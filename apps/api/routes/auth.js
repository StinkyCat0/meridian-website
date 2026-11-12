// apps/api/routes/auth.js - Authentication routes.
const express = require('express');

const User = require('../models/User');
const emailService = require('../utils/emailService');
const { signAuthToken, hashToken } = require('../utils/tokens');
const { protect } = require('../middleware/authMiddleware');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

const loginLimiter = rateLimit({ windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX });
const registerLimiter = rateLimit({ windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX });
const forgotPasswordLimiter = rateLimit({ windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX });
const resetPasswordLimiter = rateLimit({ windowMs: RATE_LIMIT_WINDOW_MS, max: RATE_LIMIT_MAX });

const FORGOT_PASSWORD_MESSAGE =
  'If an account exists with that email, a reset link has been sent.';

function normalizeEmail(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) return null;
  return email;
}

function cleanString(value, maxLength) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return trimmed;
}

function readPassword(value) {
  return typeof value === 'string' ? value : '';
}

function isValidPassword(password) {
  return (
    password.length >= MIN_PASSWORD_LENGTH && password.length <= MAX_PASSWORD_LENGTH
  );
}

function wantsJson(req) {
  return String(req.headers.accept || '').includes('application/json');
}

function frontendBaseUrl() {
  return (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
}

// Sending mail is best-effort: a failed send must never fail the request.
async function sendMailBestEffort(label, send) {
  try {
    await send();
  } catch (error) {
    console.error(`✉️ ${label} email was not sent: ${error.message}`);
  }
}

// POST /api/auth/register - Create a customer account.
router.post('/register', registerLimiter, async (req, res, next) => {
  try {
    const name = cleanString(req.body?.name, 100);
    const email = normalizeEmail(req.body?.email);
    const password = readPassword(req.body?.password);

    if (!name) {
      return res.status(400).json({ message: 'A valid name is required' });
    }
    if (!email) {
      return res.status(400).json({ message: 'A valid email is required' });
    }
    if (!isValidPassword(password)) {
      return res
        .status(400)
        .json({ message: `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters` });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Public registration always creates a plain customer account; the role
    // (and any other privileged fields) from the request body is ignored.
    const user = await User.create({ name, email, password, role: 'user' });

    const verifyToken = user.generateVerificationToken();
    await user.save();

    await sendMailBestEffort('Verification', () =>
      emailService.sendVerification(user, verifyToken),
    );

    return res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      token: signAuthToken(user),
      user: user.getPublicProfile(),
      requiresVerification: true,
    });
  } catch (err) {
    if (err && err.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    return next(err);
  }
});

// GET /api/auth/verify-email - Verify an email address with a token.
router.get('/verify-email', async (req, res, next) => {
  try {
    const token = typeof req.query.token === 'string' ? req.query.token : '';
    const email = normalizeEmail(req.query.email);

    if (!token || !email) {
      return res.status(400).json({ message: 'Token and email required' });
    }

    const user = await User.findOne({
      email,
      verificationToken: hashToken(token),
      verificationTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;
    await user.save();

    if (wantsJson(req)) {
      return res.json({ message: 'Email verified successfully', verified: true });
    }
    return res.redirect(`${frontendBaseUrl()}/login?verified=true`);
  } catch (err) {
    return next(err);
  }
});

// POST /api/auth/login - Authenticate a user.
router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = readPassword(req.body?.password);

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email }).select('+password');

    // Same response whether the email exists or not.
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isLocked) {
      return res
        .status(429)
        .json({ message: 'Account locked due to too many failed attempts. Try again later.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await user.incLoginAttempts();
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Match protect(): a valid password is not enough for a deactivated or
    // login-restricted account (admins are exempt from canLogin).
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }
    if (user.access?.canLogin === false && user.role !== 'admin') {
      return res.status(403).json({ message: 'Account access restricted' });
    }

    if (process.env.REQUIRE_EMAIL_VERIFICATION !== 'false' && !user.isVerified) {
      const verifyToken = user.generateVerificationToken();
      await user.save();
      await sendMailBestEffort('Verification', () =>
        emailService.sendVerification(user, verifyToken),
      );
      return res.status(403).json({
        message:
          'Please verify your email before logging in. A new verification email has been sent.',
        requiresVerification: true,
      });
    }

    await user.resetLoginAttempts();
    user.lastLogin = new Date();
    await user.save();

    return res.json({
      token: signAuthToken(user),
      user: user.getPublicProfile(),
    });
  } catch (err) {
    return next(err);
  }
});

// POST /api/auth/forgot-password - Send a password reset email.
router.post('/forgot-password', forgotPasswordLimiter, async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email) {
      return res.status(400).json({ message: 'A valid email is required' });
    }

    const user = await User.findOne({ email });
    if (user) {
      const resetToken = user.generateResetToken();
      await user.save();
      await sendMailBestEffort('Password reset', () =>
        emailService.sendPasswordReset(user, resetToken),
      );
    }

    // Never reveal whether the address is registered.
    return res.status(200).json({ message: FORGOT_PASSWORD_MESSAGE });
  } catch (err) {
    return next(err);
  }
});

// POST /api/auth/reset-password - Reset a password with a valid token.
router.post('/reset-password', resetPasswordLimiter, async (req, res, next) => {
  try {
    const token = typeof req.body?.token === 'string' ? req.body.token : '';
    const email = normalizeEmail(req.body?.email);
    const newPassword = readPassword(req.body?.newPassword);

    if (!token || !email || !newPassword) {
      return res
        .status(400)
        .json({ message: 'Token, email, and new password are required' });
    }
    if (!isValidPassword(newPassword)) {
      return res
        .status(400)
        .json({ message: `Password must be between ${MIN_PASSWORD_LENGTH} and ${MAX_PASSWORD_LENGTH} characters` });
    }

    const user = await User.findOne({
      email,
      resetPasswordToken: hashToken(token),
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({
      message: 'Password has been reset successfully. Please log in with your new password.',
    });
  } catch (err) {
    return next(err);
  }
});

// GET /api/auth/me - Current user's public profile.
router.get('/me', protect, (req, res) => {
  res.json(req.user.getPublicProfile());
});

// POST /api/auth/logout - Stateless JWT: the client drops the token.
router.post('/logout', (_req, res) => {
  res.json({ message: 'Logout successful - delete token client-side' });
});

module.exports = router;
