const express = require("express");
const { getcategories } = require("../controllers/categorycontroller");

const router = express.Router();

router.get("/", getcategories);

module.exports = router;