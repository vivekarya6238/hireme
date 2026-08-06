const express = require("express");
const { createjob } = require("../controllers/jobcontroller");
const { protect } = require("../middlewares/auth");
const { requirerole } = require("../middlewares/role");

const router = express.Router();

router.post("/", protect, requirerole("hirer"), createjob);

module.exports = router;