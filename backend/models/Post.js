/**
 * models/Post.js
 * Mongoose schema for social posts.
 * Supports text, image URL, likes (tracked by user ID),
 * and nested comments (with author info embedded).
 */

const mongoose = require('mongoose');

// ─── Sub-schema for comments ───────────────────────────────────────────────────
const commentSchema = new mongoose.Schema(
  {
    // Reference to the user who wrote the comment
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Denormalized username for fast display without extra queries
    authorUsername: {
      type: String,
      required: true,
    },
    // The comment text
    text: {
      type: String,
      required: [true, 'Comment cannot be empty'],
      maxlength: [500, 'Comment must be at most 500 characters'],
      trim: true,
    },
  },
  {
    timestamps: true, // Each comment has its own createdAt
  }
);

// ─── Main Post schema ─────────────────────────────────────────────────────────
const postSchema = new mongoose.Schema(
  {
    // The user who created this post
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Denormalized for feed performance (avoids a join on every load)
    authorUsername: {
      type: String,
      required: true,
    },

    // Optional text content (at least one of text/imageUrl required)
    text: {
      type: String,
      default: '',
      maxlength: [1000, 'Post text must be at most 1000 characters'],
      trim: true,
    },

    // Optional image URL
    imageUrl: {
      type: String,
      default: '',
    },

    /**
     * Likes: stored as an array of user IDs.
     * This lets us: 
     *  - Count likes quickly (likes.length)
     *  - Check if current user liked it (likes.includes(userId))
     *  - Toggle like without duplicates
     */
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Embedded comments (no separate collection needed per assignment rules)
    comments: [commentSchema],

    // Embedded poll (optional)
    poll: {
      options: [
        {
          text: {
            type: String,
            required: true,
            trim: true,
          },
          votes: [
            {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User',
            }
          ]
        }
      ],
      expiresAt: {
        type: Date,
      }
    },

    // Embedded promotion (optional)
    promotion: {
      appName: {
        type: String,
        trim: true,
      },
      title: {
        type: String,
        trim: true,
      },
      description: {
        type: String,
        trim: true,
      },
      buttonText: {
        type: String,
        trim: true,
      },
      buttonLink: {
        type: String,
        trim: true,
      },
      category: {
        type: String,
        enum: ['Refer And Earn', 'Crypto'],
        trim: true,
      }
    }
  },
  {
    timestamps: true, // createdAt used for feed ordering
  }
);

// ─── Index for fast feed queries (newest first) ────────────────────────────────
postSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Post', postSchema);
