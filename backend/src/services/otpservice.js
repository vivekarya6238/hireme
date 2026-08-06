// all otp logic lives here
// to plug a real sms provider later: change ONLY sendsms() + add keys in .env

const bcrypt = require("bcrypt");
const crypto = require("crypto");
const otp = require("../models/otp");

const generateotp = () => {
  const length = parseInt(process.env.OTP_LENGTH);
  // crypto.randomInt is safer than Math.random for codes
  return crypto
    .randomInt(0, 10 ** length)
    .toString()
    .padStart(length, "0");
};

const sendsms = async (phone, code) => {
  // dev mode: just log it
  // later: replace this body with real sms api call (msg91/twilio etc)
  console.log(`[otp] ${phone} -> ${code}`);
};

const createandsend = async (phone) => {
  const existing = await otp.findOne({ phone }).sort({ createdAt: -1 });

  // resend cooldown so nobody spams sms
  if (existing) {
    const secondssince = (Date.now() - existing.createdAt.getTime()) / 1000;
    const cooldown = parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS);
    if (secondssince < cooldown) {
      return { ok: false, waitseconds: Math.ceil(cooldown - secondssince) };
    }
  }

  const code = generateotp();
  const otphash = await bcrypt.hash(code, parseInt(process.env.BCRYPT_SALT_ROUNDS));
  const expiresat = new Date(
    Date.now() + parseInt(process.env.OTP_EXPIRY_MINUTES) * 60 * 1000
  );

  // one active otp per phone
  await otp.deleteMany({ phone });
  await otp.create({ phone, otphash, expiresat });

  await sendsms(phone, code);

  // dev convenience: return code in response for easy postman testing
  const devcode = process.env.NODE_ENV === "development" ? code : undefined;
  return { ok: true, devcode };
};

const verify = async (phone, code) => {
  const record = await otp.findOne({ phone });
  if (!record) return { ok: false, reason: "otp not found, request a new one" };

  // ttl cleanup runs every ~60s, so check expiry ourselves too
  if (record.expiresat < new Date()) {
    await otp.deleteMany({ phone });
    return { ok: false, reason: "otp expired, request a new one" };
  }

  if (record.attempts >= parseInt(process.env.OTP_MAX_ATTEMPTS)) {
    await otp.deleteMany({ phone });
    return { ok: false, reason: "too many wrong attempts, request a new otp" };
  }

  const match = await bcrypt.compare(code, record.otphash);
  if (!match) {
    record.attempts += 1;
    await record.save();
    return { ok: false, reason: "incorrect otp" };
  }

  // otp is single use
  await otp.deleteMany({ phone });
  return { ok: true };
};

module.exports = { createandsend, verify };