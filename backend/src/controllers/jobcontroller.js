const job = require("../models/job");
const category = require("../models/category");
const workplacetype = require("../models/workplacetype");
const { apierror } = require("../middlewares/errorhandler");
const { isvalidlocation } = require("../utils/validators");

// enums from schema - single source of truth
const paytypes = job.schema.path("pay.type").enumValues;

const createjob = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category: categoryid,
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

    // both refs must actually exist and be active
    const cat = await category.findById(categoryid);
    if (!cat || !cat.isactive) throw new apierror(400, "invalid category");

    const wp = await workplacetype.findById(workplacetypeid);
    if (!wp || !wp.isactive) throw new apierror(400, "invalid workplace type");

    // fair-pay flag - only compare when pay types match
    let belowsuggestedpay = false;
    if (cat.suggestedpay && cat.suggestedpay.min && cat.suggestedpay.type === pay.type) {
      belowsuggestedpay = Number(pay.amount) < cat.suggestedpay.min;
    }

    // frozen at creation - changing env multiplier later won't touch old jobs
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

// worker's main screen: open jobs near me, closest first
const browsejobs = async (req, res, next) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (isNaN(lat) || isNaN(lng)) throw new apierror(400, "lat and lng required");
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90)
      throw new apierror(400, "invalid coordinates");

    // radius clamped so nobody queries the whole planet
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
      expiresat: { $gt: new Date() }, // expired jobs never show up, no cron needed
      location: {
        $near: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: radiuskm * 1000, // meters
        },
      },
    };

    if (req.query.category) filter.category = req.query.category;

    // $near returns closest first for free
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

// hirer dashboard: my posted jobs, newest first
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

    // lazy expiry: flip status when someone actually opens an old job
    if (found.status === "open" && found.expiresat < new Date()) {
      found.status = "expired";
      await found.save();
    }

    res.status(200).json({ success: true, job: found });
  } catch (err) {
    next(err);
  }
};

// manual close by the hirer - the ONLY way a vacancy closes (locked rule)
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

module.exports = { createjob, browsejobs, getmyjobs, getjobdetail, closejob };