// apps/api/models/User.js - Customer account schema.
const crypto = require('crypto');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true, // creates the index
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned by queries unless explicitly requested
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
      index: true,
    },
    isVerified: { type: Boolean, default: false },
    verificationToken: String,
    verificationTokenExpires: Date,

    // Password reset
    resetPasswordToken: String,
    resetPasswordExpires: Date,

    // Account status
    isActive: { type: Boolean, default: true },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    lastLogin: Date,

    // Access permissions
    access: {
      canLogin: { type: Boolean, default: true },
      canAccessChat: { type: Boolean, default: true },
      canAccessPremiumFeatures: { type: Boolean, default: false },
      canAccessCrm: { type: Boolean, default: false },
    },

    // Subscription (Stripe)
    subscription: {
      stripeCustomerId: { type: String, index: true },
      plan: {
        type: String,
        enum: ['free', 'basic', 'pro', 'enterprise'],
        default: 'free',
      },
      status: {
        type: String,
        enum: ['active', 'canceled', 'past_due', 'trialing'],
        default: 'active',
      },
      currentPeriodEnd: Date,
      cancelAtPeriodEnd: { type: Boolean, default: false },
    },

    // Profile
    avatar: String,
    bio: { type: String, maxlength: 500 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

function bcryptRounds() {
  const parsed = Number.parseInt(process.env.BCRYPT_ROUNDS, 10);
  if (!Number.isInteger(parsed)) return 12;
  return Math.min(14, Math.max(10, parsed));
}

function maxLoginAttempts() {
  const parsed = Number.parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 5;
}

function lockoutDurationMs() {
  const parsed = Number.parseInt(process.env.LOCKOUT_DURATION_MS, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 60 * 60 * 1000;
}

// Virtual: is the account currently locked?
userSchema.virtual('isLocked').get(function isLocked() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash the password only when it changed. Mongoose 9: no `next` callback.
userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, bcryptRounds());
});

// Compare a candidate password against the stored hash.
userSchema.methods.comparePassword = async function comparePassword(candidate) {
  if (typeof candidate !== 'string' || !this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

// Alias used by the auth routes.
userSchema.methods.matchPassword = function matchPassword(candidate) {
  return this.comparePassword(candidate);
};

// Safe profile shape returned to API clients. Never includes password/tokens.
userSchema.methods.getPublicProfile = function getPublicProfile() {
  return {
    id: this._id,
    // The dashboard reads `_id`; keep both keys for the existing web client.
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    isVerified: !!this.isVerified,
    access: {
      canLogin: this.access?.canLogin !== false,
      canAccessChat: this.access?.canAccessChat !== false,
      canAccessPremiumFeatures: this.access?.canAccessPremiumFeatures === true,
      canAccessCrm: this.access?.canAccessCrm === true,
    },
    subscription: {
      plan: this.subscription?.plan || 'free',
      status: this.subscription?.status || 'active',
      stripeCustomerId: this.subscription?.stripeCustomerId || null,
      currentPeriodEnd: this.subscription?.currentPeriodEnd || null,
      cancelAtPeriodEnd: this.subscription?.cancelAtPeriodEnd === true,
    },
    avatar: this.avatar || null,
    bio: this.bio || null,
    createdAt: this.createdAt,
    lastLogin: this.lastLogin || null,
  };
};

// Generate an email verification token; only the hash is persisted.
userSchema.methods.generateVerificationToken = function generateVerificationToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.verificationToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex')
    .toLowerCase();
  this.verificationTokenExpires = new Date(Date.now() + TOKEN_TTL_MS);
  return rawToken;
};

// Generate a password reset token; only the hash is persisted.
userSchema.methods.generateResetToken = function generateResetToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex')
    .toLowerCase();
  this.resetPasswordExpires = new Date(Date.now() + TOKEN_TTL_MS);
  return rawToken;
};

// Record a failed login. The increment and threshold check happen in a single
// atomic pipeline update so concurrent failures cannot all miss the lockout.
userSchema.methods.incLoginAttempts = async function incLoginAttempts() {
  const maxAttempts = maxLoginAttempts();
  const now = new Date();
  const nextLockUntil = new Date(now.getTime() + lockoutDurationMs());

  // A lock exists but has already run out: restart the attempt window.
  const lockExpired = {
    $and: [
      { $ne: [{ $type: '$lockUntil' }, 'missing'] },
      { $ne: ['$lockUntil', null] },
      { $lte: ['$lockUntil', now] },
    ],
  };

  return this.updateOne([
    {
      $set: {
        loginAttempts: {
          $cond: [lockExpired, 1, { $add: [{ $ifNull: ['$loginAttempts', 0] }, 1] }],
        },
      },
    },
    {
      $set: {
        lockUntil: {
          $cond: [
            {
              $and: [
                { $not: [lockExpired] },
                { $gte: ['$loginAttempts', maxAttempts] },
              ],
            },
            nextLockUntil,
            '$$REMOVE',
          ],
        },
      },
    },
  ], { updatePipeline: true });
};

// Clear failed login state after a successful login.
userSchema.methods.resetLoginAttempts = async function resetLoginAttempts() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

// Static: find a user and validate the password in one call.
userSchema.statics.findByCredentials = async function findByCredentials(email, password) {
  const user = await this.findOne({ email: String(email).toLowerCase() }).select('+password');
  if (!user) throw new Error('Invalid email or password');

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw new Error('Invalid email or password');

  return user;
};

module.exports = mongoose.model('User', userSchema);
