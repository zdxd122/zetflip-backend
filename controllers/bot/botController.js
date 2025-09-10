const asyncHandler = require("express-async-handler");
const Bot = require("../../models/bot");
const mongoose = require("mongoose");

exports.get_bots_mm2 = asyncHandler(async (req, res, next) => {
  console.log("Fetching MM2 bots from database...");
  const bots = await Bot.find({ game: "MM2" });
  console.log(`Found ${bots.length} MM2 bots:`, bots);
  res.status(200).send(bots);
});

exports.get_bots_ps99 = asyncHandler(async (req, res, next) => {
  const bots = await Bot.find({ game: "PS99" });
  res.status(200).send(bots);
});

exports.get_bots_amp = asyncHandler(async (req, res, next) => {
  console.log("Fetching AMP bots from database...");
  const bots = await Bot.find({ game: "AMP" });
  console.log(`Found ${bots.length} AMP bots:`, bots);
  res.status(200).send(bots);
});
