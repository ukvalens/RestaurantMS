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

  useEffect(() => {
    fetchUsers();
  }, []);

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
        await axios.put(`/auth/users/${editingId}`, {
          username: formData.username,
          email: formData.email,
          role: formData.role,
        });
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
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/auth/users/${id}`);
        toast.success('User deleted successfully');
        fetchUsers();
      } catch (error) {
        toast.error(error.response?.data?.error || 'Failed to delete user');
      }
    }
  };

  const handleResetPassword = async (userId) => {
    if (!resetPasswordValue) {
      toast.error('Please enter a new password');
      return;
    }
    try {
      await axios.post('/auth/reset-user-password', {
        userId: userId,
        newPassword: resetPasswordValue,
      });
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

  if (loading) return <div className="content"><p>Loading...</p></div>;

  return (
    <div className="content">
      <h1>👥 User Management</h1>
      
      <button className="btn btn-primary" onClick={() => setShowForm(true)}>
        ➕ Add New User
      </button>

      {showForm && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Edit User' : 'Create New User'}</h2>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              {!editingId && (
                <input
                  type="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              )}
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              >
                <option value="waiter">Waiter</option>
                <option value="chef">Chef</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              <div className="form-buttons">
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Update' : 'Create'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {resetPasswordUser && (
        <div className="modal-overlay" onClick={() => setResetPasswordUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>🔐 Reset Password for {resetPasswordUser.username}</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleResetPassword(resetPasswordUser.id); }}>
              <input
                type="password"
                placeholder="New Password"
                value={resetPasswordValue}
                onChange={(e) => setResetPasswordValue(e.target.value)}
                required
                minLength="6"
              />
              <small style={{ color: '#64748b' }}>Password must be at least 6 characters</small>
              <div className="form-buttons" style={{ marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary">
                  Reset Password
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => setResetPasswordUser(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table className="users-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td><span className="role-badge">{user.role}</span></td>
              <td>{new Date(user.created_at).toLocaleDateString()}</td>
              <td>
                <button className="btn btn-sm btn-info" onClick={() => handleEdit(user)}>
                  ✎ Edit
                </button>
                <button className="btn btn-sm btn-warning" onClick={() => setResetPasswordUser(user)}>
                  🔐 Reset Pass
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => handleDelete(user.id)}>
                  🗑 Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Users;
