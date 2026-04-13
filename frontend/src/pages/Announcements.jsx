import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import toast from 'react-hot-toast';

const PRIORITY_COLORS = { urgent: '#e53e3e', normal: '#4f46e5', info: '#3182ce' };
const PRIORITY_BG     = { urgent: '#fff5f5', normal: '#f5f3ff', info:  '#ebf8ff' };
const PRIORITY_ICON   = { urgent: '🔴', normal: '🟢', info: '🔵' };

const timeAgo = (date) => {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
};

const Announcements = () => {
  const { user } = useAuth();
  const { fetchNotifications } = useNotifications();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', message: '', priority: 'normal' });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [replies, setReplies] = useState({});
  const [openReplies, setOpenReplies] = useState({});
  const [replyText, setReplyText] = useState({});
  const [replyLoading, setReplyLoading] = useState({});
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
      fetchNotifications();
    } catch { toast.error('Failed to post'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    try { await api.delete(`/announcements/${id}`); toast.success('Deleted'); loadAnnouncements(); }
    catch { toast.error('Failed to delete'); }
  };

  const toggleReplies = async (id) => {
    const nowOpen = !openReplies[id];
    setOpenReplies(prev => ({ ...prev, [id]: nowOpen }));
    if (nowOpen && !replies[id]) {
      try {
        const r = await api.get(`/announcements/${id}/replies`);
        setReplies(prev => ({ ...prev, [id]: r.data }));
      } catch {}
    }
  };

  const submitReply = async (id) => {
    const msg = replyText[id]?.trim();
    if (!msg) return;
    setReplyLoading(prev => ({ ...prev, [id]: true }));
    try {
      const r = await api.post(`/announcements/${id}/replies`, { message: msg });
      setReplies(prev => ({ ...prev, [id]: [...(prev[id] || []), r.data] }));
      setReplyText(prev => ({ ...prev, [id]: '' }));
    } catch { toast.error('Failed to send reply'); }
    finally { setReplyLoading(prev => ({ ...prev, [id]: false })); }
  };

  const deleteReply = async (announcementId, replyId) => {
    try {
      await api.delete(`/announcements/${announcementId}/replies/${replyId}`);
      setReplies(prev => ({ ...prev, [announcementId]: prev[announcementId].filter(r => r.id !== replyId) }));
    } catch { toast.error('Failed to delete reply'); }
  };

  // Sort: urgent first, then by date desc
  const sorted = [...items].sort((a, b) => {
    const p = { urgent: 0, info: 1, normal: 2 };
    if (p[a.priority] !== p[b.priority]) return p[a.priority] - p[b.priority];
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const displayed = showAll ? sorted : sorted.slice(0, 3);

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📢 Announcements</h1>
        {canManage && (
          <button className="btn-primary" onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancel' : '+ New'}
          </button>
        )}
      </div>

      {/* New announcement form */}
      {canManage && showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 700 }}>New Announcement</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
            <textarea placeholder="Message..." rows={4} value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })} required style={{ resize: 'vertical' }} />
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

      {/* Count + show all toggle */}
      {items.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <p className="menu-count">{items.length} announcement{items.length !== 1 ? 's' : ''}</p>
          {items.length > 3 && (
            <button className="btn-secondary btn-sm" onClick={() => setShowAll(v => !v)}>
              {showAll ? '▲ Show Less' : `▼ Show All (${items.length})`}
            </button>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <p className="no-results">📭 No announcements yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {displayed.map((item, idx) => {
            const color      = PRIORITY_COLORS[item.priority] || '#4f46e5';
            const bg         = PRIORITY_BG[item.priority]     || '#f5f3ff';
            const icon       = PRIORITY_ICON[item.priority]   || '📢';
            const itemReplies = replies[item.id] || [];
            const isOpen     = openReplies[item.id];
            const isTop      = idx < 3 && !showAll;

            return (
              <div key={item.id} className="ann-card" style={{ borderLeft: `4px solid ${color}`, background: bg }}>
                {/* Top badge for first 3 */}
                {isTop && idx === 0 && (
                  <div className="ann-top-badge" style={{ background: color }}>📌 Latest</div>
                )}

                {/* Card header */}
                <div className="ann-card-header">
                  <div className="ann-card-title-row">
                    <span className="ann-priority-icon">{icon}</span>
                    <h3 className="ann-card-title">{item.title}</h3>
                    <span className="ann-priority-badge" style={{ color, background: color + '18', border: `1px solid ${color}30` }}>
                      {item.priority}
                    </span>
                  </div>
                  <div className="ann-card-meta">
                    <span>👤 <strong>{item.created_by_name}</strong></span>
                    <span>🕐 {timeAgo(item.created_at)}</span>
                  </div>
                </div>

                {/* Message */}
                <p className="ann-card-message">{item.message}</p>

                {/* Footer */}
                <div className="ann-card-footer">
                  <button className="btn-secondary btn-sm" onClick={() => toggleReplies(item.id)}>
                    💬 {isOpen ? 'Hide' : 'Reply'}{itemReplies.length > 0 ? ` (${itemReplies.length})` : ''}
                  </button>
                  {canManage && (
                    <button className="btn-danger btn-sm" onClick={() => handleDelete(item.id)}>🗑 Delete</button>
                  )}
                </div>

                {/* Replies */}
                {isOpen && (
                  <div className="ann-replies-section">
                    {itemReplies.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem' }}>No replies yet. Be the first!</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        {itemReplies.map(reply => (
                          <div key={reply.id} className="ann-reply">
                            <div className="ann-reply-avatar">{reply.username.slice(0, 2).toUpperCase()}</div>
                            <div className="ann-reply-body">
                              <div className="ann-reply-meta">
                                <strong>{reply.username}</strong>
                                <span>{timeAgo(reply.created_at)}</span>
                              </div>
                              <p className="ann-reply-text">{reply.message}</p>
                            </div>
                            {(canManage || reply.user_id === user?.id) && (
                              <button className="ann-reply-del" onClick={() => deleteReply(item.id, reply.id)}>✕</button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="ann-reply-input">
                      <input
                        placeholder="Write a reply..."
                        value={replyText[item.id] || ''}
                        onChange={e => setReplyText(prev => ({ ...prev, [item.id]: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && !e.shiftKey && submitReply(item.id)}
                      />
                      <button className="btn-primary btn-sm" onClick={() => submitReply(item.id)}
                        disabled={replyLoading[item.id] || !replyText[item.id]?.trim()}>
                        {replyLoading[item.id] ? '...' : 'Send'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Announcements;
