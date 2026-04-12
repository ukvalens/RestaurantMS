import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Tables = () => {
  const [tables, setTables] = useState([]);
  const [form, setForm] = useState({ table_number: '', capacity: '' });
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;
  const { user } = useAuth();
  const canManage = ['admin', 'manager'].includes(user?.role);

  const fetchTables = async () => {
    const res = await api.get('/tables');
    setTables(res.data);
  };

  useEffect(() => { fetchTables(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tables', { table_number: form.table_number, capacity: +form.capacity });
      toast.success('Table created!');
      setForm({ table_number: '', capacity: '' });
      setShowForm(false);
      window.history.replaceState(null, '', window.location.pathname);
      fetchTables();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to create table'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/tables/${id}`, { status });
      toast.success('Status updated!');
      fetchTables();
    } catch { toast.error('Failed to update status'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this table?')) return;
    try {
      await api.delete(`/tables/${id}`);
      toast.success('Table deleted!');
      fetchTables();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to delete'); }
  };

  const statusColor = { available: '#059669', occupied: '#dc2626', reserved: '#d97706' };

  const filtered = tables.filter(t => {
    const matchSearch = t.table_number.toString().includes(search) || t.capacity.toString().includes(search);
    const matchStatus = filterStatus ? t.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Tables</h1>
        {canManage && <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ Add Table</button>}
      </div>

      {showForm && (
        <div className="card">
          <h2>New Table</h2>
          <form onSubmit={handleCreate} className="form-grid">
            <input type="text" placeholder="Table Number (e.g. T1, A2, VIP-1)" value={form.table_number}
              onChange={e => setForm({ ...form, table_number: e.target.value })} required />
            <input type="number" placeholder="Capacity" value={form.capacity}
              onChange={e => setForm({ ...form, capacity: e.target.value })} required />
            <button type="submit" className="btn-primary">Create</button>
          </form>
        </div>
      )}

      <div className="menu-filters">
        <input placeholder="🔍 Search by table number or capacity..." value={search}
          onChange={e => setSearch(e.target.value)} className="menu-search" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="available">Available</option>
          <option value="occupied">Occupied</option>
          <option value="reserved">Reserved</option>
        </select>
        {(search || filterStatus) && (
          <button className="btn-secondary btn-sm" onClick={() => { setSearch(''); setFilterStatus(''); }}>✕ Clear</button>
        )}
      </div>
      <p className="menu-count">{filtered.length} table{filtered.length !== 1 ? 's' : ''} found</p>

      <div className="tables-grid">
        {filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(t => (
          <div key={t.id} className="table-card" style={{ borderTop: `4px solid ${statusColor[t.status]}` }}>
            <h3>Table {t.table_number}</h3>
            <p>Capacity: {t.capacity}</p>
            <span className={`badge badge-${t.status}`}>{t.status}</span>
            {canManage && (
              <select value={t.status} onChange={e => updateStatus(t.id, e.target.value)} className="status-select">
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="reserved">Reserved</option>
              </select>
            )}
            {user?.role === 'admin' && (
              <button className="btn-danger btn-sm" style={{ marginTop: '0.5rem', width: '100%' }} onClick={() => handleDelete(t.id)}>🗑 Delete</button>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
        <button className="btn-secondary" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
        <span>Page {page} of {Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))}</span>
        <button className="btn-secondary" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(filtered.length / PAGE_SIZE)}>Next →</button>
      </div>
    </div>
  );
};

export default Tables;
