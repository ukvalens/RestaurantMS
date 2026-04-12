import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ label, value, icon, color }) => (
  <div className="stat-card" style={{ borderLeft: `4px solid ${color}` }}>
    <div className="stat-icon">{icon}</div>
    <div>
      <p className="stat-label">{label}</p>
      <h3 className="stat-value">{value}</h3>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ tables: 0, orders: 0, reservations: 0, payments: 0 });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tables, orders, reservations] = await Promise.all([
          api.get('/tables'),
          api.get('/orders'),
          api.get('/reservations'),
        ]);

        let paymentsCount = 0;
        if (['admin', 'manager'].includes(user?.role)) {
          const payments = await api.get('/payments');
          paymentsCount = payments.data.length;
        }

        setStats({
          tables: tables.data.length,
          orders: orders.data.length,
          reservations: reservations.data.length,
          payments: paymentsCount,
        });
        setRecentOrders(orders.data.slice(0, 5));
      } catch {}
    };
    fetchData();
  }, [user]);

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title" style={{ marginBottom: '0.25rem' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Welcome back, <strong>{user?.username}</strong> —
            <span className="role-badge" style={{ marginLeft: '0.4rem', background: 'var(--primary)' }}>{user?.role}</span>
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard label="Total Tables" value={stats.tables} icon="🪑" color="#4f46e5" />
        <StatCard label="Total Orders" value={stats.orders} icon="📋" color="#059669" />
        <StatCard label="Reservations" value={stats.reservations} icon="📅" color="#d97706" />
        {['admin', 'manager'].includes(user?.role) && (
          <StatCard label="Payments" value={stats.payments} icon="💳" color="#dc2626" />
        )}
      </div>

      <div className="card">
        <h2>Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="no-results">No orders yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Table</th><th>Waiter</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>
              {recentOrders.map(o => (
                <tr key={o.id}>
                  <td>#{o.id}</td>
                  <td>Table {o.table_number}</td>
                  <td>{o.waiter_name}</td>
                  <td>RWF {parseFloat(o.total_amount).toFixed(0)}</td>
                  <td><span className={`badge badge-${o.status}`}>{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
