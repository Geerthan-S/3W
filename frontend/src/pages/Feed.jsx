/**
 * pages/Feed.jsx
 * The public social feed — shows all posts from all users.
 * Uses cursor-based infinite scroll for pagination (bonus feature).
 * Logged-in users see an inline create-post form at the top.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { postsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import './Feed.css';

const Feed = () => {
  const { user } = useAuth();

  // ─── Feed state ────────────────────────────────────────────────────────────
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState(null); // Last post ID for pagination

  // Ref to the sentinel element at the bottom for Intersection Observer
  const sentinelRef = useRef(null);

  // ─── Load initial feed ─────────────────────────────────────────────────────
  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await postsAPI.getFeed(null, 10);
      setPosts(data.posts);
      setHasMore(data.hasMore);
      setCursor(data.nextCursor);
    } catch {
      setError('Failed to load feed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  // ─── Load more posts (infinite scroll) ────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !cursor) return;

    setLoadingMore(true);
    try {
      const { data } = await postsAPI.getFeed(cursor, 10);
      setPosts((prev) => [...prev, ...data.posts]);
      setHasMore(data.hasMore);
      setCursor(data.nextCursor);
    } catch {
      // Silently fail on pagination — user can scroll up and down to retry
      console.error('Failed to load more posts');
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, cursor]);

  // ─── Intersection Observer for infinite scroll ─────────────────────────────
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // When the sentinel enters the viewport, load more posts
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loading]);

  // ─── Handle new post created inline ───────────────────────────────────────
  const handlePostCreated = (newPost) => {
    // Prepend the new post to the top of the feed
    setPosts((prev) => [newPost, ...prev]);
  };

  // ─── Handle post deleted ───────────────────────────────────────────────────
  const handlePostDeleted = (postId) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  return (
    <div className="feed-page">
      {/* ── Hero banner ── */}
      <div className="feed-hero">
        <div className="feed-hero-inner">
          <h1 className="feed-hero-title">
            <span className="gradient-text">Community Feed</span> 🌐
          </h1>
          <p className="feed-hero-subtitle">
            See what everyone's sharing • Like • Comment • Connect
          </p>
        </div>
      </div>

      <div className="container feed-container">
        {/* ── Create post form (logged in users only) ── */}
        {user ? (
          <div className="feed-create-wrap">
            <CreatePost onPostCreated={handlePostCreated} />
          </div>
        ) : (
          <div className="feed-cta glass-card">
            <p>
              <Link to="/signup" className="cta-link">Create an account</Link>
              {' '}or{' '}
              <Link to="/login" className="cta-link">log in</Link>
              {' '}to post, like, and comment!
            </p>
          </div>
        )}

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="feed-loading">
            {[1, 2, 3].map((i) => (
              <div key={i} className="post-skeleton glass-card">
                <div className="skeleton-header">
                  <div className="skeleton-avatar skeleton-pulse" />
                  <div className="skeleton-lines">
                    <div className="skeleton-line skeleton-pulse" style={{ width: '40%' }} />
                    <div className="skeleton-line skeleton-pulse" style={{ width: '25%' }} />
                  </div>
                </div>
                <div className="skeleton-line skeleton-pulse" style={{ width: '90%' }} />
                <div className="skeleton-line skeleton-pulse" style={{ width: '70%' }} />
                <div className="skeleton-line skeleton-pulse" style={{ width: '55%' }} />
              </div>
            ))}
          </div>
        )}

        {/* ── Error state ── */}
        {error && !loading && (
          <div className="feed-error">
            <p className="alert alert-error">{error}</p>
            <button className="btn btn-ghost" onClick={loadFeed}>
              Try Again
            </button>
          </div>
        )}

        {/* ── Posts list ── */}
        {!loading && !error && (
          <>
            {posts.length === 0 ? (
              <div className="feed-empty glass-card">
                <p className="feed-empty-emoji">✦</p>
                <h3>No posts yet</h3>
                <p>Be the first to share something with the community!</p>
                {!user && (
                  <Link to="/signup" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                    Get Started
                  </Link>
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

            {/* ── Infinite scroll sentinel ── */}
            <div ref={sentinelRef} className="feed-sentinel" />

            {/* ── Load more indicator ── */}
            {loadingMore && (
              <div className="feed-loading-more">
                <div className="spinner" />
              </div>
            )}

            {/* ── End of feed ── */}
            {!hasMore && posts.length > 0 && (
              <p className="feed-end">You've reached the end ✦</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Feed;
