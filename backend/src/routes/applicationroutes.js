const express = require("express");
const {
  apply,
  getmyapplications,
  withdraw,
  selectapplicant,
  rejectapplicant,
} = require("../controllers/applicationcontroller");
const { protect } = require("../middlewares/auth");
const { requirerole } = require("../middlewares/role");

const router = express.Router();

router.post("/", protect, requirerole("worker"), apply);
router.get("/mine", protect, requirerole("worker"), getmyapplications);
router.patch("/:id/withdraw", protect, requirerole("worker"), withdraw);
router.patch("/:id/select", protect, requirerole("hirer"), selectapplicant);
router.patch("/:id/reject", protect, requirerole("hirer"), rejectapplicant);

module.exports = router;