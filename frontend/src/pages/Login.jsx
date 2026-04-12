import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const u = await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(u.role === 'customer' ? '/customer/menu' : '/app/dashboard');
    } catch {
      toast.error('Invalid credentials');
    } finally {
      setLoading(false);
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
