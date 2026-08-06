const mongoose = require("mongoose");

const categoryschema = new mongoose.Schema(
  {
    // i18n key like "cat.loader" - actual text lives in frontend locale files
    namekey: { type: String, required: true, unique: true, trim: true },
    icon: { type: String, required: true },

    // fair-pay: admin seeded range, used to flag lowball posts
    suggestedpay: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
      type: { type: String, enum: ["perday", "permonth", "perhour"] },
    },

    isactive: { type: Boolean, default: true },
    sortorder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("category", categoryschema);