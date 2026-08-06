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

module.exports = { createjob };