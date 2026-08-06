// seeds categories and workplace types
// safe to run again - upserts, never duplicates
// run: npm run seed

require("dotenv").config();
const mongoose = require("mongoose");
const category = require("../models/category");
const workplacetype = require("../models/workplacetype");

const categories = [
  { namekey: "cat.helper", icon: "🧰", sortorder: 1, suggestedpay: { min: 400, max: 600, type: "perday" } },
  { namekey: "cat.loader", icon: "📦", sortorder: 2, suggestedpay: { min: 450, max: 700, type: "perday" } },
  { namekey: "cat.shopassistant", icon: "🏪", sortorder: 3, suggestedpay: { min: 8000, max: 14000, type: "permonth" } },
  { namekey: "cat.farmwork", icon: "🌾", sortorder: 4, suggestedpay: { min: 350, max: 550, type: "perday" } },
  { namekey: "cat.construction", icon: "🧱", sortorder: 5, suggestedpay: { min: 500, max: 800, type: "perday" } },
  { namekey: "cat.cleaning", icon: "🧹", sortorder: 6, suggestedpay: { min: 300, max: 500, type: "perday" } },
  { namekey: "cat.cooking", icon: "🍳", sortorder: 7, suggestedpay: { min: 400, max: 700, type: "perday" } },
  { namekey: "cat.driver", icon: "🚗", sortorder: 8, suggestedpay: { min: 12000, max: 20000, type: "permonth" } },
  { namekey: "cat.eventwork", icon: "🎪", sortorder: 9, suggestedpay: { min: 500, max: 900, type: "perday" } },
  { namekey: "cat.security", icon: "🛡️", sortorder: 10, suggestedpay: { min: 10000, max: 16000, type: "permonth" } },
];

const workplacetypes = [
  { namekey: "wp.shop", icon: "🏪", sortorder: 1 },
  { namekey: "wp.farm", icon: "🌾", sortorder: 2 },
  { namekey: "wp.household", icon: "🏠", sortorder: 3 },
  { namekey: "wp.event", icon: "🎪", sortorder: 4 },
  { namekey: "wp.mall", icon: "🏬", sortorder: 5 },
  { namekey: "wp.warehouse", icon: "🏭", sortorder: 6 },
  { namekey: "wp.constructionsite", icon: "🧱", sortorder: 7 },
  { namekey: "wp.restaurant", icon: "🍽️", sortorder: 8 },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("db connected, seeding...");

    for (const c of categories) {
      await category.updateOne({ namekey: c.namekey }, { $set: c }, { upsert: true });
    }
    console.log(`categories done: ${categories.length}`);

    for (const w of workplacetypes) {
      await workplacetype.updateOne({ namekey: w.namekey }, { $set: w }, { upsert: true });
    }
    console.log(`workplace types done: ${workplacetypes.length}`);

    await mongoose.disconnect();
    console.log("seed complete");
  } catch (err) {
    console.error("seed failed:", err.message);
    process.exit(1);
  }
};

seed();