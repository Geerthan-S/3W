/**
 * pages/CreatePostPage.jsx
 * Standalone page for creating a post (route: /create).
 * Protected — redirects to login if not authenticated.
 */

import { Link } from 'react-router-dom';
import { Button, Container } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CreatePost from '../components/CreatePost';
import './CreatePostPage.css';

const CreatePostPage = () => {
  return (
    <div className="create-page">
      <Container maxWidth="sm">
        <div className="create-page-header">
          <Button
            component={Link}
            to="/"
            startIcon={<ArrowBackIcon />}
            variant="outlined"
            sx={{
              borderRadius: 20,
              textTransform: 'none',
              fontWeight: 700,
              color: '#424242',
              borderColor: '#e0e0e0',
              bgcolor: '#ffffff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              px: 2.5,
              py: 0.75,
              '&:hover': {
                borderColor: '#bdbdbd',
                bgcolor: '#f5f5f5',
                boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
              }
            }}
          >
            Back to Feed
          </Button>
        </div>
        {/* Uses the reusable CreatePost component — navigates to feed on submit */}
        <CreatePost />
      </Container>
    </div>
  );
};

export default CreatePostPage;
