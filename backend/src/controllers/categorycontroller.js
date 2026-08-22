const category = require("../models/category");

const getcategories = async (req, res, next) => {
  try {
    const categories = await category.find({ isactive: true }).sort({ sortorder: 1 });
    res.status(200).json({ success: true, categories });
  } catch (err) {
    next(err);
  }
};

module.exports = { getcategories };