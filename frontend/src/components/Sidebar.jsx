import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_BY_ROLE = {
  admin: [
    { to: '/app/dashboard',     label: 'Dashboard',      icon: 'fa-gauge' },
    { to: '/app/orders',        label: 'Orders & Slips',  icon: 'fa-receipt' },
    { to: '/app/deliveries',    label: 'Deliveries',      icon: 'fa-truck' },
    { to: '/app/reservations',  label: 'Reservations',    icon: 'fa-calendar-check' },
    { to: '/app/payments',      label: 'Payments',        icon: 'fa-credit-card' },
    { to: '/app/tables',        label: 'Tables',          icon: 'fa-table-cells' },
    { to: '/app/menu',          label: 'Menu',            icon: 'fa-utensils' },
    { to: '/app/users',         label: 'User Management', icon: 'fa-users' },
    { to: '/app/announcements', label: 'Announcements',   icon: 'fa-bullhorn' },
  ],
  manager: [
    { to: '/app/dashboard',     label: 'Dashboard',      icon: 'fa-gauge' },
    { to: '/app/orders',        label: 'Orders & Slips',  icon: 'fa-receipt' },
    { to: '/app/deliveries',    label: 'Deliveries',      icon: 'fa-truck' },
    { to: '/app/reservations',  label: 'Reservations',    icon: 'fa-calendar-check' },
    { to: '/app/payments',      label: 'Payments',        icon: 'fa-credit-card' },
    { to: '/app/tables',        label: 'Tables',          icon: 'fa-table-cells' },
    { to: '/app/menu',          label: 'Menu',            icon: 'fa-utensils' },
    { to: '/app/announcements', label: 'Announcements',   icon: 'fa-bullhorn' },
  ],
  waiter: [
    { to: '/app/dashboard',     label: 'Dashboard',      icon: 'fa-gauge' },
    { to: '/app/orders',        label: 'Orders & Slips',  icon: 'fa-receipt' },
    { to: '/app/reservations',  label: 'Reservations',    icon: 'fa-calendar-check' },
    { to: '/app/tables',        label: 'Tables',          icon: 'fa-table-cells' },
    { to: '/app/menu',          label: 'Menu',            icon: 'fa-utensils' },
    { to: '/app/announcements', label: 'Announcements',   icon: 'fa-bullhorn' },
  ],
  delivery: [
    { to: '/app/dashboard',     label: 'Dashboard',      icon: 'fa-gauge' },
    { to: '/app/deliveries',    label: 'My Deliveries',   icon: 'fa-truck' },
    { to: '/app/announcements', label: 'Announcements',   icon: 'fa-bullhorn' },
  ],
};

const Sidebar = ({ onClose }) => {
  const { user } = useAuth();
  const items = NAV_BY_ROLE[user?.role] || NAV_BY_ROLE.waiter;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-header-top">
          <h2><i className="fa-solid fa-utensils" style={{ marginRight: '0.5rem' }} />RestaurantMS</h2>
          <button className="sidebar-close-btn" onClick={onClose}><i className="fa-solid fa-xmark" /></button>
        </div>
        <p className="user-info">{user?.username} <span className="role-badge">{user?.role}</span></p>
      </div>
      <nav>
        {items.map(item => (
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

export default Sidebar;
