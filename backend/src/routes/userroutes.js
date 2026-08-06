const express = require("express");
const { updateme, getpublicprofile, uploadphoto } = require("../controllers/usercontroller");
const { protect } = require("../middlewares/auth");
const upload = require("../middlewares/upload");

const router = express.Router();

router.patch("/me", protect, updateme);
router.post("/me/photo", protect, upload.single("photo"), uploadphoto);
router.get("/:id", protect, getpublicprofile);

module.exports = router;