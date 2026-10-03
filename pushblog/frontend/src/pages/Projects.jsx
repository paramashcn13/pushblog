import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  API_BASE_URL,
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getGithubWebhookConfig,
  rotateGithubWebhookSecret,
} from '../api/client';
import { useAuth } from '../context/AuthContext';
import './Projects.css';

export default function Projects() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    repo_url: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [webhookProjectId, setWebhookProjectId] = useState(null);
  const [webhookConfig, setWebhookConfig] = useState(null);
  const [webhookError, setWebhookError] = useState('');
  const [webhookNotice, setWebhookNotice] = useState('');
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadProjects();
  }, [user, navigate]);

  const loadProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSubmitting(true);
    try {
      setPageError('');
      if (editingProject) {
        const res = await updateProject(editingProject.project_id, formData);
        setProjects(projects.map(p =>
          p.project_id === editingProject.project_id ? res.data : p
        ));
      } else {
        const res = await createProject(formData);
        setProjects([res.data, ...projects]);
      }
      resetForm();
    } catch (err) {
      setPageError(err.response?.data?.detail || 'Could not save this project.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      repo_url: project.repo_url || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm('Are you sure? Posts linked to this project will be unlinked.')) {
      return;
    }
    try {
      await deleteProject(projectId);
      setProjects(projects.filter(p => p.project_id !== projectId));
    } catch (err) {
      setPageError(err.response?.data?.detail || 'Could not delete this project.');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingProject(null);
    setFormData({ name: '', description: '', repo_url: '' });
  };

  const handleWebhookToggle = async (projectId) => {
    if (webhookProjectId === projectId) {
      setWebhookProjectId(null);
      setWebhookConfig(null);
      return;
    }
    setWebhookError('');
    setWebhookNotice('');
    setWebhookConfig(null);
    setWebhookProjectId(projectId);
    try {
      const res = await getGithubWebhookConfig(projectId);
      setWebhookConfig(res.data);
    } catch (err) {
      setWebhookError(err.response?.data?.detail || 'Could not load webhook settings.');
    }
  };

  const handleRotateSecret = async (projectId) => {
    if (!window.confirm('Rotate this secret? GitHub will stop delivering events until its webhook is updated.')) return;
    setWebhookError('');
    setWebhookNotice('');
    try {
      const res = await rotateGithubWebhookSecret(projectId);
      setWebhookConfig(res.data);
      setWebhookNotice('Secret rotated. Update it in GitHub now.');
    } catch (err) {
      setWebhookError(err.response?.data?.detail || 'Could not rotate the webhook secret.');
    }
  };

  const handleCopy = async (value, label) => {
    try {
      await navigator.clipboard.writeText(value);
      setWebhookNotice(`${label} copied.`);
    } catch {
      setWebhookError('Clipboard access is unavailable in this browser.');
    }
  };

  if (loading) {
    return (
      <div className="projects-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div>
          <span className="eyebrow"><span /> WORKSPACE / PROJECTS</span>
          <h1>Projects</h1>
          <p>Release history and webhook settings for your work.</p>
        </div>
        {!showForm && (
          <button
            className="add-project-btn"
            onClick={() => setShowForm(true)}
          >
            + New Project
          </button>
        )}
      </div>

      {showForm && (
        <div className="project-form-card">
          <h2>{editingProject ? 'Edit Project' : 'New Project'}</h2>
          <form onSubmit={handleSubmit} className="project-form">
            <div className="form-group">
              <label htmlFor="name">Project Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="My Awesome Project"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="What is this project about?"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label htmlFor="repo_url">Repository URL</label>
              <input
                type="url"
                id="repo_url"
                name="repo_url"
                value={formData.repo_url}
                onChange={handleChange}
                placeholder="https://github.com/username/repo"
              />
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={resetForm}>
                Cancel
              </button>
              <button type="submit" className="save-btn" disabled={submitting}>
                {submitting ? 'Saving...' : editingProject ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      {pageError && <p className="project-page-error" role="alert">{pageError}</p>}

      {projects.length === 0 ? (
        <div className="empty-state">
          <span className="eyebrow">NO PROJECTS</span>
          <h3>Your changelog starts with a project.</h3>
          <p>Connect a repository to group updates and configure release webhooks.</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <div key={project.project_id} className="project-card">
              <div className="project-card-header">
                <h3>{project.name}</h3>
                <div className="project-actions">
                  <button
                    className="edit-btn"
                    onClick={() => handleEdit(project)}
                  >
                    Edit
                  </button>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(project.project_id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              {project.description && (
                <p className="project-description">{project.description}</p>
              )}
              {project.repo_url && (
                <a
                  href={project.repo_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="repo-link"
                >
                  View Repository →
                </a>
              )}
              <div className="webhook-settings">
                <button
                  type="button"
                  className="webhook-toggle"
                  onClick={() => handleWebhookToggle(project.project_id)}
                >
                  {webhookProjectId === project.project_id ? 'Hide GitHub webhook' : 'GitHub webhook'}
                </button>
                {webhookProjectId === project.project_id && (
                  <div className="webhook-panel">
                    <p>In GitHub, add a repository webhook with content type <code>application/json</code> and select the <code>Release</code> event.</p>
                    {webhookConfig ? (
                      <>
                        <div className="webhook-value">
                          <span>Payload URL</span>
                          <code>{API_BASE_URL}{webhookConfig.webhook_path}</code>
                          <button type="button" onClick={() => handleCopy(`${API_BASE_URL}${webhookConfig.webhook_path}`, 'URL')}>Copy</button>
                        </div>
                        <div className="webhook-value">
                          <span>Secret</span>
                          <code>{webhookConfig.webhook_secret}</code>
                          <button type="button" onClick={() => handleCopy(webhookConfig.webhook_secret, 'Secret')}>Copy</button>
                        </div>
                        <button type="button" className="rotate-secret-btn" onClick={() => handleRotateSecret(project.project_id)}>
                          Rotate secret
                        </button>
                      </>
                    ) : !webhookError ? <p>Loading webhook settings...</p> : null}
                    {webhookNotice && <p className="webhook-notice">{webhookNotice}</p>}
                    {webhookError && <p className="webhook-error">{webhookError}</p>}
                  </div>
                )}
              </div>
              <div className="project-meta">
                Created {new Date(project.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
