/**
 * components/CommentSection.jsx
 * Displays existing comments and a form to add a new one.
 * Only shows input if the user is logged in.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { postsAPI } from '../services/api';
import './CommentSection.css';

// ─── Helper: format relative time ─────────────────────────────────────────────
const timeAgo = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const CommentSection = ({ postId, initialComments, onCommentAdded }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState(initialComments || []);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ─── Submit a new comment ──────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || loading) return;

    setLoading(true);
    setError('');

    try {
      const { data } = await postsAPI.addComment(postId, text.trim());
      
      // Optimistically add the new comment to local state
      setComments((prev) => [...prev, data.comment]);
      setText('');
      
      // Notify parent (PostCard) to update the comment count
      if (onCommentAdded) onCommentAdded(data.commentsCount);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="comment-section">
      {/* ── Existing comments ── */}
      {comments.length > 0 && (
        <ul className="comment-list">
          {comments.map((comment) => (
            <li key={comment._id} className="comment-item fade-in-up">
              <div className="comment-avatar avatar avatar-sm">
                {comment.authorUsername?.slice(0, 2).toUpperCase()}
              </div>
              <div className="comment-body">
                <div className="comment-header">
                  <Link
                    to={`/profile/${comment.authorUsername}`}
                    className="comment-author"
                  >
                    {comment.authorUsername}
                  </Link>
                  <span className="comment-time">{timeAgo(comment.createdAt)}</span>
                </div>
                <p className="comment-text">{comment.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* ── Add comment form (only for logged-in users) ── */}
      {user ? (
        <form className="comment-form" onSubmit={handleSubmit}>
          <div className="comment-avatar avatar avatar-sm">
            {user.username?.slice(0, 2).toUpperCase()}
          </div>
          <div className="comment-input-wrap">
            <input
              type="text"
              className="form-input comment-input"
              placeholder="Write a comment…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={500}
              disabled={loading}
            />
            <button
              type="submit"
              className="btn btn-primary comment-submit"
              disabled={!text.trim() || loading}
            >
              {loading ? '…' : '→'}
            </button>
          </div>
          {error && <p className="alert alert-error" style={{ marginTop: '0.5rem' }}>{error}</p>}
        </form>
      ) : (
        <p className="comment-login-prompt">
          <Link to="/login">Log in</Link> to leave a comment
        </p>
      )}
    </div>
  );
};

export default CommentSection;
