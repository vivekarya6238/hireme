const mongoose = require("mongoose");

// geojson point - mongo needs this exact shape for 2dsphere
const pointschema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  { _id: false }
);

const userschema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ["worker", "hirer", "both"],
      default: "worker",
    },
    language: { type: String, enum: ["hi", "en", "pa"], default: "hi" },

    // home base - default center for job search
    location: { type: pointschema },
    addresstext: { type: String, trim: true },

    photo: {
      url: String,
      publicid: String, // needed to delete/replace on cloudinary
    },

    // everything optional - filled via dropdowns, not long forms
    workerprofile: {
      skills: [{ type: mongoose.Schema.Types.ObjectId, ref: "category" }],
      // worker picked "other" during onboarding, category not in our list yet
      othercategorytext: { type: String, trim: true },
      experienceyears: { type: Number, min: 0 },
      availability: {
        type: String,
        enum: ["fulltime", "parttime", "hourly"],
      },
      expectedpay: {
        amount: { type: Number, min: 0 },
        type: { type: String, enum: ["perday", "permonth", "perhour"] },
      },
      education: {
        type: String,
        enum: ["none", "primary", "middle", "matric", "plus2", "graduate"],
      },
    },

    hirerprofile: {
      hirertype: {
        type: String,
        enum: ["shop", "farmer", "household", "event", "business", "other"],
      },
      businessname: { type: String, trim: true },
    },

    // denormalized so we never aggregate just to show a rating
    ratingsummary: {
      avgasworker: { type: Number, default: 0 },
      countasworker: { type: Number, default: 0 },
      avgashirer: { type: Number, default: 0 },
      countashirer: { type: Number, default: 0 },
    },

    isblocked: { type: Boolean, default: false },
    reportcount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

userschema.index({ location: "2dsphere" });
userschema.index({ "workerprofile.skills": 1 });

module.exports = mongoose.model("user", userschema);