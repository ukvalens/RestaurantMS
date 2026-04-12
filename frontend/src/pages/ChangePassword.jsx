import { useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const ChangePassword = () => {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirm) return toast.error('Passwords do not match');
    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      toast.success('Password changed successfully!');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Change Password</h1>
      <div className="card" style={{ maxWidth: 450 }}>
        <form onSubmit={handleSubmit} className="form-grid">
          <div>
            <label className="form-label">Current Password</label>
            <input type="password" value={form.currentPassword}
              onChange={e => setForm({ ...form, currentPassword: e.target.value })} required />
          </div>
          <div>
            <label className="form-label">New Password</label>
            <input type="password" value={form.newPassword}
              onChange={e => setForm({ ...form, newPassword: e.target.value })} required minLength={6} />
          </div>
          <div>
            <label className="form-label">Confirm New Password</label>
            <input type="password" value={form.confirm}
              onChange={e => setForm({ ...form, confirm: e.target.value })} required minLength={6} />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
