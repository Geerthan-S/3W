/**
 * pages/Profile.jsx (accessible at /profile/:username)
 * Shows the user's public profile: avatar, bio, post count, and their posts.
 * Can be visited by anyone — no auth required to view.
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { postsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import './Profile.css';

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ─── Load user posts ───────────────────────────────────────────────────────
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await postsAPI.getUserPosts(username);
        setPosts(data.posts);
      } catch {
        setError('Failed to load this profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [username]);

  // ─── Handle post deleted from profile ─────────────────────────────────────
  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  // ─── Derive stats from posts ───────────────────────────────────────────────
  const totalLikes = posts.reduce((sum, p) => sum + (p.likes?.length || 0), 0);
  const totalComments = posts.reduce((sum, p) => sum + (p.comments?.length || 0), 0);

  // Get initials for avatar
  const initials = username?.slice(0, 2).toUpperCase();

  // Check if viewing own profile
  const isOwnProfile = currentUser?.username === username;

  return (
    <div className="profile-page">
      {/* ── Profile Header ── */}
      <div className="profile-header-banner">
        <div className="profile-banner-gradient" />
        <div className="container">
          <div className="profile-header">
            {/* Avatar */}
            <div className="profile-avatar-wrap">
              <div className="avatar avatar-lg profile-avatar">{initials}</div>
            </div>

            {/* Info */}
            <div className="profile-info">
              <h1 className="profile-username">{username}</h1>
              {isOwnProfile && (
                <span className="profile-badge">You</span>
              )}
              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-value">{posts.length}</span>
                  <span className="stat-label">Posts</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <span className="stat-value">{totalLikes}</span>
                  <span className="stat-label">Likes received</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                  <span className="stat-value">{totalComments}</span>
                  <span className="stat-label">Comments</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Posts ── */}
      <div className="container profile-content">
        <div className="profile-section-label">
          <span className="gradient-text">Posts by {username}</span>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" />
          </div>
        )}

        {/* Error */}
        {error && <p className="alert alert-error">{error}</p>}

        {/* Posts list */}
        {!loading && !error && (
          <>
            {posts.length === 0 ? (
              <div className="profile-empty glass-card">
                <p className="profile-empty-emoji">🌟</p>
                <h3>No posts yet</h3>
                {isOwnProfile ? (
                  <p>
                    Share your first post!{' '}
                    <Link to="/create" className="auth-link">Create one now →</Link>
                  </p>
                ) : (
                  <p>{username} hasn't posted anything yet.</p>
                )}
              </div>
            ) : (
              <div className="posts-list">
                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onDelete={handlePostDeleted}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Profile;
