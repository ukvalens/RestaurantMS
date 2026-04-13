import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/customer/menu',             label: '🍽️ Menu',             perm: 'menu' },
  { to: '/customer/reserve',          label: '📅 Make Reservation', perm: 'reserve' },
  { to: '/customer/my-reservations',  label: '📋 My Reservations',  perm: 'my-reservations' },
  { to: '/customer/my-orders',        label: '🛒 My Orders',        perm: 'my-orders' },
  { to: '/customer/my-deliveries',    label: '🚚 My Deliveries',    perm: 'my-deliveries' },
  { to: '/customer/announcements',    label: '📢 Announcements',    perm: 'announcements' },
];

const CustomerSidebar = ({ onClose }) => {
  const { user, hasPermission } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-header-top">
          <h2>🍴 RestaurantMS</h2>
          <button className="sidebar-close-btn" onClick={onClose}>✕</button>
        </div>
        <p className="user-info">{user?.username} <span className="role-badge">customer</span></p>
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

export default CustomerSidebar;
