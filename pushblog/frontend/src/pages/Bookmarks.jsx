import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBookmarks } from '../api/client';
import PostCard from '../components/PostCard';
import './Bookmarks.css';

export default function Bookmarks() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getBookmarks()
      .then((response) => {
        if (!cancelled) setPosts(response.data);
      })
      .catch((requestError) => {
        console.error('Failed to load bookmarks:', requestError);
        if (!cancelled) {
          const detail = requestError.response?.data?.detail;
          setError(typeof detail === 'string' ? detail : 'Could not load your saved updates. Please try again.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bookmarks-page">
      <header className="bookmarks-heading">
        <div>
          <span className="eyebrow"><span /> YOUR LIBRARY</span>
          <h1>Bookmarks</h1>
          <p>Updates you saved to revisit later.</p>
        </div>
        <span className="bookmarks-index">PB / SAVED</span>
      </header>
      {error && <p className="bookmarks-error" role="alert">{error}</p>}
      {loading ? (
        <div className="bookmarks-loading" aria-label="Loading saved updates">
          <div /><div /><div />
        </div>
      ) : posts.length ? (
        <div className="bookmarks-list">
          {posts.map((post) => (
            <PostCard
              key={post.post_id}
              post={post}
              onBookmarkToggle={(postId, bookmarked) => {
                if (!bookmarked) {
                  setPosts((items) => items.filter((item) => item.post_id !== postId));
                }
              }}
            />
          ))}
        </div>
      ) : !error ? (
        <div className="bookmarks-empty">
          <span className="eyebrow">NOTHING SAVED YET</span>
          <h2>Your reading list starts here.</h2>
          <p>Use “Save” on any update to keep it close at hand.</p>
          <Link to="/explore" className="bookmarks-explore">Explore updates <span>→</span></Link>
        </div>
      ) : null}
    </div>
  );
}
