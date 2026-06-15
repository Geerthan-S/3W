/**
 * pages/CreatePostPage.jsx
 * Standalone page for creating a post (route: /create).
 * Protected — redirects to login if not authenticated.
 */

import { Link } from 'react-router-dom';
import CreatePost from '../components/CreatePost';
import './CreatePostPage.css';

const CreatePostPage = () => {
  return (
    <div className="create-page">
      <div className="container">
        <div className="create-page-header">
          <Link to="/" className="back-link">← Back to Feed</Link>
        </div>
        {/* Uses the reusable CreatePost component — navigates to feed on submit */}
        <CreatePost />
      </div>
    </div>
  );
};

export default CreatePostPage;
