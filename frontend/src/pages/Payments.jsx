import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState({ order_id: '', amount: '', payment_method: 'cash', transaction_id: '' });
  const { user } = useAuth();

  const fetchAll = async () => {
    const [pays, ords] = await Promise.all([api.get('/payments'), api.get('/orders')]);
    setPayments(pays.data);
    setOrders(ords.data.filter(o => o.status !== 'completed' && o.status !== 'cancelled'));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleOrderSelect = (orderId) => {
    const order = orders.find(o => o.id === +orderId);
    setForm({ ...form, order_id: orderId, amount: order ? order.total_amount : '' });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments', { ...form, order_id: +form.order_id, amount: +form.amount });
      toast.success('Payment processed!');
      setShowForm(false);
      setForm({ order_id: '', amount: '', payment_method: 'cash', transaction_id: '' });
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this payment?')) return;
    try { await api.delete(`/payments/${id}`); toast.success('Deleted!'); fetchAll(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const filtered = payments.filter(p => {
    const q = search.toLowerCase();
    return (p.order_id.toString().includes(q) || p.transaction_id?.toLowerCase().includes(q)) &&
      (filterMethod ? p.payment_method === filterMethod : true) &&
      (filterStatus ? p.payment_status === filterStatus : true);
  });

  const totalRevenue = filtered.reduce((sum, p) => sum + parseFloat(p.amount), 0);

  const methodIcon = { cash: 'fa-money-bill', card: 'fa-credit-card', online: 'fa-globe' };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Payments</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Process Payment</button>
      </div>

      {/* Revenue stat */}
      <div className="stat-card" style={{ borderLeft: '4px solid #059669', marginBottom: '1.5rem' }}>
        <div className="stat-icon"><i className="fa-solid fa-sack-dollar" style={{ color: '#059669' }} /></div>
        <div>
          <p className="stat-label">Total Revenue {(filterMethod || filterStatus || search) ? '(filtered)' : ''}</p>
          <h3 className="stat-value">RWF {totalRevenue.toFixed(0)}</h3>
        </div>
      </div>

      {showForm && (
        <div className="card">
          <h2>Process Payment</h2>
          <form onSubmit={handleCreate} className="form-grid">
            <select value={form.order_id} onChange={e => handleOrderSelect(e.target.value)} required>
              <option value="">Select Order</option>
              {orders.map(o => <option key={o.id} value={o.id}>Order #{o.id} — Table {o.table_number} (RWF {parseFloat(o.total_amount).toFixed(0)})</option>)}
            </select>
            <input type="number" step="0.01" placeholder="Amount" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
            <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="online">Online</option>
            </select>
            <input placeholder="Transaction ID (optional)" value={form.transaction_id} onChange={e => setForm({ ...form, transaction_id: e.target.value })} />
            <div className="btn-group">
              <button type="submit" className="btn-primary">Process</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="menu-filters" style={{ marginBottom: '0.75rem' }}>
        <input placeholder="Search by order ID or transaction ID..." value={search} onChange={e => setSearch(e.target.value)} className="menu-search" />
        <select value={filterMethod} onChange={e => setFilterMethod(e.target.value)}>
          <option value="">All Methods</option>
          <option value="cash">Cash</option>
          <option value="card">Card</option>
          <option value="online">Online</option>
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        {(search || filterMethod || filterStatus) && (
          <button className="btn-secondary btn-sm" onClick={() => { setSearch(''); setFilterMethod(''); setFilterStatus(''); }}>✕ Clear</button>
        )}
      </div>
      <p className="menu-count">{filtered.length} payment{filtered.length !== 1 ? 's' : ''} found</p>

      {/* Mobile cards */}
      <div className="pay-cards">
        {filtered.length === 0 ? <p className="no-results">No payments found.</p> : filtered.map(p => (
          <div key={p.id} className="pay-card">
            <div className="pay-card-header">
              <div>
                <strong>Order #{p.order_id}</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>#{p.id}</span>
              </div>
              <span className={`badge badge-${p.payment_status === 'completed' ? 'available' : 'occupied'}`}>{p.payment_status}</span>
            </div>
            <div className="pay-card-amount">RWF {parseFloat(p.amount).toFixed(0)}</div>
            <div className="pay-card-meta">
              <span><i className={`fa-solid ${methodIcon[p.payment_method]}`} style={{ marginRight: '0.3rem' }} />{p.payment_method}</span>
              {p.transaction_id && <span><i className="fa-solid fa-tag" style={{ marginRight: '0.3rem' }} />{p.transaction_id}</span>}
              <span><i className="fa-solid fa-calendar" style={{ marginRight: '0.3rem' }} />{new Date(p.created_at).toLocaleDateString()}</span>
            </div>
            {user?.role === 'admin' && (
              <button className="btn-danger btn-sm" style={{ marginTop: '0.5rem' }} onClick={() => handleDelete(p.id)}><i className="fa-solid fa-trash" /> Delete</button>
            )}
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="pay-table-wrapper">
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Order</th><th>Amount</th><th>Method</th><th>Status</th><th>Transaction</th><th>Date</th>{user?.role === 'admin' && <th>Action</th>}</tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td>#{p.id}</td>
                <td>Order #{p.order_id}</td>
                <td>RWF {parseFloat(p.amount).toFixed(0)}</td>
                <td><span className="badge badge-reserved">{p.payment_method}</span></td>
                <td><span className={`badge badge-${p.payment_status === 'completed' ? 'available' : 'occupied'}`}>{p.payment_status}</span></td>
                <td>{p.transaction_id || '—'}</td>
                <td>{new Date(p.created_at).toLocaleDateString()}</td>
                {user?.role === 'admin' && (
                  <td><button className="btn-danger btn-sm" onClick={() => handleDelete(p.id)}><i className="fa-solid fa-trash" /></button></td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payments;
