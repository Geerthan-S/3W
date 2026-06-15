/**
 * components/CreatePost.jsx
 * MUI Paper card — "What's on your mind?" create post form.
 * Matches TaskPlanet's create post area at the top of the feed.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, CardContent, Box, TextField, Button, Avatar, Typography,
  Divider, IconButton, Tooltip, CircularProgress, Alert, Collapse,
  Popover, Tabs, Tab,
} from '@mui/material';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import EmojiEmotionsOutlinedIcon from '@mui/icons-material/EmojiEmotionsOutlined';
import SegmentIcon from '@mui/icons-material/Segment';
import CampaignIcon from '@mui/icons-material/Campaign';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../context/AuthContext';
import { postsAPI } from '../services/api';

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕'
    ]
  },
  {
    name: 'Gestures & Hearts',
    icon: '❤️',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🧠', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❤️‍🔥', '❤️‍🩹', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💘', '💝'
    ]
  },
  {
    name: 'Nature & Food',
    icon: '🌸',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🐝', '🦋', '🌸', '🌹', '🌺', '🌻', '🌼', '🌷', '🌲', '🌳', '🌴', '🍀', '🍁', '🍃', '🌍', '🌎', '🌏', '🌟', '✨', '🔥', '💧', '🍕', '🍔', '🍟', '🌭', '🍿', '🍩', '🍪', '🍰', '🍫', '🍬', '🍺', '🍻', '🍷', '☕'
    ]
  },
  {
    name: 'Activities & Symbols',
    icon: '🎉',
    emojis: [
      '🎉', '🎈', '🎂', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀', '🏈', '⚾', '🎾', '🎱', '🎮', '🎯', '🎬', '🎧', '🎸', '🎹', '🚗', '🚀', '✈️', '📌', '📍', '📝', '✉️', '🔒', '🔑', '💡', '⏰', '📱', '💻', '💸', '💯', '✅', '❌', '⚠️', '🔥', '✨'
    ]
  }
];

const stringToColor = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ['#2196F3','#E91E63','#9C27B0','#FF5722','#4CAF50','#FF9800','#00BCD4'];
  return colors[Math.abs(hash) % colors.length];
};

const CreatePost = ({ onPostCreated }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [imagePreviewError, setImagePreviewError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Poll State
  const [showPollInput, setShowPollInput] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollDuration, setPollDuration] = useState(24); // in hours (24, 72, 168)

  // Emoji Picker State
  const [emojiAnchor, setEmojiAnchor] = useState(null);
  const [activeEmojiTab, setActiveEmojiTab] = useState(0);

  const handleEmojiOpen = (event) => {
    setEmojiAnchor(event.currentTarget);
  };

  const handleEmojiClose = () => {
    setEmojiAnchor(null);
  };

  const handleEmojiClick = (emoji) => {
    const input = document.getElementById('post-textarea');
    if (input) {
      const start = input.selectionStart;
      const end = input.selectionEnd;
      const newText = text.substring(0, start) + emoji + text.substring(end);
      setText(newText);
      
      // Refocus and place cursor after inserted emoji
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + emoji.length, start + emoji.length);
      }, 0);
    } else {
      setText((prev) => prev + emoji);
    }
  };

  const isEmojiOpen = Boolean(emojiAnchor);

  const handleAddPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const handleRemovePollOption = (index) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, idx) => idx !== index));
    }
  };

  const handlePollOptionChange = (index, val) => {
    const updated = [...pollOptions];
    updated[index] = val;
    setPollOptions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (showPollInput) {
      if (!text.trim()) {
        setError('Please enter a question for your poll.');
        return;
      }
      const validOptions = pollOptions.map(opt => opt.trim()).filter(Boolean);
      if (validOptions.length < 2) {
        setError('Please enter at least 2 valid poll options.');
        return;
      }
    } else {
      if (!text.trim() && !imageUrl.trim()) {
        setError('Please add some text or an image URL.');
        return;
      }
    }

    setLoading(true);
    try {
      const payload = showPollInput
        ? { text: text.trim(), poll: pollOptions.map(opt => opt.trim()).filter(Boolean), pollDuration }
        : { text: text.trim(), imageUrl: imageUrl.trim() };

      const { data } = await postsAPI.createPost(payload);
      if (onPostCreated) {
        onPostCreated(data);
        setText(''); setImageUrl(''); setShowImageInput(false);
        setShowPollInput(false); setPollOptions(['', '']); setPollDuration(24);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const initials = user?.username?.slice(0, 2).toUpperCase() || '';
  const showPreview = imageUrl.trim() && !imagePreviewError && showImageInput;

  return (
    <Card sx={{ mb: 1.5, borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <CardContent sx={{ pb: '12px !important' }}>
        {/* Header of Create Poll Card */}
        {showPollInput ? (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={800} color="text.primary">
              Create Poll
            </Typography>
            <Box sx={{ display: 'flex', bgcolor: '#f1f3f4', borderRadius: 20, p: 0.5 }}>
              <Button
                size="small"
                variant="contained"
                sx={{
                  borderRadius: 20,
                  bgcolor: '#2196F3',
                  color: '#fff',
                  boxShadow: 'none',
                  px: 2,
                  py: 0.5,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  '&:hover': { bgcolor: '#1976D2', boxShadow: 'none' }
                }}
              >
                All Posts
              </Button>
              <Button
                size="small"
                sx={{
                  borderRadius: 20,
                  color: '#757575',
                  px: 2,
                  py: 0.5,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                Promotions
              </Button>
            </Box>
          </Box>
        ) : null}

        {/* Row: avatar (only in non-poll mode) + textarea */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          {!showPollInput && (
            <Avatar sx={{ width: 42, height: 42, bgcolor: stringToColor(user?.username),
                          fontWeight: 700, fontSize: '0.85rem', mt: 0.5 }}>
              {initials}
            </Avatar>
          )}
          <TextField
            fullWidth multiline minRows={showPollInput ? 2 : 2} maxRows={8}
            placeholder={showPollInput ? "Ask a question..." : "What's on your mind?"}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading}
            variant="outlined"
            inputProps={{ id: 'post-textarea', maxLength: 1000 }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: showPollInput ? '#ffffff' : '#f5f5f5',
                '&:hover': { backgroundColor: showPollInput ? '#ffffff' : '#efefef' },
                '& fieldset': { border: showPollInput ? '1px solid #e0e0e0' : 'none' },
                '&.Mui-focused': { backgroundColor: showPollInput ? '#ffffff' : '#f0f0f0' },
              },
            }}
          />
        </Box>

        {/* Image URL input */}
        <Collapse in={showImageInput}>
          <Box sx={{ mt: 1.5, display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              fullWidth size="small"
              placeholder="Paste image URL here…"
              value={imageUrl}
              onChange={(e) => { setImageUrl(e.target.value); setImagePreviewError(false); }}
              disabled={loading}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <IconButton size="small" onClick={() => { setShowImageInput(false); setImageUrl(''); }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Image preview */}
          {showPreview && (
            <Box sx={{ mt: 1, borderRadius: 2, overflow: 'hidden', maxHeight: 240 }}>
              <img src={imageUrl} alt="Preview" style={{ width: '100%', maxHeight: 240, objectFit: 'cover' }}
                onError={() => setImagePreviewError(true)} />
            </Box>
          )}
        </Collapse>

        {/* Poll Options Input */}
        <Collapse in={showPollInput}>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {pollOptions.map((option, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handlePollOptionChange(index, e.target.value)}
                  disabled={loading}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: '#fafafa',
                      border: '1px solid #e0e0e0',
                      '& fieldset': { border: 'none' },
                      '&:hover': { backgroundColor: '#f5f5f5' },
                      '&.Mui-focused': { backgroundColor: '#ffffff', borderColor: '#2196F3' }
                    }
                  }}
                />
                {pollOptions.length > 2 && (
                  <IconButton size="small" onClick={() => handleRemovePollOption(index)}>
                    <DeleteOutlineIcon fontSize="small" color="error" />
                  </IconButton>
                )}
              </Box>
            ))}
            
            {pollOptions.length < 5 && (
              <Button
                onClick={handleAddPollOption}
                sx={{
                  alignSelf: 'center',
                  mt: 0.5,
                  fontWeight: 700,
                  color: '#2196F3',
                  textTransform: 'none',
                  '&:hover': { background: 'none', textDecoration: 'underline' }
                }}
              >
                + Add Option
              </Button>
            )}

            {/* Poll Duration Selection */}
            <Box sx={{ mt: 1 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 700 }}>
                Poll Duration:
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {[
                  { label: '24h', value: 24 },
                  { label: '3 Days', value: 72 },
                  { label: '7 Days', value: 168 }
                ].map((pill) => {
                  const isActive = pollDuration === pill.value;
                  return (
                    <Button
                      key={pill.value}
                      onClick={() => setPollDuration(pill.value)}
                      sx={{
                        borderRadius: 20,
                        bgcolor: isActive ? '#2196F3' : '#f5f5f5',
                        color: isActive ? '#fff' : '#757575',
                        textTransform: 'none',
                        px: 2.5,
                        py: 0.5,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        boxShadow: 'none',
                        '&:hover': {
                          bgcolor: isActive ? '#1976D2' : '#e0e0e0',
                          boxShadow: 'none',
                        }
                      }}
                    >
                      {pill.label}
                    </Button>
                  );
                })}
              </Box>
            </Box>
          </Box>
        </Collapse>

        {/* Error / Success */}
        {error && <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 1.5, borderRadius: 2 }}>Post published!</Alert>}

        <Divider sx={{ my: 1.5 }} />

        {/* Toolbar + submit */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Action icons */}
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            <Tooltip title="Add image URL">
              <IconButton size="small" color={showImageInput ? 'primary' : 'default'}
                onClick={() => {
                  setShowImageInput((v) => !v);
                  setShowPollInput(false);
                }}>
                <PhotoCameraOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Emoji">
              <IconButton size="small" onClick={handleEmojiOpen} color={isEmojiOpen ? 'primary' : 'default'}>
                <EmojiEmotionsOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Create Poll">
              <IconButton size="small" color={showPollInput ? 'primary' : 'default'}
                onClick={() => {
                  setShowPollInput((v) => !v);
                  setShowImageInput(false);
                }}>
                <SegmentIcon fontSize="small" sx={{ transform: 'rotate(180deg)' }} />
              </IconButton>
            </Tooltip>
            
            {/* Megaphone Promote option */}
            <Button
              startIcon={<CampaignIcon />}
              sx={{
                color: '#2196F3',
                fontWeight: 700,
                textTransform: 'none',
                fontSize: '0.85rem',
                ml: 1,
                display: { xs: 'none', sm: 'inline-flex' },
                '&:hover': { background: 'none' }
              }}
            >
              Promote
            </Button>
          </Box>

          {/* Post button */}
          <Button
            variant="contained"
            startIcon={loading ? null : <SendIcon sx={{ transform: 'rotate(-45deg)', mt: -0.3 }} />}
            onClick={handleSubmit}
            disabled={loading || (showPollInput ? (!text.trim() || pollOptions.filter(o => o.trim() !== '').length < 2) : (!text.trim() && !imageUrl.trim()))}
            sx={{
              borderRadius: 20,
              px: 3,
              py: 0.75,
              textTransform: 'none',
              bgcolor: '#2196F3',
              boxShadow: 'none',
              '&.Mui-disabled': {
                bgcolor: '#e0e0e0',
                color: '#9e9e9e',
              },
              '&:hover': {
                bgcolor: '#1976D2',
                boxShadow: 'none',
              }
            }}
          >
            {loading ? <CircularProgress size={18} color="inherit" /> : 'Post'}
          </Button>
        </Box>

        {/* Emoji Picker Popover */}
        <Popover
          open={isEmojiOpen}
          anchorEl={emojiAnchor}
          onClose={handleEmojiClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            sx: {
              width: 320,
              maxHeight: 350,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3,
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              mt: 1,
            }
          }}
        >
          {/* Category tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', bgcolor: '#fdfdfd' }}>
            <Tabs
              value={activeEmojiTab}
              onChange={(_, v) => setActiveEmojiTab(v)}
              variant="fullWidth"
              sx={{
                minHeight: 40,
                width: '100%',
                '& .MuiTab-root': {
                  minHeight: 40,
                  fontSize: '1.2rem',
                  py: 0.5,
                }
              }}
            >
              {EMOJI_CATEGORIES.map((cat, i) => (
                <Tab key={cat.name} label={cat.icon} title={cat.name} />
              ))}
            </Tabs>
          </Box>

          {/* Emojis list */}
          <Box sx={{ p: 1.5, overflowY: 'auto', flex: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
              {EMOJI_CATEGORIES[activeEmojiTab].name}
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
              {EMOJI_CATEGORIES[activeEmojiTab].emojis.map((emoji, idx) => (
                <IconButton
                  key={idx}
                  size="small"
                  onClick={() => handleEmojiClick(emoji)}
                  sx={{
                    fontSize: '1.25rem',
                    borderRadius: 1,
                    '&:hover': {
                      bgcolor: 'primary.light',
                      transform: 'scale(1.15)',
                    },
                    transition: 'transform 0.1s ease-in-out',
                  }}
                >
                  {emoji}
                </IconButton>
              ))}
            </Box>
          </Box>
        </Popover>
      </CardContent>
    </Card>
  );
};

export default CreatePost;
