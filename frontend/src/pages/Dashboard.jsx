import { useEffect, useState } from 'react';
import api from '../api/axios';

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
  const [stats, setStats] = useState({ tables: 0, orders: 0, reservations: 0, payments: 0 });
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tables, orders, reservations, payments] = await Promise.all([
          api.get('/tables'),
          api.get('/orders'),
          api.get('/reservations'),
          api.get('/payments'),
        ]);
        setStats({
          tables: tables.data.length,
          orders: orders.data.length,
          reservations: reservations.data.length,
          payments: payments.data.length,
        });
        setRecentOrders(orders.data.slice(0, 5));
      } catch {}
    };
    fetchData();
  }, []);

  return (
    <div className="page">
      <h1 className="page-title">Dashboard</h1>
      <div className="stats-grid">
        <StatCard label="Total Tables" value={stats.tables} icon="🪑" color="#4f46e5" />
        <StatCard label="Total Orders" value={stats.orders} icon="📋" color="#059669" />
        <StatCard label="Reservations" value={stats.reservations} icon="📅" color="#d97706" />
        <StatCard label="Payments" value={stats.payments} icon="💳" color="#dc2626" />
      </div>

      <div className="card">
        <h2>Recent Orders</h2>
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
                <td>${parseFloat(o.total_amount).toFixed(2)}</td>
                <td><span className={`badge badge-${o.status}`}>{o.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
