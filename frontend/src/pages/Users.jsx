import { useEffect, useState } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ROLES = ['customer', 'waiter', 'delivery', 'manager', 'admin'];

const roleBadgeColor = {
  admin: '#4f46e5', manager: '#0891b2', waiter: '#059669',
  delivery: '#d97706', customer: '#64748b',
};

const PERM_LABELS = {
  dashboard: '📊 Dashboard', tables: '🪑 Tables', menu: '🍽️ Menu',
  orders: '📦 Orders', reservations: '📅 Reservations', payments: '💳 Payments',
  users: '👥 Users', deliveries: '🚚 Deliveries', announcements: '📢 Announcements',
  reports: '📈 Reports', reserve: '📅 Make Reservation', 'my-reservations': '📋 My Reservations',
  'my-orders': '🛒 My Orders', 'my-deliveries': '🚚 My Deliveries',
};

const STAFF_PERMS = ['dashboard','tables','menu','orders','reservations','payments','users','deliveries','announcements','reports'];
const CUSTOMER_PERMS = ['dashboard','menu','reserve','my-reservations','my-orders','my-deliveries','announcements'];

const Users = () => {
  const { refreshPermissions } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'waiter' });
  const [resetUser, setResetUser] = useState(null);
  const [resetValue, setResetValue] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 6;

  // Permissions state
  const [permissions, setPermissions] = useState({});
  const [allPerms, setAllPerms] = useState([]);
  const [permRole, setPermRole] = useState('waiter');
  const [permSaving, setPermSaving] = useState(false);

  useEffect(() => { fetchUsers(); fetchPermissions(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/auth/users');
      setUsers(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to fetch users');
    } finally { setLoading(false); }
  };

  const fetchPermissions = async () => {
    try {
      const res = await axios.get('/auth/permissions');
      setPermissions(res.data.permissions);
      setAllPerms(res.data.allPermissions);
    } catch { /* silent */ }
  };

  const togglePerm = (perm) => {
    const cur = permissions[permRole] || [];
    setPermissions(prev => ({
      ...prev,
      [permRole]: cur.includes(perm) ? cur.filter(p => p !== perm) : [...cur, perm],
    }));
  };

  const savePermissions = async () => {
    setPermSaving(true);
    try {
      await axios.put('/auth/permissions', { role: permRole, permissions: permissions[permRole] || [] });
      await refreshPermissions();
      toast.success(`Permissions updated for ${permRole}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally { setPermSaving(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/auth/users/${editingId}`, { username: formData.username, email: formData.email, role: formData.role });
        toast.success('User updated!');
      } else {
        await axios.post('/auth/users', formData);
        toast.success('User created!');
      }
      closeForm();
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.error || 'Operation failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await axios.delete(`/auth/users/${id}`);
      toast.success('User deleted!');
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetValue) return toast.error('Enter a new password');
    try {
      await axios.post('/auth/reset-user-password', { userId: resetUser.id, newPassword: resetValue });
      toast.success('Password reset!');
      setResetUser(null);
      setResetValue('');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const openEdit = (user) => {
    setFormData({ username: user.username, email: user.email, password: '', role: user.role });
    setEditingId(user.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ username: '', email: '', password: '', role: 'waiter' });
  };

  const filtered = users.filter(u => {
    const matchSearch = u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole ? u.role === filterRole : true;
    return matchSearch && matchRole;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const roleCounts = ROLES.reduce((acc, r) => ({ ...acc, [r]: users.filter(u => u.role === r).length }), {});

  const availablePerms = permRole === 'customer' ? CUSTOMER_PERMS : STAFF_PERMS;
  const curPerms = permissions[permRole] || [];

  if (loading) return <div className="page"><p style={{ color: 'var(--text-muted)' }}>Loading users...</p></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">👥 User Management</h1>
        {activeTab === 'users' && (
          <button className="btn-primary" onClick={() => { closeForm(); setShowForm(true); }}>➕ Add User</button>
        )}
      </div>

      {/* Main tabs */}
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        <button className={`tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
          👥 Users ({users.length})
        </button>
        <button className={`tab ${activeTab === 'permissions' ? 'active' : ''}`} onClick={() => setActiveTab('permissions')}>
          🔐 Role Permissions
        </button>
      </div>

      {/* ── USERS TAB ── */}
      {activeTab === 'users' && (<>
        <div className="um-role-summary">
          {ROLES.map(r => (
            <button key={r} className={`um-role-chip ${filterRole === r ? 'active' : ''}`}
              style={{ '--chip-color': roleBadgeColor[r] }}
              onClick={() => { setFilterRole(filterRole === r ? '' : r); setPage(1); }}>
              <span className="um-role-chip-dot" />
              {r} <strong>{roleCounts[r]}</strong>
            </button>
          ))}
          <button className={`um-role-chip ${!filterRole ? 'active' : ''}`}
            style={{ '--chip-color': '#4f46e5' }}
            onClick={() => { setFilterRole(''); setPage(1); }}>
            all <strong>{users.length}</strong>
          </button>
        </div>

        <div className="um-search-bar">
          <input placeholder="🔍 Search by username or email..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          {(search || filterRole) && (
            <button className="btn-secondary btn-sm" onClick={() => { setSearch(''); setFilterRole(''); setPage(1); }}>✕ Clear</button>
          )}
        </div>

        <p className="menu-count">{filtered.length} user{filtered.length !== 1 ? 's' : ''} found</p>

        {/* Desktop table */}
        <div className="um-table-wrapper">
          <table className="um-table">
            <thead>
              <tr><th>#</th><th>User</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No users found.</td></tr>
              ) : paged.map(user => (
                <tr key={user.id}>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{user.id}</td>
                  <td><strong>{user.username}</strong></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user.email}</td>
                  <td>
                    <span className="um-role-badge" style={{ background: roleBadgeColor[user.role] + '20', color: roleBadgeColor[user.role], border: `1px solid ${roleBadgeColor[user.role]}40` }}>
                      {user.role}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="um-actions">
                      <button className="um-btn-edit" onClick={() => openEdit(user)}>✎ Edit</button>
                      <button className="um-btn-reset" onClick={() => setResetUser(user)}>🔐 Reset</button>
                      <button className="um-btn-delete" onClick={() => handleDelete(user.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="um-cards">
          {paged.length === 0 ? (
            <p className="no-results">No users found.</p>
          ) : paged.map(user => (
            <div key={user.id} className="um-card">
              <div className="um-card-top">
                <div className="um-card-avatar" style={{ background: roleBadgeColor[user.role] + '20', color: roleBadgeColor[user.role] }}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="um-card-info">
                  <strong>{user.username}</strong>
                  <span className="um-card-email">{user.email}</span>
                </div>
                <span className="um-role-badge" style={{ background: roleBadgeColor[user.role] + '20', color: roleBadgeColor[user.role], border: `1px solid ${roleBadgeColor[user.role]}40` }}>
                  {user.role}
                </span>
              </div>
              <div className="um-card-meta">
                <span>#{user.id}</span>
                <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
              </div>
              <div className="um-card-actions">
                <button className="um-btn-edit" onClick={() => openEdit(user)}>✎ Edit</button>
                <button className="um-btn-reset" onClick={() => setResetUser(user)}>🔐 Reset Pass</button>
                <button className="um-btn-delete" onClick={() => handleDelete(user.id)}>🗑 Delete</button>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="um-pagination">
            <button className="btn-secondary btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
            <div className="um-page-nums">
              {Array.from({ length: totalPages }, (_, i) => (
                <button key={i} className={`um-page-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>
                  {i + 1}
                </button>
              ))}
            </div>
            <button className="btn-secondary btn-sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>Next →</button>
          </div>
        )}
      </>)}

      {/* ── PERMISSIONS TAB ── */}
      {activeTab === 'permissions' && (
        <div className="card">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
            Define which pages and features each role can access. Changes take effect on next login.
          </p>

          {/* Role selector */}
          <div className="perm-role-tabs">
            {ROLES.map(r => (
              <button key={r} className={`perm-role-tab ${permRole === r ? 'active' : ''}`}
                style={{ '--role-color': roleBadgeColor[r] }}
                onClick={() => setPermRole(r)}>
                <span className="perm-role-dot" style={{ background: roleBadgeColor[r] }} />
                {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          {/* Permission grid */}
          <div className="perm-grid">
            {availablePerms.map(perm => {
              const checked = curPerms.includes(perm);
              return (
                <label key={perm} className={`perm-item ${checked ? 'checked' : ''}`}>
                  <input type="checkbox" checked={checked} onChange={() => togglePerm(perm)} />
                  <span className="perm-item-label">{PERM_LABELS[perm] || perm}</span>
                </label>
              );
            })}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1.5rem' }}>
            <button className="btn-primary" onClick={savePermissions} disabled={permSaving}>
              {permSaving ? 'Saving...' : '💾 Save Permissions'}
            </button>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {curPerms.length} of {availablePerms.length} permissions enabled for <strong>{permRole}</strong>
            </span>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editingId ? '✎ Edit User' : '➕ Create User'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="um-form-field">
                <label>Username</label>
                <input type="text" placeholder="Username" value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })} required />
              </div>
              <div className="um-form-field">
                <label>Email</label>
                <input type="email" placeholder="Email" value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })} required />
              </div>
              {!editingId && (
                <div className="um-form-field">
                  <label>Password</label>
                  <input type="password" placeholder="Min. 6 characters" value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })} required minLength={6} />
                </div>
              )}
              <div className="um-form-field">
                <label>Role</label>
                <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-buttons">
                <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Create'}</button>
                <button type="button" className="btn-secondary" onClick={closeForm}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetUser && (
        <div className="modal-overlay" onClick={() => setResetUser(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>🔐 Reset Password</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Setting new password for <strong>{resetUser.username}</strong>
            </p>
            <form onSubmit={handleResetPassword}>
              <div className="um-form-field">
                <label>New Password</label>
                <input type="password" placeholder="Min. 6 characters" value={resetValue}
                  onChange={e => setResetValue(e.target.value)} required minLength={6} />
              </div>
              <div className="form-buttons">
                <button type="submit" className="btn-primary">Reset Password</button>
                <button type="button" className="btn-secondary" onClick={() => setResetUser(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
