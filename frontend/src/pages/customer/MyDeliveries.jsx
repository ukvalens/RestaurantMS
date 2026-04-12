import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const STATUSES = ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'];

const statusColor = {
  pending: '#d97706', assigned: '#2563eb', picked_up: '#7c3aed',
  in_transit: '#0891b2', delivered: '#059669', cancelled: '#dc2626'
};

const MyDeliveries = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ delivery_address: '', notes: '' });

  const fetchDeliveries = async () => {
    try {
      const res = await api.get('/deliveries');
      setDeliveries(res.data);
    } catch { toast.error('Failed to load deliveries'); }
  };

  useEffect(() => { fetchDeliveries(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/deliveries', { ...form, customer_id: user.id });
      toast.success('Delivery request placed!');
      setForm({ delivery_address: '', notes: '' });
      setShowForm(false);
      fetchDeliveries();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  return (
    <div className="customer-page">
      <div className="page-header">
        <h1 className="page-title">🚚 My Deliveries</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Request Delivery</button>
      </div>

      {showForm && (
        <div className="card">
          <h2>New Delivery Request</h2>
          <form onSubmit={handleCreate} className="form-grid">
            <input placeholder="Delivery Address" value={form.delivery_address}
              onChange={e => setForm({ ...form, delivery_address: e.target.value })} required />
            <input placeholder="Notes (optional)" value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })} />
            <div className="btn-group">
              <button type="submit" className="btn-primary">Submit Request</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {deliveries.length === 0 ? (
        <div className="card"><p className="no-results">No deliveries yet. Request one above!</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {deliveries.map(d => (
            <div key={d.id} className="card" style={{ borderLeft: `4px solid ${statusColor[d.status] || '#94a3b8'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <strong>Delivery #{d.id}</strong>
                <span className={`badge badge-delivery-${d.status}`}>{d.status.replace('_', ' ')}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.9rem' }}>
                <span>📍 <strong>Address:</strong> {d.delivery_address}</span>
                {d.driver_name && <span>🚗 <strong>Driver:</strong> {d.driver_name}</span>}
                <span>💰 <strong>Fee:</strong> RWF {parseFloat(d.delivery_fee || 0).toFixed(0)}</span>
                {d.order_id && <span>📋 <strong>Order:</strong> #{d.order_id}</span>}
                {d.notes && <span>📝 <strong>Notes:</strong> {d.notes}</span>}
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  🕐 {new Date(d.created_at).toLocaleString()}
                </span>
              </div>
              {/* Progress tracker */}
              <div className="delivery-progress">
                {STATUSES.filter(s => s !== 'cancelled').map((s, i) => (
                  <div key={s} className={`delivery-step ${STATUSES.indexOf(d.status) >= i && d.status !== 'cancelled' ? 'active' : ''}`}>
                    <div className="delivery-step-dot" />
                    <span>{s.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
              {d.status === 'cancelled' && (
                <p style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.5rem' }}>❌ This delivery was cancelled.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDeliveries;
