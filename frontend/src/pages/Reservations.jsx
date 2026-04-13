import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const STATUSES = ['pending', 'confirmed', 'cancelled', 'completed'];

const Reservations = () => {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editReservation, setEditReservation] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', customer_email: '', table_id: '', reservation_date: '', reservation_time: '', party_size: '', special_requests: '' });
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
    try { await api.put(`/reservations/${id}`, { status }); toast.success('Updated!'); fetchAll(); }
    catch { toast.error('Failed'); }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/reservations/${editReservation.id}`, { ...editReservation, table_id: +editReservation.table_id, party_size: +editReservation.party_size });
      toast.success('Reservation updated!');
      setEditReservation(null);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reservation?')) return;
    try { await api.delete(`/reservations/${id}`); toast.success('Deleted!'); fetchAll(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const filtered = reservations.filter(r => {
    const q = search.toLowerCase();
    return (r.customer_name.toLowerCase().includes(q) || r.customer_phone.includes(q) || r.customer_email?.toLowerCase().includes(q)) &&
      (filterStatus ? r.status === filterStatus : true) &&
      (filterDate ? r.reservation_date?.split('T')[0] === filterDate : true);
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
            <div className="btn-group">
              <button type="submit" className="btn-primary">Create</button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="menu-filters" style={{ marginBottom: '0.75rem' }}>
        <input placeholder="Search by name, phone or email..." value={search} onChange={e => setSearch(e.target.value)} className="menu-search" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ width: 'auto' }} />
        {(search || filterStatus || filterDate) && (
          <button className="btn-secondary btn-sm" onClick={() => { setSearch(''); setFilterStatus(''); setFilterDate(''); }}>✕ Clear</button>
        )}
      </div>
      <p className="menu-count">{filtered.length} reservation{filtered.length !== 1 ? 's' : ''} found</p>

      {/* Mobile cards */}
      <div className="rs-cards">
        {filtered.length === 0 ? <p className="no-results">No reservations found.</p> : filtered.map(r => (
          <div key={r.id} className="rs-card">
            <div className="rs-card-header">
              <div>
                <strong>{r.customer_name}</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>#{r.id}</span>
              </div>
              <span className={`badge badge-${r.status}`}>{r.status}</span>
            </div>
            <div className="rs-card-meta">
              <span><i className="fa-solid fa-phone" style={{ marginRight: '0.3rem' }} />{r.customer_phone}</span>
              <span><i className="fa-solid fa-chair" style={{ marginRight: '0.3rem' }} />Table {r.table_number}</span>
              <span><i className="fa-solid fa-users" style={{ marginRight: '0.3rem' }} />Party of {r.party_size}</span>
              <span><i className="fa-solid fa-calendar" style={{ marginRight: '0.3rem' }} />{r.reservation_date?.split('T')[0]}</span>
              <span><i className="fa-solid fa-clock" style={{ marginRight: '0.3rem' }} />{r.reservation_time}</span>
            </div>
            {canManage && (
              <div className="rs-card-actions">
                <select value={r.status} onChange={e => updateStatus(r.id, e.target.value)} className="status-select">
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button className="btn-secondary btn-sm" onClick={() => setEditReservation({ ...r, reservation_date: r.reservation_date?.split('T')[0] })}><i className="fa-solid fa-pen" /> Edit</button>
                <button className="btn-danger btn-sm" onClick={() => handleDelete(r.id)}><i className="fa-solid fa-trash" /></button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="rs-table-wrapper">
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Customer</th><th>Phone</th><th>Table</th><th>Date</th><th>Time</th><th>Party</th><th>Status</th>{canManage && <th>Update</th>}{canManage && <th>Actions</th>}</tr>
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
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                )}
                {canManage && (
                  <td>
                    <div className="btn-group">
                      <button className="btn-secondary btn-sm" onClick={() => setEditReservation({ ...r, reservation_date: r.reservation_date?.split('T')[0] })}>Edit</button>
                      <button className="btn-danger btn-sm" onClick={() => handleDelete(r.id)}><i className="fa-solid fa-trash" /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editReservation && canManage && (
        <div className="modal-overlay" onClick={() => setEditReservation(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Edit Reservation #{editReservation.id}</h2>
            <form onSubmit={handleEdit} className="form-grid">
              <input placeholder="Customer Name" value={editReservation.customer_name} onChange={e => setEditReservation({ ...editReservation, customer_name: e.target.value })} required />
              <input placeholder="Phone" value={editReservation.customer_phone} onChange={e => setEditReservation({ ...editReservation, customer_phone: e.target.value })} required />
              <input type="email" placeholder="Email" value={editReservation.customer_email || ''} onChange={e => setEditReservation({ ...editReservation, customer_email: e.target.value })} />
              <select value={editReservation.table_id} onChange={e => setEditReservation({ ...editReservation, table_id: e.target.value })} required>
                <option value="">Select Table</option>
                {tables.map(t => <option key={t.id} value={t.id}>Table {t.table_number} (cap: {t.capacity})</option>)}
              </select>
              <input type="date" value={editReservation.reservation_date} onChange={e => setEditReservation({ ...editReservation, reservation_date: e.target.value })} required />
              <input type="time" value={editReservation.reservation_time} onChange={e => setEditReservation({ ...editReservation, reservation_time: e.target.value })} required />
              <input type="number" placeholder="Party Size" value={editReservation.party_size} onChange={e => setEditReservation({ ...editReservation, party_size: e.target.value })} required />
              <input placeholder="Special Requests" value={editReservation.special_requests || ''} onChange={e => setEditReservation({ ...editReservation, special_requests: e.target.value })} />
              <select value={editReservation.status} onChange={e => setEditReservation({ ...editReservation, status: e.target.value })}>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="form-buttons">
                <button type="submit" className="btn-primary">Save Changes</button>
                <button type="button" className="btn-secondary" onClick={() => setEditReservation(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reservations;
