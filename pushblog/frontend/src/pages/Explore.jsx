import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { explorePosts, getExploreProjects, searchUsers } from '../api/client';
import PostCard from '../components/PostCard';
import DeveloperRow from '../components/DeveloperRow';
import './Explore.css';

export default function Explore() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q')?.trim().toLowerCase() || '';
  const [activeTab, setActiveTab] = useState('updates');
  const [posts, setPosts] = useState([]);
  const [projects, setProjects] = useState([]);
  const [developers, setDevelopers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadExplore = async () => {
      setLoading(true);
      setError('');
      const [postResult, projectResult, developerResult] = await Promise.allSettled([
        explorePosts(),
        getExploreProjects(),
        query ? searchUsers(query) : Promise.resolve({ data: [] }),
      ]);
      if (cancelled) return;
      if (postResult.status === 'fulfilled') setPosts(postResult.value.data);
      if (projectResult.status === 'fulfilled') setProjects(projectResult.value.data);
      if (developerResult.status === 'fulfilled') setDevelopers(developerResult.value.data);
      if ([postResult, projectResult, developerResult].every((result) => result.status === 'rejected')) {
        setError('Could not load public projects, developers, or updates. Check your connection and try again.');
      } else if ([postResult, projectResult, developerResult].some((result) => result.status === 'rejected')) {
        setError('Some search results could not be loaded.');
      }
      setLoading(false);
    };
    loadExplore();
    return () => { cancelled = true; };
  }, [query]);

  const matches = (value) => [
    value.name,
    value.description,
    value.current_version,
    value.owner?.username,
  ].filter(Boolean).join(' ').toLowerCase().includes(query);
  const visibleProjects = query ? projects.filter(matches) : projects;
  const visiblePosts = query ? posts.filter((post) => [
    post.title,
    post.content,
    post.version,
    post.change_type,
    post.project?.name,
    post.author?.username,
  ].filter(Boolean).join(' ').toLowerCase().includes(query)) : posts;

  return (
    <div className="explore-page">
      <header className="explore-heading">
        <div>
          <span className="eyebrow"><span /> DISCOVERY / PUBLIC</span>
          <h1>Explore what’s shipping.</h1>
          <p>Follow the work behind the releases, not just the announcement.</p>
        </div>
        <span className="explore-index">PB / EXPLORE</span>
      </header>

      <div className="explore-toolbar">
        <div className="explore-tabs" role="tablist" aria-label="Explore results">
          <button type="button" role="tab" aria-selected={activeTab === 'updates'} className={activeTab === 'updates' ? 'active' : ''} onClick={() => setActiveTab('updates')}>
            Changelogs <span>{visiblePosts.length}</span>
          </button>
          <button type="button" role="tab" aria-selected={activeTab === 'projects'} className={activeTab === 'projects' ? 'active' : ''} onClick={() => setActiveTab('projects')}>
            Projects <span>{visibleProjects.length}</span>
          </button>
          <button type="button" role="tab" aria-selected={activeTab === 'developers'} className={activeTab === 'developers' ? 'active' : ''} onClick={() => setActiveTab('developers')}>
            Developers <span>{developers.length}</span>
          </button>
        </div>
        <span className="explore-sort">RECENTLY UPDATED</span>
      </div>

      {query && <p className="explore-query">Showing results for <strong>“{searchParams.get('q')}”</strong></p>}
      {error && <p className="explore-error" role="alert">{error}</p>}

      {loading ? (
        <div className="explore-loading" aria-label="Loading results">
          {[1, 2, 3].map((item) => <div key={item} />)}
        </div>
      ) : activeTab === 'updates' ? (
        visiblePosts.length ? (
          <div className="explore-updates">
            {visiblePosts.map((post) => <PostCard key={post.post_id} post={post} />)}
          </div>
        ) : (
          <div className="explore-empty">
            <span className="eyebrow">NO MATCHING UPDATES</span>
            <h2>{query ? 'Try a different search.' : 'Public updates will appear here.'}</h2>
            <p>{query ? 'Search by title, project, version, author, or change type.' : 'When a developer publishes a changelog, it becomes discoverable here.'}</p>
          </div>
        )
      ) : activeTab === 'projects' && visibleProjects.length ? (
        <div className="discovery-projects">
          {visibleProjects.map((project) => (
            <article className="discovery-project" key={project.project_id}>
              <Link to={`/project/${project.project_id}`} className="discovery-project-main">
                <div className="discovery-project-owner">
                  <span className="project-monogram">{project.name.slice(0, 1).toUpperCase()}</span>
                  <span>@{project.owner.username} / {project.name.toLowerCase().replaceAll(' ', '-')}</span>
                </div>
                <h2>{project.name}</h2>
                <p>{project.description || 'A public project changelog.'}</p>
              </Link>
              <div className="discovery-project-footer">
                <span>{project.current_version || 'VERSION NOT SET'}</span>
                <span>{project.updates_count} {project.updates_count === 1 ? 'update' : 'updates'}</span>
                {project.repo_url && <a href={project.repo_url} target="_blank" rel="noopener noreferrer">GitHub ↗</a>}
              </div>
            </article>
          ))}
        </div>
      ) : activeTab === 'developers' && developers.length ? (
        <div className="discovery-developers">
          {developers.map((developer) => (
            <DeveloperRow key={developer.user_id} developer={developer} showFollow />
          ))}
        </div>
      ) : (
        <div className="explore-empty">
          <span className="eyebrow">
            {activeTab === 'projects' ? 'NO PUBLIC PROJECTS' : 'NO DEVELOPERS FOUND'}
          </span>
          <h2>
            {activeTab === 'projects'
              ? query ? 'No projects match that search.' : 'Projects appear after their first public update.'
              : query ? 'No developers match that search.' : 'Search by username or name to find developers.'}
          </h2>
          <p>
            {activeTab === 'projects'
              ? query ? 'Try a project name, maintainer, or version.' : 'A project becomes discoverable when its owner publishes a changelog.'
              : query ? 'Try a different username or display name.' : 'Use the search bar above to discover people to follow.'}
          </p>
        </div>
      )}
    </div>
  );
}