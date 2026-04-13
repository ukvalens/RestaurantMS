import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

const PaymentSlip = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get(`/orders/${id}`),
      api.get('/payments').catch(() => ({ data: [] })),
    ]).then(([orderRes, payRes]) => {
      setData(orderRes.data);
      const paid = payRes.data.find(p => p.order_id === +id && p.payment_status === 'completed');
      setPayment(paid || null);
    }).catch(() => {
      toast.error('Failed to load slip');
      navigate(-1);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page"><p style={{ color: 'var(--text-muted)' }}>Loading slip...</p></div>;
  if (!data) return null;

  // Block access if payment not completed
  if (!payment) return (
    <div className="page">
      <div className="page-header no-print">
        <h1 className="page-title"><i className="fa-solid fa-receipt" style={{ marginRight: '0.5rem' }} />Payment Slip</h1>
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          <i className="fa-solid fa-arrow-left" style={{ marginRight: '0.4rem' }} />Back
        </button>
      </div>
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem' }}>
        <i className="fa-solid fa-clock" style={{ fontSize: '2.5rem', color: '#d97706', marginBottom: '1rem', display: 'block' }} />
        <h3 style={{ marginBottom: '0.5rem' }}>Payment Not Yet Approved</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Your payment slip will be available once the manager or admin approves your payment.
        </p>
      </div>
    </div>
  );

  const { order, items } = data;
  const subtotal = items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
  const tax = subtotal * 0.18;
  const total = subtotal + tax;
  const paidAt = new Date(payment.created_at);

  return (
    <div className="page">
      <div className="page-header no-print">
        <h1 className="page-title"><i className="fa-solid fa-receipt" style={{ marginRight: '0.5rem' }} />Payment Slip</h1>
        <div className="btn-group">
          <button className="btn-secondary" onClick={() => navigate(-1)}>
            <i className="fa-solid fa-arrow-left" style={{ marginRight: '0.4rem' }} />Back
          </button>
          <button className="btn-primary" onClick={() => window.print()}>
            <i className="fa-solid fa-print" style={{ marginRight: '0.4rem' }} />Print
          </button>
        </div>
      </div>

      <div className="slip-wrapper">
        {/* Header */}
        <div className="slip-header">
          <div className="slip-logo"><i className="fa-solid fa-utensils" /></div>
          <h2 className="slip-brand">RestaurantMS</h2>
          <p className="slip-tagline">Thank you for dining with us!</p>
        </div>

        <div className="slip-divider" />

        {/* Order info */}
        <div className="slip-meta">
          <div className="slip-meta-row"><span>Receipt #</span><strong>RMS-{payment.id}</strong></div>
          <div className="slip-meta-row"><span>Order #</span><strong>#{order.id}</strong></div>
          <div className="slip-meta-row"><span>Table</span><strong>Table {order.table_number || order.table_id}</strong></div>
          <div className="slip-meta-row"><span>Served by</span><strong>{order.waiter_name || '—'}</strong></div>
          <div className="slip-meta-row"><span>Date</span><strong>{paidAt.toLocaleDateString()}</strong></div>
          <div className="slip-meta-row"><span>Time</span><strong>{paidAt.toLocaleTimeString()}</strong></div>
        </div>

        <div className="slip-divider" />

        {/* Items */}
        <table className="slip-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Item</th>
              <th style={{ textAlign: 'center' }}>Qty</th>
              <th style={{ textAlign: 'right' }}>Price</th>
              <th style={{ textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i}>
                <td>
                  <div style={{ fontWeight: 500 }}>{it.name || 'Item'}</div>
                  {it.special_instructions && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{it.special_instructions}</div>
                  )}
                </td>
                <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                <td style={{ textAlign: 'right' }}>RWF {parseFloat(it.price).toFixed(0)}</td>
                <td style={{ textAlign: 'right' }}>RWF {(parseFloat(it.price) * it.quantity).toFixed(0)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="slip-divider" />

        {/* Totals */}
        <div className="slip-totals">
          <div className="slip-total-row"><span>Subtotal</span><span>RWF {subtotal.toFixed(0)}</span></div>
          <div className="slip-total-row"><span>VAT (18%)</span><span>RWF {tax.toFixed(0)}</span></div>
          <div className="slip-total-row slip-grand-total"><span>TOTAL PAID</span><span>RWF {total.toFixed(0)}</span></div>
        </div>

        <div className="slip-divider" />

        {/* Payment info */}
        <div className="slip-meta">
          <div className="slip-meta-row">
            <span>Payment Method</span>
            <strong style={{ textTransform: 'capitalize' }}>{payment.payment_method}</strong>
          </div>
          <div className="slip-meta-row">
            <span>Payment Status</span>
            <span className="badge badge-available"><i className="fa-solid fa-circle-check" style={{ marginRight: '0.25rem' }} />Completed</span>
          </div>
          {payment.transaction_id && (
            <div className="slip-meta-row"><span>Transaction ID</span><strong>{payment.transaction_id}</strong></div>
          )}
        </div>

        <div className="slip-divider" />

        {/* Footer */}
        <div className="slip-footer">
          <p><i className="fa-solid fa-circle-check" style={{ color: '#059669', marginRight: '0.4rem' }} />Payment confirmed. Thank you!</p>
          <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            RestaurantMS &bull; {paidAt.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSlip;
