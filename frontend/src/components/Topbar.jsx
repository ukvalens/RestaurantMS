import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const Topbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="hamburger-btn" onClick={onMenuClick}>☰</button>
        <span className="topbar-greeting">{(() => { const h = new Date().getHours(); return h < 12 ? '🌅 Good Morning' : h < 17 ? '☀️ Good Afternoon' : '🌙 Good Evening'; })()}, {user?.username}!</span>
      </div>
      <div className="topbar-right" ref={ref}>
        <NotificationBell />
        <button className="avatar-btn" onClick={() => setOpen(!open)}>
          {user?.avatar_url && (
            <img src={user.avatar_url} alt="profile" className="topbar-avatar-img" />
          )}
          <div className="avatar-info">
            <span className="avatar-name">{user?.username}</span>
            <span className="avatar-role">{user?.role}</span>
          </div>
          <span className="avatar-chevron">{open ? '▲' : '▼'}</span>
        </button>
        {open && (
          <div className="profile-dropdown">
            <div className="dropdown-header">
              {user?.avatar_url && (
                <img src={user.avatar_url} alt="profile" className="dropdown-avatar-img" />
              )}
              <div>
                <p className="dropdown-name">{user?.username}</p>
                <p className="dropdown-email">{user?.email}</p>
                <span className="role-badge">{user?.role}</span>
              </div>
            </div>
            <hr className="dropdown-divider" />
            <Link to="/app/profile" className="dropdown-item" onClick={() => setOpen(false)}>👤 My Profile</Link>
            <Link to="/app/change-password" className="dropdown-item" onClick={() => setOpen(false)}>🔒 Change Password</Link>
            <hr className="dropdown-divider" />
            <button className="dropdown-item dropdown-logout" onClick={handleLogout}>🚪 Logout</button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Topbar;
