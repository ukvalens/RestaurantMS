import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const ROLES = ['admin', 'manager', 'waiter', 'chef', 'customer'];

const Settings = () => {
  const [tab, setTab] = useState('users');

  // User Management
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [userPage, setUserPage] = useState(1);
  const USERS_PER_PAGE = 5;
  const [showUserForm, setShowUserForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [userForm, setUserForm] = useState({ username: '', email: '', password: '', role: 'waiter' });

  // Restaurant Info
  const [restaurant, setRestaurant] = useState({ name: 'RestaurantMS', email: '', phone: '', address: '' });
  const [savingInfo, setSavingInfo] = useState(false);

  // System stats
  const [stats, setStats] = useState({ users: 0, orders: 0, reservations: 0, payments: 0, tables: 0, menuItems: 0 });

  const fetchUsers = () => api.get('/auth/users').then(r => setUsers(r.data)).catch(() => {});

  const fetchStats = async () => {
    try {
      const [orders, reservations, payments, tables, menu] = await Promise.all([
        api.get('/orders'), api.get('/reservations'), api.get('/payments'),
        api.get('/tables'), api.get('/menu/items'),
      ]);
      setStats({
        orders: orders.data.length,
        reservations: reservations.data.length,
        payments: payments.data.length,
        tables: tables.data.length,
        menuItems: menu.data.length,
      });
    } catch {}
  };

  useEffect(() => { fetchUsers(); fetchStats(); }, []);

  const allFilteredUsers = users.filter(u => {
    const matchSearch = u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole ? u.role === filterRole : true;
    return matchSearch && matchRole;
  });
  const totalUserPages = Math.ceil(allFilteredUsers.length / USERS_PER_PAGE);
  const filteredUsers = allFilteredUsers.slice((userPage - 1) * USERS_PER_PAGE, userPage * USERS_PER_PAGE);

  const openCreate = () => {
    setEditUser(null);
    setUserForm({ username: '', email: '', password: '', role: 'waiter' });
    setShowUserForm(true);
  };

  const openEdit = (u) => {
    setEditUser(u);
    setUserForm({ username: u.username, email: u.email, password: '', role: u.role });
    setShowUserForm(true);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editUser) {
        await api.put(`/auth/users/${editUser.id}`, { username: userForm.username, email: userForm.email, role: userForm.role });
        toast.success('User updated!');
      } else {
        await api.post('/auth/users', userForm);
        toast.success('User created!');
      }
      setShowUserForm(false);
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.delete(`/auth/users/${id}`);
      toast.success('User deleted!');
      fetchUsers();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handleSaveInfo = (e) => {
    e.preventDefault();
    setSavingInfo(true);
    setTimeout(() => { toast.success('Settings saved!'); setSavingInfo(false); }, 600);
  };

  return (
    <div className="page">
      <h1 className="page-title">⚙️ Settings</h1>

      <div className="tabs">
        <button className={tab === 'users' ? 'tab active' : 'tab'} onClick={() => setTab('users')}>👥 User Management</button>
        <button className={tab === 'info' ? 'tab active' : 'tab'} onClick={() => setTab('info')}>🏠 Restaurant Info</button>
        <button className={tab === 'system' ? 'tab active' : 'tab'} onClick={() => setTab('system')}>📊 System Overview</button>
      </div>

      {/* ── USER MANAGEMENT ── */}
      {tab === 'users' && (
        <>
          <div className="page-header">
            <div />
            <button className="btn-primary" onClick={openCreate}>+ Add User</button>
          </div>

          {showUserForm && (
            <div className="card">
              <h2>{editUser ? 'Edit User' : 'New User'}</h2>
              <form onSubmit={handleUserSubmit} className="form-grid" style={{ marginTop: '1rem' }}>
                <div className="form-field">
                  <label className="form-label">Username</label>
                  <input value={userForm.username} onChange={e => setUserForm({ ...userForm, username: e.target.value })} required />
                </div>
                <div className="form-field">
                  <label className="form-label">Email</label>
                  <input type="email" value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} required />
                </div>
                {!editUser && (
                  <div className="form-field">
                    <label className="form-label">Password</label>
                    <input type="password" value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} required minLength={6} />
                  </div>
                )}
                <div className="form-field">
                  <label className="form-label">Role</label>
                  <select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="btn-group" style={{ gridColumn: '1 / -1' }}>
                  <button type="submit" className="btn-primary">{editUser ? 'Update' : 'Create'}</button>
                  <button type="button" className="btn-secondary" onClick={() => setShowUserForm(false)}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="card">
            <div className="menu-filters" style={{ marginBottom: '1rem' }}>
              <input placeholder="🔍 Search by name or email..." value={search}
                onChange={e => { setSearch(e.target.value); setUserPage(1); }} className="menu-search" />
              <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setUserPage(1); }}>
                <option value="">All Roles</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {(search || filterRole) && (
                <button className="btn-secondary btn-sm" onClick={() => { setSearch(''); setFilterRole(''); setUserPage(1); }}>✕ Clear</button>
              )}
            </div>
            <p className="menu-count">{allFilteredUsers.length} user{allFilteredUsers.length !== 1 ? 's' : ''}</p>
            <table className="data-table">
              <thead>
                <tr><th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td><span className="role-badge">{u.role}</span></td>
                    <td>{u.created_at?.split('T')[0]}</td>
                    <td>
                      <div className="btn-group">
                        <button className="btn-secondary btn-sm" onClick={() => openEdit(u)}>Edit</button>
                        <button className="btn-danger btn-sm" onClick={() => handleDeleteUser(u.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalUserPages > 1 && (
              <div className="pagination">
                <button className="page-btn" onClick={() => setUserPage(p => p - 1)} disabled={userPage === 1}>← Prev</button>
                {Array.from({ length: totalUserPages }, (_, i) => (
                  <button key={i + 1} className={`page-btn ${userPage === i + 1 ? 'page-btn-active' : ''}`}
                    onClick={() => setUserPage(i + 1)}>{i + 1}</button>
                ))}
                <button className="page-btn" onClick={() => setUserPage(p => p + 1)} disabled={userPage === totalUserPages}>Next →</button>
              </div>
            )}
            <p className="menu-count" style={{ marginTop: '0.5rem' }}>
              Showing {allFilteredUsers.length === 0 ? 0 : (userPage - 1) * USERS_PER_PAGE + 1}–{Math.min(userPage * USERS_PER_PAGE, allFilteredUsers.length)} of {allFilteredUsers.length}
            </p>
          </div>
        </>
      )}

      {/* ── RESTAURANT INFO ── */}
      {tab === 'info' && (
        <div className="card" style={{ maxWidth: 520 }}>
          <h2>Restaurant Info</h2>
          <form onSubmit={handleSaveInfo} className="profile-form" style={{ marginTop: '1rem' }}>
            <div className="form-field">
              <label className="form-label">Restaurant Name</label>
              <input value={restaurant.name} onChange={e => setRestaurant({ ...restaurant, name: e.target.value })} required />
            </div>
            <div className="form-field">
              <label className="form-label">Contact Email</label>
              <input type="email" value={restaurant.email} onChange={e => setRestaurant({ ...restaurant, email: e.target.value })} placeholder="contact@restaurant.com" />
            </div>
            <div className="form-field">
              <label className="form-label">Phone</label>
              <input value={restaurant.phone} onChange={e => setRestaurant({ ...restaurant, phone: e.target.value })} placeholder="+1 234 567 890" />
            </div>
            <div className="form-field">
              <label className="form-label">Address</label>
              <input value={restaurant.address} onChange={e => setRestaurant({ ...restaurant, address: e.target.value })} placeholder="123 Main St, City" />
            </div>
            <button type="submit" className="btn-primary" disabled={savingInfo} style={{ alignSelf: 'flex-start' }}>
              {savingInfo ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* ── SYSTEM OVERVIEW ── */}
      {tab === 'system' && (
        <>
          <div className="stats-grid">
            <div className="stat-card" style={{ borderLeft: '4px solid #4f46e5' }}>
              <div className="stat-icon">👥</div>
              <div><p className="stat-label">Total Users</p><h3 className="stat-value">{users.length}</h3></div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #059669' }}>
              <div className="stat-icon">📋</div>
              <div><p className="stat-label">Total Orders</p><h3 className="stat-value">{stats.orders}</h3></div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #d97706' }}>
              <div className="stat-icon">📅</div>
              <div><p className="stat-label">Reservations</p><h3 className="stat-value">{stats.reservations}</h3></div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #dc2626' }}>
              <div className="stat-icon">💳</div>
              <div><p className="stat-label">Payments</p><h3 className="stat-value">{stats.payments}</h3></div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #7c3aed' }}>
              <div className="stat-icon">🪑</div>
              <div><p className="stat-label">Tables</p><h3 className="stat-value">{stats.tables}</h3></div>
            </div>
            <div className="stat-card" style={{ borderLeft: '4px solid #0891b2' }}>
              <div className="stat-icon">🍽️</div>
              <div><p className="stat-label">Menu Items</p><h3 className="stat-value">{stats.menuItems}</h3></div>
            </div>
          </div>

          <div className="card">
            <h2>Role Distribution</h2>
            <table className="data-table" style={{ marginTop: '0.5rem' }}>
              <thead>
                <tr><th>Role</th><th>Count</th></tr>
              </thead>
              <tbody>
                {ROLES.map(r => (
                  <tr key={r}>
                    <td><span className="role-badge">{r}</span></td>
                    <td>{users.filter(u => u.role === r).length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Settings;
