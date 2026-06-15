/**
 * pages/Signup.jsx
 * Registration page — username, email, password form.
 * Auto-logs in after successful account creation.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Signup = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, email, password, confirmPassword } = formData;

    // Client-side validation
    if (!username || !email || !password) {
      return setError('All fields are required.');
    }
    if (password !== confirmPassword) {
      return setError('Passwords do not match.');
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters.');
    }
    if (username.length < 3) {
      return setError('Username must be at least 3 characters.');
    }

    setLoading(true);
    try {
      await register(username, email, password);
      // AuthContext sets the token; navigate to feed
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-blob auth-blob-1" />
      <div className="auth-blob auth-blob-2" />

      <div className="auth-card glass-card">
        {/* Logo */}
        <div className="auth-logo">
          <span className="logo-icon-lg">✦</span>
          <h1 className="auth-app-name gradient-text">SocialPost</h1>
        </div>

        <div className="auth-header">
          <h2 className="auth-title">Join the community</h2>
          <p className="auth-subtitle">Create your account to start posting</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {/* Username */}
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              className="form-input"
              placeholder="yourname"
              value={formData.username}
              onChange={handleChange}
              autoComplete="username"
              disabled={loading}
              maxLength={20}
              required
            />
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              disabled={loading}
              required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="Min. 6 characters"
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              disabled={loading}
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="form-input"
              placeholder="Repeat your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              disabled={loading}
              required
            />
          </div>

          {/* Error */}
          {error && <p className="alert alert-error">{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Creating account…
              </>
            ) : (
              'Create Account ✦'
            )}
          </button>
        </form>

        {/* Switch to login */}
        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
