const jwt = require("jsonwebtoken");
const user = require("../models/user");
const otpservice = require("../services/otpservice");
const { apierror } = require("../middlewares/errorhandler");

// indian mobile: 10 digits starting 6-9
const isvalidphone = (phone) => /^[6-9]\d{9}$/.test(phone);

const sendotp = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const cleanphone = String(phone || "").trim();
    if (!isvalidphone(cleanphone))
      throw new apierror(400, "valid 10 digit phone required");

    const result = await otpservice.createandsend(cleanphone);
    if (!result.ok)
      throw new apierror(429, `wait ${result.waitseconds}s before requesting again`);

    const existing = await user.findOne({ phone: cleanphone });

    res.status(200).json({
      success: true,
      message: "otp sent",
      isnewuser: !existing,
      // devcode only appears in development mode
      ...(result.devcode && { devcode: result.devcode }),
    });
  } catch (err) {
    next(err);
  }
};

const verifyotp = async (req, res, next) => {
  try {
    const { phone, otp, name, role } = req.body;
    const cleanphone = String(phone || "").trim();
    if (!cleanphone || !otp) throw new apierror(400, "phone and otp required");

    const result = await otpservice.verify(cleanphone, String(otp).trim());
    if (!result.ok) throw new apierror(401, result.reason);

    let account = await user.findOne({ phone: cleanphone });

    // first successful otp = signup
    if (!account) {
      if (!name || !String(name).trim())
        throw new apierror(400, "name required for new account");
      account = await user.create({
        phone: cleanphone,
        name: String(name).trim(),
        role: ["worker", "hirer", "both"].includes(role) ? role : "worker",
      });
    }

    if (account.isblocked) throw new apierror(403, "account blocked");

    const token = jwt.sign({ id: account._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: account._id,
        phone: account.phone,
        name: account.name,
        role: account.role,
        language: account.language,
      },
    });
  } catch (err) {
    next(err);
  }
};

// who am i - client uses this on app open to restore session
const getme = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, user: req.user });
  } catch (err) {
    next(err);
  }
};

module.exports = { sendotp, verifyotp, getme };