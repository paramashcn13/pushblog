import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toggleBookmark, toggleLike } from '../api/client';
import { getImageUrl } from '../api/client';
import LikesPopover from './LikesPopover';
import UserAvatar from './UserAvatar';
import './PostCard.css';

const changeTypeColors = {
  feature: '#4f83cc',
  bugfix: '#c45c5c',
  improvement: '#5e9b78',
  release: '#3d91a8',
  update: '#778493',
};

function ActionIcon({ name, filled = false }) {
  const paths = {
    bookmark: <path d="M6 4h12v17l-6-4-6 4V4Z" />,
    heart: <path d="M20.8 5.7a5.5 5.5 0 0 0-7.8 0L12 6.8l-1.1-1.1a5.5 5.5 0 0 0-7.7 7.8L12 22l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z" />,
    comment: <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v8Z" />,
  };

  return (
    <svg
      className="action-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

export default function PostCard({ post, onLikeToggle, onBookmarkToggle }) {
  const [isLiked, setIsLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(Boolean(post.is_bookmarked));
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [bookmarkError, setBookmarkError] = useState('');

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

  const handleBookmark = async () => {
    if (isBookmarking) return;
    setIsBookmarking(true);
    setBookmarkError('');
    try {
      const res = await toggleBookmark(post.post_id);
      setIsBookmarked(res.data.bookmarked);
      if (onBookmarkToggle) onBookmarkToggle(post.post_id, res.data.bookmarked);
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      setBookmarkError(err.response?.status === 401
        ? 'Sign in to save updates.'
        : 'Could not update this bookmark. Please try again.');
    } finally {
      setIsBookmarking(false);
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
            <UserAvatar user={post.author} alt={`${post.author.username} avatar`} />
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
          className={`action-btn bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
          onClick={handleBookmark}
          disabled={isBookmarking}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark update'}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark update'}
        >
          <ActionIcon name="bookmark" filled={isBookmarked} />
          <span>{isBookmarked ? 'Saved' : 'Save'}</span>
        </button>
        <button
          className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={isLiking}
          aria-label={isLiked ? 'Unlike update' : 'Like update'}
        >
          <ActionIcon name="heart" filled={isLiked} />
        </button>
        <LikesPopover postId={post.post_id} likesCount={likesCount} />
        <Link to={`/post/${post.post_id}`} className="action-btn">
          <ActionIcon name="comment" />
          <span>{post.comments_count} comments</span>
        </Link>
      </div>
      {bookmarkError && <p className="post-action-error" role="alert">{bookmarkError}</p>}
    </article>
  );
}
