/**
 * components/CreatePost.jsx
 * Form for creating a new post.
 * Can be used as a standalone page (/create) or embedded in the feed.
 * Both text and imageUrl are optional, but at least one is required.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postsAPI } from '../services/api';
import './CreatePost.css';

const CreatePost = ({ onPostCreated }) => {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreviewError, setImagePreviewError] = useState(false);

  // ─── Submit handler ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // At least one field must be filled
    if (!text.trim() && !imageUrl.trim()) {
      setError('Please add some text or an image URL.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await postsAPI.createPost({
        text: text.trim(),
        imageUrl: imageUrl.trim(),
      });

      // If embedded in feed, notify parent; otherwise navigate back to feed
      if (onPostCreated) {
        onPostCreated(data);
        setText('');
        setImageUrl('');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  // Preview image validity
  const showPreview = imageUrl.trim() && !imagePreviewError;

  return (
    <form className="create-post-form glass-card" onSubmit={handleSubmit}>
      <h2 className="create-post-title">
        <span className="gradient-text">Create a Post</span>
      </h2>

      {/* ── Text area ── */}
      <div className="form-group">
        <label className="form-label">What's on your mind?</label>
        <textarea
          className="form-input create-post-textarea"
          placeholder="Share something with the community…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={1000}
          rows={4}
          disabled={loading}
        />
        <span className="char-count">{text.length}/1000</span>
      </div>

      {/* ── Image URL input ── */}
      <div className="form-group">
        <label className="form-label">Image URL (optional)</label>
        <input
          type="url"
          className="form-input"
          placeholder="https://example.com/image.jpg"
          value={imageUrl}
          onChange={(e) => { setImageUrl(e.target.value); setImagePreviewError(false); }}
          disabled={loading}
        />
      </div>

      {/* ── Image preview ── */}
      {showPreview && (
        <div className="image-preview-wrap">
          <img
            src={imageUrl}
            alt="Preview"
            className="image-preview"
            onError={() => setImagePreviewError(true)}
          />
          <button
            type="button"
            className="image-preview-remove"
            onClick={() => setImageUrl('')}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Error ── */}
      {error && <p className="alert alert-error">{error}</p>}

      {/* ── Submit ── */}
      <div className="create-post-actions">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || (!text.trim() && !imageUrl.trim())}
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              Posting…
            </>
          ) : (
            'Publish Post ✦'
          )}
        </button>
      </div>
    </form>
  );
};

export default CreatePost;
