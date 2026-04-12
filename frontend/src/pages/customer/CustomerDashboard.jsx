import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const StatCard = ({ label, value, icon, color }) => (
  <div className="stat-card" style={{ borderLeft: `4px solid ${color}` }}>
    <div className="stat-icon">{icon}</div>
    <div>
      <p className="stat-label">{label}</p>
      <h3 className="stat-value">{value}</h3>
    </div>
  </div>
);

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);

  useEffect(() => {
    api.get('/reservations').then(r => {
      setReservations(r.data.filter(res =>
        res.customer_email === user?.email || res.customer_name === user?.username
      ));
    }).catch(() => {});
  }, [user]);

  const total = reservations.length;
  const pending = reservations.filter(r => r.status === 'pending').length;
  const confirmed = reservations.filter(r => r.status === 'confirmed').length;
  const completed = reservations.filter(r => r.status === 'completed').length;
  const recent = reservations.slice(0, 5);

  return (
    <div className="page">
      <h1 className="page-title">📊 Dashboard</h1>

      <div className="stats-grid">
        <StatCard label="Total Reservations" value={total} icon="📅" color="#4f46e5" />
        <StatCard label="Pending" value={pending} icon="⏳" color="#d97706" />
        <StatCard label="Confirmed" value={confirmed} icon="✅" color="#059669" />
        <StatCard label="Completed" value={completed} icon="🏁" color="#dc2626" />
      </div>

      <div className="card">
        <h2>Recent Reservations</h2>
        {recent.length === 0 ? (
          <p className="no-results">No reservations yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Table</th><th>Date</th><th>Time</th><th>Party</th><th>Status</th></tr>
            </thead>
            <tbody>
              {recent.map(r => (
                <tr key={r.id}>
                  <td>#{r.id}</td>
                  <td>Table {r.table_number}</td>
                  <td>{r.reservation_date?.split('T')[0]}</td>
                  <td>{r.reservation_time}</td>
                  <td>{r.party_size}</td>
                  <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
