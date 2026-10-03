import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getPostLikes } from '../api/client';
import './LikesPopover.css';

export default function LikesPopover({ postId, likesCount }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');

  const handleToggle = async () => {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (users.length || !likesCount || loading) return;
    setLoading(true);
    setError('');
    try {
      const response = await getPostLikes(postId);
      setUsers(response.data);
    } catch {
      setError('Could not load people who liked this update.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <span className="likes-popover-wrap">
      <button type="button" className="likes-list-trigger" onClick={handleToggle} disabled={!likesCount} aria-expanded={open}>
        {likesCount} {likesCount === 1 ? 'like' : 'likes'}
      </button>
      {open && (
        <span className="likes-popover" role="dialog" aria-label="People who liked this update">
          <strong>Liked by</strong>
          {loading ? <span className="likes-popover-state">Loading...</span> : null}
          {error ? <span className="likes-popover-error">{error}</span> : null}
          {!loading && !error && users.map((person) => (
            <Link key={person.user_id} to={`/profile/${person.username}`} className="likes-person">
              <span>{person.username[0].toUpperCase()}</span>
              @{person.username}
            </Link>
          ))}
          <button type="button" className="likes-popover-close" onClick={() => setOpen(false)} aria-label="Close likes list">×</button>
        </span>
      )}
    </span>
  );
}