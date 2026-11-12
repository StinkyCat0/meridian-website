// apps/api/scripts/seed-admin.js - Create (or update) an admin account.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
  const MONGO_URI = process.env.MONGO_URI;
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!MONGO_URI) {
    console.error('❌ MONGO_URI is required (set it in apps/api/.env).');
    process.exit(1);
  }
  if (!email || !password) {
    console.error(
      '❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment before seeding an admin.',
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('❌ ADMIN_PASSWORD must be at least 8 characters.');
    process.exit(1);
  }

  let conn;

  try {
    console.log('🔗 Connecting to MongoDB...');
    conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ Connected: ${conn.connection.host}`);

    let admin = await User.findOne({ email });

    if (admin) {
      admin.role = 'admin';
      admin.isVerified = true;
      admin.isActive = true;
      admin.access = { ...(admin.access || {}), canLogin: true, canAccessCrm: true };
      admin.password = password; // pre-save hook re-hashes
      await admin.save();
      console.log('✅ Existing admin updated (role, verification, password).');
    } else {
      admin = await User.create({
        name: 'Meridian Admin',
        email,
        password,
        role: 'admin',
        isVerified: true,
        isActive: true,
        access: { canLogin: true, canAccessCrm: true },
      });
      console.log('✅ Admin created successfully.');
    }

    console.log(`📧 Email: ${admin.email}`);
    console.log(`🆔 ID: ${admin._id}`);
    console.log(`🎭 Role: ${admin.role}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);

    if (err.message.includes('ECONNREFUSED')) {
      console.error('💡 Is MongoDB running locally? Try: mongodb-start');
    } else if (err.message.includes('Authentication failed')) {
      console.error('💡 Check MongoDB credentials and IP whitelist.');
    }

    if (conn) await mongoose.disconnect();
    process.exit(1);
  }
};

seedAdmin();
