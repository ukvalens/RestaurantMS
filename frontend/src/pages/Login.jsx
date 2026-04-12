import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import toast from 'react-hot-toast';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const u = await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(u.role === 'customer' ? '/customer/menu' : '/app/dashboard');
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message || 'Invalid credentials';
      setError(errMsg);
      console.error('Login error:', errMsg, err);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const testBackendConnection = async () => {
    try {
      const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
      await api.get(backendUrl ? `${backendUrl}/health` : '/health');
      toast.success('✅ Backend connected');
    } catch (err) {
      toast.error('❌ Backend connection failed');
      console.error('Backend test error:', err);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split">
        <div className="auth-info">
          <div className="auth-info-inner">
            <div className="auth-info-logo">🍴</div>
            <h2>RestaurantMS</h2>
            <p>Your all-in-one platform for managing tables, orders, reservations, and payments seamlessly.</p>
            <ul className="auth-features">
              <li>🪑 Table & reservation management</li>
              <li>🛒 Real-time order tracking</li>
              <li>🍽️ Menu & inventory control</li>
              <li>💳 Integrated payments</li>
            </ul>
          </div>
        </div>
        <div className="auth-card">
          <h1>🍴 RestaurantMS</h1>
          <h2>Sign In</h2>
          <form onSubmit={handleSubmit}>
            <div className="auth-input-group">
              <span className="auth-input-icon">✉️</span>
              <input type="email" placeholder="Email address" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="auth-input-group">
              <span className="auth-input-icon">🔒</span>
              <input type="password" placeholder="Password" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? <span className="auth-btn-loading">Signing in...</span> : 'Sign In →'}
            </button>
            {error && <div style={{ color: '#ef4444', fontSize: '0.9rem', marginTop: '0.5rem' }}>⚠️ {error}</div>}
            <button type="button" className="auth-submit-btn" style={{ marginTop: '0.5rem', background: '#6366f1', fontSize: '0.85rem' }} onClick={testBackendConnection}>
              🔧 Test Backend
            </button>
          </form>
          <div className="auth-links">
            <Link to="/register">Don't have an account? <strong>Register</strong></Link>
            <Link to="/forgot-password">Forgot password?</Link>
            <Link to="/">← Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
