/**
 * App.jsx — Root component with MUI ThemeProvider (light, TaskPlanet-inspired)
 * and React Router setup.
 */

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Pages
import Feed from './pages/Feed';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import CreatePostPage from './pages/CreatePostPage';
import SearchPage from './pages/SearchPage';

// Layout
import Navbar from './components/Navbar';

// ─── MUI Theme — light, blue primary matching TaskPlanet ──────────────────────
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2196F3',       // TaskPlanet blue
      contrastText: '#fff',
    },
    secondary: {
      main: '#FF9800',
    },
    background: {
      default: '#F0F2F5',    // Light grey page bg
      paper: '#FFFFFF',
    },
    text: {
      primary: '#212121',
      secondary: '#757575',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          borderRadius: 12,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        containedPrimary: {
          borderRadius: 20,
          boxShadow: 'none',
          '&:hover': { boxShadow: '0 2px 8px rgba(33,150,243,0.3)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600 },
      },
    },
  },
});

// ─── Protected Route ──────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
};

// ─── App Layout ───────────────────────────────────────────────────────────────
const AppLayout = () => (
  <>
    <Navbar />
    <Routes>
      <Route path="/"                element={<Feed />} />
      <Route path="/login"           element={<Login />} />
      <Route path="/signup"          element={<Signup />} />
      <Route path="/profile/:username" element={<Profile />} />
      <Route path="/create"          element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
      <Route path="/search"          element={<SearchPage />} />
      <Route path="*"                element={<Navigate to="/" replace />} />
    </Routes>
  </>
);

// ─── Root ─────────────────────────────────────────────────────────────────────
const App = () => (
  <BrowserRouter>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ToastProvider>
        <AuthProvider>
          <AppLayout />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  </BrowserRouter>
);

export default App;
