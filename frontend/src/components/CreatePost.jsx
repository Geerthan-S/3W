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
} from '@mui/material';
import PhotoCameraOutlinedIcon from '@mui/icons-material/PhotoCameraOutlined';
import EmojiEmotionsOutlinedIcon from '@mui/icons-material/EmojiEmotionsOutlined';
import LinkOutlinedIcon from '@mui/icons-material/LinkOutlined';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../context/AuthContext';
import { postsAPI } from '../services/api';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!text.trim() && !imageUrl.trim()) {
      setError('Please add some text or an image URL.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await postsAPI.createPost({ text: text.trim(), imageUrl: imageUrl.trim() });
      if (onPostCreated) {
        onPostCreated(data);
        setText(''); setImageUrl(''); setShowImageInput(false);
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
    <Card sx={{ mb: 1.5, borderRadius: 3 }}>
      <CardContent sx={{ pb: '12px !important' }}>
        {/* Row: avatar + textarea */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          <Avatar sx={{ width: 42, height: 42, bgcolor: stringToColor(user?.username),
                        fontWeight: 700, fontSize: '0.85rem', mt: 0.5 }}>
            {initials}
          </Avatar>
          <TextField
            fullWidth multiline minRows={2} maxRows={8}
            placeholder="What's on your mind?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading}
            variant="outlined"
            inputProps={{ maxLength: 1000 }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                backgroundColor: '#f5f5f5',
                '&:hover': { backgroundColor: '#efefef' },
                '& fieldset': { border: 'none' },
                '&.Mui-focused': { backgroundColor: '#f0f0f0' },
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

        {/* Error / Success */}
        {error && <Alert severity="error" sx={{ mt: 1.5, borderRadius: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mt: 1.5, borderRadius: 2 }}>Post published!</Alert>}

        <Divider sx={{ my: 1.5 }} />

        {/* Toolbar + submit */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Action icons */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Add image URL">
              <IconButton size="small" color={showImageInput ? 'primary' : 'default'}
                onClick={() => setShowImageInput((v) => !v)}>
                <PhotoCameraOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Emoji">
              <IconButton size="small"><EmojiEmotionsOutlinedIcon fontSize="small" /></IconButton>
            </Tooltip>
            <Tooltip title="Link">
              <IconButton size="small"><LinkOutlinedIcon fontSize="small" /></IconButton>
            </Tooltip>
          </Box>

          {/* Post button */}
          <Button
            variant="contained" endIcon={loading ? null : <SendIcon />}
            onClick={handleSubmit}
            disabled={loading || (!text.trim() && !imageUrl.trim())}
            sx={{ borderRadius: 5, px: 3, py: 0.8 }}
          >
            {loading ? <CircularProgress size={18} color="inherit" /> : 'Post'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CreatePost;
