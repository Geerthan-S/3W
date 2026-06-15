/**
 * pages/Signup.jsx — MUI styled registration form
 */
import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Link, Alert, CircularProgress, Divider,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Signup = () => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '', email: '', password: '', confirmPassword: '',
  });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, email, password, confirmPassword } = formData;
    if (!username || !email || !password) {
      showToast('All fields are required.', 'warning');
      setError('All fields are required.');
      return;
    }
    if (password !== confirmPassword) {
      showToast('Passwords do not match.', 'warning');
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      showToast('Password must be at least 6 characters.', 'warning');
      setError('Password must be at least 6 characters.');
      return;
    }
    if (username.length < 3) {
      showToast('Username must be at least 3 characters.', 'warning');
      setError('Username must be at least 3 characters.');
      return;
    }

    setLoading(true);
    try {
      await register(username, email, password);
      showToast('Registered and logged in successfully!', 'success');
      navigate('/', { replace: true });
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errMsg);
      showToast(errMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default',
               display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 420, borderRadius: 4 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" fontWeight={800} color="primary"
            sx={{ mb: 0.5, letterSpacing: '-0.5px' }}>
            Social<span style={{ color: '#212121' }}>Post</span>
          </Typography>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>Join the community 🌐</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your account to start posting
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField fullWidth label="Username" name="username"
              value={formData.username} onChange={handleChange}
              disabled={loading} required margin="normal" inputProps={{ maxLength: 20 }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField fullWidth label="Email" name="email" type="email"
              value={formData.email} onChange={handleChange}
              disabled={loading} required margin="normal"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField fullWidth label="Password" name="password" type="password"
              value={formData.password} onChange={handleChange}
              disabled={loading} required margin="normal"
              helperText="Minimum 6 characters"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField fullWidth label="Confirm Password" name="confirmPassword" type="password"
              value={formData.confirmPassword} onChange={handleChange}
              disabled={loading} required margin="normal"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />



            <Button fullWidth type="submit" variant="contained" size="large"
              disabled={loading}
              sx={{ mt: 2.5, mb: 1.5, borderRadius: 2, py: 1.3, fontWeight: 700, fontSize: '1rem' }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Create Account'}
            </Button>

            <Divider sx={{ my: 1.5 }} />

            <Typography variant="body2" color="text.secondary" textAlign="center">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" fontWeight={600}>Sign in</Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Signup;
