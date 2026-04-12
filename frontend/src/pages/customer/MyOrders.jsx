import { useEffect, useState } from 'react';
import api from '../../api/axios';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => {
    api.get('/orders').then(r => setOrders(r.data)).catch(() => {});
  }, []);

  const statuses = ['pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'];

  const filtered = orders.filter(o => {
    const matchSearch = o.id.toString().includes(search) ||
      o.table_number?.toString().includes(search);
    const matchStatus = filterStatus ? o.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="page">
      <h1 className="page-title">📋 Orders</h1>
      <div className="card">
        <div className="menu-filters" style={{ marginBottom: '1rem' }}>
          <input placeholder="🔍 Search by order ID or table..." value={search}
            onChange={e => setSearch(e.target.value)} className="menu-search" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {(search || filterStatus) && (
            <button className="btn-secondary btn-sm" onClick={() => { setSearch(''); setFilterStatus(''); }}>✕ Clear</button>
          )}
        </div>
        <p className="menu-count">{filtered.length} order{filtered.length !== 1 ? 's' : ''} found</p>
        {filtered.length === 0 ? (
          <p className="no-results">No orders found.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>ID</th><th>Table</th><th>Waiter</th><th>Amount</th><th>Status</th></tr>
            </thead>
            <tbody>
              {filtered.map(o => (
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
        )}
      </div>
    </div>
  );
};

export default MyOrders;
