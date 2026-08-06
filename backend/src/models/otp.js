const mongoose = require("mongoose");

const otpschema = new mongoose.Schema(
  {
    phone: { type: String, required: true, index: true },
    otphash: { type: String, required: true },
    expiresat: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// mongo auto-deletes docs once expiresat passes
otpschema.index({ expiresat: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("otp", otpschema);