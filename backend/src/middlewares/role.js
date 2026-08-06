const { apierror } = require("./errorhandler");

// use after protect - checks req.user.role
// "both" always passes since that user is worker and hirer
const requirerole = (role) => (req, res, next) => {
  if (req.user.role === role || req.user.role === "both") return next();
  return next(new apierror(403, `only ${role} can do this`));
};

module.exports = { requirerole };