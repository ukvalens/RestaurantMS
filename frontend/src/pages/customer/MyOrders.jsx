import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

const MyOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [details, setDetails] = useState({});

  const statuses = ['pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'];

  useEffect(() => {
    api.get('/orders').then(r => {
      setOrders(r.data.filter(o => o.waiter_id === user?.id));
    }).catch(() => {});
  }, [user]);

  const toggleDetail = async (id) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!details[id]) {
      try {
        const r = await api.get(`/orders/${id}`);
        setDetails(prev => ({ ...prev, [id]: r.data }));
      } catch {}
    }
  };

  const filtered = orders.filter(o => {
    const matchSearch = o.id.toString().includes(search) || o.table_number?.toString().includes(search);
    const matchStatus = filterStatus ? o.status === filterStatus : true;
    return matchSearch && matchStatus;
  });

  const statusStep = { pending: 0, preparing: 1, ready: 2, served: 3, completed: 4, cancelled: -1 };
  const STEPS = ['pending', 'preparing', 'ready', 'served', 'completed'];

  return (
    <div className="page">
      <h1 className="page-title"><i className="fa-solid fa-bag-shopping" style={{ marginRight: '0.5rem' }} />My Orders</h1>

      <div className="menu-filters" style={{ marginBottom: '1rem' }}>
        <input placeholder="Search by order ID or table..." value={search}
          onChange={e => setSearch(e.target.value)} className="menu-search" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Status</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {(search || filterStatus) && (
          <button className="btn-secondary btn-sm" onClick={() => { setSearch(''); setFilterStatus(''); }}>
            <i className="fa-solid fa-xmark" /> Clear
          </button>
        )}
      </div>

      <p className="menu-count">{filtered.length} order{filtered.length !== 1 ? 's' : ''}</p>

      {filtered.length === 0 ? (
        <p className="no-results">No orders found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map(o => {
            const step = statusStep[o.status];
            const isExpanded = expandedId === o.id;
            const detail = details[o.id];

            return (
              <div key={o.id} className="card" style={{ padding: '1rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <strong>Order #{o.id}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginLeft: '0.5rem' }}>
                      <i className="fa-solid fa-chair" style={{ marginRight: '0.25rem' }} />Table {o.table_number}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span className={`badge badge-${o.status}`}>{o.status}</span>
                    <strong style={{ color: 'var(--primary)' }}>RWF {parseFloat(o.total_amount).toFixed(0)}</strong>
                  </div>
                </div>

                {/* Progress bar */}
                {o.status !== 'cancelled' && (
                  <div style={{ display: 'flex', alignItems: 'center', margin: '0.75rem 0 0.5rem', gap: 0 }}>
                    {STEPS.map((s, i) => (
                      <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                        {i < STEPS.length - 1 && (
                          <div style={{ position: 'absolute', top: 7, left: '50%', width: '100%', height: 2, background: step > i ? 'var(--primary)' : 'var(--border)', zIndex: 0 }} />
                        )}
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: step >= i ? 'var(--primary)' : 'var(--border)', border: `2px solid ${step >= i ? 'var(--primary)' : 'var(--border)'}`, zIndex: 1, flexShrink: 0 }} />
                        <span style={{ fontSize: '0.6rem', color: step >= i ? 'var(--primary)' : 'var(--text-muted)', marginTop: '0.2rem', textAlign: 'center', fontWeight: step >= i ? 600 : 400 }}>
                          {s}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {o.status === 'cancelled' && (
                  <p style={{ color: '#dc2626', fontSize: '0.82rem', margin: '0.5rem 0' }}>
                    <i className="fa-solid fa-circle-xmark" style={{ marginRight: '0.3rem' }} />This order was cancelled.
                  </p>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                  <button className="btn-secondary btn-sm" onClick={() => toggleDetail(o.id)}>
                    <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'}`} style={{ marginRight: '0.3rem' }} />
                    {isExpanded ? 'Hide' : 'View'} Items
                  </button>
                  {['served', 'completed'].includes(o.status) && (
                    <button className="btn-primary btn-sm" onClick={() => navigate(`/app/orders/${o.id}/slip`)}>
                      <i className="fa-solid fa-receipt" style={{ marginRight: '0.3rem' }} />Payment Slip
                    </button>
                  )}
                </div>

                {/* Expanded items */}
                {isExpanded && (
                  <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                    {!detail ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading...</p>
                    ) : (
                      <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                          <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th><th>Notes</th></tr></thead>
                          <tbody>
                            {detail.items?.map((it, i) => (
                              <tr key={i}>
                                <td>{it.name || 'Item'}</td>
                                <td>{it.quantity}</td>
                                <td>RWF {parseFloat(it.price).toFixed(0)}</td>
                                <td>RWF {(parseFloat(it.price) * it.quantity).toFixed(0)}</td>
                                <td>{it.special_instructions || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <div style={{ textAlign: 'right', fontWeight: 700, marginTop: '0.5rem', color: 'var(--primary)' }}>
                          Total: RWF {detail.items?.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0).toFixed(0)}
                        </div>
                      </div>
                    )}
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

export default MyOrders;
