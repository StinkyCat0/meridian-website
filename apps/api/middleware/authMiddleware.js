// apps/api/middleware/authMiddleware.js - JWT route protection.
const User = require('../models/User');
const { verifyAuthToken } = require('../utils/tokens');

// Attach the authenticated user (without password) to req.user.
const protect = async (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  let decoded;
  try {
    decoded = verifyAuthToken(token);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    return res.status(401).json({ message: 'Token is invalid' });
  }

  try {
    const userId = decoded?.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Token is invalid' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }
    if (user.isLocked) {
      return res
        .status(429)
        .json({ message: 'Account locked due to too many failed attempts. Try again later.' });
    }
    if (user.access?.canLogin === false && user.role !== 'admin') {
      return res.status(403).json({ message: 'Account access restricted' });
    }
    if (process.env.REQUIRE_EMAIL_VERIFICATION !== 'false' && !user.isVerified) {
      return res
        .status(403)
        .json({ message: 'Please verify your email before continuing' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};

// Admin-only guard; must run after protect.
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Admin access required' });
};

module.exports = { protect, admin };
