const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // never return this field unless explicitly requested
    },
    name: {
      type: String,
      trim: true,
    },
    refreshTokenVersion: {
      type: Number,
      default: 0, // bump this to invalidate all existing refresh tokens at once
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
