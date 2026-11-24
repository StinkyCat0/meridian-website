// apps/api/routes/demos.js - Public demo visit counters.
const express = require("express");
const DemoVisit = require("../models/DemoVisit");
const { rateLimit } = require("../middleware/rateLimit");

const { DEMO_KEYS, DEMO_CATALOG } = DemoVisit;

const router = express.Router();

const visitLimiter = rateLimit({ windowMs: 60 * 1000, max: 60 });

async function demoItems() {
  const visits = await DemoVisit.find({ key: { $in: DEMO_KEYS } }).lean();
  const byKey = new Map(visits.map((entry) => [entry.key, entry]));

  return DEMO_CATALOG.map((demo) => {
    const stored = byKey.get(demo.key);
    return {
      key: demo.key,
      name: demo.name,
      path: demo.path,
      description: demo.description,
      visits: stored?.visits || 0,
      lastVisitedAt: stored?.lastVisitedAt || null,
    };
  });
}

// GET /api/demos - visit totals for every demo environment.
router.get("/", async (_req, res, next) => {
  try {
    res.json({ items: await demoItems() });
  } catch (error) {
    next(error);
  }
});

// POST /api/demos/:key/visit - record one visit for a known demo.
router.post("/:key/visit", visitLimiter, async (req, res, next) => {
  try {
    const { key } = req.params;
    if (!DEMO_KEYS.includes(key)) {
      return res.status(404).json({ message: "Demo not found" });
    }

    const demo = await DemoVisit.findOneAndUpdate(
      { key },
      { $inc: { visits: 1 }, $set: { lastVisitedAt: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    ).lean();

    return res.json({ key, visits: demo.visits });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
module.exports.demoItems = demoItems;
