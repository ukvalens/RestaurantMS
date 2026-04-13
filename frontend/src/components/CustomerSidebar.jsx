import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/customer/dashboard',        label: 'Dashboard',         icon: 'fa-gauge',          perm: 'dashboard' },
  { to: '/customer/menu',             label: 'Browse Menu',        icon: 'fa-utensils',       perm: 'menu' },
  { to: '/customer/reserve',          label: 'Make Reservation',   icon: 'fa-calendar-plus',  perm: 'reserve' },
  { to: '/customer/my-reservations',  label: 'My Reservations',    icon: 'fa-calendar-check', perm: 'my-reservations' },
  { to: '/customer/my-orders',        label: 'My Orders & Slips',  icon: 'fa-receipt',        perm: 'my-orders' },
  { to: '/customer/my-deliveries',    label: 'My Deliveries',      icon: 'fa-truck',          perm: 'my-deliveries' },
  { to: '/customer/announcements',    label: 'Announcements',      icon: 'fa-bullhorn',       perm: 'announcements' },
];

const CustomerSidebar = ({ onClose }) => {
  const { user, hasPermission } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-header-top">
          <h2><i className="fa-solid fa-utensils" style={{ marginRight: '0.5rem' }} />RestaurantMS</h2>
          <button className="sidebar-close-btn" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
        </div>
        <p className="user-info">{user?.username} <span className="role-badge">customer</span></p>
      </div>
      <nav>
        {navItems
          .filter(item => hasPermission(item.perm))
          .map(item => (
            <NavLink key={item.to} to={item.to} onClick={onClose}
              className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <i className={`fa-solid ${item.icon}`} style={{ width: '1.1rem', marginRight: '0.6rem' }} />
              {item.label}
            </NavLink>
          ))}
      </nav>
    </aside>
  );
};

export default CustomerSidebar;
