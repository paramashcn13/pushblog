import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProjects, createProject, updateProject, deleteProject } from '../api/client';
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
      console.error('Failed to save project:', err);
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
      console.error('Failed to delete project:', err);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingProject(null);
    setFormData({ name: '', description: '', repo_url: '' });
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
          <h1>My Projects</h1>
          <p>Organize your posts by project</p>
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

      {projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📁</div>
          <h3>No projects yet</h3>
          <p>Create a project to organize your devlogs</p>
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
