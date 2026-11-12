// apps/api/middleware/rateLimit.js - Small in-memory fixed-window rate limiter.

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_MAX = 10;
const MAX_KEYS = 10_000;

/**
 * Build an Express middleware limiting requests per key (client IP by default).
 *
 * @param {{ windowMs?: number, max?: number, keyGenerator?: (req) => string }} options
 */
function rateLimit({
  windowMs = DEFAULT_WINDOW_MS,
  max = DEFAULT_MAX,
  keyGenerator,
} = {}) {
  const hits = new Map();
  const identify =
    typeof keyGenerator === 'function'
      ? keyGenerator
      : (req) => req.ip || req.socket?.remoteAddress || 'unknown';

  function sweep(now) {
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) hits.delete(key);
    }
  }

  return function rateLimitMiddleware(req, res, next) {
    if (process.env.RATE_LIMIT_DISABLED === 'true') return next();

    const now = Date.now();
    const key = String(identify(req));
    let entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      if (hits.size >= MAX_KEYS) {
        sweep(now);
        // Still full: evict the oldest active key so memory stays bounded.
        while (hits.size >= MAX_KEYS) {
          const oldest = hits.keys().next().value;
          if (oldest === undefined) break;
          hits.delete(oldest);
        }
      }
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;

    if (entry.count > max) {
      const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ message: 'Too many requests. Try again later.' });
    }

    return next();
  };
}

module.exports = { rateLimit };
