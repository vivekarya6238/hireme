const ratelimit = require("express-rate-limit");

// stops otp spam / sms bombing from one ip
const otplimiter = ratelimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES) * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS),
  message: { success: false, message: "too many requests, try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { otplimiter };