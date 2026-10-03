import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toggleLike } from '../api/client';
import { getImageUrl } from '../api/client';
import LikesPopover from './LikesPopover';
import './PostCard.css';

const changeTypeColors = {
  feature: '#315fce',
  bugfix: '#b5443b',
  improvement: '#3e8562',
  release: '#7a5ca8',
  update: '#69717e',
};

export default function PostCard({ post, onLikeToggle }) {
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
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
    <article className="post-card">
      <div className="post-header">
        <Link to={`/profile/${post.author.username}`} className="post-author">
          <div className="author-avatar">
            {post.author.username[0].toUpperCase()}
          </div>
          <div className="author-info">
            <span className="author-name">{post.author.username}</span>
            <span className="post-date">{formatDate(post.created_at)}</span>
          </div>
        </Link>
        {post.version && (
          <span className="post-version">{post.version}</span>
        )}
      </div>

      <div className="post-content">
        <Link to={`/post/${post.post_id}`} className="post-summary-link">
          <h3 className="post-title">{post.title}</h3>
          <div className="post-meta">
            {post.status === 'draft' && <span className="post-status-draft">Draft</span>}
            {post.change_type && (
              <span className="change-type" style={{ backgroundColor: changeTypeColors[post.change_type] }}>
                {post.change_type.replace('_', ' ')}
              </span>
            )}
            {post.project && <span className="project-tag">{post.project.name}</span>}
          </div>
          <p className="post-excerpt">
            {post.content.length > 200 ? `${post.content.substring(0, 200)}...` : post.content}
          </p>
          {post.media && post.media.length > 0 && (
            <div className="post-media">
              <img src={getImageUrl(post.media[0].media_url)} alt={post.media[0].caption || 'Post image'} />
              {post.media.length > 1 && <span className="media-count">+{post.media.length - 1}</span>}
            </div>
          )}
        </Link>
      </div>

      <div className="post-actions">
        <button
          className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={isLiking}
          aria-label={isLiked ? 'Unlike update' : 'Like update'}
        >
          <span className="action-icon">{isLiked ? '❤️' : '🤍'}</span>
        </button>
        <LikesPopover postId={post.post_id} likesCount={likesCount} />
        <Link to={`/post/${post.post_id}`} className="action-btn">
          <span className="action-icon">💬</span>
          <span>{post.comments_count} comments</span>
        </Link>
      </div>
    </article>
  );
}
