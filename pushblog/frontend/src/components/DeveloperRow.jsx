import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toggleFollow } from '../api/client';
import { useAuth } from '../context/AuthContext';
import './DeveloperRow.css';

export default function DeveloperRow({ developer, showFollow = false }) {
  const { user } = useAuth();
  const [status, setStatus] = useState(developer.follow_status || 'none');
  const [busy, setBusy] = useState(false);

  const handleFollow = async () => {
    if (!user || busy) return;
    setBusy(true);
    try {
      const result = await toggleFollow(developer.user_id);
      setStatus(result.data.status || (result.data.following ? 'accepted' : 'none'));
    } catch (error) {
      console.error('Could not update follow status:', error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="developer-row">
      <Link to={`/profile/${developer.username}`} className="developer-row-profile">
        <span className="developer-row-avatar">
          {developer.avatar_url
            ? <img src={developer.avatar_url} alt="" />
            : developer.username[0].toUpperCase()}
        </span>
        <span className="developer-row-copy">
          <strong>{developer.display_name || developer.username}</strong>
          <span>@{developer.username}{developer.is_private ? ' · PRIVATE' : ''}</span>
          {developer.bio && <small>{developer.bio}</small>}
        </span>
      </Link>
      {showFollow && user && user.user_id !== developer.user_id && (
        <button
          type="button"
          className={`developer-follow-button ${status !== 'none' ? 'is-following' : ''}`}
          onClick={handleFollow}
          disabled={busy}
        >
          {busy ? 'Updating...' : status === 'pending' ? 'Requested' : status === 'accepted' ? 'Following' : 'Follow'}
        </button>
      )}
    </article>
  );
}