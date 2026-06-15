/**
 * pages/Profile.jsx — MUI profile with stats + post list
 */
import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box, Container, Avatar, Typography, Card, CardContent,
  Grid, Divider, Stack, Skeleton, Alert, Button,
} from '@mui/material';
import { postsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';

const stringToColor = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ['#2196F3','#E91E63','#9C27B0','#FF5722','#4CAF50','#FF9800','#00BCD4'];
  return colors[Math.abs(hash) % colors.length];
};

const Profile = () => {
  const { username } = useParams();
  const { user: currentUser } = useAuth();

  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true); setError('');
      try {
        const { data } = await postsAPI.getUserPosts(username);
        setPosts(data?.posts || []);
      } catch (err) {
        console.error('Profile posts loading error:', err);
        setError('Failed to load this profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [username]);

  const handlePostDeleted = (id) => setPosts((p) => p.filter((post) => post._id !== id));

  const totalLikes    = posts.reduce((s, p) => s + (p.likes?.length || 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.comments?.length || 0), 0);
  const isOwn         = currentUser?.username === username;

  const statCard = (label, value) => (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h6" fontWeight={800}>{value}</Typography>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
    </Box>
  );

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 6 }}>
      <Container maxWidth="sm" sx={{ pt: 3 }}>
        {/* ── Profile header card ── */}
        <Card sx={{ mb: 2, borderRadius: 3 }}>
          <CardContent sx={{ pt: 3, pb: '16px !important' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar sx={{ width: 72, height: 72, bgcolor: stringToColor(username),
                            fontWeight: 700, fontSize: '1.5rem' }}>
                {username?.slice(0, 2).toUpperCase()}
              </Avatar>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" fontWeight={800}>{username}</Typography>
                  {isOwn && (
                    <Typography variant="caption" sx={{ px: 1, py: 0.2, bgcolor: 'primary.main',
                      color: '#fff', borderRadius: 5, fontWeight: 700, fontSize: '0.65rem' }}>
                      You
                    </Typography>
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">@{username}</Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Stats row */}
            <Grid container spacing={2} columns={3}>
              <Grid item xs={1}>{statCard('Posts', posts.length)}</Grid>
              <Grid item xs={1}>{statCard('Likes', totalLikes)}</Grid>
              <Grid item xs={1}>{statCard('Comments', totalComments)}</Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* ── Posts ── */}
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary"
          sx={{ mb: 1.5, px: 0.5 }}>
          Posts by {username}
        </Typography>

        {loading && (
          <Stack spacing={1.5}>
            {[1,2].map((i) => (
              <Card key={i} sx={{ borderRadius: 3, p: 2 }}>
                <Box sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
                  <Skeleton variant="circular" width={44} height={44} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton variant="text" width="40%" />
                    <Skeleton variant="text" width="25%" />
                  </Box>
                </Box>
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="60%" />
              </Card>
            ))}
          </Stack>
        )}

        {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

        {!loading && !error && (
          posts.length === 0 ? (
            <Card sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
              <Typography variant="h5" sx={{ mb: 1 }}>🌟</Typography>
              <Typography variant="subtitle1" fontWeight={700} gutterBottom>No posts yet</Typography>
              {isOwn ? (
                <Button component={RouterLink} to="/create" variant="contained"
                  sx={{ mt: 1, borderRadius: 5 }}>
                  Create your first post
                </Button>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {username} hasn't posted anything yet.
                </Typography>
              )}
            </Card>
          ) : (
            <Stack spacing={0}>
              {posts.map((post) => (
                <PostCard key={post._id} post={post} onDelete={handlePostDeleted} />
              ))}
            </Stack>
          )
        )}
      </Container>
    </Box>
  );
};

export default Profile;
