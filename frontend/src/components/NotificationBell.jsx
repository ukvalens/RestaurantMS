import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

const typeIcon = {
  new_order:    'fa-cart-shopping',
  reservation:  'fa-calendar-check',
  low_stock:    'fa-triangle-exclamation',
  delivery:     'fa-truck',
  announcement: 'fa-bullhorn',
  new_user:     'fa-user-plus',
  default:      'fa-bell',
};

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const NotificationBell = () => {
  const { notifications, unreadCount, markRead, markAllRead, deleteNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = (n) => {
    if (!n.is_read) markRead(n.id);
    if (n.link) { navigate(n.link); setOpen(false); }
  };

  return (
    <div className="notif-wrapper" ref={ref}>
      <button className="notif-bell-btn" onClick={() => setOpen(o => !o)} aria-label="Notifications">
        <i className="fa-solid fa-bell" />
        {unreadCount > 0 && (
          <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span className="notif-title"><i className="fa-solid fa-bell" style={{ marginRight: '0.4rem' }} />Notifications</span>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={markAllRead}>Mark all read</button>
            )}
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <i className="fa-solid fa-circle-check" style={{ fontSize: '2rem', color: '#059669' }} />
                <p>You're all caught up!</p>
              </div>
            ) : notifications.map(n => (
              <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                onClick={() => handleClick(n)}>
                <div className="notif-item-icon">
                  <i className={`fa-solid ${typeIcon[n.type] || typeIcon.default}`} />
                </div>
                <div className="notif-item-body">
                  <p className="notif-item-title">{n.title}</p>
                  <p className="notif-item-msg">{n.message}</p>
                  <span className="notif-item-time">{timeAgo(n.created_at)}</span>
                </div>
                <button className="notif-item-del"
                  onClick={e => { e.stopPropagation(); deleteNotification(n.id); }}
                  aria-label="Dismiss"><i className="fa-solid fa-xmark" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
