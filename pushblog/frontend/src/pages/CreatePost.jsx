import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPost, getProjects, uploadFile, getImageUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import './CreatePost.css';

const changeTypes = [
  { value: 'feature', label: 'Feature', color: '#10b981' },
  { value: 'bugfix', label: 'Bug Fix', color: '#ef4444' },
  { value: 'improvement', label: 'Improvement', color: '#3b82f6' },
  { value: 'release', label: 'Release', color: '#8b5cf6' },
  { value: 'update', label: 'Update', color: '#f59e0b' },
];

export default function CreatePost() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    version: '',
    change_type: '',
    project_id: '',
    visibility: 'public',
  });
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadedImages = [];
      for (const file of files) {
        const res = await uploadFile(file);
        uploadedImages.push({
          media_url: res.data.url,
          media_type: 'image',
          caption: '',
        });
      }
      setImages([...images, ...uploadedImages]);
    } catch (err) {
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    setSubmitting(true);
    try {
      const postData = {
        ...formData,
        project_id: formData.project_id ? parseInt(formData.project_id) : null,
        media: images,
      };
      const res = await createPost(postData);
      navigate(`/post/${res.data.post_id}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-post-page">
      <div className="create-post-card">
        <h1>Create New Post</h1>
        <p className="subtitle">Share your latest update with the community</p>

        <form onSubmit={handleSubmit} className="create-form">
          {error && <div className="form-error">{error}</div>}

          <div className="form-row">
            <div className="form-group flex-2">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="What did you ship?"
                required
              />
            </div>
            <div className="form-group flex-1">
              <label htmlFor="version">Version</label>
              <input
                type="text"
                id="version"
                name="version"
                value={formData.version}
                onChange={handleChange}
                placeholder="v1.0.0"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="project_id">Project</label>
              <select
                id="project_id"
                name="project_id"
                value={formData.project_id}
                onChange={handleChange}
              >
                <option value="">No project</option>
                {projects.map((project) => (
                  <option key={project.project_id} value={project.project_id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group flex-1">
              <label htmlFor="change_type">Change Type</label>
              <select
                id="change_type"
                name="change_type"
                value={formData.change_type}
                onChange={handleChange}
              >
                <option value="">Select type</option>
                {changeTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="content">Content *</label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Describe your changes, what's new, what you learned..."
              rows={8}
              required
            />
          </div>

          <div className="form-group">
            <label>Screenshots</label>
            <div className="image-upload-area">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploading}
                id="image-input"
              />
              <label htmlFor="image-input" className="upload-label">
                {uploading ? 'Uploading...' : '+ Add Images'}
              </label>
            </div>
            {images.length > 0 && (
              <div className="image-preview-grid">
                {images.map((img, index) => (
                  <div key={index} className="image-preview">
                    <img src={getImageUrl(img.media_url)} alt="" />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={() => removeImage(index)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Visibility</label>
            <div className="radio-group">
              <label className="radio-option">
                <input
                  type="radio"
                  name="visibility"
                  value="public"
                  checked={formData.visibility === 'public'}
                  onChange={handleChange}
                />
                <span>Public</span>
              </label>
              <label className="radio-option">
                <input
                  type="radio"
                  name="visibility"
                  value="private"
                  checked={formData.visibility === 'private'}
                  onChange={handleChange}
                />
                <span>Private</span>
              </label>
            </div>
          </div>

          <button type="submit" className="submit-btn" disabled={submitting}>
            {submitting ? 'Publishing...' : 'Publish Post'}
          </button>
        </form>
      </div>
    </div>
  );
}
