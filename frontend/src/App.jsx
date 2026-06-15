/**
 * App.jsx
 * Root component — sets up React Router with all pages.
 * Includes a ProtectedRoute wrapper that redirects to /login
 * if the user is not authenticated.
 */

import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Feed from './pages/Feed';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import CreatePostPage from './pages/CreatePostPage';

// Layout
import Navbar from './components/Navbar';

// ─── Protected Route Wrapper ───────────────────────────────────────────────────
// Redirects unauthenticated users to /login, preserving the intended destination.
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show nothing while verifying the token on first load
  if (loading) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// ─── App Layout ───────────────────────────────────────────────────────────────
// Wraps all routes with the sticky Navbar.
const AppLayout = () => {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Feed />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/profile/:username" element={<Profile />} />

          {/* Protected routes — require authentication */}
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <CreatePostPage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all: redirect unknown routes to feed */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </>
  );
};

// ─── Root App ────────────────────────────────────────────────────────────────
const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
