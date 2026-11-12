// backend/routes/auth.js - Production Auth Routes
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const emailService = require('../utils/emailService');

// 🔍 DEBUG: Log when this file loads (remove in production)
if (process.env.DEBUG === 'true') {
  console.log('✅ auth.js routes loaded');
}

// POST /api/auth/register - Create new user with email verification
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    if (process.env.DEBUG === 'true') {
      console.log('🔍 Register attempt:', { email, hasPassword: !!password });
    }
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password required' });
    }
    
    // Check if user already exists (case-insensitive)
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    // Create new user - pre-save hook hashes password automatically ✅
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'staff',
    });
    
    // Generate and send verification email
    const verifyToken = user.generateVerificationToken();
    await user.save();
    await emailService.sendVerification(user, verifyToken);
    
    // Create JWT for immediate login (but require verification for sensitive actions)
    const payload = { user: { id: user._id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    
    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      token,
      user: user.getPublicProfile(),
      requiresVerification: true,
    });
    
  } catch (err) {
    if (process.env.DEBUG === 'true') {
      console.error('❌ Register error:', err);
    }
    
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    
    res.status(500).json({ message: 'Registration failed', error: process.env.DEBUG === 'true' ? err.message : undefined });
  }
});

// GET /api/auth/verify-email - Verify email with token
router.get('/verify-email', async (req, res) => {
  try {
    const { token, email } = req.query;
    
    if (!token || !email) {
      return res.status(400).json({ message: 'Token and email required' });
    }
    
    // Hash token for comparison (security: never store raw tokens)
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    const user = await User.findOne({
      email: email.toLowerCase(),
      verificationToken: hashedToken,
      verificationTokenExpiry: { $gt: Date.now() },
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }
    
    // Mark user as verified
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();
    
    // Redirect to frontend with success param
    res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
    
  } catch (err) {
    if (process.env.DEBUG === 'true') {
      console.error('❌ Verify email error:', err);
    }
    res.status(500).json({ message: 'Verification failed' });
  }
});

// POST /api/auth/login - Authenticate user (preserves your JWT structure)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (process.env.DEBUG === 'true') {
      console.log('🔍 Login attempt:', { email, hasPassword: !!password });
    }
    
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    
    // 🔑 CRITICAL: Select +password to include it (excluded by default)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      // Security: Don't reveal if email exists
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    // Check account lockout
    if (user.isLocked()) {
      return res.status(429).json({ message: 'Account locked due to too many failed attempts. Try again later.' });
    }
    
    // 🔑 CRITICAL: Await the bcrypt comparison (preserves your matchPassword method)
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      await user.incrementLoginAttempts();
      return res.status(400).json({ message: 'Invalid email or password' });
    }
    
    // Check if email is verified (optional: require verification for login)
    if (!user.isVerified) {
      // Resend verification email
      const verifyToken = user.generateVerificationToken();
      await user.save();
      await emailService.sendVerification(user, verifyToken);
      return res.status(403).json({ 
        message: 'Please verify your email before logging in. A new verification email has been sent.',
        requiresVerification: true 
      });
    }
    
    // Reset login attempts on successful login
    await user.resetLoginAttempts();
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    
    // 🔑 CRITICAL: Create JWT payload matching your existing structure
    const payload = {
      user: {
        id: user._id,
        role: user.role,
      },
    };
    
    // Sign token with JWT_SECRET from .env
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    if (process.env.DEBUG === 'true') {
      console.log('🎉 Login successful - returning token');
    }
    
    // Return token + safe user data (preserves your response structure)
    res.json({
      token,
      user: user.getPublicProfile(),
    });
    
  } catch (err) {
    if (process.env.DEBUG === 'true') {
      console.error('❌ LOGIN ERROR:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
      });
    }
    
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.DEBUG === 'true' ? err.message : undefined,
    });
  }
});

// POST /api/auth/forgot-password - Send password reset email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Find user (case-insensitive)
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Always return success message (security: don't reveal if email exists)
    if (!user) {
      return res.status(200).json({ message: 'If an account exists with that email, a reset link has been sent.' });
    }
    
    // Generate reset token
    const resetToken = user.generateResetToken();
    await user.save();
    
    // Send reset email via configurable service (Zoho/Gmail/etc.)
    await emailService.sendPasswordReset(user, resetToken);
    
    res.status(200).json({ message: 'If an account exists with that email, a reset link has been sent.' });
    
  } catch (err) {
    if (process.env.DEBUG === 'true') {
      console.error('❌ Forgot password error:', err);
    }
    res.status(500).json({ message: 'Failed to process reset request' });
  }
});

// POST /api/auth/reset-password - Reset password with token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;
    
    if (!token || !email || !newPassword) {
      return res.status(400).json({ message: 'Token, email, and new password are required' });
    }
    
    // Hash token for comparison
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // Find user with valid reset token
    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: Date.now() },
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    // Update password (pre-save hook hashes it automatically)
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();
    
    res.status(200).json({ message: 'Password has been reset successfully. Please log in with your new password.' });
    
  } catch (err) {
    if (process.env.DEBUG === 'true') {
      console.error('❌ Reset password error:', err);
    }
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// GET /api/auth/me - Get current user from JWT (preserves your structure)
router.get('/me', async (req, res) => {
  try {
    // Get token from Authorization header: "Bearer <token>"
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token missing' });
    }
    
    // Verify token signature and expiry (preserves your JWT_SECRET usage)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 🔑 CRITICAL: decoded.user.id matches your payload structure
    const user = await User.findById(decoded.user.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }
    
    res.json(user.getPublicProfile());
    
  } catch (err) {
    if (process.env.DEBUG === 'true') {
      console.error('❌ Auth me error:', err.name, err.message);
    }
    
    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Token is invalid' });
    }
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    
    res.status(401).json({ message: 'Token is not valid' });
  }
});

// POST /api/auth/logout - Client deletes token locally (stateless JWT)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful - delete token client-side' });
});

module.exports = router;
