/**
 * pages/Profile.jsx — MUI profile with stats + post list
 */
import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box, Container, Avatar, Typography, Card, CardContent,
  Grid, Divider, Stack, Skeleton, Alert, Button, Dialog, DialogTitle,
  DialogContent, TextField, DialogActions,
} from '@mui/material';
import { postsAPI, authAPI } from '../services/api';
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
  const { user: currentUser, updateUser } = useAuth();

  const [posts, setPosts]     = useState([]);
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  // Edit profile state
  const [editOpen, setEditOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bioText, setBioText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true); setError('');
      try {
        const [postsRes, userRes] = await Promise.all([
          postsAPI.getUserPosts(username),
          authAPI.getProfile(username)
        ]);
        setPosts(postsRes.data?.posts || []);
        setProfileUser(userRes.data);
      } catch (err) {
        console.error('Profile loading error:', err);
        setError('Failed to load this profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [username]);

  useEffect(() => {
    if (profileUser) {
      setAvatarUrl(profileUser.avatar || '');
      setBioText(profileUser.bio || '');
    }
  }, [profileUser]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const { data } = await authAPI.updateProfile({ avatar: avatarUrl, bio: bioText });
      setProfileUser(data);
      if (updateUser) {
        updateUser({ avatar: data.avatar, bio: data.bio });
      }
      setEditOpen(false);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 2 }}>
              <Avatar 
                src={profileUser?.avatar || ''} 
                sx={{ width: 72, height: 72, bgcolor: stringToColor(username),
                      fontWeight: 700, fontSize: '1.5rem' }}
              >
                {profileUser?.avatar ? null : username?.slice(0, 2).toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="h6" fontWeight={800} noWrap>{username}</Typography>
                  {isOwn && (
                    <Typography variant="caption" sx={{ px: 1, py: 0.2, bgcolor: 'primary.main',
                      color: '#fff', borderRadius: 5, fontWeight: 700, fontSize: '0.65rem', flexShrink: 0 }}>
                      You
                    </Typography>
                  )}
                </Box>
                <Typography variant="body2" color="text.secondary">@{username}</Typography>

                {profileUser?.bio && (
                  <Typography variant="body2" color="text.primary" sx={{ mt: 0.8, fontStyle: 'italic', wordBreak: 'break-word' }}>
                    {profileUser.bio}
                  </Typography>
                )}

                {isOwn && (
                  <Button 
                    size="small" 
                    variant="outlined" 
                    onClick={() => setEditOpen(true)}
                    sx={{ mt: 1.5, borderRadius: 5, textTransform: 'none', fontWeight: 700 }}
                  >
                    Edit Profile
                  </Button>
                )}
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

      {/* ── Edit Profile Dialog ── */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Profile</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1.5 }}>
          {saveError && <Alert severity="error">{saveError}</Alert>}
          <TextField
            fullWidth
            label="Profile Icon URL"
            placeholder="Paste image URL here..."
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            disabled={saving}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Bio"
            placeholder="Tell us about yourself..."
            value={bioText}
            onChange={(e) => setBioText(e.target.value)}
            disabled={saving}
            inputProps={{ maxLength: 150 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setEditOpen(false)} disabled={saving} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSaveProfile} variant="contained" disabled={saving} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
