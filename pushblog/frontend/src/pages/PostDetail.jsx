import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPost, toggleLike, deletePost, getImageUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import CommentSection from '../components/CommentSection';
import './PostDetail.css';

const changeTypeColors = {
  feature: '#10b981',
  bugfix: '#ef4444',
  improvement: '#3b82f6',
  release: '#8b5cf6',
  update: '#f59e0b',
};

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    try {
      const res = await getPost(id);
      setPost(res.data);
      setIsLiked(res.data.is_liked);
      setLikesCount(res.data.likes_count);
    } catch (err) {
      console.error('Failed to load post:', err);
      if (err.response?.status === 404) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await toggleLike(post.post_id);
      setIsLiked(res.data.liked);
      setLikesCount(res.data.likes_count);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }
    try {
      await deletePost(post.post_id);
      navigate('/');
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="post-detail-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-detail-page">
        <div className="not-found">Post not found</div>
      </div>
    );
  }

  return (
    <div className="post-detail-page">
      <article className="post-detail-card">
        <header className="post-detail-header">
          <div className="post-meta-row">
            <Link to={`/profile/${post.author.username}`} className="author-link">
              <div className="author-avatar">
                {post.author.username[0].toUpperCase()}
              </div>
              <div className="author-info">
                <span className="author-name">{post.author.username}</span>
                <span className="post-date">{formatDate(post.created_at)}</span>
              </div>
            </Link>

            <div className="post-badges">
              {post.version && (
                <span className="version-badge">{post.version}</span>
              )}
              {post.change_type && (
                <span
                  className="change-type-badge"
                  style={{ backgroundColor: changeTypeColors[post.change_type] }}
                >
                  {post.change_type}
                </span>
              )}
            </div>
          </div>

          <h1 className="post-title">{post.title}</h1>

          {post.project && (
            <div className="project-info">
              <span className="project-label">Project:</span>
              <span className="project-name">{post.project.name}</span>
              {post.project.repo_url && (
                <a
                  href={post.project.repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="repo-link"
                >
                  View Repo →
                </a>
              )}
            </div>
          )}
        </header>

        <div className="post-content">
          {post.content.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        {post.media && post.media.length > 0 && (
          <div className="post-media-gallery">
            {post.media.map((media, index) => (
              <div
                key={media.media_id}
                className="media-item"
                onClick={() => setSelectedImage(media)}
              >
                <img
                  src={getImageUrl(media.media_url)}
                  alt={media.caption || `Screenshot ${index + 1}`}
                />
                {media.caption && (
                  <span className="media-caption">{media.caption}</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="post-actions">
          <button
            className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleLike}
          >
            <span>{isLiked ? '❤️' : '🤍'}</span>
            <span>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
          </button>

          {user && user.user_id === post.user_id && (
            <button className="action-btn delete-btn" onClick={handleDelete}>
              Delete Post
            </button>
          )}
        </div>

        <CommentSection postId={post.post_id} />
      </article>

      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <button className="close-modal">×</button>
          <img
            src={getImageUrl(selectedImage.media_url)}
            alt={selectedImage.caption || 'Full size'}
          />
        </div>
      )}
    </div>
  );
}
