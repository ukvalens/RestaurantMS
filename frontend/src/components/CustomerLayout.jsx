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
          <p>🍴 RestaurantMS © {new Date().getFullYear()} — Built with React & Node.js</p>
        </footer>
      </div>
    </div>
  );
};

export default CustomerLayout;
