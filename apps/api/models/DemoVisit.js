// apps/api/models/DemoVisit.js - Server-side demo environment visit counters.
const mongoose = require("mongoose");

const DEMO_KEYS = ["bakery", "luxesm", "dental", "corrowear"];

// Public metadata shared by /api/demos and /api/studio/demos. Names and paths
// mirror the React demo routes in apps/web/src/App.jsx.
const DEMO_CATALOG = [
  {
    key: "bakery",
    name: "The Daily Knead",
    path: "/bakery",
    description: "Artisanal bakery storefront demo.",
  },
  {
    key: "luxesm",
    name: "LuxeSM Salon",
    path: "/luxe-sm",
    description: "Aesthetic salon and booking demo.",
  },
  {
    key: "dental",
    name: "San Marcos Dental",
    path: "/san-marcos-dental",
    description: "Boutique dental practice demo.",
  },
  {
    key: "corrowear",
    name: "CorroWear",
    path: "/corrowear",
    description: "Bespoke apparel studio demo.",
  },
];

const demoVisitSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      enum: DEMO_KEYS,
    },
    visits: { type: Number, default: 0, min: 0 },
    lastVisitedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("DemoVisit", demoVisitSchema);
module.exports.DEMO_KEYS = DEMO_KEYS;
module.exports.DEMO_CATALOG = DEMO_CATALOG;
