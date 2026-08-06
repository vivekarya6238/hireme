const express = require("express");
const { sendotp, verifyotp } = require("../controllers/authcontroller");
const { otplimiter } = require("../middlewares/ratelimiter");

const router = express.Router();

router.post("/sendotp", otplimiter, sendotp);
router.post("/verifyotp", otplimiter, verifyotp);

module.exports = router;