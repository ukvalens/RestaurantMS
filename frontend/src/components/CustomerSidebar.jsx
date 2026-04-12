import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/customer/menu', label: '🍽️ Menu' },
  { to: '/customer/reserve', label: '📅 Make Reservation' },
  { to: '/customer/my-reservations', label: '📋 My Reservations' },
];

const CustomerSidebar = ({ onClose }) => {
  const { user } = useAuth();

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
        {navItems.map(item => (
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
