const express = require("express");
const { createrating, getuserratings } = require("../controllers/ratingcontroller");
const { protect } = require("../middlewares/auth");

const router = express.Router();

router.post("/", protect, createrating);
router.get("/user/:id", protect, getuserratings);

module.exports = router;