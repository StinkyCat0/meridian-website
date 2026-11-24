// apps/api/models/CrmHandoff.js - One-time website -> CRM login codes.
// Only the SHA-256 hash of the code is stored. A TTL index removes expired
// documents; `usedAt` makes consumption single-use even before MongoDB's TTL
// sweeper runs.
const mongoose = require("mongoose");

const CRM_HANDOFF_TTL_MS = 60 * 1000;

const crmHandoffSchema = new mongoose.Schema(
  {
    codeHash: {
      type: String,
      required: true,
      unique: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      expires: 0,
    },
    usedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("CrmHandoff", crmHandoffSchema);
module.exports.CRM_HANDOFF_TTL_MS = CRM_HANDOFF_TTL_MS;
