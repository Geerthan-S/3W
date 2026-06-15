/**
 * components/Navbar.jsx
 * MUI AppBar — shows app name, search, and login/profile links.
 */

import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Box, Button, Avatar, IconButton,
  InputBase, Menu, MenuItem, Tooltip, Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutlined';
import { useAuth } from '../context/AuthContext';
import { alpha, styled } from '@mui/material/styles';

// ── Styled search bar ─────────────────────────────────────────────────────────
const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: 20,
  backgroundColor: alpha(theme.palette.common.black, 0.06),
  '&:hover': { backgroundColor: alpha(theme.palette.common.black, 0.09) },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  maxWidth: 320,
  [theme.breakpoints.up('sm')]: { marginLeft: theme.spacing(3) },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: theme.palette.primary.main,
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    width: '100%',
  },
}));

// ─────────────────────────────────────────────────────────────────────────────

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (e) => setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleLogout = () => { handleClose(); logout(); navigate('/login'); };

  const initials = user?.username?.slice(0, 2).toUpperCase() || '';

  return (
    <AppBar position="sticky" color="inherit" elevation={1}
      sx={{ bgcolor: 'white', borderBottom: '1px solid #e0e0e0' }}>
      <Toolbar sx={{ gap: 1 }}>
        {/* Logo */}
        <Typography
          component={RouterLink} to="/"
          variant="h6" fontWeight={800} color="primary"
          sx={{ textDecoration: 'none', flexShrink: 0, letterSpacing: '-0.5px' }}
        >
          Social
        </Typography>

        {/* Search bar */}
        <Search>
          <SearchIconWrapper><SearchIcon fontSize="small" /></SearchIconWrapper>
          <StyledInputBase placeholder="Search users, posts…" inputProps={{ 'aria-label': 'search' }} />
        </Search>

        <Box sx={{ flexGrow: 1 }} />

        {user ? (
          <>
            {/* Create post */}
            <Tooltip title="Create Post">
              <IconButton color="primary" onClick={() => navigate('/create')} sx={{ mr: 0.5 }}>
                <AddCircleOutlineIcon />
              </IconButton>
            </Tooltip>

            {/* Avatar menu */}
            <Tooltip title={user.username}>
              <IconButton onClick={handleMenu} sx={{ p: 0 }}>
                <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.85rem', fontWeight: 700 }}>
                  {initials}
                </Avatar>
              </IconButton>
            </Tooltip>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}
              PaperProps={{ sx: { mt: 1.5, minWidth: 160, borderRadius: 2 } }}>
              <MenuItem onClick={() => { handleClose(); navigate(`/profile/${user.username}`); }}>
                My Profile
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>Logout</MenuItem>
            </Menu>
          </>
        ) : (
          <>
            <Button component={RouterLink} to="/login" color="inherit" sx={{ fontWeight: 600 }}>
              Login
            </Button>
            <Button component={RouterLink} to="/signup" variant="contained" size="small">
              Sign Up
            </Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
