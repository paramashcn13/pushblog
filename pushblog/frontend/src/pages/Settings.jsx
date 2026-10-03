import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, updateProfile } from '../api/client';
import { useAuth } from '../context/AuthContext';
import './Settings.css';

const emptyProfile = {
  display_name: '',
  bio: '',
  avatar_url: '',
  github_url: '',
  website_url: '',
  is_private: false,
};

export default function Settings() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    if (authLoading) return () => { cancelled = true; };
    if (!user) {
      navigate('/login');
      return () => { cancelled = true; };
    }

    getUser(user.username)
      .then((res) => {
        if (!cancelled) setFormData({ ...emptyProfile, ...res.data.profile });
      })
      .catch(() => {
        if (!cancelled) setError('Could not load your profile.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [authLoading, user, navigate]);

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
    setError('');
    setNotice('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await updateProfile(formData);
      setNotice('Profile changes saved.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not save your profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="settings-page"><p className="settings-status">Loading profile...</p></div>;
  }

  return (
    <div className="settings-page">
      <header className="settings-heading">
        <span className="eyebrow"><span /> ACCOUNT / PROFILE</span>
        <h1>Profile settings</h1>
        <p>Keep your developer profile current across your changelog.</p>
      </header>
      <form className="settings-form" onSubmit={handleSubmit}>
        {error && <p className="settings-message settings-error" role="alert">{error}</p>}
        {notice && <p className="settings-message settings-success" role="status">{notice}</p>}
        <label>
          Display name
          <input name="display_name" value={formData.display_name || ''} onChange={handleChange} maxLength={100} />
        </label>
        <label>
          Bio
          <textarea name="bio" value={formData.bio || ''} onChange={handleChange} rows={4} maxLength={500} />
        </label>
        <label>
          Avatar image URL
          <input type="url" name="avatar_url" value={formData.avatar_url || ''} onChange={handleChange} />
        </label>
        <label>
          GitHub profile URL
          <input type="url" name="github_url" value={formData.github_url || ''} onChange={handleChange} placeholder="https://github.com/username" />
        </label>
        <label>
          Website URL
          <input type="url" name="website_url" value={formData.website_url || ''} onChange={handleChange} />
        </label>
        <label className="settings-privacy-toggle">
          <input
            type="checkbox"
            name="is_private"
            checked={Boolean(formData.is_private)}
            onChange={(event) => setFormData({ ...formData, is_private: event.target.checked })}
          />
          <span>
            <strong>Private account</strong>
            <small>New followers must be approved before they can see followers-only posts.</small>
          </span>
        </label>
        <div className="settings-actions">
          <button type="button" className="settings-cancel" onClick={() => navigate(`/profile/${user.username}`)}>Cancel</button>
          <button type="submit" className="settings-save" disabled={saving}>{saving ? 'Saving...' : 'Save profile'}</button>
        </div>
      </form>
    </div>
  );
}