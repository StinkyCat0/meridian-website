// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 🔐 Protect route: verify JWT and attach user to req (preserves your structure)
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token signature and expiry (uses your JWT_SECRET)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // 🔑 CRITICAL: decoded.user.id matches your payload structure
      req.user = await User.findById(decoded.user.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }
      
      // Check if user account is active
      if (!req.user.isActive) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }
      
      // Check if user can login (for subscription control)
      if (!req.user.access?.canLogin && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Account access restricted' });
      }
      
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Token is invalid' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token has expired' });
      }
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// 🔐 Admin-only middleware (optional helper)
const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

module.exports = { protect, admin };
