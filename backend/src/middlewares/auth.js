const jwt = require("jsonwebtoken");
const user = require("../models/user");
const { apierror } = require("./errorhandler");

// gatekeeper for protected routes
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer "))
      throw new apierror(401, "login required");

    const token = header.split(" ")[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      throw new apierror(401, "invalid or expired token, login again");
    }

    // fresh from db every time - role/block changes apply instantly
    const account = await user.findById(decoded.id);
    if (!account) throw new apierror(401, "account not found");
    if (account.isblocked) throw new apierror(403, "account blocked");

    req.user = account;
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { protect };