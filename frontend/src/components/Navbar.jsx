/**
 * components/Navbar.jsx
 * Responsive top navigation bar.
 * Shows logo, nav links, and the current user's avatar + logout button.
 * Collapses gracefully on mobile.
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Generate initials from username for the avatar fallback
  const getInitials = (username) =>
    username ? username.slice(0, 2).toUpperCase() : '??';

  // Helper to mark the active route
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* ── Logo ── */}
        <Link to="/" className="navbar-logo">
          <span className="logo-icon">✦</span>
          <span className="logo-text gradient-text">SocialPost</span>
        </Link>

        {/* ── Desktop Nav Links ── */}
        <div className="navbar-links">
          {user ? (
            <>
              <Link
                to="/"
                className={`nav-link ${isActive('/') ? 'active' : ''}`}
              >
                Feed
              </Link>
              <Link
                to="/create"
                className={`nav-link ${isActive('/create') ? 'active' : ''}`}
              >
                + Create
              </Link>
              <div className="nav-divider" />
              <Link to={`/profile/${user.username}`} className="nav-avatar-btn">
                <div className="avatar avatar-sm">{getInitials(user.username)}</div>
                <span className="nav-username">{user.username}</span>
              </Link>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`nav-link ${isActive('/login') ? 'active' : ''}`}
              >
                Login
              </Link>
              <Link to="/signup" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile Hamburger ── */}
        <button
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>
      </div>

      {/* ── Mobile Dropdown Menu ── */}
      <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
        {user ? (
          <>
            <Link to="/" onClick={() => setMenuOpen(false)}>🏠 Feed</Link>
            <Link to="/create" onClick={() => setMenuOpen(false)}>✏️ Create Post</Link>
            <Link to={`/profile/${user.username}`} onClick={() => setMenuOpen(false)}>
              👤 My Profile
            </Link>
            <button onClick={() => { handleLogout(); setMenuOpen(false); }}>
              🚪 Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" onClick={() => setMenuOpen(false)}>Login</Link>
            <Link to="/signup" onClick={() => setMenuOpen(false)}>Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
