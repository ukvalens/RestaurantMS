import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/app/dashboard',    label: '📊 Dashboard',      perm: 'dashboard' },
  { to: '/app/tables',       label: '🪑 Tables',          perm: 'tables' },
  { to: '/app/menu',         label: '🍽️ Menu',            perm: 'menu' },
  { to: '/app/orders',       label: '📋 Orders',          perm: 'orders' },
  { to: '/app/deliveries',   label: '🚚 Deliveries',      perm: 'deliveries' },
  { to: '/app/reservations', label: '📅 Reservations',    perm: 'reservations' },
  { to: '/app/payments',     label: '💳 Payments',        perm: 'payments' },
  { to: '/app/announcements',label: '📢 Announcements',   perm: 'announcements' },
  { to: '/app/users',        label: '👥 User Management', perm: 'users' },
];

const Sidebar = ({ onClose }) => {
  const { user, hasPermission } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-header-top">
          <h2>🍴 RestaurantMS</h2>
          <button className="sidebar-close-btn" onClick={onClose}>✕</button>
        </div>
        <p className="user-info">{user?.username} <span className="role-badge">{user?.role}</span></p>
      </div>
      <nav>
        {navItems
          .filter(item => hasPermission(item.perm))
          .map(item => (
            <NavLink key={item.to} to={item.to} onClick={onClose}
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              {item.label}
            </NavLink>
          ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
