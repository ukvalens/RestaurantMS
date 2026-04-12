import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState({ table_id: '', items: [{ menu_item_id: '', quantity: 1, price: '', special_instructions: '' }] });
  const { user } = useAuth();

  const fetchOrders = async () => {
    const res = await api.get('/orders');
    setOrders(res.data);
  };

  useEffect(() => {
    fetchOrders();
    api.get('/tables').then(r => setTables(r.data.filter(t => t.status === 'available')));
    api.get('/menu/items').then(r => setMenuItems(r.data.filter(i => i.is_available)));
  }, []);

  const addItem = () => setForm({ ...form, items: [...form.items, { menu_item_id: '', quantity: 1, price: '', special_instructions: '' }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });

  const updateItem = (i, field, value) => {
    const updated = [...form.items];
    updated[i] = { ...updated[i], [field]: value };
    if (field === 'menu_item_id') {
      const found = menuItems.find(m => m.id === +value);
      if (found) updated[i].price = found.price;
    }
    setForm({ ...form, items: updated });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/orders', {
        table_id: +form.table_id,
        waiter_id: user.id,
        items: form.items.map(i => ({ ...i, menu_item_id: +i.menu_item_id, quantity: +i.quantity, price: +i.price }))
      });
      toast.success('Order created!');
      setShowForm(false);
      setForm({ table_id: '', items: [{ menu_item_id: '', quantity: 1, price: '', special_instructions: '' }] });
      fetchOrders();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/orders/${id}/status`, { status });
      toast.success('Status updated!');
      fetchOrders();
    } catch { toast.error('Failed'); }
  };

  const statuses = ['pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'];

  const filtered = orders.filter(o => {
    const matchSearch = o.id.toString().includes(search) ||
      o.table_number?.toString().includes(search) ||
      o.waiter_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus ? o.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Orders</h1>
        {['admin', 'manager', 'waiter'].includes(user?.role) && (
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>+ New Order</button>
        )}
      </div>

      {showForm && (
        <div className="card">
          <h2>New Order</h2>
          <form onSubmit={handleCreate}>
            <div className="form-grid">
              <select value={form.table_id} onChange={e => setForm({ ...form, table_id: e.target.value })} required>
                <option value="">Select Table</option>
                {tables.map(t => <option key={t.id} value={t.id}>Table {t.table_number} (cap: {t.capacity})</option>)}
              </select>
            </div>
            <h3 style={{ margin: '1rem 0 0.5rem' }}>Order Items</h3>
            {form.items.map((item, i) => (
              <div key={i} className="order-item-row">
                <select value={item.menu_item_id} onChange={e => updateItem(i, 'menu_item_id', e.target.value)} required>
                  <option value="">Select Item</option>
                  {menuItems.map(m => <option key={m.id} value={m.id}>{m.name} - ${m.price}</option>)}
                </select>
                <input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} required />
                <input placeholder="Special instructions" value={item.special_instructions} onChange={e => updateItem(i, 'special_instructions', e.target.value)} />
                {form.items.length > 1 && <button type="button" className="btn-danger btn-sm" onClick={() => removeItem(i)}>✕</button>}
              </div>
            ))}
            <div className="btn-group mt-1">
              <button type="button" className="btn-secondary" onClick={addItem}>+ Add Item</button>
              <button type="submit" className="btn-primary">Place Order</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <div className="menu-filters" style={{ marginBottom: '1rem' }}>
          <input placeholder="🔍 Search by order ID, table or waiter..." value={search}
            onChange={e => setSearch(e.target.value)} className="menu-search" />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {(search || filterStatus) && (
            <button className="btn-secondary btn-sm" onClick={() => { setSearch(''); setFilterStatus(''); }}>✕ Clear</button>
          )}
        </div>
        <p className="menu-count">{filtered.length} order{filtered.length !== 1 ? 's' : ''} found</p>
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Table</th><th>Waiter</th><th>Amount</th><th>Status</th><th>Update Status</th></tr>
          </thead>
          <tbody>
            {filtered.map(o => (
              <tr key={o.id}>
                <td>#{o.id}</td>
                <td>Table {o.table_number}</td>
                <td>{o.waiter_name}</td>
                <td>${parseFloat(o.total_amount).toFixed(2)}</td>
                <td><span className={`badge badge-${o.status}`}>{o.status}</span></td>
                <td>
                  <select value={o.status} onChange={e => updateStatus(o.id, e.target.value)} className="status-select">
                    {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;
