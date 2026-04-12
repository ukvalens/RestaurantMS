import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

const Register = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'customer' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.email.includes('@')) e.email = 'Enter a valid email address';
    if (form.password.length < 6) e.password = ['At least 6 characters'];
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setLoading(true);
    try {
      await api.post('/auth/register', {
        ...form,
        email: form.email.trim().toLowerCase(),
        username: form.username.trim(),
        password: form.password.trim()
      });
      toast.success('Account created! Please login.');
      navigate('/login');
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Registration failed';
      toast.error(typeof msg === 'string' ? msg : 'Registration failed');
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
            <h2>Join RestaurantMS</h2>
            <p>Create your account and get instant access to a smarter way of managing your restaurant experience.</p>
            <ul className="auth-features">
              <li>🪑 Book & manage reservations</li>
              <li>🛒 Place and track orders</li>
              <li>🍽️ Browse our full menu</li>
              <li>💳 Fast & secure payments</li>
            </ul>
          </div>
        </div>
        <div className="auth-card">
          <h1>🍴 RestaurantMS</h1>
          <h2>Create Account</h2>
          <form onSubmit={handleSubmit}>
            <div className="auth-input-group">
              <span className="auth-input-icon">👤</span>
              <input placeholder="Username" value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div className="auth-input-group">
              <span className="auth-input-icon">✉️</span>
              <input type="email" placeholder="Email address" value={form.email}
                onChange={e => { setForm({ ...form, email: e.target.value }); setErrors(p => ({ ...p, email: null })); }} required />
            </div>
            {errors.email && <span className="field-error">{errors.email}</span>}
            <div className="auth-input-group">
              <span className="auth-input-icon">🔒</span>
              <input type="password" placeholder="Password" value={form.password}
                onChange={e => { setForm({ ...form, password: e.target.value }); setErrors(p => ({ ...p, password: null })); }} required />
            </div>
            {errors.password && (
              <ul className="password-rules">
                {errors.password.map(r => <li key={r}>✗ {r}</li>)}
              </ul>
            )}
            <div className="auth-input-group">
              <span className="auth-input-icon">🏷️</span>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="customer">Customer</option>
                <option value="waiter">Waiter</option>
                <option value="chef">Chef</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>
          <div className="auth-links">
            <Link to="/login">Already have an account? <strong>Sign In</strong></Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
