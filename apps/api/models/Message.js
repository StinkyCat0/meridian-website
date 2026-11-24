const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    subject: { type: String, default: "", trim: true },
    message: String,
    status: {
      type: String,
      enum: ["new", "read", "archived"],
      default: "new",
      index: true,
    },
    readAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null },
    // Deal id returned by the CRM intake endpoint, when the CRM accepted the lead.
    crmDealId: { type: String, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Message", messageSchema);
