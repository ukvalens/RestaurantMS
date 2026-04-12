import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PRIORITY_COLORS = { urgent: '#e53e3e', normal: 'var(--primary)', info: '#3182ce' };

const Announcements = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', message: '', priority: 'normal' });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const canManage = ['admin', 'manager'].includes(user?.role);

  const loadAnnouncements = async () => {
    try { const r = await api.get('/announcements'); setItems(r.data); } catch {}
  };

  useEffect(() => { loadAnnouncements(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/announcements', form);
      toast.success('Announcement posted!');
      setForm({ title: '', message: '', priority: 'normal' });
      setShowForm(false);
      loadAnnouncements();
    } catch { toast.error('Failed to post'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try { await api.delete(`/announcements/${id}`); toast.success('Deleted'); loadAnnouncements(); }
    catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>📢 Announcements</h1>
          <p className="page-subtitle">
            {canManage ? 'Post and manage announcements for your team.' : 'Stay updated with the latest announcements.'}
          </p>
        </div>
        {canManage && (
          <button className="btn-primary" onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancel' : '+ New Announcement'}
          </button>
        )}
      </div>

      {canManage && showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>New Announcement</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            <textarea placeholder="Message..." rows={4} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required style={{ resize: 'vertical' }} />
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option value="normal">🟢 Normal</option>
              <option value="info">🔵 Info</option>
              <option value="urgent">🔴 Urgent</option>
            </select>
            <button type="submit" className="btn-primary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
              {loading ? 'Posting...' : 'Post Announcement'}
            </button>
          </form>
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty-state">
          <p>📭 No announcements yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.map(item => (
            <div key={item.id} className="card" style={{ borderLeft: `4px solid ${PRIORITY_COLORS[item.priority] || 'var(--primary)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ marginBottom: '0.25rem' }}>{item.title}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                    By {item.created_by_name} · {new Date(item.created_at).toLocaleString()} ·{' '}
                    <span style={{ color: PRIORITY_COLORS[item.priority], fontWeight: 600, textTransform: 'capitalize' }}>{item.priority}</span>
                  </p>
                  <p>{item.message}</p>
                </div>
                {canManage && (
                  <button onClick={() => handleDelete(item.id)} className="btn-danger" style={{ marginLeft: '1rem', flexShrink: 0 }}>Delete</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Announcements;
