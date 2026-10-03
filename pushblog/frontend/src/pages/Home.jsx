import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFeed, explorePosts } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import './Home.css';

export default function Home() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(user ? 'feed' : 'explore');

  useEffect(() => {
    loadPosts();
  }, [activeTab, user]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = activeTab === 'feed' && user
        ? await getFeed()
        : await explorePosts();
      setPosts(res.data);
    } catch (err) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-page">
      <div className="home-header">
        <div className="header-content">
          <h1>
            <span className="highlight">{'>'}</span> Developer Updates
          </h1>
          <p>Share your changelog, track your progress, inspire others</p>
        </div>

        {user && (
          <Link to="/create" className="create-post-btn">
            + New Post
          </Link>
        )}
      </div>

      <div className="feed-tabs">
        {user && (
          <button
            className={`tab ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            Your Feed
          </button>
        )}
        <button
          className={`tab ${activeTab === 'explore' ? 'active' : ''}`}
          onClick={() => setActiveTab('explore')}
        >
          Explore
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No posts yet</h3>
          <p>
            {activeTab === 'feed'
              ? 'Follow some developers to see their updates here!'
              : 'Be the first to share your developer journey!'}
          </p>
          {user && (
            <Link to="/create" className="empty-action">
              Create your first post
            </Link>
          )}
        </div>
      ) : (
        <div className="posts-grid">
          {posts.map((post) => (
            <PostCard key={post.post_id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
