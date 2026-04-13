import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'];

const statusColor = {
  pending: '#d97706', assigned: '#2563eb', picked_up: '#7c3aed',
  in_transit: '#0891b2', delivered: '#059669', cancelled: '#dc2626',
};

const Deliveries = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState({
    delivery_address: '', delivery_fee: '', driver_id: '',
    customer_id: '', order_id: '', notes: ''
  });

  const canManage = ['admin', 'manager'].includes(user?.role);
  const isDriver = user?.role === 'delivery';

  const fetchAll = async () => {
    try {
      const [del, drv] = await Promise.all([
        api.get('/deliveries'),
        canManage || user?.role === 'waiter'
          ? api.get('/deliveries/drivers')
          : Promise.resolve({ data: [] })
      ]);
      setDeliveries(del.data);
      setDrivers(drv.data);
    } catch { toast.error('Failed to load deliveries'); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/deliveries', {
        ...form,
        delivery_fee: +form.delivery_fee || 0,
        driver_id: form.driver_id ? +form.driver_id : null,
        customer_id: form.customer_id ? +form.customer_id : null,
        order_id: form.order_id ? +form.order_id : null,
      });
      toast.success('Delivery created!');
      setForm({ delivery_address: '', delivery_fee: '', driver_id: '', customer_id: '', order_id: '', notes: '' });
      setShowForm(false);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/deliveries/${id}`, { status });
      toast.success('Status updated!');
      fetchAll();
    } catch { toast.error('Failed'); }
  };

  const assignDriver = async (id, driver_id) => {
    try {
      await api.put(`/deliveries/${id}`, {
        driver_id: driver_id ? +driver_id : null,
        status: driver_id ? 'assigned' : 'pending'
      });
      toast.success(driver_id ? 'Driver assigned!' : 'Driver removed!');
      fetchAll();
    } catch { toast.error('Failed'); }
  };

  const updateFee = async (id, delivery_fee) => {
    try {
      await api.put(`/deliveries/${id}`, { delivery_fee: +delivery_fee });
      toast.success('Fee updated!');
      fetchAll();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this delivery?')) return;
    try {
      await api.delete(`/deliveries/${id}`);
      toast.success('Deleted!');
      fetchAll();
    } catch { toast.error('Failed'); }
  };

  const filtered = deliveries.filter(d => {
    const q = search.toLowerCase();
    const matchSearch = d.id.toString().includes(q) ||
      d.delivery_address?.toLowerCase().includes(q) ||
      d.driver_name?.toLowerCase().includes(q) ||
      d.customer_name?.toLowerCase().includes(q);
    return matchSearch && (filterStatus ? d.status === filterStatus : true);
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Deliveries</h1>
        {!isDriver && (
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ New Delivery</button>
        )}
      </div>

      {showForm && !isDriver && (
        <div className="card">
          <h2>New Delivery</h2>
          <form onSubmit={handleCreate} className="form-grid">
            <input placeholder="Delivery Address" value={form.delivery_address}
              onChange={e => setForm({ ...form, delivery_address: e.target.value })} required />
            <input type="number" step="0.01" placeholder="Delivery Fee (RWF)" value={form.delivery_fee}
              onChange={e => setForm({ ...form, delivery_fee: e.target.value })} />
            <input type="number" placeholder="Order ID (optional)" value={form.order_id}
              onChange={e => setForm({ ...form, order_id: e.target.value })} />
            <input type="number" placeholder="Customer ID (optional)" value={form.customer_id}
              onChange={e => setForm({ ...form, customer_id: e.target.value })} />
            <select value={form.driver_id} onChange={e => setForm({ ...form, driver_id: e.target.value })}>
              <option value="">Assign Driver (optional)</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.username} — {d.email}</option>)}
            </select>
            <input placeholder="Notes (optional)" value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })} />
            <div className="btn-group">
              <button type="submit" className="btn-primary">Create</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="menu-filters" style={{ marginBottom: '0.75rem' }}>
        <input placeholder="Search by ID, address, driver or customer..."
          value={search} onChange={e => setSearch(e.target.value)} className="menu-search" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        {(search || filterStatus) && (
          <button className="btn-secondary btn-sm" onClick={() => { setSearch(''); setFilterStatus(''); }}>✕ Clear</button>
        )}
      </div>
      <p className="menu-count">{filtered.length} deliver{filtered.length !== 1 ? 'ies' : 'y'} found</p>

      {filtered.length === 0 && <p className="no-results">No deliveries found.</p>}

      {/* Mobile / Tablet cards — shown by default */}
      <div className="dv-cards">
        {filtered.map(d => (
          <div key={d.id} className="dv-card" style={{ borderLeft: `4px solid ${statusColor[d.status] || '#94a3b8'}` }}>
            <div className="dv-card-header">
              <span className="dv-card-id">#{d.id}</span>
              <span className={`badge badge-delivery-${d.status}`}>{d.status.replace(/_/g, ' ')}</span>
            </div>
            <p className="dv-card-address"><i className="fa-solid fa-location-dot" style={{ marginRight: '0.3rem' }} />{d.delivery_address}</p>
            <div className="dv-card-meta">
              <span><i className="fa-solid fa-user" style={{ marginRight: '0.3rem' }} />{d.customer_name || '—'}</span>
              <span><i className="fa-solid fa-car" style={{ marginRight: '0.3rem' }} />{d.driver_name || <em style={{ color: 'var(--text-muted)' }}>Unassigned</em>}</span>
              <span><i className="fa-solid fa-coins" style={{ marginRight: '0.3rem' }} />RWF {parseFloat(d.delivery_fee || 0).toFixed(0)}</span>
            </div>
            {d.notes && <p className="dv-card-notes"><i className="fa-solid fa-note-sticky" style={{ marginRight: '0.3rem' }} />{d.notes}</p>}
            <div className="dv-card-actions">
              {canManage && (
                <select value={d.driver_id || ''} onChange={e => assignDriver(d.id, e.target.value)} className="status-select">
                  <option value="">Unassigned</option>
                  {drivers.map(dr => <option key={dr.id} value={dr.id}>{dr.username}</option>)}
                </select>
              )}
              <select value={d.status} onChange={e => updateStatus(d.id, e.target.value)} className="status-select">
                {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
              {canManage && <FeeInput value={d.delivery_fee} onSave={fee => updateFee(d.id, fee)} />}
              {canManage && (
                <button className="btn-danger btn-sm" onClick={() => handleDelete(d.id)}><i className="fa-solid fa-trash" /> Delete</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table — hidden on mobile, shown on large screens */}
      <div className="dv-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Address</th><th>Customer</th><th>Driver</th>
              <th>Fee</th><th>Status</th>
              {canManage && <th>Assign Driver</th>}
              {canManage && <th>Update Fee</th>}
              <th>Update Status</th>
              {canManage && <th>Action</th>}
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id}>
                <td>#{d.id}</td>
                <td style={{ maxWidth: 180, wordBreak: 'break-word' }}>{d.delivery_address}</td>
                <td>{d.customer_name || '—'}</td>
                <td>{d.driver_name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                <td>RWF {parseFloat(d.delivery_fee || 0).toFixed(0)}</td>
                <td><span className={`badge badge-delivery-${d.status}`}>{d.status.replace(/_/g, ' ')}</span></td>
                {canManage && (
                  <td>
                    <select value={d.driver_id || ''} onChange={e => assignDriver(d.id, e.target.value)} className="status-select">
                      <option value="">Unassigned</option>
                      {drivers.map(dr => <option key={dr.id} value={dr.id}>{dr.username}</option>)}
                    </select>
                  </td>
                )}
                {canManage && (
                  <td><FeeInput value={d.delivery_fee} onSave={fee => updateFee(d.id, fee)} /></td>
                )}
                <td>
                  <select value={d.status} onChange={e => updateStatus(d.id, e.target.value)} className="status-select">
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </td>
                {canManage && (
                  <td><button className="btn-danger btn-sm" onClick={() => handleDelete(d.id)}><i className="fa-solid fa-trash" /></button></td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const FeeInput = ({ value, onSave }) => {
  const [val, setVal] = useState(parseFloat(value || 0).toFixed(0));
  return (
    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
      <input type="number" value={val} onChange={e => setVal(e.target.value)}
        style={{ width: 75, padding: '0.3rem 0.5rem', fontSize: '0.8rem' }} />
      <button className="btn-secondary btn-sm" onClick={() => onSave(val)}>✓</button>
    </div>
  );
};

export default Deliveries;
