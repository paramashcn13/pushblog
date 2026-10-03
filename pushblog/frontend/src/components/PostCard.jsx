import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toggleLike } from '../api/client';
import { getImageUrl } from '../api/client';
import './PostCard.css';

const changeTypeColors = {
  feature: '#10b981',
  bugfix: '#ef4444',
  improvement: '#3b82f6',
  release: '#8b5cf6',
  update: '#f59e0b',
};

export default function PostCard({ post, onLikeToggle }) {
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLiking) return;
    setIsLiking(true);

    try {
      const res = await toggleLike(post.post_id);
      setIsLiked(res.data.liked);
      setLikesCount(res.data.likes_count);
      if (onLikeToggle) onLikeToggle(post.post_id, res.data);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    } finally {
      setIsLiking(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <Link to={`/post/${post.post_id}`} className="post-card">
      <div className="post-header">
        <div className="post-author">
          <div className="author-avatar">
            {post.author.username[0].toUpperCase()}
          </div>
          <div className="author-info">
            <span className="author-name">{post.author.username}</span>
            <span className="post-date">{formatDate(post.created_at)}</span>
          </div>
        </div>
        {post.version && (
          <span className="post-version">{post.version}</span>
        )}
      </div>

      <div className="post-content">
        <h3 className="post-title">{post.title}</h3>

        <div className="post-meta">
          {post.change_type && (
            <span
              className="change-type"
              style={{ backgroundColor: changeTypeColors[post.change_type] }}
            >
              {post.change_type}
            </span>
          )}
          {post.project && (
            <span className="project-tag">{post.project.name}</span>
          )}
        </div>

        <p className="post-excerpt">
          {post.content.length > 200
            ? post.content.substring(0, 200) + '...'
            : post.content}
        </p>

        {post.media && post.media.length > 0 && (
          <div className="post-media">
            <img
              src={getImageUrl(post.media[0].media_url)}
              alt={post.media[0].caption || 'Post image'}
            />
            {post.media.length > 1 && (
              <span className="media-count">+{post.media.length - 1}</span>
            )}
          </div>
        )}
      </div>

      <div className="post-actions">
        <button
          className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={isLiking}
        >
          <span className="action-icon">{isLiked ? '❤️' : '🤍'}</span>
          <span>{likesCount}</span>
        </button>
        <div className="action-btn">
          <span className="action-icon">💬</span>
          <span>{post.comments_count}</span>
        </div>
      </div>
    </Link>
  );
}
