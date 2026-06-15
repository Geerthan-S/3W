/**
 * components/PostCard.jsx
 * Displays a single post with: author info, text, image, like button,
 * comment count, and a collapsible comment section.
 * Like updates are instant (optimistic UI).
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postsAPI } from '../services/api';
import CommentSection from './CommentSection';
import './PostCard.css';

// ─── Helper: relative time string ─────────────────────────────────────────────
const timeAgo = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const PostCard = ({ post, onDelete }) => {
  const { user } = useAuth();

  // ─── Local state for optimistic like updates ───────────────────────────────
  const [liked, setLiked] = useState(
    user ? post.likes?.includes(user.id) : false
  );
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ─── Toggle like ───────────────────────────────────────────────────────────
  const handleLike = async () => {
    if (!user || likeLoading) return;

    // Optimistically update UI before the API call completes
    setLiked((prev) => !prev);
    setLikesCount((prev) => (liked ? prev - 1 : prev + 1));
    setLikeLoading(true);

    try {
      const { data } = await postsAPI.likePost(post._id);
      // Sync with server response in case of race conditions
      setLiked(data.liked);
      setLikesCount(data.likesCount);
    } catch {
      // Revert optimistic update on failure
      setLiked((prev) => !prev);
      setLikesCount((prev) => (liked ? prev + 1 : prev - 1));
    } finally {
      setLikeLoading(false);
    }
  };

  // ─── Delete post ───────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    setDeleteLoading(true);
    try {
      await postsAPI.deletePost(post._id);
      if (onDelete) onDelete(post._id);
    } catch {
      alert('Failed to delete post');
      setDeleteLoading(false);
    }
  };

  const isOwner = user && (user.id === post.author?._id || user.id === post.author);

  return (
    <article className="post-card glass-card fade-in-up">
      {/* ── Post Header ── */}
      <div className="post-header">
        <Link to={`/profile/${post.authorUsername}`} className="post-author-link">
          <div className="avatar post-avatar">
            {post.author?.avatar ? (
              <img src={post.author.avatar} alt={post.authorUsername} />
            ) : (
              post.authorUsername?.slice(0, 2).toUpperCase()
            )}
          </div>
          <div>
            <p className="post-username">{post.authorUsername}</p>
            <p className="post-time">{timeAgo(post.createdAt)}</p>
          </div>
        </Link>

        {/* ── Delete button (owner only) ── */}
        {isOwner && (
          <button
            className="btn btn-danger post-delete-btn"
            onClick={handleDelete}
            disabled={deleteLoading}
            title="Delete post"
          >
            {deleteLoading ? '…' : '🗑'}
          </button>
        )}
      </div>

      {/* ── Post Content ── */}
      <div className="post-content">
        {post.text && <p className="post-text">{post.text}</p>}
        {post.imageUrl && (
          <div className="post-image-wrap">
            <img
              src={post.imageUrl}
              alt="Post"
              className="post-image"
              loading="lazy"
              onError={(e) => {
                // Hide broken images gracefully
                e.target.closest('.post-image-wrap').style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      {/* ── Post Actions ── */}
      <div className="post-actions">
        {/* Like button */}
        <button
          className={`action-btn like-btn ${liked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={!user}
          title={user ? (liked ? 'Unlike' : 'Like') : 'Log in to like'}
        >
          <span className="action-icon">{liked ? '❤️' : '🤍'}</span>
          <span className="action-count">{likesCount}</span>
        </button>

        {/* Comment toggle */}
        <button
          className={`action-btn ${showComments ? 'active' : ''}`}
          onClick={() => setShowComments((v) => !v)}
        >
          <span className="action-icon">💬</span>
          <span className="action-count">{commentsCount}</span>
        </button>
      </div>

      {/* ── Comments (collapsible) ── */}
      {showComments && (
        <CommentSection
          postId={post._id}
          initialComments={post.comments || []}
          onCommentAdded={(count) => setCommentsCount(count)}
        />
      )}
    </article>
  );
};

export default PostCard;
