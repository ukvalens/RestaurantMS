import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AppFooter from './AppFooter';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}
      <div className={`sidebar-wrapper ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      <div className="main-wrapper">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="main-content">
          <Outlet />
        </main>
        <AppFooter />
      </div>
    </div>
  );
};

export default Layout;
