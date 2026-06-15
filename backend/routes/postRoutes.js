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
//   ?sort=newest|likes|comments|foryou|shares
router.get('/', async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit) || 10, 20);
    const cursor = req.query.cursor;
    const sort   = req.query.sort || 'newest';
    const type   = req.query.type || 'posts';
    const category = req.query.category;
    const search = req.query.search;

    // Build base filter based on type and category
    const baseFilter = {};
    if (type === 'promotions') {
      baseFilter.promotion = { $ne: null };
      if (category && ['Refer And Earn', 'Crypto'].includes(category)) {
        baseFilter['promotion.category'] = category;
      }
      if (search) {
        const searchRegex = { $regex: search, $options: 'i' };
        baseFilter.$or = [
          { 'promotion.title': searchRegex },
          { 'promotion.description': searchRegex },
          { 'promotion.appName': searchRegex }
        ];
      }
    } else {
      baseFilter.$and = [
        {
          $or: [
            { promotion: null },
            { promotion: { $exists: false } }
          ]
        }
      ];
      if (search) {
        baseFilter.$and.push({
          text: { $regex: search, $options: 'i' }
        });
      }
    }

    let posts;

    if (sort === 'likes') {
      // Sort by number of likes (most liked first) — no cursor pagination for sorted views
      posts = await Post.find(baseFilter)
        .populate('author', 'username avatar')
        .lean();
      posts.sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0));
      posts = posts.slice(0, limit);
    } else if (sort === 'comments') {
      posts = await Post.find(baseFilter)
        .populate('author', 'username avatar')
        .lean();
      posts.sort((a, b) => (b.comments?.length || 0) - (a.comments?.length || 0));
      posts = posts.slice(0, limit);
    } else {
      // Default: newest first with cursor pagination
      const query = cursor ? { ...baseFilter, _id: { $lt: cursor } } : baseFilter;
      const raw = await Post.find(query)
        .sort({ _id: -1 })
        .limit(limit + 1)
        .populate('author', 'username avatar')
        .lean();

      const hasMore = raw.length > limit;
      if (hasMore) raw.pop();
      const nextCursor = hasMore ? raw[raw.length - 1]._id : null;
      return res.json({ posts: raw, hasMore, nextCursor });
    }

    res.json({ posts, hasMore: false, nextCursor: null });
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
    const { text, imageUrl, poll, pollDuration, promotion } = req.body;

    // Validate: need at least text, image, poll, or promotion
    if (!text?.trim() && !imageUrl?.trim() && !poll && !promotion) {
      return res.status(400).json({ message: 'Post must have text, an image, a poll, or a promotion' });
    }

    // Validate promotion if provided
    if (promotion) {
      const { appName, title, description, buttonText, buttonLink, category } = promotion;
      if (!appName?.trim() || !title?.trim() || !description?.trim() || !buttonText?.trim() || !buttonLink?.trim() || !category?.trim()) {
        return res.status(400).json({ message: 'All promotion fields are required.' });
      }
      if (!['Refer And Earn', 'Crypto'].includes(category)) {
        return res.status(400).json({ message: 'Invalid promotion category.' });
      }
    }

    let pollData = null;
    if (poll && Array.isArray(poll)) {
      const filteredOptions = poll.map(opt => opt.trim()).filter(Boolean);
      if (filteredOptions.length < 2) {
        return res.status(400).json({ message: 'A poll must have at least 2 options' });
      }
      if (!text?.trim()) {
        return res.status(400).json({ message: 'A poll must have a question (text)' });
      }

      const hours = parseInt(pollDuration) || 24;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + hours);

      pollData = {
        options: filteredOptions.map(t => ({ text: t, votes: [] })),
        expiresAt
      };
    }

    const post = await Post.create({
      author: req.user._id,
      authorUsername: req.user.username,
      text: text?.trim() || '',
      imageUrl: imageUrl?.trim() || '',
      poll: pollData,
      promotion: promotion || null
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
// ─── POST /api/posts/:id/vote ──────────────────────────────────────────────────
// Casts a vote on a poll option. Requires auth.
router.post('/:id/vote', protect, async (req, res) => {
  try {
    const { optionId } = req.body;
    if (!optionId) {
      return res.status(400).json({ message: 'Option ID is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!post.poll || !post.poll.options || post.poll.options.length === 0) {
      return res.status(400).json({ message: 'This post is not a poll' });
    }

    if (post.poll.expiresAt && new Date() > new Date(post.poll.expiresAt)) {
      return res.status(400).json({ message: 'This poll has ended' });
    }

    const userId = req.user._id;

    // Check if user has already voted on any option
    const alreadyVoted = post.poll.options.some(opt => 
      opt.votes.some(v => v.equals(userId))
    );

    if (alreadyVoted) {
      return res.status(400).json({ message: 'You have already voted in this poll' });
    }

    // Find the option to vote on
    const option = post.poll.options.id(optionId);
    if (!option) {
      return res.status(404).json({ message: 'Poll option not found' });
    }

    option.votes.push(userId);
    await post.save();

    res.json(post);
  } catch (err) {
    console.error('Vote error:', err);
    res.status(500).json({ message: 'Failed to record vote' });
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
