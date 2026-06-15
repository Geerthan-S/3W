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
  Divider, Collapse, Tooltip, Dialog, DialogTitle, DialogContent,
} from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutlined';
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import TwitterIcon from '@mui/icons-material/Twitter';
import FacebookIcon from '@mui/icons-material/Facebook';
import TelegramIcon from '@mui/icons-material/Telegram';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { postsAPI, authAPI } from '../services/api';
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
  const { user, updateUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [liked, setLiked] = useState(user ? post.likes?.includes(user.id) : false);
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [commentsCount, setCommentsCount] = useState(post.comments?.length || 0);
  const [showComments, setShowComments] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [sharesCount, setSharesCount] = useState(post.sharesCount || 0);

  const recordShare = async () => {
    try {
      const { data } = await postsAPI.sharePost(post._id);
      setSharesCount(data.sharesCount);
    } catch (err) {
      console.error('Failed to increment share count:', err);
    }
  };

  const authorId = post.author?._id || post.author;
  const isFollowing = user?.following?.includes(authorId);

  const handleFollowToggle = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    setFollowLoading(true);
    try {
      const { data } = await authAPI.followUser(post.authorUsername);
      if (updateUser) {
        updateUser({ following: data.currentUserFollowing });
      }
      const isNowFollowing = data.currentUserFollowing.includes(authorId);
      showToast(isNowFollowing ? `Followed @${post.authorUsername}` : `Unfollowed @${post.authorUsername}`, 'success');
    } catch (err) {
      console.error('Follow failed:', err);
      showToast('Failed to toggle follow', 'error');
    } finally {
      setFollowLoading(false);
    }
  };

  // Poll state
  const [poll, setPoll] = useState(post.poll);
  const [voteLoading, setVoteLoading] = useState(false);

  const isOwner = user && (user.id === post.author?._id || user.id === post.author);
  const initials = post.authorUsername?.slice(0, 2).toUpperCase();
  const avatarColor = stringToColor(post.authorUsername);

  const isPromotion = !!post.promotion;
  const promoThemeColor = isPromotion
    ? (post.promotion.themeColor ||
       (post.promotion.appName?.toLowerCase().includes('quiz') ||
        post.promotion.appName?.toLowerCase().includes('pay') ||
        post.promotion.appName?.toLowerCase().includes('gold') ||
        post.promotion.appName?.toLowerCase().includes('money')
          ? '#d4af37' // Gold/Yellow
          : '#2196F3')) // Blue
    : null;

  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShareClick = () => {
    setShareOpen(true);
  };

  const handleShareClose = () => {
    setShareOpen(false);
    setCopied(false);
  };

  const postUrl = `${window.location.origin}/?post=${post._id}`;
  const shareText = `Check out this post by @${post.authorUsername} on SocialPost!`;
  const encodedUrl = encodeURIComponent(postUrl);
  const encodedText = encodeURIComponent(shareText);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(postUrl);
    setCopied(true);
    recordShare();
    showToast('Link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

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
    } catch (err) {
      setLiked((p) => !p);
      setLikesCount((p) => (liked ? p + 1 : p - 1));
      showToast('Failed to like post. Please try again.', 'error');
    } finally {
      setLikeLoading(false);
    }
  };

  // ── Cast Vote ──────────────────────────────────────────────────────────────
  const handleVote = async (optionId) => {
    if (!user || voteLoading) return;
    setVoteLoading(true);
    try {
      const { data } = await postsAPI.votePost(post._id, optionId);
      setPoll(data.poll);
      showToast('Vote cast successfully!', 'success');
    } catch (err) {
      console.error('Vote failed:', err);
      showToast(err.response?.data?.message || 'Failed to cast vote', 'error');
    } finally {
      setVoteLoading(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    setDeleteLoading(true);
    try {
      await postsAPI.deletePost(post._id);
      showToast('Post deleted successfully!', 'success');
      if (onDelete) onDelete(post._id);
    } catch (err) {
      showToast('Failed to delete post', 'error');
      setDeleteLoading(false);
    }
  };

  // Poll metrics calculation
  const totalVotes = poll?.options?.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0) || 0;
  const hasVoted = poll?.options?.some(opt =>
    opt.votes?.some(v => v === user?.id || v._id === user?.id || v === user?._id)
  );
  const isExpired = poll?.expiresAt ? new Date() > new Date(poll.expiresAt) : false;
  const shouldShowResults = hasVoted || !user || isExpired;

  const getPollTimeLeft = () => {
    if (!poll || !poll.expiresAt) return '';
    const timeLeftMs = new Date(poll.expiresAt).getTime() - Date.now();
    if (timeLeftMs <= 0) return 'Final results';

    const minutes = Math.floor(timeLeftMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'} left`;
    if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'} left`;
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} left`;
  };

  return (
    <Card 
      sx={{ 
        mb: 1.5, 
        borderRadius: 3, 
        boxShadow: isPromotion ? `0 0 12px ${promoThemeColor}` : '0 1px 4px rgba(0,0,0,0.08)',
        border: isPromotion ? `2px solid ${promoThemeColor}` : 'none',
        transition: 'box-shadow 0.3s ease-in-out'
      }}
    >
      <CardContent sx={{ pb: 0 }}>
        {/* ── Header row ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          {/* Avatar */}
          <Avatar
            sx={{ width: 44, height: 44, bgcolor: avatarColor, fontWeight: 700,
                  fontSize: '0.9rem', cursor: 'pointer' }}
            onClick={() => navigate(`/profile/${post.authorUsername}`)}
            src={post.author?.avatar || ''}
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
              <Button 
                variant={isFollowing ? "outlined" : "contained"} 
                size="small"
                onClick={handleFollowToggle}
                disabled={followLoading}
                sx={{ 
                  borderRadius: 5, 
                  px: 2, 
                  py: 0.3, 
                  fontSize: '0.78rem', 
                  minWidth: 0,
                  textTransform: 'none',
                  fontWeight: 700
                }}
              >
                {isFollowing ? 'Following' : 'Follow'}
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

        {/* ── Promotion layout ── */}
        {isPromotion ? (
          <Box sx={{ mt: 1.5 }}>
            {/* Row: Title on the left, AppName Badge on the right */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, gap: 1 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: promoThemeColor, fontSize: '1.1rem' }}>
                {post.promotion.title}
              </Typography>
              <Box
                sx={{
                  border: `1px solid ${promoThemeColor}`,
                  color: promoThemeColor,
                  borderRadius: 20,
                  px: 1.5,
                  py: 0.3,
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap'
                }}
              >
                {post.promotion.appName}
              </Box>
            </Box>

            {/* Description */}
            <Typography variant="body2" sx={{ color: 'text.primary', mb: 2.5, lineHeight: 1.6 }}>
              {post.promotion.description}
            </Typography>

            {/* CTA Button centered */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2.5 }}>
              <Button
                variant="contained"
                href={post.promotion.buttonLink}
                target="_blank"
                rel="noopener noreferrer"
                endIcon={<span>→</span>}
                sx={{
                  bgcolor: promoThemeColor,
                  color: '#fff',
                  borderRadius: 20,
                  px: 4,
                  py: 1,
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: promoThemeColor,
                    opacity: 0.9,
                    boxShadow: 'none'
                  }
                }}
              >
                {post.promotion.buttonText}
              </Button>
            </Box>

            {/* Category Pill and Info Icon on the bottom right */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1, mb: 1 }}>
              <Box
                sx={{
                  border: '1px solid #9C27B0', // Purple/Pink category color
                  color: '#9C27B0',
                  borderRadius: 20,
                  px: 1.5,
                  py: 0.3,
                  fontSize: '0.75rem',
                  fontWeight: 700
                }}
              >
                {post.promotion.category}
              </Box>
              <Tooltip title="Sponsored promotion">
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    bgcolor: promoThemeColor,
                    color: '#fff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    cursor: 'help'
                  }}
                >
                  i
                </Box>
              </Tooltip>
            </Box>
          </Box>
        ) : (
          /* ── Standard post text / poll / image ── */
          <>
            {/* ── Post text ── */}
            {post.text && (
              <Typography variant="body2" sx={{ mb: (post.imageUrl || (poll && poll.options?.length > 0)) ? 1.5 : 0, lineHeight: 1.7, color: 'text.primary' }}>
                {post.text}
              </Typography>
            )}

            {/* ── Poll Section ── */}
            {poll && poll.options && poll.options.length > 0 && (
              <Box sx={{ mt: 1.5, mb: 1.5, display: 'flex', flexDirection: 'column', gap: 1 }}>
                {poll.options.map((option) => {
                  const optVotes = option.votes?.length || 0;
                  const percent = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                  const isUserChoice = option.votes?.some(v => v === user?.id || v._id === user?.id || v === user?._id);

                  return (
                    <Box key={option._id} sx={{ position: 'relative', width: '100%' }}>
                      {shouldShowResults ? (
                        // Results Mode
                        <Box
                          sx={{
                            position: 'relative',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            p: 1.25,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: isUserChoice ? 'primary.main' : '#e0e0e0',
                            bgcolor: isUserChoice ? 'rgba(33, 150, 243, 0.03)' : '#fcfcfc',
                            overflow: 'hidden',
                            zIndex: 1,
                          }}
                        >
                          {/* Progress bar background */}
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              bottom: 0,
                              width: `${percent}%`,
                              bgcolor: isUserChoice ? 'rgba(33, 150, 243, 0.12)' : '#eef0f2',
                              zIndex: -1,
                              transition: 'width 0.6s ease-in-out',
                            }}
                          />
                          <Typography variant="body2" fontWeight={isUserChoice ? 700 : 500} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {option.text}
                            {isUserChoice && <span style={{ fontSize: '0.85rem', color: '#2196F3' }}>✓</span>}
                          </Typography>
                          <Typography variant="body2" fontWeight={700}>
                            {percent}%
                          </Typography>
                        </Box>
                      ) : (
                        // Vote Mode (clickable option)
                        <Button
                          fullWidth
                          variant="outlined"
                          disabled={voteLoading}
                          onClick={() => handleVote(option._id)}
                          sx={{
                            justifyContent: 'flex-start',
                            textTransform: 'none',
                            borderRadius: 2,
                            p: 1.25,
                            borderColor: '#bdbdbd',
                            color: 'text.primary',
                            fontWeight: 600,
                            '&:hover': {
                              bgcolor: 'rgba(33, 150, 243, 0.04)',
                              borderColor: 'primary.main',
                            }
                          }}
                        >
                          {option.text}
                        </Button>
                      )}
                    </Box>
                  );
                })}

                {/* Poll footer */}
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} • {getPollTimeLeft()} {!user ? '• Log in to vote' : ''}
                </Typography>
              </Box>
            )}
          </>
        )}
      </CardContent>

      {/* ── Post image ── */}
      {!isPromotion && post.imageUrl && (
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
          <IconButton size="small" onClick={handleShareClick} sx={{ color: 'text.secondary' }}>
            <ShareOutlinedIcon fontSize="small" />
          </IconButton>
          <Typography variant="caption" color="text.secondary">{sharesCount}</Typography>
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

      {/* ── Share Dialog ── */}
      <Dialog 
        open={shareOpen} 
        onClose={handleShareClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
            position: 'relative'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, pr: 6, pb: 1 }}>
          Share Post
          <IconButton
            onClick={handleShareClose}
            sx={{
              position: 'absolute',
              right: 12,
              top: 12,
              color: 'text.secondary'
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1, pb: 3 }}>
          {/* Post Preview Thumbnail */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              p: 2,
              mb: 3,
              borderRadius: 2,
              bgcolor: '#f5f7f8',
              border: '1px solid #eef0f2'
            }}
          >
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Avatar 
                  sx={{ width: 24, height: 24, bgcolor: avatarColor, fontSize: '0.65rem', fontWeight: 700 }}
                >
                  {initials}
                </Avatar>
                <Typography variant="caption" fontWeight={700} noWrap>
                  @{post.authorUsername}
                </Typography>
              </Box>
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  lineHeight: 1.4
                }}
              >
                {isPromotion 
                  ? `[Promo] ${post.promotion.appName} - ${post.promotion.title}: ${post.promotion.description}` 
                  : post.text || 'Image Post'
                }
              </Typography>
            </Box>

            {/* Image Thumbnail if exists */}
            {!isPromotion && post.imageUrl && (
              <Box 
                component="img" 
                src={post.imageUrl} 
                alt="Thumbnail" 
                sx={{
                  width: 50,
                  height: 50,
                  borderRadius: 1,
                  objectFit: 'cover',
                  flexShrink: 0
                }}
              />
            )}
          </Box>

          {/* Share Options Row */}
          <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            {/* Copy Link Button */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <IconButton 
                onClick={handleCopyLink}
                sx={{ 
                  bgcolor: copied ? 'success.light' : '#f0f2f5', 
                  color: copied ? 'success.contrastText' : 'text.primary',
                  width: 48,
                  height: 48,
                  '&:hover': { bgcolor: copied ? 'success.main' : '#e4e6eb' }
                }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                {copied ? 'Copied!' : 'Copy Link'}
              </Typography>
            </Box>

            {/* WhatsApp */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <IconButton 
                href={`https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={recordShare}
                sx={{ 
                  bgcolor: '#E8F5E9', 
                  color: '#25D366',
                  width: 48,
                  height: 48,
                  '&:hover': { bgcolor: '#C8E6C9' }
                }}
              >
                <WhatsAppIcon fontSize="small" />
              </IconButton>
              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                WhatsApp
              </Typography>
            </Box>

            {/* Telegram */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <IconButton 
                href={`https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={recordShare}
                sx={{ 
                  bgcolor: '#E1F5FE', 
                  color: '#0088cc',
                  width: 48,
                  height: 48,
                  '&:hover': { bgcolor: '#B3E5FC' }
                }}
              >
                <TelegramIcon fontSize="small" />
              </IconButton>
              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                Telegram
              </Typography>
            </Box>

            {/* Twitter/X */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <IconButton 
                href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={recordShare}
                sx={{ 
                  bgcolor: '#E0E0E0', 
                  color: '#000000',
                  width: 48,
                  height: 48,
                  '&:hover': { bgcolor: '#BDBDBD' }
                }}
              >
                <TwitterIcon fontSize="small" />
              </IconButton>
              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                Twitter
              </Typography>
            </Box>

            {/* Facebook */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              <IconButton 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={recordShare}
                sx={{ 
                  bgcolor: '#E8EAF6', 
                  color: '#1877F2',
                  width: 48,
                  height: 48,
                  '&:hover': { bgcolor: '#C5CAE9' }
                }}
              >
                <FacebookIcon fontSize="small" />
              </IconButton>
              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                Facebook
              </Typography>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default PostCard;
