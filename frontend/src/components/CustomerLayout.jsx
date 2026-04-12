import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import CustomerSidebar from './CustomerSidebar';
import CustomerTopbar from './CustomerTopbar';

const CustomerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : ''}`}>
        <CustomerSidebar onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="main-wrapper">
        <CustomerTopbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="main-content">
          <Outlet />
        </main>
        <footer className="app-footer">
          <div className="footer-inner">
            <div className="footer-brand">🍴 <strong>RestaurantMS</strong> © {new Date().getFullYear()}</div>
            <div className="footer-contact">
              <span>👤 Ukwitegetse Valens</span>
              <span>✉️ <a href="mailto:ukwitegetsev9@gmail.com">ukwitegetsev9@gmail.com</a></span>
              <span>📞 <a href="tel:+250780468216">+250 780 468 216</a></span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default CustomerLayout;
