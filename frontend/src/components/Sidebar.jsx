import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/app/dashboard', label: '📊 Dashboard', roles: ['admin', 'manager', 'waiter', 'chef'] },
  { to: '/app/tables', label: '🪑 Tables', roles: ['admin', 'manager', 'waiter'] },
  { to: '/app/menu', label: '🍽️ Menu', roles: ['admin', 'manager', 'waiter', 'chef'] },
  { to: '/app/orders', label: '📋 Orders', roles: ['admin', 'manager', 'waiter', 'chef'] },
  { to: '/app/reservations', label: '📅 Reservations', roles: ['admin', 'manager', 'waiter'] },
  { to: '/app/payments', label: '💳 Payments', roles: ['admin', 'manager'] },
  { to: '/app/users', label: '👥 User Management', roles: ['admin'] },
];

const Sidebar = ({ onClose }) => {
  const { user } = useAuth();

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
          .filter(item => item.roles.includes(user?.role))
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
