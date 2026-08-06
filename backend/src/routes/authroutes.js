const express = require("express");
const { sendotp, verifyotp, getme } = require("../controllers/authcontroller");
const { protect } = require("../middlewares/auth");
const { otplimiter } = require("../middlewares/ratelimiter");

const router = express.Router();

router.post("/sendotp", otplimiter, sendotp);
router.post("/verifyotp", otplimiter, verifyotp);
router.get("/me", protect, getme);

module.exports = router;