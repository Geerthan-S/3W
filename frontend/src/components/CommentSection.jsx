/**
 * components/CommentSection.jsx
 * MUI List of comments + input to add new ones.
 */

import { useState } from 'react';
import {
  Box, Typography, Avatar, TextField, Button, List,
  ListItem, ListItemAvatar, ListItemText, Divider, CircularProgress,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { useAuth } from '../context/AuthContext';
import { postsAPI } from '../services/api';

const stringToColor = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ['#2196F3','#E91E63','#9C27B0','#FF5722','#4CAF50','#FF9800','#00BCD4'];
  return colors[Math.abs(hash) % colors.length];
};

const timeAgo = (dateStr) => {
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const CommentSection = ({ postId, initialComments, onCommentAdded }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await postsAPI.addComment(postId, text.trim());
      const newComments = [...comments, data.comment];
      setComments(newComments);
      setText('');
      if (onCommentAdded) onCommentAdded(data.commentsCount);
    } catch {
      setError('Failed to post comment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Comment list */}
      {comments.length > 0 ? (
        <List dense disablePadding>
          {comments.map((c, i) => (
            <Box key={c._id || i}>
              <ListItem alignItems="flex-start" disableGutters sx={{ py: 0.75 }}>
                <ListItemAvatar sx={{ minWidth: 40 }}>
                  <Avatar sx={{ width: 30, height: 30, bgcolor: stringToColor(c.authorUsername),
                                fontSize: '0.7rem', fontWeight: 700 }}>
                    {c.authorUsername?.slice(0, 2).toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                      <Typography variant="caption" fontWeight={700}>{c.authorUsername}</Typography>
                      <Typography variant="caption" color="text.secondary">{timeAgo(c.createdAt)}</Typography>
                    </Box>
                  }
                  secondary={<Typography variant="body2" sx={{ mt: 0.2, color: 'text.primary' }}>{c.text}</Typography>}
                />
              </ListItem>
              {i < comments.length - 1 && <Divider variant="inset" component="li" />}
            </Box>
          ))}
        </List>
      ) : (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', py: 1 }}>
          No comments yet. Be the first!
        </Typography>
      )}

      {/* Add comment input */}
      {user && (
        <Box component="form" onSubmit={handleSubmit}
          sx={{ display: 'flex', gap: 1, mt: 1.5, alignItems: 'center' }}>
          <Avatar sx={{ width: 30, height: 30, bgcolor: stringToColor(user.username),
                        fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}>
            {user.username?.slice(0, 2).toUpperCase()}
          </Avatar>
          <TextField
            fullWidth
            size="small"
            placeholder="Write a comment…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={loading}
            error={!!error}
            helperText={error}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 5, fontSize: '0.85rem' } }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit(e); }}
          />
          <Button type="submit" variant="contained" size="small" disabled={!text.trim() || loading}
            sx={{ borderRadius: 5, minWidth: 0, px: 1.5, py: 0.8 }}>
            {loading ? <CircularProgress size={16} color="inherit" /> : <SendIcon fontSize="small" />}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default CommentSection;
