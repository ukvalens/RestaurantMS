import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', customer_email: '',
    table_id: '', reservation_date: '', reservation_time: '',
    party_size: '', special_requests: ''
  });
  const { user } = useAuth();
  const canManage = ['admin', 'manager'].includes(user?.role);

  const fetchAll = async () => {
    const [res, tabs] = await Promise.all([api.get('/reservations'), api.get('/tables')]);
    setReservations(res.data);
    setTables(tabs.data);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/reservations', { ...form, table_id: +form.table_id, party_size: +form.party_size });
      toast.success('Reservation created!');
      setShowForm(false);
      setForm({ customer_name: '', customer_phone: '', customer_email: '', table_id: '', reservation_date: '', reservation_time: '', party_size: '', special_requests: '' });
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/reservations/${id}/status`, { status });
      toast.success('Status updated!');
      fetchAll();
    } catch { toast.error('Failed'); }
  };

  const filtered = reservations.filter(r => {
    const matchSearch = r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      r.customer_phone.includes(search) ||
      r.customer_email?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus ? r.status === filterStatus : true;
    const matchDate = filterDate ? r.reservation_date?.split('T')[0] === filterDate : true;
    return matchSearch && matchStatus && matchDate;
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Reservations</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ New Reservation</button>
      </div>

      {showForm && (
        <div className="card">
          <h2>New Reservation</h2>
          <form onSubmit={handleCreate} className="form-grid">
            <input placeholder="Customer Name" value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} required />
            <input placeholder="Phone" value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} required />
            <input type="email" placeholder="Email (optional)" value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} />
            <select value={form.table_id} onChange={e => setForm({ ...form, table_id: e.target.value })} required>
              <option value="">Select Table</option>
              {tables.map(t => <option key={t.id} value={t.id}>Table {t.table_number} (cap: {t.capacity})</option>)}
            </select>
            <input type="date" value={form.reservation_date} onChange={e => setForm({ ...form, reservation_date: e.target.value })} required />
            <input type="time" value={form.reservation_time} onChange={e => setForm({ ...form, reservation_time: e.target.value })} required />
            <input type="number" placeholder="Party Size" value={form.party_size} onChange={e => setForm({ ...form, party_size: e.target.value })} required />
            <input placeholder="Special Requests" value={form.special_requests} onChange={e => setForm({ ...form, special_requests: e.target.value })} />
            <button type="submit" className="btn-primary">Create Reservation</button>
          </form>
        </div>
      )}

      <div className="card">
        <div className="menu-filters" style={{ marginBottom: '1rem' }}>
          <input placeholder="🔍 Search by name, phone or email..." value={search}
            onChange={e => setSearch(e.target.value)} className="menu-search" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            {['pending', 'confirmed', 'cancelled', 'completed'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ width: 'auto' }} />
          {(search || filterStatus || filterDate) && (
            <button className="btn-secondary btn-sm" onClick={() => { setSearch(''); setFilterStatus(''); setFilterDate(''); }}>✕ Clear</button>
          )}
        </div>
        <p className="menu-count">{filtered.length} reservation{filtered.length !== 1 ? 's' : ''} found</p>
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Customer</th><th>Phone</th><th>Table</th><th>Date</th><th>Time</th><th>Party</th><th>Status</th>{canManage && <th>Action</th>}</tr>
          </thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r.id}>
                <td>#{r.id}</td>
                <td>{r.customer_name}</td>
                <td>{r.customer_phone}</td>
                <td>Table {r.table_number}</td>
                <td>{r.reservation_date?.split('T')[0]}</td>
                <td>{r.reservation_time}</td>
                <td>{r.party_size}</td>
                <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                {canManage && (
                  <td>
                    <select value={r.status} onChange={e => updateStatus(r.id, e.target.value)} className="status-select">
                      {['pending', 'confirmed', 'cancelled', 'completed'].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reservations;
