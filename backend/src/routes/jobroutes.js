const express = require("express");
const {
  createjob,
  browsejobs,
  getmyjobs,
  getjobdetail,
  closejob,
} = require("../controllers/jobcontroller");
const { getapplicants, confirmhires } = require("../controllers/applicationcontroller");
const { protect } = require("../middlewares/auth");
const { requirerole } = require("../middlewares/role");

const router = express.Router();

router.post("/", protect, requirerole("hirer"), createjob);
router.get("/", protect, browsejobs);
router.get("/mine", protect, requirerole("hirer"), getmyjobs);
router.get("/:id", protect, getjobdetail);
router.get("/:id/applicants", protect, requirerole("hirer"), getapplicants);
router.patch("/:id/close", protect, requirerole("hirer"), closejob);
router.patch("/:id/confirmhires", protect, requirerole("hirer"), confirmhires);

module.exports = router;