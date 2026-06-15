/**
 * pages/Feed.jsx
 * Main feed with filter tabs matching TaskPlanet:
 * [All Post] [For You] [Most Liked] [Most Commented] [Most Shared]
 * Infinite scroll via Intersection Observer.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Container, Typography, Tabs, Tab, Fab, Skeleton,
  Stack, Alert, Button, Paper,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { postsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';

const FILTER_TABS = [
  { label: 'All Post',      value: 'newest'   },
  { label: 'For You',       value: 'foryou'   },
  { label: 'Most Liked',    value: 'likes'    },
  { label: 'Most Commented',value: 'comments' },
  { label: 'Most Shared',   value: 'shares'   },
];

const Feed = () => {
  const { user } = useAuth();
  const [posts, setPosts]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError]           = useState('');
  const [hasMore, setHasMore]       = useState(true);
  const [cursor, setCursor]         = useState(null);
  const [activeTab, setActiveTab]   = useState(0);
  const sentinelRef                 = useRef(null);

  // ── Load feed (sort by active tab) ─────────────────────────────────────────
  const loadFeed = useCallback(async (sort = 'newest') => {
    setLoading(true); setError('');
    try {
      const { data } = await postsAPI.getFeed(null, 10, sort);
      setPosts(data?.posts || []);
      setHasMore(data?.hasMore || false);
      setCursor(data?.nextCursor || null);
    } catch (err) {
      console.error('Feed loading error:', err);
      setError('Failed to load feed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeed(FILTER_TABS[activeTab].value);
  }, [activeTab, loadFeed]);

  // ── Infinite scroll ─────────────────────────────────────────────────────────
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || !cursor) return;
    setLoadingMore(true);
    try {
      const { data } = await postsAPI.getFeed(cursor, 10, FILTER_TABS[activeTab].value);
      setPosts((p) => [...p, ...(data?.posts || [])]);
      setHasMore(data?.hasMore || false);
      setCursor(data?.nextCursor || null);
    } catch (err) {
      console.error('Load more error:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, cursor, activeTab]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasMore && !loading) loadMore(); },
      { threshold: 0.1, rootMargin: '120px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore, hasMore, loading]);

  // ── Handle new post / deleted post ─────────────────────────────────────────
  const handlePostCreated  = (p) => setPosts((prev) => [p, ...prev]);
  const handlePostDeleted  = (id) => setPosts((prev) => prev.filter((p) => p._id !== id));

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 10 }}>
      <Container maxWidth="sm" sx={{ pt: 2 }}>

        {/* ── Create post (logged in) or CTA (guest) ── */}
        {user ? (
          <CreatePost onPostCreated={handlePostCreated} />
        ) : (
          <Paper elevation={0} sx={{ p: 2, mb: 1.5, borderRadius: 3, textAlign: 'center',
                                     border: '1px dashed #bdbdbd' }}>
            <Typography variant="body2" color="text.secondary">
              <RouterLink to="/signup" style={{ color: '#2196F3', fontWeight: 600, textDecoration: 'none' }}>
                Sign up
              </RouterLink>
              {' '}or{' '}
              <RouterLink to="/login" style={{ color: '#2196F3', fontWeight: 600, textDecoration: 'none' }}>
                log in
              </RouterLink>
              {' '}to post, like, and comment!
            </Typography>
          </Paper>
        )}

        {/* ── Filter tabs ── */}
        <Paper elevation={0} sx={{ borderRadius: 3, mb: 1.5, overflow: 'hidden' }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            TabIndicatorProps={{ style: { display: 'none' } }}
            sx={{
              minHeight: 42,
              '& .MuiTab-root': {
                minHeight: 42, minWidth: 'auto', px: 2, py: 0.5,
                fontSize: '0.8rem', fontWeight: 600, color: 'text.secondary',
                borderRadius: 20, mx: 0.3, my: 0.5,
                textTransform: 'none',
              },
              '& .Mui-selected': {
                bgcolor: 'primary.main', color: '#fff !important',
                borderRadius: 20,
              },
            }}
          >
            {FILTER_TABS.map((tab, i) => (
              <Tab key={tab.value} label={tab.label} id={`feed-tab-${i}`} />
            ))}
          </Tabs>
        </Paper>

        {/* ── Loading skeletons ── */}
        {loading && (
          <Stack spacing={1.5}>
            {[1, 2, 3].map((i) => (
              <Paper key={i} sx={{ p: 2, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                  <Skeleton variant="circular" width={44} height={44} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="40%" height={18} />
                    <Skeleton variant="text" width="25%" height={14} />
                  </Box>
                </Box>
                <Skeleton variant="text" width="90%" />
                <Skeleton variant="text" width="70%" />
                <Skeleton variant="rounded" height={180} sx={{ mt: 1, borderRadius: 2 }} />
              </Paper>
            ))}
          </Stack>
        )}

        {/* ── Error ── */}
        {error && !loading && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
            <Button variant="outlined" onClick={() => loadFeed(FILTER_TABS[activeTab].value)}>
              Try Again
            </Button>
          </Box>
        )}

        {/* ── Posts ── */}
        {!loading && !error && (
          <>
            {posts.length === 0 ? (
              <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
                <Typography variant="h5" sx={{ mb: 1 }}>🌐</Typography>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>No posts yet</Typography>
                <Typography variant="body2" color="text.secondary">
                  {user ? 'Be the first to share something!' : 'Sign up to start posting.'}
                </Typography>
              </Paper>
            ) : (
              <Stack spacing={0}>
                {posts.map((post) => (
                  <PostCard key={post._id} post={post} onDelete={handlePostDeleted} />
                ))}
              </Stack>
            )}

            {/* Sentinel for infinite scroll */}
            <div ref={sentinelRef} style={{ height: 1 }} />

            {loadingMore && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <Skeleton variant="rounded" width="100%" height={120} sx={{ borderRadius: 3 }} />
              </Box>
            )}

            {!hasMore && posts.length > 0 && (
              <Typography variant="caption" color="text.secondary"
                sx={{ display: 'block', textAlign: 'center', py: 3 }}>
                You've reached the end ✦
              </Typography>
            )}
          </>
        )}
      </Container>

      {/* ── FAB: create post ── */}
      {user && (
        <Fab color="primary" aria-label="create post"
          component={RouterLink} to="/create"
          sx={{ position: 'fixed', bottom: 24, right: 24, boxShadow: 3 }}>
          <AddIcon />
        </Fab>
      )}
    </Box>
  );
};

export default Feed;
