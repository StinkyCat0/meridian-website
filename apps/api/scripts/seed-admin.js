// backend/scripts/seed-admin.js
require('dotenv').config({ path: '../.env' });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;

const seedAdmin = async () => {
  let conn;
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    console.log(`   URI: ${MONGO_URI?.replace(/:[^:]+@/, ':***@') || 'NOT SET'}`);
    
    conn = await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    
    console.log(`✅ Connected: ${conn.connection.host}`);
    
    // Check if admin already exists
    const existing = await User.findOne({ email: 'admin@meridian.local' });
    if (existing) {
      console.log('⚠️ Admin already exists:', existing.email);
      await mongoose.disconnect();
      process.exit(0);
    }

    // ✅ Manual bcrypt hash to bypass any middleware issues
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('MeridianDev2026!', salt);
    
    // Create user with pre-hashed password
    const admin = new User({
      name: 'Meridian Admin',
      email: 'admin@meridian.local',
      password: hashedPassword, // Already hashed ✅
      role: 'admin'
    });
    
    // Save with validateBeforeSave: false to skip pre-save hook (already hashed)
    await admin.save({ validateBeforeSave: false });

    console.log('\n✅ Admin created successfully!');
    console.log(`📧 Email: ${admin.email}`);
    console.log(`🔑 Password: MeridianDev2026! (change in production)`);
    console.log(`🆔 ID: ${admin._id}`);
    console.log(`🎭 Role: ${admin.role}`);
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
    
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    
    if (err.message.includes('ECONNREFUSED')) {
      console.error('💡 Is MongoDB running locally? Try: mongodb-start');
    } else if (err.message.includes('Authentication failed')) {
      console.error('💡 Check Atlas credentials & IP whitelist in MongoDB Atlas');
    } else if (err.message.includes('next is not a function')) {
      console.error('💡 Update User.js: use async pre-save WITHOUT next() callback');
    }
    
    if (conn) await mongoose.disconnect();
    process.exit(1);
  }
};

seedAdmin();
