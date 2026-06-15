/**
 * pages/SearchPage.jsx
 * Dedicated tabbed search results page.
 * Displays matching Posts, Users, and Promotions.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
  Box, Container, Typography, Tabs, Tab, InputBase, IconButton,
  Stack, Card, CardContent, Avatar, Button, CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { authAPI, postsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import PostCardSkeleton from '../components/PostCardSkeleton';

const SearchPage = () => {
  const navigate = useNavigate();
  const { user: currentUser, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Tab: 0 = Posts, 1 = Users, 2 = Promotions
  const [activeTab, setActiveTab] = useState(0);

  const [tempQuery, setTempQuery] = useState(searchParams.get('q') || '');
  const [query, setQuery] = useState(searchParams.get('q') || '');

  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [promotions, setPromotions] = useState([]);

  const [loading, setLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState({});

  // Fetch results based on active tab and query
  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setPosts([]);
        setUsers([]);
        setPromotions([]);
        return;
      }

      setLoading(true);
      try {
        if (activeTab === 0) {
          // Fetch Posts
          const { data } = await postsAPI.getFeed(null, 20, 'newest', 'posts', null, query);
          setPosts(data?.posts || []);
        } else if (activeTab === 1) {
          // Fetch Users
          const { data } = await authAPI.searchUsers(query);
          setUsers(data || []);
        } else if (activeTab === 2) {
          // Fetch Promotions
          const { data } = await postsAPI.getFeed(null, 20, 'newest', 'promotions', null, query);
          setPromotions(data?.posts || []);
        }
      } catch (err) {
        console.error('Search fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [activeTab, query]);

  // Sync tempQuery if q parameter in URL changes
  useEffect(() => {
    const q = searchParams.get('q') || '';
    setTempQuery(q);
    setQuery(q);
  }, [searchParams]);

  const handleSearchSubmit = () => {
    setQuery(tempQuery);
    if (tempQuery.trim()) {
      setSearchParams({ q: tempQuery });
    } else {
      setSearchParams({});
    }
  };

  const handleFollowToggle = async (username, userId) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setFollowLoading(prev => ({ ...prev, [userId]: true }));
    try {
      const { data } = await authAPI.followUser(username);
      if (updateUser) {
        updateUser({ following: data.currentUserFollowing });
      }
    } catch (err) {
      console.error('Follow toggle error:', err);
    } finally {
      setFollowLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const renderEmptyState = (typeLabel) => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 10,
        textAlign: 'center',
        gap: 1.5,
      }}
    >
      <SearchOffIcon sx={{ fontSize: 64, color: '#bdbdbd' }} />
      <Typography variant="h6" fontWeight={800} color="text.primary" sx={{ mt: 1 }}>
        No {typeLabel} found for "{query}"
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Try different keywords or check your spelling
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', pb: 8 }}>
      <Container maxWidth="sm" sx={{ pt: 2 }}>
        {/* Search header layout matching screenshots */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ color: 'text.primary', p: 0.5 }}>
            <ArrowBackIcon />
          </IconButton>
          <Box
            sx={{
              display: 'flex',
              flexGrow: 1,
              position: 'relative',
              alignItems: 'center',
              bgcolor: '#f1f3f4',
              borderRadius: 20,
              px: 2,
              py: 0.75,
              border: '1px solid #e0e0e0',
            }}
          >
            <InputBase
              fullWidth
              placeholder="Search users, posts, promotions…"
              value={tempQuery}
              onChange={(e) => setTempQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearchSubmit();
              }}
              sx={{ fontSize: '0.95rem' }}
            />
            {tempQuery && (
              <IconButton
                size="small"
                onClick={() => {
                  setTempQuery('');
                  setQuery('');
                  setSearchParams({});
                }}
                sx={{ p: 0.2 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
          <IconButton
            onClick={handleSearchSubmit}
            sx={{
              bgcolor: '#2196F3',
              color: '#fff',
              '&:hover': { bgcolor: '#1976D2' },
              width: 42,
              height: 42,
              borderRadius: '50%',
              boxShadow: '0 2px 4px rgba(33,150,243,0.3)',
            }}
          >
            <SearchIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Tab Filters */}
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="fullWidth"
          sx={{
            borderBottom: '1px solid #e0e0e0',
            mb: 2.5,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              color: '#757575',
              pb: 1.5,
              '&.Mui-selected': {
                color: '#2196F3',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#2196F3',
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab label="Posts" />
          <Tab label="Users" />
          <Tab label="Promotions" />
        </Tabs>

        {/* Search Results Display */}
        {loading ? (
          activeTab === 1 ? (
            <Stack spacing={1.5}>
              {[1, 2, 3].map((i) => (
                <Card key={i} sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: '16px !important' }}>
                    <Skeleton variant="circular" width={48} height={48} animation="wave" />
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Skeleton variant="text" width="40%" height={20} animation="wave" />
                      <Skeleton variant="text" width="60%" height={16} animation="wave" />
                    </Box>
                    <Skeleton variant="rectangular" width={75} height={30} sx={{ borderRadius: 5 }} animation="wave" />
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            <Stack spacing={0}>
              {[1, 2, 3].map((i) => (
                <PostCardSkeleton key={i} />
              ))}
            </Stack>
          )
        ) : !query.trim() ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 12, textAlign: 'center' }}>
            <SearchIcon sx={{ fontSize: 56, color: '#bdbdbd', mb: 1.5 }} />
            <Typography variant="subtitle1" fontWeight={700} color="text.secondary">
              Search for users, posts, or promotions using the bar above.
            </Typography>
          </Box>
        ) : (
          <Box>
            {/* Tab 0: Posts */}
            {activeTab === 0 && (
              posts.length === 0 ? renderEmptyState('posts') : (
                <Stack spacing={0}>
                  {posts.map((post) => (
                    <PostCard key={post._id} post={post} onDelete={(id) => setPosts(p => p.filter(item => item._id !== id))} />
                  ))}
                </Stack>
              )
            )}

            {/* Tab 1: Users */}
            {activeTab === 1 && (
              users.length === 0 ? renderEmptyState('users') : (
                <Stack spacing={1.5}>
                  {users.map((cardUser) => {
                    const isFollowing = currentUser?.following?.includes(cardUser._id);
                    const isSelf = currentUser && (currentUser.id === cardUser._id || currentUser._id === cardUser._id);
                    return (
                      <Card key={cardUser._id} sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                        <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: '16px !important' }}>
                          <Avatar
                            src={cardUser.avatar || ''}
                            sx={{ width: 48, height: 48, bgcolor: 'primary.main', fontSize: '1rem', fontWeight: 700 }}
                          >
                            {cardUser.avatar ? null : cardUser.username?.slice(0, 2).toUpperCase()}
                          </Avatar>
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography
                              component={RouterLink}
                              to={`/profile/${cardUser.username}`}
                              variant="subtitle1"
                              fontWeight={800}
                              sx={{ textDecoration: 'none', color: 'text.primary', '&:hover': { textDecoration: 'underline' } }}
                            >
                              {cardUser.username}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {cardUser.bio || 'No bio yet'}
                            </Typography>
                          </Box>
                          {!isSelf && (
                            <Button
                              variant={isFollowing ? "outlined" : "contained"}
                              size="small"
                              onClick={() => handleFollowToggle(cardUser.username, cardUser._id)}
                              disabled={followLoading[cardUser._id]}
                              sx={{ borderRadius: 5, px: 2, py: 0.4, textTransform: 'none', fontWeight: 700, fontSize: '0.8rem' }}
                            >
                              {isFollowing ? 'Following' : 'Follow'}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </Stack>
              )
            )}

            {/* Tab 2: Promotions */}
            {activeTab === 2 && (
              promotions.length === 0 ? renderEmptyState('promotions') : (
                <Stack spacing={0}>
                  {promotions.map((post) => (
                    <PostCard key={post._id} post={post} onDelete={(id) => setPromotions(p => p.filter(item => item._id !== id))} />
                  ))}
                </Stack>
              )
            )}
          </Box>
        )}
      </Container>
    </Box>
  );
};

export default SearchPage;
