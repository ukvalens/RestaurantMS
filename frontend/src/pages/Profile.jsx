import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ username: user?.username || '', email: user?.email || '' });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(user?.avatar_url || null);
  const [file, setFile] = useState(null);
  const fileRef = useRef();

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) { toast.error('Max 2MB'); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('avatar', file);
    try {
      const res = await api.post('/auth/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser({ avatar_url: res.data.avatar_url });
      setPreview(res.data.avatar_url);
      setFile(null);
      toast.success('Picture updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put('/auth/profile', form);
      updateUser({ username: res.data.username, email: res.data.email });
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">My Profile</h1>
      <div className="card" style={{ maxWidth: 480 }}>

        {/* Picture */}
        <div className="profile-pic-section">
          <div className="profile-pic-wrapper" style={{ cursor: 'pointer', position: 'relative' }} onClick={() => fileRef.current.click()}>
            {preview
              ? <img src={preview} alt="profile" className="profile-pic" />
              : <div className="profile-pic-placeholder">👤</div>
            }
            <div style={{ position: 'absolute', bottom: 0, right: 0, background: 'var(--primary)', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: 'white' }}>✏️</div>
          </div>
          <div>
            <p style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{user?.username}</p>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            <button className="btn-secondary btn-sm" onClick={() => fileRef.current.click()}>📁 Choose Photo</button>
            {file && (
              <button className="btn-primary btn-sm" style={{ marginLeft: '0.5rem' }} onClick={handleUpload} disabled={uploading}>
                {uploading ? 'Uploading...' : '⬆ Upload'}
              </button>
            )}
            {preview && !file && (
              <button className="btn-sm" style={{ marginLeft: '0.5rem', background: 'var(--danger)', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', padding: '0.3rem 0.6rem' }}
                onClick={async () => { await api.post('/auth/avatar/remove').catch(() => {}); updateUser({ avatar_url: null }); setPreview(null); }}>
                🗑 Remove
              </button>
            )}
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>Click photo to change · JPG, PNG · Max 2MB</p>
          </div>
        </div>

        <hr className="dropdown-divider" style={{ margin: '1.25rem 0' }} />

        {/* Info */}
        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-field">
            <label className="form-label">Username</label>
            <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
          </div>
          <div className="form-field">
            <label className="form-label">Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-field">
            <label className="form-label">Role</label>
            <input value={user?.role} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }} />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>

        </form>
      </div>
    </div>
  );
};

export default Profile;
