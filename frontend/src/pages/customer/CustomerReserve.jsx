import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import toast from 'react-hot-toast';

const CustomerReserve = () => {
  const { user } = useAuth();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    customer_name: user?.username || '',
    customer_phone: '',
    customer_email: user?.email || '',
    table_id: '',
    reservation_date: '',
    reservation_time: '',
    party_size: '',
    special_requests: '',
  });

  useEffect(() => {
    api.get('/tables').then(r => setTables(r.data.filter(t => t.status === 'available')));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/reservations', { ...form, table_id: +form.table_id, party_size: +form.party_size });
      toast.success('Table booked successfully!');
      setForm({ customer_name: user?.username || '', customer_phone: '', customer_email: user?.email || '', table_id: '', reservation_date: '', reservation_time: '', party_size: '', special_requests: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to book table');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">📅 Make a Reservation</h1>
      <div className="card" style={{ maxWidth: 560 }}>
        <form onSubmit={handleSubmit} className="form-grid">
          <div className="form-field">
            <label className="form-label">Your Name</label>
            <input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} required />
          </div>
          <div className="form-field">
            <label className="form-label">Phone</label>
            <input value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} required />
          </div>
          <div className="form-field">
            <label className="form-label">Email</label>
            <input type="email" value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} />
          </div>
          <div className="form-field">
            <label className="form-label">Table</label>
            <select value={form.table_id} onChange={e => setForm({ ...form, table_id: e.target.value })} required>
              <option value="">Select a Table</option>
              {tables.map(t => <option key={t.id} value={t.id}>Table {t.table_number} — Capacity: {t.capacity}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label className="form-label">Date</label>
            <input type="date" value={form.reservation_date} onChange={e => setForm({ ...form, reservation_date: e.target.value })} required />
          </div>
          <div className="form-field">
            <label className="form-label">Time</label>
            <input type="time" value={form.reservation_time} onChange={e => setForm({ ...form, reservation_time: e.target.value })} required />
          </div>
          <div className="form-field">
            <label className="form-label">Party Size</label>
            <input type="number" min="1" value={form.party_size} onChange={e => setForm({ ...form, party_size: e.target.value })} required />
          </div>
          <div className="form-field">
            <label className="form-label">Special Requests</label>
            <input value={form.special_requests} onChange={e => setForm({ ...form, special_requests: e.target.value })} placeholder="Optional" />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ gridColumn: '1 / -1' }}>
            {loading ? 'Booking...' : '📅 Book Table'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomerReserve;
