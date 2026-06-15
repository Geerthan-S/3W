/**
 * services/api.js
 * Centralized API service using axios.
 * All backend calls go through this module — keeps components clean.
 * The auth token is automatically attached to every request via interceptor.
 */

import axios from 'axios';

// Base URL — reads from VITE_API_URL (set per environment, no localhost fallback)
const API = import.meta.env.VITE_API_URL;

// Create an axios instance — baseURL is the root VITE_API_URL
const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor — attach JWT token ────────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor — handle 401 globally ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the token expires, clear storage so the user is redirected to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Optional: redirect to login (handled in AuthContext instead)
    }
    return Promise.reject(error);
  }
);

// ─── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  /** Register a new user */
  register: (data) => api.post('/api/auth/register', data),

  /** Log in with email and password */
  login: (data) => api.post('/api/auth/login', data),

  /** Get the currently logged-in user */
  getMe: () => api.get('/api/auth/me'),

  /** Update authenticated user profile details */
  updateProfile: (data) => api.put('/api/auth/profile', data),

  /** Get public user profile info by username */
  getProfile: (username) => api.get(`/api/auth/profile/${username}`),

  /** Follow or unfollow a user by their username */
  followUser: (username) => api.post(`/api/auth/profile/${username}/follow`),
};

// ─── Posts API ─────────────────────────────────────────────────────────────────
export const postsAPI = {
  /**
   * Get paginated feed.
   * @param {string|null} cursor - Last post ID from previous page (for infinite scroll)
   * @param {number} limit - Posts per page
   */
  getFeed: (cursor = null, limit = 10, sort = 'newest', type = 'posts', category = null) => {
    const params = { limit, sort, type };
    if (cursor) params.cursor = cursor;
    if (category) params.category = category;
    return api.get('/api/posts', { params });
  },

  /** Create a new post (text and/or imageUrl) */
  createPost: (data) => api.post('/api/posts', data),

  /** Toggle like on a post */
  likePost: (postId) => api.post(`/api/posts/${postId}/like`),

  /** Add a comment to a post */
  addComment: (postId, text) => api.post(`/api/posts/${postId}/comment`, { text }),

  /** Delete own post */
  deletePost: (postId) => api.delete(`/api/posts/${postId}`),

  /** Get all posts by a specific username */
  getUserPosts: (username) => api.get(`/api/posts/user/${username}`),

  /** Cast a vote on a poll option */
  votePost: (postId, optionId) => api.post(`/api/posts/${postId}/vote`, { optionId }),
};

export default api;
