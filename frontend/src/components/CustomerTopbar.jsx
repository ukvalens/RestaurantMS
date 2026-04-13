import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const CustomerTopbar = ({ onMenuClick }) => {
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

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return <><i className="fa-solid fa-sun" style={{ color: '#f59e0b' }} /> Good Morning</>;
    if (h < 17) return <><i className="fa-solid fa-cloud-sun" style={{ color: '#f97316' }} /> Good Afternoon</>;
    return <><i className="fa-solid fa-moon" style={{ color: '#6366f1' }} /> Good Evening</>;
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="hamburger-btn" onClick={onMenuClick}><i className="fa-solid fa-bars" /></button>
        <span className="topbar-greeting">{greeting()}, {user?.username}!</span>
      </div>
      <div className="topbar-right" ref={ref}>
        <NotificationBell />
        <button className="avatar-btn" onClick={() => setOpen(!open)}>
          {user?.avatar_url
            ? <img src={user.avatar_url} alt="profile" className="topbar-avatar-img" />
            : <div className="topbar-avatar-initials">{user?.username?.slice(0,2).toUpperCase()}</div>
          }
          <div className="avatar-info">
            <span className="avatar-name">{user?.username}</span>
            <span className="avatar-role">customer</span>
          </div>
          <span className="avatar-chevron"><i className={`fa-solid fa-chevron-${open ? 'up' : 'down'}`} /></span>
        </button>
        {open && (
          <div className="profile-dropdown">
            <div className="dropdown-header">
              {user?.avatar_url
                ? <img src={user.avatar_url} alt="profile" className="dropdown-avatar-img" />
                : <div className="dropdown-avatar-initials">{user?.username?.slice(0,2).toUpperCase()}</div>
              }
              <div>
                <p className="dropdown-name">{user?.username}</p>
                <p className="dropdown-email">{user?.email}</p>
                <span className="role-badge">customer</span>
              </div>
            </div>
            <hr className="dropdown-divider" />
            <Link to="/customer/profile" className="dropdown-item" onClick={() => setOpen(false)}>
              <i className="fa-solid fa-user" style={{ width: '1rem', marginRight: '0.5rem' }} />My Profile
            </Link>
            <hr className="dropdown-divider" />
            <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
              <i className="fa-solid fa-right-from-bracket" style={{ width: '1rem', marginRight: '0.5rem' }} />Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default CustomerTopbar;
