import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPublicProject } from '../api/client';
import PostCard from '../components/PostCard';
import './PublicProject.css';

export default function PublicProject() {
  const { id } = useParams();
  const [result, setResult] = useState({ id: null, project: null, error: '' });

  useEffect(() => {
    let cancelled = false;
    getPublicProject(id)
      .then((res) => {
        if (!cancelled) setResult({ id, project: res.data, error: '' });
      })
      .catch((err) => {
        if (!cancelled) {
          setResult({
            id,
            project: null,
            error: err.response?.status === 404 ? 'This project has no public changelog yet.' : 'Could not load this project.',
          });
        }
      });
    return () => { cancelled = true; };
  }, [id]);

  const loading = result.id !== id;
  const project = result.id === id ? result.project : null;
  const error = result.id === id ? result.error : '';

  if (loading) {
    return <div className="public-project-page"><div className="project-detail-skeleton" /></div>;
  }

  if (error || !project) {
    return (
      <div className="public-project-page project-detail-empty">
        <span className="eyebrow">PROJECT / UNAVAILABLE</span>
        <h1>{error || 'Project not found.'}</h1>
        <Link to="/explore">Back to Explore</Link>
      </div>
    );
  }

  return (
    <div className="public-project-page">
      <header className="public-project-header">
        <div className="public-project-identity">
          <span className="public-project-mark">{project.name.slice(0, 1).toUpperCase()}</span>
          <div>
            <span className="eyebrow"><span /> PROJECT / CHANGELOG</span>
            <h1>{project.name}</h1>
            <Link to={`/profile/${project.owner.username}`} className="public-project-owner">
              @{project.owner.username} / {project.name.toLowerCase().replaceAll(' ', '-')}
            </Link>
          </div>
        </div>
        <div className="public-project-actions">
          {project.repo_url && <a href={project.repo_url} target="_blank" rel="noopener noreferrer">GitHub ↗</a>}
          <Link to={`/profile/${project.owner.username}`}>Maintainer</Link>
        </div>
        {project.description && <p className="public-project-description">{project.description}</p>}
      </header>

      <div className="public-project-stats">
        <div><strong>{project.updates_count}</strong><span>UPDATES</span></div>
        <div><strong>{project.current_version || '—'}</strong><span>CURRENT VERSION</span></div>
        <div><strong>{new Date(project.updated_at).toLocaleDateString()}</strong><span>LAST UPDATED</span></div>
      </div>

      <section className="project-timeline">
        <div className="timeline-heading">
          <div>
            <span className="eyebrow">RELEASE HISTORY</span>
            <h2>Changelog</h2>
          </div>
          <span>{project.updates_count} PUBLISHED</span>
        </div>
        {project.recent_updates.map((post) => (
          <div className="timeline-entry" key={post.post_id}>
            <span className="timeline-node" />
            <PostCard post={post} />
          </div>
        ))}
      </section>
    </div>
  );
}