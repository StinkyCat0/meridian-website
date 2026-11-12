// backend/scripts/test-login.js
require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

const testLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🔗 Connected to MongoDB');
    
    const email = 'admin@meridian.local';
    const password = 'NewDevPass2026!';
    
    // 🔑 CRITICAL: Find user WITH password field (excluded by default)
    console.log('🔍 Finding user...');
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    console.log('✅ User found:', user.email);
    console.log('🔐 Password field present:', !!user.password);
    console.log('🔑 Password starts with $2:', user.password?.startsWith('$2'));
    
    // 🔑 CRITICAL: Use the model's matchPassword method
    console.log('🔐 Comparing password...');
    const isMatch = await user.matchPassword(password);
    
    console.log('✅ Password match result:', isMatch);
    
    if (isMatch) {
      console.log('🎉 LOGIN WOULD SUCCEED!');
      // Generate a test JWT
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || 'dev-secret',
        { expiresIn: '1h' }
      );
      console.log('🎫 Test token:', token.substring(0, 50) + '...');
    } else {
      console.log('❌ Password comparison failed');
      console.log('💡 This means either:');
      console.log('   1. matchPassword() method has a bug');
      console.log('   2. bcrypt version mismatch');
      console.log('   3. Password field not properly selected');
    }
    
    await mongoose.disconnect();
    process.exit(isMatch ? 0 : 1);
    
  } catch (err) {
    console.error('❌ Diagnostic error:', err.message);
    console.error('💡 Stack:', err.stack);
    process.exit(1);
  }
};

testLogin();
