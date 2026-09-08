const workplacetype = require("../models/workplacetype");

const getworkplacetypes = async (req, res, next) => {
  try {
    const workplacetypes = await workplacetype.find({ isactive: true }).sort({ sortorder: 1 });
    res.status(200).json({ success: true, workplacetypes });
  } catch (err) {
    next(err);
  }
};

module.exports = { getworkplacetypes };