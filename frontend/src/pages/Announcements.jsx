import { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import toast from 'react-hot-toast';

const PRIORITY_COLORS = { urgent: '#e53e3e', normal: 'var(--primary)', info: '#3182ce' };
const PRIORITY_BG    = { urgent: '#fff5f5', normal: '#f0f0ff',          info: '#ebf8ff' };

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
  const [replies, setReplies] = useState({});         // { [announcementId]: reply[] }
  const [openReplies, setOpenReplies] = useState({}); // { [announcementId]: bool }
  const [replyText, setReplyText] = useState({});     // { [announcementId]: string }
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
      fetchNotifications(); // refresh bell immediately
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

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">📢 Announcements</h1>
        {canManage && (
          <button className="btn-primary" onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancel' : '+ New Announcement'}
          </button>
        )}
      </div>

      {canManage && showForm && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>New Announcement</h3>
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

      {items.length === 0 ? (
        <p className="no-results">📭 No announcements yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {items.map(item => {
            const color = PRIORITY_COLORS[item.priority] || 'var(--primary)';
            const bg    = PRIORITY_BG[item.priority]    || '#f0f0ff';
            const itemReplies = replies[item.id] || [];
            const isOpen = openReplies[item.id];

            return (
              <div key={item.id} className="card" style={{ borderLeft: `4px solid ${color}`, background: bg, padding: '1.25rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1rem', margin: 0 }}>{item.title}</h3>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color, background: color + '20', padding: '2px 8px', borderRadius: '999px', textTransform: 'uppercase' }}>
                        {item.priority}
                      </span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.6rem' }}>
                      By <strong>{item.created_by_name}</strong> · {timeAgo(item.created_at)}
                    </p>
                    <p style={{ fontSize: '0.92rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{item.message}</p>
                  </div>
                  {canManage && (
                    <button onClick={() => handleDelete(item.id)} className="btn-danger btn-sm" style={{ flexShrink: 0 }}>🗑</button>
                  )}
                </div>

                {/* Replies toggle */}
                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  <button className="btn-secondary btn-sm" onClick={() => toggleReplies(item.id)}>
                    💬 {isOpen ? 'Hide' : 'Show'} Replies {itemReplies.length > 0 ? `(${itemReplies.length})` : ''}
                  </button>

                  {isOpen && (
                    <div style={{ marginTop: '0.75rem' }}>
                      {/* Reply list */}
                      {itemReplies.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>No replies yet. Be the first!</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                          {itemReplies.map(reply => (
                            <div key={reply.id} className="ann-reply">
                              <div className="ann-reply-avatar">{reply.username.charAt(0).toUpperCase()}</div>
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

                      {/* Reply input */}
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
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Announcements;
