const rating = require("../models/rating");
const job = require("../models/job");
const application = require("../models/application");
const user = require("../models/user");
const { apierror } = require("../middlewares/errorhandler");

const createrating = async (req, res, next) => {
  try {
    const { jobid, stars, comment } = req.body;

    const starsnum = Number(stars);
    if (isNaN(starsnum) || starsnum < 1 || starsnum > 5)
      throw new apierror(400, "stars must be between 1 and 5");

    const target = await job.findById(jobid);
    if (!target) throw new apierror(404, "job not found");
    if (target.status !== "filled") throw new apierror(400, "job is not filled yet");

    const raterid = req.user._id;
    let ratedid, direction;

    // figure out who's rating whom - and confirm they were actually paired on this job
    if (String(target.hirer) === String(raterid)) {
      // hirer rating a worker - need to know which one
      const { workerid } = req.body;
      if (!workerid) throw new apierror(400, "workerid required when rating as hirer");

      const paired = await application.findOne({
        job: jobid,
        worker: workerid,
        status: "selected",
      });
      if (!paired) throw new apierror(403, "this worker was not selected for this job");

      ratedid = workerid;
      direction = "hirertoworker";
    } else {
      // worker rating the hirer - confirm this worker was selected here
      const paired = await application.findOne({
        job: jobid,
        worker: raterid,
        status: "selected",
      });
      if (!paired) throw new apierror(403, "you were not selected for this job");

      ratedid = target.hirer;
      direction = "workertohirer";
    }

    let created;
    try {
      created = await rating.create({
        job: jobid,
        rater: raterid,
        rated: ratedid,
        direction,
        stars: starsnum,
        comment: comment ? String(comment).trim() : undefined,
      });
    } catch (err) {
      if (err.code === 11000)
        throw new apierror(409, "you already rated this person for this job");
      throw err;
    }

    // incremental average - no aggregate query needed to show a rating
    const field = direction === "hirertoworker" ? "asworker" : "ashirer";
    const ratedaccount = await user.findById(ratedid);
    const oldavg = ratedaccount.ratingsummary[`avg${field}`];
    const oldcount = ratedaccount.ratingsummary[`count${field}`];
    const newcount = oldcount + 1;
    const newavg = (oldavg * oldcount + starsnum) / newcount;

    await user.updateOne(
      { _id: ratedid },
      {
        $set: {
          [`ratingsummary.avg${field}`]: newavg,
          [`ratingsummary.count${field}`]: newcount,
        },
      }
    );

    res.status(201).json({ success: true, rating: created });
  } catch (err) {
    next(err);
  }
};

const getuserratings = async (req, res, next) => {
  try {
    const found = await rating
      .find({ rated: req.params.id })
      .sort({ createdAt: -1 })
      .populate("rater", "name photo")
      .populate("job", "title");

    res.status(200).json({ success: true, count: found.length, ratings: found });
  } catch (err) {
    next(err);
  }
};

module.exports = { createrating, getuserratings };