const application = require("../models/application");
const job = require("../models/job");
const { apierror } = require("../middlewares/errorhandler");

// worker applies - the anti-crowd gate lives here
const apply = async (req, res, next) => {
  try {
    const { jobid } = req.body;
    if (!jobid) throw new apierror(400, "jobid required");

    const target = await job.findById(jobid);
    if (!target) throw new apierror(404, "job not found");

    if (String(target.hirer) === String(req.user._id))
      throw new apierror(400, "cannot apply to your own job");

    if (target.status !== "open" || target.expiresat < new Date())
      throw new apierror(400, "job is not open");

    // atomic seat grab: cap check + increment in ONE db operation
    // if two people race for the last seat, mongo lets exactly one through
    const seat = await job.findOneAndUpdate(
      {
        _id: jobid,
        status: "open",
        expiresat: { $gt: new Date() },
        $expr: { $lt: ["$applicantcount", "$applicationcap"] },
      },
      { $inc: { applicantcount: 1 } },
      { new: true }
    );

    const status = seat ? "applied" : "waitlist";

    let created;
    try {
      created = await application.create({
        job: jobid,
        worker: req.user._id,
        status,
      });
    } catch (err) {
      // duplicate apply blocked by unique index - give the seat back if we took one
      if (err.code === 11000 && seat) {
        await job.updateOne({ _id: jobid }, { $inc: { applicantcount: -1 } });
      }
      throw err;
    }

    res.status(201).json({ success: true, application: created });
  } catch (err) {
    next(err);
  }
};

// worker's applications with live status - the transparency screen
const getmyapplications = async (req, res, next) => {
  try {
    const found = await application
      .find({ worker: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "job",
        select: "title status pay addresstext startdate category hirer",
        populate: [
          { path: "category", select: "namekey icon" },
          { path: "hirer", select: "name photo ratingsummary phone" },
        ],
      });

    // phone reveal rule: hirer's phone only when this worker is selected
    const applications = found.map((a) => {
      const obj = a.toObject();
      if (obj.status !== "selected" && obj.job && obj.job.hirer) {
        delete obj.job.hirer.phone;
      }
      return obj;
    });

    res.status(200).json({ success: true, count: applications.length, applications });
  } catch (err) {
    next(err);
  }
};

// worker backs out - freed seat goes to the oldest waitlisted person
const withdraw = async (req, res, next) => {
  try {
    const app = await application.findById(req.params.id);
    if (!app) throw new apierror(404, "application not found");

    if (String(app.worker) !== String(req.user._id))
      throw new apierror(403, "not your application");

    if (!["applied", "waitlist", "selected"].includes(app.status))
      throw new apierror(400, `cannot withdraw a ${app.status} application`);

    const hadseat = ["applied", "selected"].includes(app.status);
    const wasselected = app.status === "selected";

    app.status = "withdrawn";
    app.statusupdatedat = new Date();
    await app.save();

    if (wasselected) {
      await job.updateOne({ _id: app.job }, { $inc: { selectedcount: -1 } });
    }

    if (hadseat) {
      // promote oldest waitlisted into the freed seat
      const promoted = await application.findOneAndUpdate(
        { job: app.job, status: "waitlist" },
        { $set: { status: "applied", statusupdatedat: new Date() } },
        { sort: { createdAt: 1 }, new: true }
      );
      // nobody waiting - just free the seat counter
      if (!promoted) {
        await job.updateOne({ _id: app.job }, { $inc: { applicantcount: -1 } });
      }
    }

    res.status(200).json({ success: true, application: app });
  } catch (err) {
    next(err);
  }
};

// hirer views applicants for their job
const getapplicants = async (req, res, next) => {
  try {
    const target = await job.findById(req.params.id);
    if (!target) throw new apierror(404, "job not found");

    if (String(target.hirer) !== String(req.user._id))
      throw new apierror(403, "not your job");

    const found = await application
      .find({ job: target._id })
      .sort({ createdAt: 1 })
      .populate("worker", "name photo addresstext ratingsummary workerprofile phone");

    // phone reveal rule: worker's phone only after selection
    const applicants = found.map((a) => {
      const obj = a.toObject();
      if (obj.status !== "selected" && obj.worker) delete obj.worker.phone;
      return obj;
    });

    res.status(200).json({ success: true, count: applicants.length, applicants });
  } catch (err) {
    next(err);
  }
};

// hirer picks a worker - atomic so selections never exceed openings
const selectapplicant = async (req, res, next) => {
  try {
    const app = await application.findById(req.params.id).populate("job");
    if (!app) throw new apierror(404, "application not found");

    const target = app.job;
    if (String(target.hirer) !== String(req.user._id))
      throw new apierror(403, "not your job");

    if (target.status !== "open") throw new apierror(400, `job is ${target.status}`);

    // waitlisted people must get promoted first - selection is from the capped pool only
    if (app.status !== "applied")
      throw new apierror(400, `can only select an applied application (this one is ${app.status})`);

    // atomic slot grab: selections can never exceed openings
    const slot = await job.findOneAndUpdate(
      {
        _id: target._id,
        status: "open",
        $expr: { $lt: ["$selectedcount", "$openings"] },
      },
      { $inc: { selectedcount: 1 } },
      { new: true }
    );
    if (!slot) throw new apierror(400, "all openings already selected");

    app.status = "selected";
    app.statusupdatedat = new Date();
    await app.save();

    res.status(200).json({ success: true, application: app });
  } catch (err) {
    next(err);
  }
};

// hirer rejects - freed seat promotes the oldest waitlisted person
const rejectapplicant = async (req, res, next) => {
  try {
    const app = await application.findById(req.params.id).populate("job");
    if (!app) throw new apierror(404, "application not found");

    const target = app.job;
    if (String(target.hirer) !== String(req.user._id))
      throw new apierror(403, "not your job");

    if (!["applied", "waitlist", "selected"].includes(app.status))
      throw new apierror(400, `cannot reject a ${app.status} application`);

    const hadseat = ["applied", "selected"].includes(app.status);
    const wasselected = app.status === "selected";

    app.status = "rejected";
    app.statusupdatedat = new Date();
    await app.save();

    if (wasselected) {
      await job.updateOne({ _id: target._id }, { $inc: { selectedcount: -1 } });
    }

    if (hadseat) {
      const promoted = await application.findOneAndUpdate(
        { job: target._id, status: "waitlist" },
        { $set: { status: "applied", statusupdatedat: new Date() } },
        { sort: { createdAt: 1 }, new: true }
      );
      if (!promoted) {
        await job.updateOne({ _id: target._id }, { $inc: { applicantcount: -1 } });
      }
    }

    res.status(200).json({ success: true, application: app });
  } catch (err) {
    next(err);
  }
};

// the LOCKED rule: only this closes a vacancy as filled
const confirmhires = async (req, res, next) => {
  try {
    const target = await job.findById(req.params.id);
    if (!target) throw new apierror(404, "job not found");

    if (String(target.hirer) !== String(req.user._id))
      throw new apierror(403, "not your job");

    if (target.status !== "open") throw new apierror(400, `job is ${target.status}`);

    if (target.selectedcount < 1)
      throw new apierror(400, "select at least one worker first");

    target.status = "filled";
    await target.save();

    // everyone not selected gets a clear rejection - nobody waits on a dead vacancy
    await application.updateMany(
      { job: target._id, status: { $in: ["applied", "waitlist"] } },
      { $set: { status: "rejected", statusupdatedat: new Date() } }
    );

    // final hired list with phones - both sides can now contact each other
    const selected = await application
      .find({ job: target._id, status: "selected" })
      .populate("worker", "name phone photo");

    res.status(200).json({ success: true, job: target, selected });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  apply,
  getmyapplications,
  withdraw,
  getapplicants,
  selectapplicant,
  rejectapplicant,
  confirmhires,
};