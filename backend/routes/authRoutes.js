/**
 * routes/authRoutes.js
 * Handles user registration and login.
 * Returns a JWT token on success.
 */

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// ─── Helper: generate a signed JWT ────────────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '7d', // Token valid for 7 days
  });
};

// ─── POST /api/auth/register ───────────────────────────────────────────────────
// Creates a new user account and returns a JWT token.
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if email or username is already taken
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      const field = existingUser.email === email.toLowerCase() ? 'Email' : 'Username';
      return res.status(409).json({ message: `${field} is already taken` });
    }

    // Create the user (password is hashed in the pre-save hook)
    const user = await User.create({ username, email, password });

    // Return the token and public user info
    res.status(201).json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        followers: user.followers || [],
        following: user.following || [],
      },
    });
  } catch (err) {
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({ message: messages[0] });
    }
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// ─── POST /api/auth/login ──────────────────────────────────────────────────────
// Authenticates a user and returns a JWT token.
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Generic message to avoid email enumeration
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare provided password with stored hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Return token and user info
    res.json({
      token: generateToken(user._id),
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        followers: user.followers || [],
        following: user.following || [],
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// ─── GET /api/auth/me ──────────────────────────────────────────────────────────
// Returns the currently authenticated user's profile.
router.get('/me', protect, async (req, res) => {
  res.json({
    id: req.user._id,
    username: req.user.username,
    email: req.user.email,
    avatar: req.user.avatar,
    bio: req.user.bio,
    createdAt: req.user.createdAt,
    followers: req.user.followers || [],
    following: req.user.following || [],
  });
});

// ─── PUT /api/auth/profile ──────────────────────────────────────────────────────
// Updates the authenticated user's profile details (avatar, bio).
router.put('/profile', protect, async (req, res) => {
  try {
    const { avatar, bio } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (avatar !== undefined) user.avatar = avatar;
    if (bio !== undefined) user.bio = bio;
    
    await user.save();
    
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.createdAt,
      followers: user.followers || [],
      following: user.following || [],
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// ─── GET /api/auth/profile/:username ───────────────────────────────────────────
// Returns public profile details of a user by username.
router.get('/profile/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select('username bio avatar createdAt followers following');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({
      _id: user._id,
      username: user.username,
      bio: user.bio,
      avatar: user.avatar,
      createdAt: user.createdAt,
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
      followers: user.followers || [],
      following: user.following || [],
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Server error retrieving profile' });
  }
});

// ─── POST /api/auth/profile/:username/follow ──────────────────────────────────
// Follows/unfollows a user by username
router.post('/profile/:username/follow', protect, async (req, res) => {
  try {
    const targetUsername = req.params.username;
    const currentUser = req.user;

    if (currentUser.username === targetUsername) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const targetUser = await User.findOne({ username: targetUsername });
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!targetUser.followers) targetUser.followers = [];
    if (!currentUser.following) currentUser.following = [];

    const isFollowing = currentUser.following.some(id => id.toString() === targetUser._id.toString());

    if (isFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(id => id.toString() !== targetUser._id.toString());
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUser._id.toString());
    } else {
      // Follow
      currentUser.following.push(targetUser._id);
      targetUser.followers.push(currentUser._id);
    }

    await currentUser.save();
    await targetUser.save();

    res.json({
      followed: !isFollowing,
      followersCount: targetUser.followers.length,
      followingCount: targetUser.following.length,
      currentUserFollowing: currentUser.following,
    });
  } catch (err) {
    console.error('Follow error:', err);
    res.status(500).json({ message: 'Server error during follow operation' });
  }
});

module.exports = router;
