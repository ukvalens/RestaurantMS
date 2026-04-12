import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Topbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const navigate = useNavigate();
  const initials = user?.username?.slice(0, 2).toUpperCase() || 'U';
  const avatarSrc = user?.avatar_url?.startsWith('data:') ? user.avatar_url : null;

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
        <h2 className="topbar-title">Welcome, {user?.username} 👋</h2>
      </div>
      <div className="topbar-right" ref={ref}>
        <button className="avatar-btn" onClick={() => setOpen(!open)}>
          {avatarSrc
            ? <img src={avatarSrc} alt="profile" className="topbar-avatar-img" />
            : <div className="avatar">{initials}</div>
          }
          <div className="avatar-info">
            <span className="avatar-name">{user?.username}</span>
            <span className="avatar-role">{user?.role}</span>
          </div>
          <span className="avatar-chevron">{open ? '▲' : '▼'}</span>
        </button>
        {open && (
          <div className="profile-dropdown">
            <div className="dropdown-header">
              {avatarSrc
                ? <img src={avatarSrc} alt="profile" className="dropdown-avatar-img" />
                : <div className="avatar avatar-lg">{initials}</div>
              }
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
