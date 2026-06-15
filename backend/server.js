/**
 * server.js
 * Entry point for the Social Post App backend.
 * Sets up Express, connects to MongoDB, and registers all routes.
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Route imports
const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://3-w-phi.vercel.app",
      "https://3-w-black.vercel.app"
    ],
    credentials: true
  })
);
app.use(express.json({ limit: '10mb' })); // Allow large base64 images if needed

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'Social Post App API is running 🚀' });
});

// ─── Database Connection ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
