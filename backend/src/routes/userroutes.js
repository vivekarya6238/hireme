const express = require("express");
const { updateme, getpublicprofile } = require("../controllers/usercontroller");
const { protect } = require("../middlewares/auth");

const router = express.Router();

router.patch("/me", protect, updateme);
router.get("/:id", protect, getpublicprofile);

module.exports = router;