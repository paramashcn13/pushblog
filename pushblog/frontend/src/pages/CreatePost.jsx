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
  const [submitting, setSubmitting] = useState('');
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
    } catch {
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
    const status = e.nativeEvent.submitter?.value || 'published';
    if (!formData.title.trim() || !formData.content.trim()) {
      if (status === 'draft' && !formData.content.trim()) {
        setError('Add some notes before saving this draft.');
      } else {
        setError('Title and content are required');
      }
      return;
    }

    setSubmitting(status);
    try {
      const postData = {
        ...formData,
        project_id: formData.project_id ? parseInt(formData.project_id) : null,
        change_type: formData.change_type || null,
        status,
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
      <header className="composer-heading">
        <div>
          <span className="eyebrow"><span /> WRITE / NEW ENTRY</span>
          <h1>New changelog</h1>
          <p>Give the change a version, a reason, and enough context to matter.</p>
        </div>
        <span className="composer-state">UNPUBLISHED</span>
      </header>

      <div className="composer-layout">
        <form onSubmit={handleSubmit} className="create-form">
          {error && <div className="form-error" role="alert">{error}</div>}

          <div className="form-row">
            <div className="form-group flex-2">
              <label htmlFor="title">Entry title</label>
              <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} placeholder="What changed?" required />
            </div>
            <div className="form-group flex-1">
              <label htmlFor="version">Version</label>
              <input type="text" id="version" name="version" value={formData.version} onChange={handleChange} placeholder="v2.5.0" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="project_id">Project</label>
              <select id="project_id" name="project_id" value={formData.project_id} onChange={handleChange}>
                <option value="">No project</option>
                {projects.map((project) => <option key={project.project_id} value={project.project_id}>{project.name}</option>)}
              </select>
            </div>
            <div className="form-group flex-1">
              <label htmlFor="change_type">Change type</label>
              <select id="change_type" name="change_type" value={formData.change_type} onChange={handleChange}>
                <option value="">Choose a type</option>
                {changeTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group editor-group">
            <label htmlFor="content">Release notes</label>
            <textarea id="content" name="content" value={formData.content} onChange={handleChange} placeholder={'Describe the change.\n\nWhat does this make possible for someone using your project?'} rows={14} required />
            <span className="editor-hint">Plain text with line breaks is supported.</span>
          </div>

          <div className="form-group">
            <label>Screenshots and media</label>
            <div className="image-upload-area">
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} id="image-input" />
              <label htmlFor="image-input" className="upload-label">{uploading ? 'Uploading...' : 'Attach images'}</label>
            </div>
            {images.length > 0 && (
              <div className="image-preview-grid">
                {images.map((img, index) => (
                  <div key={img.media_url} className="image-preview">
                    <img src={getImageUrl(img.media_url)} alt={img.caption || `Attachment ${index + 1}`} />
                    <button type="button" className="remove-image" onClick={() => removeImage(index)} aria-label="Remove attachment">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <fieldset className="visibility-fieldset">
            <legend>Visibility</legend>
            <label className="radio-option">
              <input type="radio" name="visibility" value="public" checked={formData.visibility === 'public'} onChange={handleChange} />
              <span>Public</span>
            </label>
            <label className="radio-option">
              <input type="radio" name="visibility" value="private" checked={formData.visibility === 'private'} onChange={handleChange} />
              <span>Private</span>
            </label>
          </fieldset>

          <div className="composer-actions">
            <button type="submit" name="status" value="draft" className="save-draft-btn" disabled={Boolean(submitting) || uploading}>
              {submitting === 'draft' ? 'Saving draft...' : 'Save draft'}
            </button>
            <button type="submit" name="status" value="published" className="submit-btn" disabled={Boolean(submitting) || uploading}>
              {submitting === 'published' ? 'Publishing...' : 'Publish update'}
            </button>
          </div>
        </form>

        <aside className="composer-preview" aria-live="polite">
          <div className="preview-heading"><span className="eyebrow">LIVE PREVIEW</span><span>CHANGELOG</span></div>
          <div className="preview-entry">
            <div className="preview-meta">
              <code>{formData.version || 'UNVERSIONED'}</code>
              {formData.change_type && <span className={`preview-type type-${formData.change_type}`}>{formData.change_type.toUpperCase()}</span>}
            </div>
            {formData.project_id && <p className="preview-project">{projects.find((project) => String(project.project_id) === formData.project_id)?.name}</p>}
            <h2>{formData.title || 'Your update title'}</h2>
            <p className="preview-content">{formData.content || 'Your release notes will appear here as you write.'}</p>
            {images[0] && <img className="preview-image" src={getImageUrl(images[0].media_url)} alt="First attachment preview" />}
          </div>
          <p className="preview-footnote">A clear history is useful long after the release ships.</p>
        </aside>
      </div>
    </div>
  );
}
