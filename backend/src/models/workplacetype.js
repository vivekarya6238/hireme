const mongoose = require("mongoose");

const workplacetypeschema = new mongoose.Schema(
  {
    namekey: { type: String, required: true, unique: true, trim: true },
    icon: { type: String, required: true },
    isactive: { type: Boolean, default: true },
    sortorder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("workplacetype", workplacetypeschema);