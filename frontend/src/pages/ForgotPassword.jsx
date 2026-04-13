import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setSent(true);
      toast.success('Reset link sent!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-split">
        <div className="auth-info">
          <div className="auth-info-inner">
            <div className="auth-info-logo"><i className="fa-solid fa-utensils" /></div>
            <h2>RestaurantMS</h2>
            <p>Don't worry — it happens to the best of us. Enter your email and we'll send you a secure reset link.</p>
            <ul className="auth-features">
              <li><i className="fa-solid fa-shield-halved" style={{ marginRight: '0.5rem' }} />Secure reset link</li>
              <li><i className="fa-solid fa-clock" style={{ marginRight: '0.5rem' }} />Link expires in 1 hour</li>
              <li><i className="fa-solid fa-envelope" style={{ marginRight: '0.5rem' }} />Sent to your inbox</li>
              <li><i className="fa-solid fa-lock" style={{ marginRight: '0.5rem' }} />Your data stays safe</li>
            </ul>
          </div>
        </div>
        <div className="auth-card">
          <h1><i className="fa-solid fa-utensils" style={{ marginRight: '0.5rem' }} />RestaurantMS</h1>
          <h2>Forgot Password</h2>
          {sent ? (
            <div className="reset-success">
              <i className="fa-solid fa-circle-check" style={{ fontSize: '2.5rem', color: '#059669', marginBottom: '0.75rem' }} />
              <p>A reset link has been sent to <strong>{email}</strong>.</p>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Check your inbox and follow the instructions. The link expires in 1 hour.</p>
              <Link to="/login" className="auth-submit-btn" style={{ display: 'block', textAlign: 'center', marginTop: '1rem', textDecoration: 'none' }}>
                <i className="fa-solid fa-arrow-left" style={{ marginRight: '0.4rem' }} />Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="reset-hint">Enter your registered email address and we'll send you a password reset link.</p>
              <div className="auth-input-group">
                <span className="auth-input-icon"><i className="fa-solid fa-envelope" /></span>
                <input type="email" placeholder="Email address" value={email}
                  onChange={e => setEmail(e.target.value)} required />
              </div>
              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading
                  ? <><i className="fa-solid fa-spinner fa-spin" style={{ marginRight: '0.4rem' }} />Sending...</>
                  : <><i className="fa-solid fa-paper-plane" style={{ marginRight: '0.4rem' }} />Send Reset Link</>
                }
              </button>
            </form>
          )}
          {!sent && (
            <div className="auth-links">
              <Link to="/login"><i className="fa-solid fa-arrow-left" style={{ marginRight: '0.3rem' }} />Back to Sign In</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
