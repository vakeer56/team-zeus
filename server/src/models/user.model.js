// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,       // creates index automatically
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    select: false        // CRITICAL: never returned in queries by default
                          // must explicitly .select('+passwordHash') during login
  },
  role: {
    type: String,
    enum: ['admin', 'candidate'],   // whitelist — prevents privilege injection
    default: 'candidate',
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null
  }
}, { timestamps: true });          // adds createdAt, updatedAt

module.exports = mongoose.model('User', userSchema);