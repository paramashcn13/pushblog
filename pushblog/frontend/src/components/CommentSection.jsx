import { useState, useEffect } from 'react';
import { getComments, addComment, deleteComment } from '../api/client';
import { useAuth } from '../context/AuthContext';
import './CommentSection.css';

export default function CommentSection({ postId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [postId]);

  const loadComments = async () => {
    try {
      const res = await getComments(postId);
      setComments(res.data);
    } catch (err) {
      console.error('Failed to load comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await addComment(postId, { content: newComment });
      setComments([...comments, res.data]);
      setNewComment('');
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await deleteComment(commentId);
      setComments(comments.filter(c => c.comment_id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="comments-loading">Loading comments...</div>;
  }

  return (
    <div className="comment-section">
      <h3 className="comments-title">
        Comments ({comments.length})
      </h3>

      {user ? (
        <form onSubmit={handleSubmit} className="comment-form">
          <div className="comment-input-wrapper">
            <div className="comment-avatar">
              {user.username[0].toUpperCase()}
            </div>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a comment..."
              className="comment-input"
              rows={2}
            />
          </div>
          <button
            type="submit"
            className="comment-submit"
            disabled={!newComment.trim() || submitting}
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      ) : (
        <p className="login-prompt">
          <a href="/login">Log in</a> to leave a comment
        </p>
      )}

      <div className="comments-list">
        {comments.map((comment) => (
          <div key={comment.comment_id} className="comment">
            <div className="comment-avatar">
              {comment.author?.username[0].toUpperCase() || '?'}
            </div>
            <div className="comment-body">
              <div className="comment-header">
                <span className="comment-author">
                  {comment.author?.username || 'Unknown'}
                </span>
                <span className="comment-date">
                  {formatDate(comment.created_at)}
                </span>
                {user && comment.user_id === user.user_id && (
                  <button
                    className="comment-delete"
                    onClick={() => handleDelete(comment.comment_id)}
                  >
                    Delete
                  </button>
                )}
              </div>
              <p className="comment-content">{comment.content}</p>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="no-comments">No comments yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}
