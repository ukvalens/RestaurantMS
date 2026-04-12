import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const BASE_URL = 'http://localhost:5000';
const PAGE_SIZE = 4;

const Home = () => {
  const { token, user } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    api.get('/menu/items').then(r => {
      setMenuItems(r.data.filter(i => i.is_available));
    }).catch(() => {});
  }, []);

  const totalPages = Math.ceil(menuItems.length / PAGE_SIZE);
  const pageItems = menuItems.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const dashLink = user?.role === 'customer' ? '/customer/dashboard' : '/app/dashboard';

  return (
    <div className="home">

      {/* Navbar */}
      <nav className="home-nav">
        <div className="home-nav-brand">🍴 RestaurantMS</div>
        <div className="home-nav-links">
          {token ? (
            <Link to={dashLink} className="home-nav-btn">Go to Dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="home-nav-btn-outline">Sign In</Link>
              <Link to="/register" className="home-nav-btn">Get Started</Link>
            </>
          )}
        </div>
      </nav>





      {/* Menu Showcase */}
      {menuItems.length > 0 && (
        <section style={{ padding: '4rem 6%', background: 'var(--bg)' }}>
          <div className="section-header">
            <h2>🍽️ Our Menu Highlights</h2>
            <p>Fresh dishes crafted with passion — explore what we offer</p>
          </div>

          <div className="menu-grid" style={{ maxWidth: 1100, margin: '0 auto' }}>
            {pageItems.map(item => (
              <div key={item.id} className="menu-card"
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                style={{ transition: 'transform 0.2s' }}>
                {item.image_url
                  ? <img src={`${BASE_URL}${item.image_url}`} alt={item.name} className="menu-img" onError={e => e.target.style.display = 'none'} />
                  : <div style={{ height: 150, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🍽️</div>
                }
                <div className="menu-card-body">
                  <span className="menu-category">{item.category_name}</span>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                  <div className="menu-footer">
                    <strong>${parseFloat(item.price).toFixed(2)}</strong>
                    <span className="badge badge-available">Available</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dot Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} onClick={() => setPage(i)} style={{
                  width: page === i ? 28 : 10, height: 10,
                  borderRadius: 999, border: 'none', cursor: 'pointer',
                  background: page === i ? 'var(--primary)' : 'var(--border)',
                  transition: 'all 0.2s', padding: 0,
                }} />
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <Link to={token ? '/customer/menu' : '/register'} className="hero-btn-primary">
              View Full Menu →
            </Link>
          </div>
        </section>
      )}



      {/* Footer */}
      <footer className="app-footer">
        <p>🍴 RestaurantMS © {new Date().getFullYear()} — Built with React & Node.js</p>
      </footer>

    </div>
  );
};

export default Home;
