const express = require("express");
const {
  createjob,
  browsejobs,
  getmyjobs,
  getjobdetail,
  closejob,
} = require("../controllers/jobcontroller");
const { protect } = require("../middlewares/auth");
const { requirerole } = require("../middlewares/role");

const router = express.Router();

router.post("/", protect, requirerole("hirer"), createjob);
router.get("/", protect, browsejobs);
router.get("/mine", protect, requirerole("hirer"), getmyjobs);
router.get("/:id", protect, getjobdetail);
router.patch("/:id/close", protect, requirerole("hirer"), closejob);

module.exports = router;