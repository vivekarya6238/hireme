const mongoose = require("mongoose");

const ratingschema = new mongoose.Schema(
  {
    // rating must come from a real job, no random reviews
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "job",
      required: true,
    },
    rater: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    rated: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    direction: {
      type: String,
      enum: ["workertohirer", "hirertoworker"],
      required: true,
    },
    stars: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 300 },
  },
  { timestamps: true }
);

// one rating per pair per job
ratingschema.index({ job: 1, rater: 1, rated: 1 }, { unique: true });
ratingschema.index({ rated: 1 });

module.exports = mongoose.model("rating", ratingschema);