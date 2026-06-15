/**
 * models/User.js
 * Mongoose schema for User accounts.
 * Stores authentication info and public profile details.
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // Display name shown on posts and profile
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username must be at most 20 characters'],
    },

    // Email used for login (not shown publicly)
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },

    // Hashed password — never stored as plain text
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },

    // Optional avatar URL — defaults to a generated one based on username
    avatar: {
      type: String,
      default: '',
    },

    // Short bio shown on the profile page
    bio: {
      type: String,
      default: '',
      maxlength: [150, 'Bio must be at most 150 characters'],
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// ─── Hash password before saving ──────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  // Only hash if the password field was changed (not on profile updates)
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ─── Instance method: compare passwords ───────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
