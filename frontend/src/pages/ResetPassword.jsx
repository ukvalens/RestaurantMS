import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      toast.success('Password reset successful!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Invalid or expired token');
    } finally {
      setLoading(false);
    }
  };

  if (!token) return (
    <div className="auth-page">
      <div className="auth-split">
        <div className="auth-info">
          <div className="auth-info-inner">
            <div className="auth-info-logo"><i className="fa-solid fa-utensils" /></div>
            <h2>RestaurantMS</h2>
          </div>
        </div>
        <div className="auth-card">
          <h1><i className="fa-solid fa-utensils" style={{ marginRight: '0.5rem' }} />RestaurantMS</h1>
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '2.5rem', color: '#ef4444', marginBottom: '0.75rem', display: 'block' }} />
            <p style={{ color: '#ef4444', fontWeight: 600, marginBottom: '0.5rem' }}>Invalid reset link</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>This link is missing or has expired. Please request a new one.</p>
          </div>
          <div className="auth-links">
            <Link to="/forgot-password"><i className="fa-solid fa-rotate-right" style={{ marginRight: '0.3rem' }} />Request New Link</Link>
            <Link to="/login"><i className="fa-solid fa-arrow-left" style={{ marginRight: '0.3rem' }} />Back to Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-split">
        <div className="auth-info">
          <div className="auth-info-inner">
            <div className="auth-info-logo"><i className="fa-solid fa-utensils" /></div>
            <h2>RestaurantMS</h2>
            <p>Create a strong new password to keep your account secure.</p>
            <ul className="auth-features">
              <li><i className="fa-solid fa-check" style={{ marginRight: '0.5rem' }} />At least 6 characters</li>
              <li><i className="fa-solid fa-check" style={{ marginRight: '0.5rem' }} />Both passwords must match</li>
              <li><i className="fa-solid fa-shield-halved" style={{ marginRight: '0.5rem' }} />Stored securely encrypted</li>
            </ul>
          </div>
        </div>
        <div className="auth-card">
          <h1><i className="fa-solid fa-utensils" style={{ marginRight: '0.5rem' }} />RestaurantMS</h1>
          <h2>Set New Password</h2>
          <form onSubmit={handleSubmit}>
            <div className="auth-input-group">
              <span className="auth-input-icon"><i className="fa-solid fa-lock" /></span>
              <input type="password" placeholder="New password (min. 6 characters)" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </div>
            <div className="auth-input-group">
              <span className="auth-input-icon"><i className="fa-solid fa-lock" /></span>
              <input type="password" placeholder="Confirm new password" value={form.confirm}
                onChange={e => setForm({ ...form, confirm: e.target.value })} required minLength={6} />
            </div>
            {form.confirm && form.password !== form.confirm && (
              <p style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: '-0.25rem' }}>
                <i className="fa-solid fa-xmark" style={{ marginRight: '0.3rem' }} />Passwords do not match
              </p>
            )}
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading
                ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.4rem' }} />Resetting...</>
                : <><i className="fa-solid fa-key" style={{ marginRight: '0.4rem' }} />Reset Password</>
              }
            </button>
          </form>
          <div className="auth-links">
            <Link to="/login"><i className="fa-solid fa-arrow-left" style={{ marginRight: '0.3rem' }} />Back to Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
