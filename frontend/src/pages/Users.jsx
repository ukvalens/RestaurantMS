import { useEffect, useState } from 'react';
import axios from '../api/axios';
import toast from 'react-hot-toast';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', role: 'waiter' });
  const [resetPasswordUser, setResetPasswordUser] = useState(null);
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/auth/users');
      setUsers(response.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/auth/users/${editingId}`, { username: formData.username, email: formData.email, role: formData.role });
        toast.success('User updated successfully');
      } else {
        await axios.post('/auth/users', formData);
        toast.success('User created successfully');
      }
      setFormData({ username: '', email: '', password: '', role: 'waiter' });
      setEditingId(null);
      setShowForm(false);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleEdit = (user) => {
    setFormData({ username: user.username, email: user.email, password: '', role: user.role });
    setEditingId(user.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await axios.delete(`/auth/users/${id}`);
      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  const handleResetPassword = async (userId) => {
    if (!resetPasswordValue) return toast.error('Please enter a new password');
    try {
      await axios.post('/auth/reset-user-password', { userId, newPassword: resetPasswordValue });
      toast.success('Password reset successfully');
      setResetPasswordUser(null);
      setResetPasswordValue('');
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reset password');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ username: '', email: '', password: '', role: 'waiter' });
  };

  const paged = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(users.length / PAGE_SIZE);

  if (loading) return <div className="page"><p>Loading...</p></div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">👥 User Management</h1>
        <button className="btn-primary" onClick={() => setShowForm(true)}>➕ Add New User</button>
      </div>

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editingId ? 'Edit User' : 'Create New User'}</h2>
            <form onSubmit={handleSubmit}>
              <input type="text" placeholder="Username" value={formData.username}
                onChange={e => setFormData({ ...formData, username: e.target.value })} required />
              <input type="email" placeholder="Email" value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })} required />
              {!editingId && (
                <input type="password" placeholder="Password" value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })} required />
              )}
              <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                <option value="customer">Customer</option>
                <option value="waiter">Waiter</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <div className="form-buttons">
                <button type="submit" className="btn-primary">{editingId ? 'Update' : 'Create'}</button>
                <button type="button" className="btn-secondary" onClick={handleCancel}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordUser && (
        <div className="modal-overlay" onClick={() => setResetPasswordUser(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>🔐 Reset Password for {resetPasswordUser.username}</h2>
            <form onSubmit={e => { e.preventDefault(); handleResetPassword(resetPasswordUser.id); }}>
              <input type="password" placeholder="New Password" value={resetPasswordValue}
                onChange={e => setResetPasswordValue(e.target.value)} required minLength="6" />
              <small style={{ color: 'var(--text-muted)' }}>Minimum 6 characters</small>
              <div className="form-buttons">
                <button type="submit" className="btn-primary">Reset Password</button>
                <button type="button" className="btn-secondary" onClick={() => setResetPasswordUser(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Desktop table */}
      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th><th>Username</th><th>Email</th><th>Role</th><th>Created</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.map(user => (
              <tr key={user.id}>
                <td>{user.id}</td>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td><span className="role-badge">{user.role}</span></td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="user-actions">
                    <button className="btn-secondary btn-sm" onClick={() => handleEdit(user)}>✎ Edit</button>
                    <button className="btn-warning btn-sm" onClick={() => setResetPasswordUser(user)}>🔐 Reset</button>
                    <button className="btn-danger btn-sm" onClick={() => handleDelete(user.id)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="users-card-list">
        {paged.map(user => (
          <div key={user.id} className="user-card">
            <div className="user-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <strong>{user.username}</strong>
                <span className="role-badge">{user.role}</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>#{user.id}</span>
            </div>
            <div className="user-card-email">{user.email}</div>
            <div className="user-card-date">{new Date(user.created_at).toLocaleDateString()}</div>
            <div className="user-card-actions">
              <button className="btn-secondary btn-sm" onClick={() => handleEdit(user)}>✎ Edit</button>
              <button className="btn-warning btn-sm" onClick={() => setResetPasswordUser(user)}>🔐 Reset Pass</button>
              <button className="btn-danger btn-sm" onClick={() => handleDelete(user.id)}>🗑 Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn-secondary" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
        <span>Page {page} of {totalPages || 1}</span>
        <button className="btn-secondary" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}>Next →</button>
      </div>
    </div>
  );
};

export default Users;
