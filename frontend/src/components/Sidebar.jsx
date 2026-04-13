import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ALL_NAV = [
  { to: '/app/dashboard',     label: 'Dashboard',       icon: 'fa-gauge',          perm: 'dashboard' },
  { to: '/app/tables',        label: 'Tables',           icon: 'fa-table-cells',    perm: 'tables' },
  { to: '/app/menu',          label: 'Menu',             icon: 'fa-utensils',       perm: 'menu' },
  { to: '/app/orders',        label: 'Orders & Slips',   icon: 'fa-receipt',        perm: 'orders' },
  { to: '/app/deliveries',    label: 'Deliveries',       icon: 'fa-truck',          perm: 'deliveries' },
  { to: '/app/reservations',  label: 'Reservations',     icon: 'fa-calendar-check', perm: 'reservations' },
  { to: '/app/payments',      label: 'Payments',         icon: 'fa-credit-card',    perm: 'payments' },
  { to: '/app/announcements', label: 'Announcements',    icon: 'fa-bullhorn',       perm: 'announcements' },
  { to: '/app/users',         label: 'User Management',  icon: 'fa-users',          perm: 'users' },
];

const Sidebar = ({ onClose }) => {
  const { user, hasPermission } = useAuth();

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
        {ALL_NAV.filter(item => hasPermission(item.perm)).map(item => (
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
