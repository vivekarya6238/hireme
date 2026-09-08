const job = require("../models/job");
const category = require("../models/category");
const workplacetype = require("../models/workplacetype");
const { apierror } = require("../middlewares/errorhandler");
const { isvalidlocation } = require("../utils/validators");

const paytypes = job.schema.path("pay.type").enumValues;

const createjob = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category: categoryid,
      othercategorytext,
      workplacetype: workplacetypeid,
      openings,
      pay,
      location,
      addresstext,
      startdate,
    } = req.body;

    const cleantitle = String(title || "").trim();
    if (!cleantitle) throw new apierror(400, "title required");

    const openingscount = parseInt(openings);
    if (isNaN(openingscount) || openingscount < 1)
      throw new apierror(400, "openings must be at least 1");

    if (!pay || isNaN(Number(pay.amount)) || Number(pay.amount) < 0)
      throw new apierror(400, "valid pay amount required");
    if (!paytypes.includes(pay.type)) throw new apierror(400, "invalid pay type");

    if (!isvalidlocation(location))
      throw new apierror(400, "location must be a geojson point with [lng, lat]");

    const cat = await category.findById(categoryid);
    if (!cat || !cat.isactive) throw new apierror(400, "invalid category");

    const wp = await workplacetype.findById(workplacetypeid);
    if (!wp || !wp.isactive) throw new apierror(400, "invalid workplace type");

    let belowsuggestedpay = false;
    if (cat.suggestedpay && cat.suggestedpay.min && cat.suggestedpay.type === pay.type) {
      belowsuggestedpay = Number(pay.amount) < cat.suggestedpay.min;
    }

    const applicationcap =
      openingscount * parseInt(process.env.APPLICATION_CAP_MULTIPLIER);

    const expiresat = new Date(
      Date.now() + parseInt(process.env.JOB_EXPIRY_DAYS) * 24 * 60 * 60 * 1000
    );

    const created = await job.create({
      hirer: req.user._id,
      title: cleantitle,
      description: description ? String(description).trim() : undefined,
      category: categoryid,
      othercategorytext: othercategorytext ? String(othercategorytext).trim() : undefined,
      workplacetype: workplacetypeid,
      openings: openingscount,
      pay: { amount: Number(pay.amount), type: pay.type },
      belowsuggestedpay,
      location: { type: "Point", coordinates: location.coordinates },
      addresstext: addresstext ? String(addresstext).trim() : undefined,
      startdate: startdate ? new Date(startdate) : undefined,
      applicationcap,
      expiresat,
    });

    res.status(201).json({ success: true, job: created });
  } catch (err) {
    next(err);
  }
};

const browsejobs = async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (isNaN(lat) || isNaN(lng)) throw new apierror(400, "lat and lng required");
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90)
      throw new apierror(400, "invalid coordinates");

    const maxradius = parseInt(process.env.MAX_SEARCH_RADIUS_KM);
    let radiuskm = Number(req.query.radiuskm) || parseInt(process.env.DEFAULT_SEARCH_RADIUS_KM);
    if (radiuskm < 1) radiuskm = 1;
    if (radiuskm > maxradius) radiuskm = maxradius;

    const maxlimit = parseInt(process.env.PAGE_SIZE_MAX);
    let limit = parseInt(req.query.limit) || parseInt(process.env.PAGE_SIZE_DEFAULT);
    if (limit < 1) limit = 1;
    if (limit > maxlimit) limit = maxlimit;

    let page = parseInt(req.query.page) || 1;
    if (page < 1) page = 1;

    const filter = {
      status: "open",
      expiresat: { $gt: new Date() },
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: radiuskm * 1000,
        },
      },
    };

    if (req.query.category) filter.category = req.query.category;

    const jobs = await job
      .find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("category", "namekey icon")
      .populate("workplacetype", "namekey icon")
      .populate("hirer", "name photo ratingsummary");

    res.status(200).json({ success: true, page, radiuskm, count: jobs.length, jobs });
  } catch (err) {
    next(err);
  }
};

const getmyjobs = async (req, res, next) => {
  try {
    const jobs = await job
      .find({ hirer: req.user._id })
      .sort({ createdAt: -1 })
      .populate("category", "namekey icon")
      .populate("workplacetype", "namekey icon");

    res.status(200).json({ success: true, count: jobs.length, jobs });
  } catch (err) {
    next(err);
  }
};

const getjobdetail = async (req, res, next) => {
  try {
    const found = await job
      .findById(req.params.id)
      .populate("category", "namekey icon suggestedpay")
      .populate("workplacetype", "namekey icon")
      .populate("hirer", "name photo addresstext ratingsummary");

    if (!found) throw new apierror(404, "job not found");

    if (found.status === "open" && found.expiresat < new Date()) {
      found.status = "expired";
      await found.save();
    }

    res.status(200).json({ success: true, job: found });
  } catch (err) {
    next(err);
  }
};

// limited whitelist - openings/category/location stay locked so
// applicationcap and geo-matching invariants never drift after creation
const updatejob = async (req, res, next) => {
  try {
    const target = await job.findById(req.params.id);
    if (!target) throw new apierror(404, "job not found");

    if (String(target.hirer) !== String(req.user._id))
      throw new apierror(403, "not your job");

    if (!["open", "closed"].includes(target.status))
      throw new apierror(400, `cannot edit a ${target.status} job`);

    const { title, description, pay, openings } = req.body;
    const updates = {};

    if (title !== undefined) {
      const clean = String(title).trim();
      if (!clean) throw new apierror(400, "title cannot be empty");
      updates.title = clean;
    }

    if (description !== undefined) {
      updates.description = String(description).trim();
    }

    if (pay !== undefined) {
      const amount = Number(pay.amount);
      if (isNaN(amount) || amount < 0) throw new apierror(400, "invalid pay amount");
      if (!paytypes.includes(pay.type)) throw new apierror(400, "invalid pay type");
      updates.pay = { amount, type: pay.type };

      const cat = await category.findById(target.category);
      if (cat?.suggestedpay?.min && cat.suggestedpay.type === pay.type) {
        updates.belowsuggestedpay = amount < cat.suggestedpay.min;
      } else {
        updates.belowsuggestedpay = false;
      }
    }

    // openings can change, but never below workers already selected
    // cap is recomputed from the new count so anti-crowd math stays correct
    if (openings !== undefined) {
      const newopenings = parseInt(openings);
      if (isNaN(newopenings) || newopenings < 1)
        throw new apierror(400, "openings must be at least 1");
      if (newopenings < target.selectedcount)
        throw new apierror(400, `openings cannot be less than ${target.selectedcount} already-selected workers`);

      updates.openings = newopenings;
      updates.applicationcap = newopenings * parseInt(process.env.APPLICATION_CAP_MULTIPLIER);
    }

    if (Object.keys(updates).length === 0) throw new apierror(400, "nothing to update");

    const updated = await job.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true })
      .populate("category", "namekey icon")
      .populate("workplacetype", "namekey icon");

    res.status(200).json({ success: true, job: updated });
  } catch (err) {
    next(err);
  }
};

const closejob = async (req, res, next) => {
  try {
    const found = await job.findById(req.params.id);
    if (!found) throw new apierror(404, "job not found");

    if (String(found.hirer) !== String(req.user._id))
      throw new apierror(403, "not your job");

    if (["closed", "expired"].includes(found.status))
      throw new apierror(400, `job already ${found.status}`);

    found.status = "closed";
    await found.save();

    res.status(200).json({ success: true, job: found });
  } catch (err) {
    next(err);
  }
};

// undo an accidental close - only from closed, and only if not expired
const reopenjob = async (req, res, next) => {
  try {
    const found = await job.findById(req.params.id);
    if (!found) throw new apierror(404, "job not found");

    if (String(found.hirer) !== String(req.user._id))
      throw new apierror(403, "not your job");

    if (found.status !== "closed")
      throw new apierror(400, `can only reopen a closed job (this one is ${found.status})`);

    if (found.expiresat < new Date())
      throw new apierror(400, "job has already expired, cannot reopen");

    found.status = "open";
    await found.save();

    res.status(200).json({ success: true, job: found });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createjob,
  browsejobs,
  getmyjobs,
  getjobdetail,
  updatejob,
  closejob,
  reopenjob,
};