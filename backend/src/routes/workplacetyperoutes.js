const express = require("express");
const { getworkplacetypes } = require("../controllers/workplacetypecontroller");

const router = express.Router();

router.get("/", getworkplacetypes);

module.exports = router;