import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split">
        <div className="auth-info">
          <div className="auth-info-inner">
            <div className="auth-info-logo">
              <i className="fa-solid fa-utensils" />
            </div>
            <h2>RestaurantMS</h2>
            <p>Your all-in-one platform for managing tables, orders, reservations, and payments seamlessly.</p>
            <ul className="auth-features">
              <li><i className="fa-solid fa-chair" style={{ marginRight: '0.5rem' }} />Table &amp; reservation management</li>
              <li><i className="fa-solid fa-cart-shopping" style={{ marginRight: '0.5rem' }} />Real-time order tracking</li>
              <li><i className="fa-solid fa-utensils" style={{ marginRight: '0.5rem' }} />Menu &amp; inventory control</li>
              <li><i className="fa-solid fa-credit-card" style={{ marginRight: '0.5rem' }} />Integrated payments</li>
            </ul>
          </div>
        </div>
        <div className="auth-card">
          <h1><i className="fa-solid fa-utensils" style={{ marginRight: '0.5rem' }} />RestaurantMS</h1>
          <h2>Sign In</h2>
          <form onSubmit={handleSubmit}>
            <div className="auth-input-group">
              <span className="auth-input-icon"><i className="fa-solid fa-envelope" /></span>
              <input type="email" placeholder="Email address" value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="auth-input-group">
              <span className="auth-input-icon"><i className="fa-solid fa-lock" /></span>
              <input type="password" placeholder="Password" value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Signing in...' : <>Sign In <i className="fa-solid fa-arrow-right" /></>}
            </button>
            {error && (
              <div style={{ color: '#ef4444', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: '0.4rem' }} />{error}
              </div>
            )}
          </form>
          <div className="auth-links">
            <Link to="/register">Don't have an account? <strong>Register</strong></Link>
            <Link to="/forgot-password">Forgot password?</Link>
            <Link to="/"><i className="fa-solid fa-arrow-left" style={{ marginRight: '0.3rem' }} />Back to Home</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
