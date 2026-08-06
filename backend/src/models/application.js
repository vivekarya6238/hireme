const mongoose = require("mongoose");

const applicationschema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "job",
      required: true,
    },
    worker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    status: {
      type: String,
      enum: ["applied", "waitlist", "selected", "rejected", "withdrawn"],
      default: "applied",
    },
    statusupdatedat: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// one worker, one job, one application - enforced by db itself
applicationschema.index({ job: 1, worker: 1 }, { unique: true });
applicationschema.index({ worker: 1, status: 1 });
applicationschema.index({ job: 1, status: 1 });

module.exports = mongoose.model("application", applicationschema);