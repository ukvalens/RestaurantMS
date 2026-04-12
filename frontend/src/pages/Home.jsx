import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const PAGE_SIZE = 4;

const Home = () => {
  const { token, user } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    api.get('/menu/items').then(r => setMenuItems(r.data.filter(i => i.is_available))).catch(() => {});
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
            <Link to={dashLink} className="home-nav-btn">Go to Dashboard →</Link>
          ) : (
            <>
              <Link to="/login" className="home-nav-btn-outline">Sign In</Link>
              <Link to="/register" className="home-nav-btn">Get Started</Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">🌟 Welcome to RestaurantMS</div>
        <div className="hero-content">
          <h1>Manage Your Restaurant<br /><span className="hero-highlight">Smarter & Faster</span></h1>
          <p>An all-in-one platform for tables, orders, reservations, menus, and payments — built for modern restaurants.</p>
          <div className="hero-actions">
            {token ? (
              <Link to={dashLink} className="hero-btn-primary">Go to Dashboard →</Link>
            ) : (
              <>
                <Link to="/register" className="hero-btn-primary">🚀 Get Started Free</Link>
                <Link to="/login" className="hero-btn-secondary">Sign In</Link>
              </>
            )}
          </div>
        </div>
        <div className="hero-stats">
          <div className="hero-stat"><span className="hero-stat-num">🪑</span><span>Table Management</span></div>
          <div className="hero-stat"><span className="hero-stat-num">📋</span><span>Order Tracking</span></div>
          <div className="hero-stat"><span className="hero-stat-num">📅</span><span>Reservations</span></div>
          <div className="hero-stat"><span className="hero-stat-num">💳</span><span>Payments</span></div>
        </div>
      </section>

      {/* Features */}
      <section className="home-features">
        <div className="section-header">
          <h2>Everything You Need</h2>
          <p>Powerful tools to run your restaurant efficiently</p>
        </div>
        <div className="features-grid">
          {[
            { icon: '🪑', title: 'Table Management', desc: 'Track table availability in real-time. Mark tables as available, occupied, or reserved instantly.' },
            { icon: '📋', title: 'Order Management', desc: 'Create and track orders from placement to delivery. Update statuses with a single click.' },
            { icon: '📅', title: 'Reservations', desc: 'Handle customer reservations with ease. Assign tables and manage booking schedules.' },
            { icon: '🍽️', title: 'Menu Control', desc: 'Add, edit, and organize menu items by category. Upload images and set availability.' },
            { icon: '💳', title: 'Payments', desc: 'Process payments via cash, card, or online. Track revenue and transaction history.' },
            { icon: '👥', title: 'User Roles', desc: 'Manage staff with role-based access — admin, manager, waiter, and customer roles.' },
          ].map(f => (
            <div key={f.title} className="feature-card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="home-how">
        <div className="section-header">
          <h2>How It Works</h2>
          <p>Get up and running in minutes</p>
        </div>
        <div className="how-grid">
          <div className="how-step"><div className="how-num">1</div><h3>Create Account</h3><p>Register with your email and choose your role to get started.</p></div>
          <div className="how-step"><div className="how-num">2</div><h3>Set Up Your Restaurant</h3><p>Add tables, menu categories, and items to your dashboard.</p></div>
          <div className="how-step"><div className="how-num">3</div><h3>Start Managing</h3><p>Take orders, manage reservations, and process payments seamlessly.</p></div>
        </div>
      </section>

      {/* Menu Showcase */}
      {menuItems.length > 0 && (
        <section style={{ padding: '4rem 6%', background: 'var(--bg)' }}>
          <div className="section-header">
            <h2>🍽️ Menu Highlights</h2>
            <p>Fresh dishes crafted with passion</p>
          </div>
          <div className="menu-grid" style={{ maxWidth: 1100, margin: '0 auto' }}>
            {pageItems.map(item => (
              <div key={item.id} className="menu-card" style={{ transition: 'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                {item.image_url
                  ? <img src={item.image_url} alt={item.name} className="menu-img" onError={e => e.target.style.display = 'none'} />
                  : <div style={{ height: 150, background: 'linear-gradient(135deg,#ede9fe,#dbeafe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🍽️</div>
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
              View Full Menu →
            </Link>
          </div>
        </section>
      )}

      {/* CTA */}
      {!token && (
        <section className="home-cta">
          <h2>Ready to Transform Your Restaurant?</h2>
          <p>Join RestaurantMS today and take control of your operations.</p>
          <div className="hero-actions">
            <Link to="/register" className="hero-btn-primary">🚀 Create Free Account</Link>
            <Link to="/login" className="hero-btn-secondary" style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1.5px solid rgba(255,255,255,0.4)' }}>Sign In</Link>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-grid">
          <div className="footer-col">
            <div className="footer-brand">🍴 RestaurantMS</div>
            <p className="footer-tagline">Your all-in-one restaurant management platform. Built with ❤️ for modern restaurants.</p>
          </div>
          <div className="footer-col">
            <h4>Contact</h4>
            <ul>
              <li>👤 Ukwitegetse Valens</li>
              <li>✉️ ukwitegetsev9@gmail.com</li>
              <li>📞 +250 780 468 216</li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/login" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>Sign In</Link></li>
              <li><Link to="/register" style={{ color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}>Register</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">© {new Date().getFullYear()} RestaurantMS. All rights reserved.</div>
      </footer>

    </div>
  );
};

export default Home;
