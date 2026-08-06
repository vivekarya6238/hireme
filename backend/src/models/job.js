const mongoose = require("mongoose");

const pointschema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  { _id: false }
);

const jobschema = new mongoose.Schema(
  {
    hirer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 1000 },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "category",
      required: true,
    },
    workplacetype: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "workplacetype",
      required: true,
    },

    openings: { type: Number, required: true, min: 1 },

    pay: {
      amount: { type: Number, required: true, min: 0 },
      type: {
        type: String,
        enum: ["perday", "permonth", "perhour", "fixed"],
        required: true,
      },
    },
    // set at post time by comparing against category suggested range
    belowsuggestedpay: { type: Boolean, default: false },

    location: { type: pointschema, required: true },
    addresstext: { type: String, trim: true },

    startdate: { type: Date },

    // frozen at creation: openings x multiplier from env
    // changing the multiplier later must not affect old jobs
    applicationcap: { type: Number, required: true },
    applicantcount: { type: Number, default: 0 },
    selectedcount: { type: Number, default: 0 },

    // closes only when hirer confirms, never auto
    status: {
      type: String,
      enum: ["open", "filled", "closed", "expired"],
      default: "open",
    },
    expiresat: { type: Date, required: true },
  },
  { timestamps: true }
);

jobschema.index({ location: "2dsphere" });
jobschema.index({ status: 1, category: 1 });
jobschema.index({ hirer: 1 });

module.exports = mongoose.model("job", jobschema);