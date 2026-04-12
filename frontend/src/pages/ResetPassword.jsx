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
      <div className="auth-card">
        <h1>🍴 RestaurantMS</h1>
        <p style={{ textAlign: 'center', color: 'red' }}>Invalid reset link.</p>
        <p><Link to="/login">← Back to Sign In</Link></p>
      </div>
    </div>
  );

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>🍴 RestaurantMS</h1>
        <h2>Reset Password</h2>
        <form onSubmit={handleSubmit}>
          <input type="password" placeholder="New Password" value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })} required minLength={6} />
          <input type="password" placeholder="Confirm New Password" value={form.confirm}
            onChange={e => setForm({ ...form, confirm: e.target.value })} required minLength={6} />
          <button type="submit" disabled={loading}>{loading ? 'Resetting...' : 'Reset Password'}</button>
        </form>
        <p><Link to="/login">← Back to Sign In</Link></p>
      </div>
    </div>
  );
};

export default ResetPassword;
