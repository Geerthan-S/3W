/**
 * components/PostCard.jsx
 * MUI Card — matches TaskPlanet social card:
 * Avatar | Name @handle | time | [Follow]
 * Post text / image
 * ♡ likes  💬 comments  ↗ shares
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, CardContent, CardActions, CardMedia,
  Avatar, Typography, Box, IconButton, Button,
  Divider, Collapse, Tooltip,
} from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import { useAuth } from '../context/AuthContext';
import { postsAPI } from '../services/api';
import CommentSection from './CommentSection';

// ─── Relative time ─────────────────────────────────────────────────────────────
const timeAgo = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ─── Avatar color from username ────────────────────────────────────────────────
const stringToColor = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ['#2196F3','#E91E63','#9C27B0','#FF5722','#4CAF50','#FF9800','#00BCD4'];
  return colors[Math.abs(hash) % colors.length];
};

const PostCard = ({ post, onDelete }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [liked, setLiked] = useState(user ? post.likes?.includes(user.id) : false);
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const isOwner = user && (user.id === post.author?._id || user.id === post.author);
  const initials = post.authorUsername?.slice(0, 2).toUpperCase();
  const avatarColor = stringToColor(post.authorUsername);

  // ── Like toggle ───────────────────────────────────────────────────────────
  const handleLike = async () => {
    if (!user || likeLoading) return;
    setLiked((p) => !p);
    setLikesCount((p) => (liked ? p - 1 : p + 1));
    setLikeLoading(true);
    try {
      const { data } = await postsAPI.likePost(post._id);
      setLiked(data.liked);
      setLikesCount(data.likesCount);
    } catch {
      setLiked((p) => !p);
      setLikesCount((p) => (liked ? p + 1 : p - 1));
    } finally {
      setLikeLoading(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
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

  return (
    <Card sx={{ mb: 1.5, borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <CardContent sx={{ pb: 0 }}>
        {/* ── Header row ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          {/* Avatar */}
          <Avatar
            sx={{ width: 44, height: 44, bgcolor: avatarColor, fontWeight: 700,
                  fontSize: '0.9rem', cursor: 'pointer' }}
            onClick={() => navigate(`/profile/${post.authorUsername}`)}
          >
            {post.author?.avatar ? null : initials}
          </Avatar>

          {/* Name + handle + time */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ cursor: 'pointer' }}
                onClick={() => navigate(`/profile/${post.authorUsername}`)}>
                {post.authorUsername}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                @{post.authorUsername}
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary">
              {timeAgo(post.createdAt)}
            </Typography>
          </Box>

          {/* Follow / Delete */}
          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
            {!isOwner && (
              <Button variant="contained" size="small"
                sx={{ borderRadius: 5, px: 2, py: 0.3, fontSize: '0.78rem', minWidth: 0 }}>
                Follow
              </Button>
            )}
            {isOwner && (
              <Tooltip title="Delete post">
                <IconButton size="small" color="error" onClick={handleDelete}
                  disabled={deleteLoading}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* ── Post text ── */}
        {post.text && (
          <Typography variant="body2" sx={{ mb: post.imageUrl ? 1.5 : 0, lineHeight: 1.7, color: 'text.primary' }}>
            {post.text}
          </Typography>
        )}
      </CardContent>

      {/* ── Post image ── */}
      {post.imageUrl && (
        <CardMedia
          component="img"
          image={post.imageUrl}
          alt="Post image"
          onError={(e) => e.target.closest('.MuiCardMedia-root')?.remove?.()}
          sx={{ maxHeight: 400, objectFit: 'cover' }}
        />
      )}

      <Divider sx={{ mx: 2, mt: 1 }} />

      {/* ── Action bar: ♡ likes  💬 comments  ↗ shares ── */}
      <CardActions sx={{ px: 2, py: 0.5 }}>
        {/* Like */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size="small" onClick={handleLike} disabled={!user}
            sx={{ color: liked ? 'error.main' : 'text.secondary' }}>
            {liked ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
          </IconButton>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
            {likesCount}
          </Typography>
        </Box>

        {/* Comment */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size="small" onClick={() => setShowComments((v) => !v)}
            sx={{ color: showComments ? 'primary.main' : 'text.secondary' }}>
            <ChatBubbleOutlineIcon fontSize="small" />
          </IconButton>
          <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
            {commentsCount}
          </Typography>
        </Box>

        {/* Share */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton size="small" sx={{ color: 'text.secondary' }}>
            <ShareOutlinedIcon fontSize="small" />
          </IconButton>
          <Typography variant="caption" color="text.secondary">0</Typography>
        </Box>
      </CardActions>

      {/* ── Comments section (collapsible) ── */}
      <Collapse in={showComments} timeout="auto" unmountOnExit>
        <Divider sx={{ mx: 2 }} />
        <Box sx={{ px: 2, py: 1 }}>
          <CommentSection
            postId={post._id}
            initialComments={post.comments || []}
            onCommentAdded={(count) => setCommentsCount(count)}
          />
        </Box>
      </Collapse>
    </Card>
  );
};

export default PostCard;
