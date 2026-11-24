// apps/api/middleware/studioAuth.js - Constant-time service-token gate for the
// CRM Studio API. The token never reaches query strings, responses, or logs.
const crypto = require("crypto");

const HEADER = "x-meridian-studio-token";
const MIN_TOKEN_LENGTH = 32;

function digest(value) {
  return crypto.createHash("sha256").update(String(value)).digest();
}

function configuredToken() {
  const token = process.env.STUDIO_API_TOKEN || "";
  return token.length >= MIN_TOKEN_LENGTH ? token : null;
}

function studioAuth(req, res, next) {
  const expected = configuredToken();
  if (!expected) {
    return res.status(503).json({ message: "Studio API is not configured" });
  }

  const provided = req.headers[HEADER];
  if (typeof provided !== "string" || provided.length === 0) {
    return res.status(401).json({ message: "Invalid studio token" });
  }

  // Compare fixed-length digests so neither length nor content leaks through
  // timingSafeEqual; the raw token is never logged.
  const matches = crypto.timingSafeEqual(digest(provided), digest(expected));
  if (!matches) {
    return res.status(401).json({ message: "Invalid studio token" });
  }

  return next();
}

module.exports = { studioAuth, MIN_TOKEN_LENGTH };
