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
      <div className="auth-card">
        <h1>🍴 RestaurantMS</h1>
        <h2>Forgot Password</h2>
        {sent ? (
          <div className="reset-success">
            <p>✅ A reset link has been sent to <strong>{email}</strong>. Check your inbox.</p>
            <Link to="/login">Back to Sign In</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="reset-hint">Enter your email and we'll send you a reset link.</p>
            <input type="email" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)} required />
            <button type="submit" disabled={loading}>{loading ? 'Sending...' : 'Send Reset Link'}</button>
          </form>
        )}
        <p><Link to="/login">← Back to Sign In</Link></p>
      </div>
    </div>
  );
};

export default ForgotPassword;
