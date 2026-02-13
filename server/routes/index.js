"use strict";

const express = require("express");
const { enter } = require("./enter");
const { autosave } = require("./autosave");
const { wallet } = require("./wallet");
const { redeem } = require("./redeem");
const { grant } = require("./grant");

const router = express.Router();

router.post("/enter", enter);
router.post("/autosave", autosave);
router.post("/wallet", wallet);
router.post("/redeem", redeem);
router.post("/grant", grant);

module.exports = router;
