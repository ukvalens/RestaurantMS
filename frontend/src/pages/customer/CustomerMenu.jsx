import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const CustomerMenu = () => {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [tables, setTables] = useState([]);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [tableId, setTableId] = useState('');
  const [placing, setPlacing] = useState(false);
  const [viewImage, setViewImage] = useState(null);

  useEffect(() => {
    api.get('/menu/categories').then(r => setCategories(r.data));
    api.get('/menu/items').then(r => setItems(r.data.filter(i => i.is_available)));
    api.get('/tables').then(r => setTables(r.data.filter(t => t.status === 'available')));
  }, []);

  const filtered = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory ? item.category_id === +filterCategory : true;
    return matchSearch && matchCat;
  });

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { ...item, qty: 1, special_instructions: '' }];
    });
    toast.success(`${item.name} added to cart`);
  };

  const updateQty = (id, qty) => {
    if (qty < 1) return removeFromCart(id);
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty } : c));
  };

  const updateNote = (id, note) => setCart(prev => prev.map(c => c.id === id ? { ...c, special_instructions: note } : c));

  const removeFromCart = (id) => setCart(prev => prev.filter(c => c.id !== id));

  const cartTotal = cart.reduce((sum, c) => sum + parseFloat(c.price) * c.qty, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  const handlePlaceOrder = async () => {
    if (!tableId) return toast.error('Please select a table');
    if (cart.length === 0) return toast.error('Cart is empty');
    setPlacing(true);
    try {
      await api.post('/orders', {
        table_id: +tableId,
        waiter_id: user.id,
        items: cart.map(c => ({
          menu_item_id: c.id,
          quantity: c.qty,
          price: parseFloat(c.price),
          special_instructions: c.special_instructions,
        })),
      });
      toast.success('Order placed successfully!');
      setCart([]);
      setTableId('');
      setShowCart(false);
      api.get('/tables').then(r => setTables(r.data.filter(t => t.status === 'available')));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">🍽️ Our Menu</h1>
        <button className="btn-primary" onClick={() => setShowCart(true)} style={{ position: 'relative' }}>
          🛒 Cart {cartCount > 0 && <span className="role-badge" style={{ marginLeft: 4 }}>{cartCount}</span>}
        </button>
      </div>

      <div className="menu-filters">
        <input placeholder="🔍 Search by name or description..." value={search}
          onChange={e => setSearch(e.target.value)} className="menu-search" />
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {(search || filterCategory) && (
          <button className="btn-secondary btn-sm" onClick={() => { setSearch(''); setFilterCategory(''); }}>✕ Clear</button>
        )}
      </div>
      <p className="menu-count">{filtered.length} item{filtered.length !== 1 ? 's' : ''} found</p>

      <div className="menu-grid">
        {filtered.length === 0 ? (
          <p className="no-results">No items match your search.</p>
        ) : filtered.map(item => {
          const inCart = cart.find(c => c.id === item.id);
          return (
            <div key={item.id} className="menu-card">
              {item.image_url && <img src={item.image_url} alt={item.name} className="menu-img" onError={e => e.target.style.display = 'none'} />}
              <div className="menu-card-body">
                <span className="menu-category">{item.category_name}</span>
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <div className="menu-footer">
                  <strong>${parseFloat(item.price).toFixed(2)}</strong>
                  {inCart
                    ? <span className="badge badge-confirmed">In cart ×{inCart.qty}</span>
                    : <span className="badge badge-available">Available</span>}
                </div>
                <div className="btn-group mt-1">
                  {item.image_url && (
                    <button className="btn-secondary btn-sm" style={{ flexShrink: 0 }} onClick={() => setViewImage(item.image_url)}>🖼 View Image</button>
                  )}
                  <button className="btn-primary btn-sm" style={{ flex: 1, minWidth: 0 }} onClick={() => addToCart(item)}>+ Add to Cart</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Image Modal */}
      {viewImage && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setViewImage(null)}>
          <div style={{ background: 'white', borderRadius: 12, padding: '1rem', maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Item Image</span>
              <button className="btn-secondary btn-sm" onClick={() => setViewImage(null)}>✕ Close</button>
            </div>
            <img src={viewImage} alt="menu item" style={{ maxWidth: '70vw', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }} />
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex' }}>
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowCart(false)} />
          <div style={{ width: 420, background: 'white', display: 'flex', flexDirection: 'column', boxShadow: '-4px 0 20px rgba(0,0,0,0.15)', overflowY: 'auto' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.1rem' }}>🛒 Your Cart</h2>
              <button className="btn-secondary btn-sm" onClick={() => setShowCart(false)}>✕ Close</button>
            </div>

            <div style={{ flex: 1, padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {cart.length === 0 ? (
                <p className="no-results">Your cart is empty.</p>
              ) : cart.map(c => (
                <div key={c.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: 600 }}>{c.name}</span>
                    <button className="btn-danger btn-sm" onClick={() => removeFromCart(c.id)}>✕</button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <button className="btn-secondary btn-sm" onClick={() => updateQty(c.id, c.qty - 1)}>−</button>
                    <span style={{ minWidth: 24, textAlign: 'center' }}>{c.qty}</span>
                    <button className="btn-secondary btn-sm" onClick={() => updateQty(c.id, c.qty + 1)}>+</button>
                    <span style={{ marginLeft: 'auto', fontWeight: 600 }}>${(parseFloat(c.price) * c.qty).toFixed(2)}</span>
                  </div>
                  <input placeholder="Special instructions (optional)" value={c.special_instructions}
                    onChange={e => updateNote(c.id, e.target.value)}
                    style={{ fontSize: '0.82rem', padding: '0.4rem 0.6rem' }} />
                </div>
              ))}
            </div>

            {cart.length > 0 && (
              <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem' }}>
                  <span>Total</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="form-field">
                  <label className="form-label">Select Table</label>
                  <select value={tableId} onChange={e => setTableId(e.target.value)}>
                    <option value="">Choose a table...</option>
                    {tables.map(t => <option key={t.id} value={t.id}>Table {t.table_number} — Capacity: {t.capacity}</option>)}
                  </select>
                </div>
                <button className="btn-primary" onClick={handlePlaceOrder} disabled={placing}>
                  {placing ? 'Placing...' : '✅ Place Order'}
                </button>
                <button className="btn-danger btn-sm" onClick={() => setCart([])}>🗑 Clear Cart</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerMenu;
