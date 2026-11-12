// apps/api/utils/tokens.js - JWT signing/verification and token hashing.
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const ISSUER = 'meridian-website';
const AUDIENCE = 'meridian-crm';
const DEFAULT_EXPIRES_IN = '7d';

function jwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured');
  return secret;
}

/**
 * Sign an auth JWT for a user document. Never log the returned token.
 */
function signAuthToken(user) {
  if (!user || !user._id) {
    throw new Error('A user document is required to sign an auth token');
  }

  const payload = {
    user: {
      id: String(user._id),
      role: user.role,
      email: user.email,
      name: user.name,
      isVerified: !!user.isVerified,
      crmAccess: user.access?.canAccessCrm === true,
    },
  };

  return jwt.sign(payload, jwtSecret(), {
    algorithm: 'HS256',
    expiresIn: process.env.JWT_EXPIRES_IN || DEFAULT_EXPIRES_IN,
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}

/**
 * Verify a token issued by signAuthToken. Throws jsonwebtoken errors.
 */
function verifyAuthToken(token) {
  return jwt.verify(token, jwtSecret(), {
    algorithms: ['HS256'],
    issuer: ISSUER,
    audience: AUDIENCE,
  });
}

/**
 * Deterministic lowercase sha256 hex digest used to store opaque tokens.
 */
function hashToken(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex').toLowerCase();
}

module.exports = { signAuthToken, verifyAuthToken, hashToken };
