import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import AppFooter from '../components/AppFooter';

const PAGE_SIZE = 4;

const Home = () => {
  const { token, user } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    api.get('/menu/items/public').then(r => setMenuItems(r.data)).catch(() => {});
  }, []);

  const totalPages = Math.ceil(menuItems.length / PAGE_SIZE);
  const pageItems = menuItems.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const dashLink = user?.role === 'customer' ? '/customer/dashboard' : '/app/dashboard';

  const nextPage = useCallback(() => {
    setPage(p => (p + 1) % Math.max(1, totalPages));
  }, [totalPages]);

  useEffect(() => {
    if (totalPages <= 1) return;
    const timer = setInterval(nextPage, 5000);
    return () => clearInterval(timer);
  }, [nextPage, totalPages]);

  return (
    <div className="home">

      {/* Navbar */}
      <nav className="home-nav">
        <div className="home-nav-brand">
          <i className="fa-solid fa-utensils" style={{ marginRight: '0.5rem' }} />RestaurantMS
        </div>
        <div className="home-nav-links">
          {token ? (
            <Link to={dashLink} className="home-nav-btn">
              Go to Dashboard <i className="fa-solid fa-arrow-right" style={{ marginLeft: '0.3rem' }} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="home-nav-btn-outline">Sign In</Link>
              <Link to="/register" className="home-nav-btn">Get Started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Menu Highlights */}
      <section style={{ padding: '3rem 6%', background: 'var(--bg)', minHeight: '80vh' }}>
        <div className="section-header">
          <h2><i className="fa-solid fa-utensils" style={{ marginRight: '0.5rem' }} />Menu Highlights</h2>
          <p>Fresh dishes crafted with passion — explore what we offer</p>
        </div>

        {menuItems.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>No menu items available yet.</p>
        ) : (
          <>
            <div className="menu-grid" style={{ maxWidth: 1100, margin: '0 auto' }}>
              {pageItems.map(item => (
                <div key={item.id} className="menu-card" style={{ transition: 'transform 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} className="menu-img" onError={e => e.target.style.display = 'none'} />
                    : <div style={{ height: 150, background: 'linear-gradient(135deg,#ede9fe,#dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', color: 'var(--primary)' }}>
                        <i className="fa-solid fa-utensils" />
                      </div>
                  }
                  <div className="menu-card-body">
                    <span className="menu-category">{item.category_name}</span>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                    <div className="menu-footer">
                      <strong>RWF {parseFloat(item.price).toFixed(0)}</strong>
                      <span className="badge badge-available">Available</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} onClick={() => setPage(i)} style={{
                    width: page === i ? 28 : 10, height: 10, borderRadius: 999,
                    border: 'none', cursor: 'pointer', padding: 0,
                    background: page === i ? 'var(--primary)' : 'var(--border)', transition: 'all 0.2s',
                  }} />
                ))}
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Link to={token ? (user?.role === 'customer' ? '/customer/menu' : '/app/menu') : '/register'} className="hero-btn-primary">
                View Full Menu <i className="fa-solid fa-arrow-right" style={{ marginLeft: '0.3rem' }} />
              </Link>
            </div>
          </>
        )}
      </section>

      <AppFooter />

    </div>
  );
};

export default Home;
