/**
 * routes/postRoutes.js
 * CRUD for posts, plus like/comment functionality.
 * Feed uses cursor-based pagination for performance (bonus).
 */

const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const { protect } = require('../middleware/authMiddleware');

// ─── GET /api/posts ────────────────────────────────────────────────────────────
// Returns the public feed with cursor-based pagination.
// Query params:
//   ?limit=10        — number of posts per page (default: 10)
//   ?cursor=<postId> — fetch posts older than this ID (for infinite scroll)
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 20); // Cap at 20
    const cursor = req.query.cursor; // Last post ID from previous page

    // Build the query — if cursor provided, fetch posts before it
    const query = cursor ? { _id: { $lt: cursor } } : {};

    // Fetch posts, newest first, populating only the author's avatar
    const posts = await Post.find(query)
      .sort({ _id: -1 }) // Descending by _id = chronological (MongoDB ObjectID has timestamp)
      .limit(limit + 1)  // Fetch one extra to check if there's a next page
      .populate('author', 'username avatar')
      .lean(); // Use lean() for faster reads (plain JS objects, not Mongoose docs)

    // Check if there are more posts after this page
    const hasMore = posts.length > limit;
    if (hasMore) posts.pop(); // Remove the extra post we fetched

    // The next cursor is the last post's ID
    const nextCursor = hasMore ? posts[posts.length - 1]._id : null;

    res.json({ posts, hasMore, nextCursor });
  } catch (err) {
    console.error('Feed error:', err);
    res.status(500).json({ message: 'Failed to load feed' });
  }
});

// ─── POST /api/posts ───────────────────────────────────────────────────────────
// Creates a new post. Requires auth.
// At least one of text or imageUrl must be provided.
router.post('/', protect, async (req, res) => {
  try {
    const { text, imageUrl } = req.body;

    // Validate: need at least text or image
    if (!text?.trim() && !imageUrl?.trim()) {
      return res.status(400).json({ message: 'Post must have text or an image' });
    }

    const post = await Post.create({
      author: req.user._id,
      authorUsername: req.user.username,
      text: text?.trim() || '',
      imageUrl: imageUrl?.trim() || '',
    });

    // Populate author info before returning so the frontend can render immediately
    await post.populate('author', 'username avatar');

    res.status(201).json(post);
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ message: 'Failed to create post' });
  }
});

// ─── POST /api/posts/:id/like ──────────────────────────────────────────────────
// Toggles a like on a post. Requires auth.
// If the user already liked → unlike. Otherwise → like.
router.post('/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const userId = req.user._id;
    const alreadyLiked = post.likes.some((id) => id.equals(userId));

    if (alreadyLiked) {
      // Remove like (unlike)
      post.likes = post.likes.filter((id) => !id.equals(userId));
    } else {
      // Add like
      post.likes.push(userId);
    }

    await post.save();

    res.json({
      likesCount: post.likes.length,
      liked: !alreadyLiked, // New state after toggle
    });
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).json({ message: 'Failed to update like' });
  }
});

// ─── POST /api/posts/:id/comment ──────────────────────────────────────────────
// Adds a comment to a post. Requires auth.
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ message: 'Comment cannot be empty' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Add the new comment with denormalized author info
    const newComment = {
      author: req.user._id,
      authorUsername: req.user.username,
      text: text.trim(),
    };

    post.comments.push(newComment);
    await post.save();

    // Return only the newly added comment (last one)
    const addedComment = post.comments[post.comments.length - 1];

    res.status(201).json({
      comment: addedComment,
      commentsCount: post.comments.length,
    });
  } catch (err) {
    console.error('Comment error:', err);
    res.status(500).json({ message: 'Failed to add comment' });
  }
});

// ─── DELETE /api/posts/:id ─────────────────────────────────────────────────────
// Deletes a post. Only the post author can delete their own post.
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Ensure only the author can delete
    if (!post.author.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    await post.deleteOne();
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ message: 'Failed to delete post' });
  }
});

// ─── GET /api/posts/user/:username ────────────────────────────────────────────
// Returns all posts by a specific user (for profile page).
router.get('/user/:username', async (req, res) => {
  try {
    const posts = await Post.find({ authorUsername: req.params.username })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatar')
      .lean();

    res.json({ posts });
  } catch (err) {
    console.error('User posts error:', err);
    res.status(500).json({ message: 'Failed to load user posts' });
  }
});

module.exports = router;
