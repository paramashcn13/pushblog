import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getPost, toggleLike, deletePost, updatePost, getImageUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import CommentSection from '../components/CommentSection';
import LikesPopover from '../components/LikesPopover';
import './PostDetail.css';

const changeTypeColors = {
  feature: '#10b981',
  bugfix: '#ef4444',
  improvement: '#3b82f6',
  release: '#8b5cf6',
  update: '#f59e0b',
};

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [draftEdits, setDraftEdits] = useState({
    title: '',
    version: '',
    content: '',
    release_impact: {
      breaking_changes: false,
      affected_versions: '',
      migration_steps: '',
      upgrade_minutes: '',
    },
  });

  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    try {
      const res = await getPost(id);
      setPost(res.data);
      setDraftEdits({
        title: res.data.title,
        version: res.data.version || '',
        content: res.data.content,
        release_impact: {
          breaking_changes: Boolean(res.data.release_impact?.breaking_changes),
          affected_versions: res.data.release_impact?.affected_versions || '',
          migration_steps: res.data.release_impact?.migration_steps || '',
          upgrade_minutes: res.data.release_impact?.upgrade_minutes || '',
        },
      });
      setIsLiked(res.data.is_liked);
      setLikesCount(res.data.likes_count);
    } catch (err) {
      console.error('Failed to load post:', err);
      if (err.response?.status === 404) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await toggleLike(post.post_id);
      setIsLiked(res.data.liked);
      setLikesCount(res.data.likes_count);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }
    try {
      await deletePost(post.post_id);
      navigate('/');
    } catch (err) {
      console.error('Failed to delete post:', err);
    }
  };

  const handlePublish = async () => {
    setPublishing(true);
    setPublishError('');
    try {
      const res = await updatePost(post.post_id, getDraftPayload('published'));
      setPost(res.data);
    } catch (err) {
      setPublishError(err.response?.data?.detail || 'Failed to publish draft.');
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveDraft = async () => {
    setSavingDraft(true);
    setPublishError('');
    try {
      const res = await updatePost(post.post_id, getDraftPayload('draft'));
      setPost(res.data);
    } catch (err) {
      setPublishError(err.response?.data?.detail || 'Failed to save draft.');
    } finally {
      setSavingDraft(false);
    }
  };

  const getDraftPayload = (status) => ({
    title: draftEdits.title,
    version: draftEdits.version || null,
    content: draftEdits.content,
    status,
    release_impact: {
      ...draftEdits.release_impact,
      affected_versions: draftEdits.release_impact.affected_versions || null,
      migration_steps: draftEdits.release_impact.migration_steps || null,
      upgrade_minutes: draftEdits.release_impact.upgrade_minutes
        ? Number(draftEdits.release_impact.upgrade_minutes)
        : null,
    },
  });

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="post-detail-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-detail-page">
        <div className="not-found">Post not found</div>
      </div>
    );
  }

  const impact = post.release_impact;
  const hasImpact = impact && (
    impact.breaking_changes || impact.affected_versions ||
    impact.migration_steps || impact.upgrade_minutes
  );

  return (
    <div className="post-detail-page">
      <article className="post-detail-card">
        <header className="post-detail-header">
          <div className="post-meta-row">
            <Link to={`/profile/${post.author.username}`} className="author-link">
              <div className="author-avatar">
                {post.author.username[0].toUpperCase()}
              </div>
              <div className="author-info">
                <span className="author-name">{post.author.username}</span>
                <span className="post-date">{formatDate(post.created_at)}</span>
              </div>
            </Link>

            <div className="post-badges">
              {post.version && (
                <span className="version-badge">{post.version}</span>
              )}
              {post.change_type && (
                <span
                  className="change-type-badge"
                  style={{ backgroundColor: changeTypeColors[post.change_type] }}
                >
                  {post.change_type}
                </span>
              )}
            </div>
          </div>

          <h1 className="post-title">{post.title}</h1>

          {post.release_compare_url && (
            <a
              className="release-compare-link"
              href={post.release_compare_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Compare with previous release
            </a>
          )}

          {post.status === 'draft' && (
            <div className="draft-review">
              <span>Draft</span>
              {user?.user_id === post.user_id && (
                <>
                  <label>
                    Title
                    <input
                      value={draftEdits.title}
                      onChange={(event) => setDraftEdits({ ...draftEdits, title: event.target.value })}
                      maxLength={200}
                    />
                  </label>
                  <label>
                    Version
                    <input
                      value={draftEdits.version}
                      onChange={(event) => setDraftEdits({ ...draftEdits, version: event.target.value })}
                      maxLength={50}
                    />
                  </label>
                  <label>
                    Release notes
                    <textarea
                      value={draftEdits.content}
                      onChange={(event) => setDraftEdits({ ...draftEdits, content: event.target.value })}
                      rows={10}
                    />
                  </label>
                  {post.change_type === 'release' && (
                    <fieldset className="impact-editor">
                      <legend>Upgrade impact</legend>
                      <label className="impact-breaking-toggle">
                        <input
                          type="checkbox"
                          checked={draftEdits.release_impact.breaking_changes}
                          onChange={(event) => setDraftEdits({
                            ...draftEdits,
                            release_impact: {
                              ...draftEdits.release_impact,
                              breaking_changes: event.target.checked,
                            },
                          })}
                        />
                        Includes breaking changes
                      </label>
                      <label>
                        Affected versions
                        <input
                          value={draftEdits.release_impact.affected_versions}
                          onChange={(event) => setDraftEdits({
                            ...draftEdits,
                            release_impact: {
                              ...draftEdits.release_impact,
                              affected_versions: event.target.value,
                            },
                          })}
                          placeholder="For example, versions before 2.0"
                        />
                      </label>
                      <label>
                        Migration steps
                        <textarea
                          value={draftEdits.release_impact.migration_steps}
                          onChange={(event) => setDraftEdits({
                            ...draftEdits,
                            release_impact: {
                              ...draftEdits.release_impact,
                              migration_steps: event.target.value,
                            },
                          })}
                          rows={4}
                        />
                      </label>
                      <label>
                        Estimated upgrade time (minutes)
                        <input
                          type="number"
                          min="1"
                          max="1440"
                          value={draftEdits.release_impact.upgrade_minutes}
                          onChange={(event) => setDraftEdits({
                            ...draftEdits,
                            release_impact: {
                              ...draftEdits.release_impact,
                              upgrade_minutes: event.target.value,
                            },
                          })}
                        />
                      </label>
                    </fieldset>
                  )}
                  <div className="draft-review-actions">
                    <button type="button" onClick={handleSaveDraft} disabled={savingDraft || publishing}>
                      {savingDraft ? 'Saving...' : 'Save draft'}
                    </button>
                    <button type="button" onClick={handlePublish} disabled={publishing || savingDraft || !draftEdits.title.trim() || !draftEdits.content.trim()}>
                      {publishing ? 'Publishing...' : 'Publish post'}
                    </button>
                  </div>
                </>
              )}
              {publishError && <p>{publishError}</p>}
            </div>
          )}

          {post.project && (
            <div className="project-info">
              <span className="project-label">Project:</span>
              <span className="project-name">{post.project.name}</span>
              {post.project.repo_url && (
                <a
                  href={post.project.repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="repo-link"
                >
                  View Repo →
                </a>
              )}
            </div>
          )}
        </header>

        {post.status === 'draft' && user?.user_id === post.user_id ? (
          <div className="post-content">
            {draftEdits.content.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        ) : <div className="post-content">
          {post.content.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>}

        {post.status === 'published' && hasImpact && (
          <section className="release-impact">
            <h2>Upgrade impact</h2>
            {impact.breaking_changes && <strong className="breaking-change-flag">Breaking changes</strong>}
            {impact.affected_versions && (
              <div>
                <h3>Affected versions</h3>
                <p>{impact.affected_versions}</p>
              </div>
            )}
            {impact.migration_steps && (
              <div>
                <h3>Migration steps</h3>
                <p className="migration-steps">{impact.migration_steps}</p>
              </div>
            )}
            {impact.upgrade_minutes && <p>Estimated upgrade time: {impact.upgrade_minutes} minutes</p>}
          </section>
        )}

        {post.media && post.media.length > 0 && (
          <div className="post-media-gallery">
            {post.media.map((media, index) => (
              <div
                key={media.media_id}
                className="media-item"
                onClick={() => setSelectedImage(media)}
              >
                <img
                  src={getImageUrl(media.media_url)}
                  alt={media.caption || `Screenshot ${index + 1}`}
                />
                {media.caption && (
                  <span className="media-caption">{media.caption}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {post.status === 'published' && <div className="post-actions">
          <button
            className={`action-btn like-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleLike}
          >
            <span>{isLiked ? '❤️' : '🤍'}</span>
          </button>
          <LikesPopover postId={post.post_id} likesCount={likesCount} />

          {user && user.user_id === post.user_id && (
            <button className="action-btn delete-btn" onClick={handleDelete}>
              Delete Post
            </button>
          )}
        </div>}

        {post.status === 'published' && <CommentSection postId={post.post_id} />}
      </article>

      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <button className="close-modal">×</button>
          <img
            src={getImageUrl(selectedImage.media_url)}
            alt={selectedImage.caption || 'Full size'}
          />
        </div>
      )}
    </div>
  );
}
