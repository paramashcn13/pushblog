import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getFeed, explorePosts } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import './Home.css';

export default function Home({ initialTab = 'latest' }) {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const activeTab = user ? selectedTab : 'latest';
  const query = searchParams.get('q')?.trim().toLowerCase() || '';

  useEffect(() => {
    let cancelled = false;
    const loadPosts = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const res = activeTab === 'following' && user
          ? await getFeed()
          : await explorePosts();
        if (!cancelled) setPosts(res.data);
      } catch (err) {
        console.error('Failed to load posts:', err);
        if (!cancelled) setLoadError(err.response?.data?.detail || 'Could not load changelog entries.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadPosts();
    return () => { cancelled = true; };
  }, [activeTab, user, reloadKey]);

  const filteredPosts = posts.filter((post) => {
    if (!query) return true;
    const haystack = [
      post.title,
      post.content,
      post.version,
      post.change_type,
      post.project?.name,
      post.author?.username,
    ].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(query);
  });

  const activeProjects = [...new Map(
    posts.filter((post) => post.project).map((post) => [post.project.project_id, post.project])
  ).values()];
  const releaseCount = posts.filter((post) => post.change_type === 'release').length;
  const greeting = new Date().getHours() < 12
    ? 'Good morning'
    : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="home-page">
      <section className={`home-intro ${user ? 'home-intro-member' : 'home-intro-public'}`}>
        <div className="intro-copy">
          <div className="eyebrow"><span /> BUILT IN PUBLIC, WITH CONTEXT</div>
          <h1>
            {user ? <>{greeting}, {user.username}.</> : <>Build in public.<br />Ship with context.</>}
          </h1>
          <p>
            {user
              ? 'A running log of what is changing across your developer network.'
              : 'Document features, fixes, releases, and everything in between.'}
          </p>
          {!user && (
            <div className="intro-actions">
              <Link to="/register" className="primary-link">Start writing <span>→</span></Link>
              <Link to="/explore" className="text-link">Explore updates</Link>
            </div>
          )}
        </div>
        <div className="intro-aside">
          {user ? (
            <>
              <span className="intro-aside-label">THE DEVELOPER CHANGELOG</span>
              <span className="intro-aside-index">PB / 001</span>
              <span className="intro-aside-note">Projects move fast.<br />Their stories should keep up.</span>
            </>
          ) : (
            <>
              <span className="intro-aside-label">SAMPLE CHANGELOG</span>
              <div className="intro-sample-meta"><code>v2.4.0</code><span>FEATURE</span></div>
              <div>
                <h2 className="intro-sample-title">New deployment analytics</h2>
                <p className="intro-sample-copy">Added deployment history and performance metrics to every project.</p>
              </div>
            </>
          )}
        </div>

      </section>

      <div className="feed-layout">
        <section className="feed-main">
          <div className="feed-toolbar">
            <div className="feed-tabs" role="tablist" aria-label="Changelog feed">
              {user && (
                <button
                  role="tab"
                  aria-selected={activeTab === 'following'}
                  className={`tab ${activeTab === 'following' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('following')}
                >Following</button>
              )}
              <button
                role="tab"
                aria-selected={activeTab === 'latest'}
                className={`tab ${activeTab === 'latest' ? 'active' : ''}`}
                onClick={() => setSelectedTab('latest')}
              >Latest</button>
            </div>
            <span className="feed-count">{query ? `${filteredPosts.length} MATCHES` : 'CHANGELOG STREAM'}</span>
          </div>

          {query && <p className="search-summary">Results for <strong>“{searchParams.get('q')}”</strong></p>}

          {loading ? (
            <div className="feed-skeletons" aria-label="Loading changelog entries">
              {[1, 2, 3].map((item) => <div className="feed-skeleton" key={item} />)}
            </div>
          ) : loadError ? (
            <div className="feed-empty feed-error">
              <span className="eyebrow">CONNECTION INTERRUPTED</span>
              <h2>We couldn't load the stream.</h2>
              <p>{loadError}</p>
              <button type="button" onClick={() => setReloadKey((key) => key + 1)}>Try again</button>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="feed-empty">
              <span className="eyebrow">NO ENTRIES YET</span>
              <h2>{query ? 'No changelogs match that search.' : activeTab === 'following' ? 'Your network is quiet.' : 'The stream starts here.'}</h2>
              <p>{query ? 'Try a project, version, or change type.' : activeTab === 'following' ? 'Follow developers to see their project updates here.' : 'Publish an update to start a useful history of what your project ships.'}</p>
              {user && <Link to="/create" className="primary-link">Write an update <span>→</span></Link>}
            </div>
          ) : (
            <div className="posts-grid">
              {filteredPosts.map((post) => <PostCard key={post.post_id} post={post} />)}
            </div>
          )}
        </section>

        <aside className="feed-rail">
          <section className="rail-section">
            <div className="rail-heading">
              <span className="eyebrow">IN THIS STREAM</span>
              <span className="rail-live"><i /> CURRENT</span>
            </div>
            <div className="rail-metrics">
              <div><strong>{posts.length}</strong><span>updates loaded</span></div>
              <div><strong>{activeProjects.length}</strong><span>projects</span></div>
              <div><strong>{releaseCount}</strong><span>releases</span></div>
            </div>
          </section>

          <section className="rail-section">
            <div className="rail-heading"><span className="eyebrow">ACTIVE PROJECTS</span></div>
            {activeProjects.length ? (
              <ul className="active-project-list">
                {activeProjects.slice(0, 5).map((project) => (
                  <li key={project.project_id}>
                    <span className="project-mark">{project.name.slice(0, 1).toUpperCase()}</span>
                    <span>{project.name}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="rail-empty">Project activity will show here as updates arrive.</p>}
          </section>

          <section className="rail-note">
            <span className="eyebrow">WHY PUSHBLOG</span>
            <p>A clear record of what changed, why it changed, and what comes next.</p>
            {!user && <Link to="/register">Make your first entry <span>→</span></Link>}
          </section>
        </aside>
      </div>
    </div>
  );
}
