import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const MyReservations = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('reservations');

  const [reservations, setReservations] = useState([]);
  const [resSearch, setResSearch] = useState('');
  const [resStatus, setResStatus] = useState('');

  const [orders, setOrders] = useState([]);
  const [ordSearch, setOrdSearch] = useState('');
  const [ordStatus, setOrdStatus] = useState('');

  useEffect(() => {
    api.get('/reservations').then(r => {
      setReservations(r.data.filter(res =>
        res.customer_email === user?.email || res.customer_name === user?.username
      ));
    }).catch(() => {});

    api.get('/orders').then(r => {
      setOrders(r.data.filter(o => o.waiter_id === user?.id));
    }).catch(() => {});
  }, [user]);

  const filteredRes = reservations.filter(r => {
    const matchSearch = r.reservation_date?.split('T')[0].includes(resSearch) ||
      r.table_number?.toString().includes(resSearch);
    const matchStatus = resStatus ? r.status === resStatus : true;
    return matchSearch && matchStatus;
  });

  const filteredOrd = orders.filter(o => {
    const matchSearch = o.id.toString().includes(ordSearch) ||
      o.table_number?.toString().includes(ordSearch);
    const matchStatus = ordStatus ? o.status === ordStatus : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="page">
      <h1 className="page-title">📋 My Activity</h1>

      <div className="tabs">
        <button className={tab === 'reservations' ? 'tab active' : 'tab'} onClick={() => setTab('reservations')}>
          📅 Reservations ({reservations.length})
        </button>
        <button className={tab === 'orders' ? 'tab active' : 'tab'} onClick={() => setTab('orders')}>
          🛒 Orders ({orders.length})
        </button>
      </div>

      {/* ── RESERVATIONS ── */}
      {tab === 'reservations' && (
        <div className="card">
          <div className="menu-filters" style={{ marginBottom: '1rem' }}>
            <input placeholder="🔍 Search by date or table..." value={resSearch}
              onChange={e => setResSearch(e.target.value)} className="menu-search" />
            <select value={resStatus} onChange={e => setResStatus(e.target.value)}>
              <option value="">All Status</option>
              {['pending', 'confirmed', 'cancelled', 'completed'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {(resSearch || resStatus) && (
              <button className="btn-secondary btn-sm" onClick={() => { setResSearch(''); setResStatus(''); }}>✕ Clear</button>
            )}
          </div>
          <p className="menu-count">{filteredRes.length} reservation{filteredRes.length !== 1 ? 's' : ''}</p>
          {filteredRes.length === 0 ? (
            <p className="no-results">No reservations found.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Table</th><th>Date</th><th>Time</th><th>Party</th><th>Status</th><th>Special Requests</th></tr>
              </thead>
              <tbody>
                {filteredRes.map(r => (
                  <tr key={r.id}>
                    <td>#{r.id}</td>
                    <td>Table {r.table_number}</td>
                    <td>{r.reservation_date?.split('T')[0]}</td>
                    <td>{r.reservation_time}</td>
                    <td>{r.party_size}</td>
                    <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                    <td>{r.special_requests || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── ORDERS ── */}
      {tab === 'orders' && (
        <div className="card">
          <div className="menu-filters" style={{ marginBottom: '1rem' }}>
            <input placeholder="🔍 Search by order ID or table..." value={ordSearch}
              onChange={e => setOrdSearch(e.target.value)} className="menu-search" />
            <select value={ordStatus} onChange={e => setOrdStatus(e.target.value)}>
              <option value="">All Status</option>
              {['pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {(ordSearch || ordStatus) && (
              <button className="btn-secondary btn-sm" onClick={() => { setOrdSearch(''); setOrdStatus(''); }}>✕ Clear</button>
            )}
          </div>
          <p className="menu-count">{filteredOrd.length} order{filteredOrd.length !== 1 ? 's' : ''}</p>
          {filteredOrd.length === 0 ? (
            <p className="no-results">No orders found.</p>
          ) : (
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Table</th><th>Amount</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {filteredOrd.map(o => (
                  <tr key={o.id}>
                    <td>#{o.id}</td>
                    <td>Table {o.table_number}</td>
                    <td>${parseFloat(o.total_amount).toFixed(2)}</td>
                    <td><span className={`badge badge-${o.status}`}>{o.status}</span></td>
                    <td>{o.created_at?.split('T')[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default MyReservations;
