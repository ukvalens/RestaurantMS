import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const STATUSES = ['pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'];

const statusColor = {
  pending: '#d97706', assigned: '#2563eb', picked_up: '#7c3aed',
  in_transit: '#0891b2', delivered: '#059669', cancelled: '#dc2626',
};

// Distance in km from Kigali Downtown (Nyarugenge) to each district center
// Source: approximate road distances
const RWANDA_DISTRICTS = {
  // Kigali City
  'Nyarugenge (Kigali)':    { province: 'Kigali', km: 1 },
  'Gasabo (Kigali)':        { province: 'Kigali', km: 6 },
  'Kicukiro (Kigali)':      { province: 'Kigali', km: 8 },
  // Eastern Province
  'Rwamagana':              { province: 'Eastern', km: 51 },
  'Bugesera':               { province: 'Eastern', km: 45 },
  'Gatsibo':                { province: 'Eastern', km: 105 },
  'Kayonza':                { province: 'Eastern', km: 88 },
  'Kirehe':                 { province: 'Eastern', km: 130 },
  'Ngoma':                  { province: 'Eastern', km: 95 },
  'Nyagatare':              { province: 'Eastern', km: 155 },
  'Rulindo':                { province: 'Eastern', km: 40 },
  // Western Province
  'Karongi':                { province: 'Western', km: 120 },
  'Ngororero':              { province: 'Western', km: 75 },
  'Nyabihu':                { province: 'Western', km: 100 },
  'Nyamasheke':             { province: 'Western', km: 165 },
  'Rubavu':                 { province: 'Western', km: 155 },
  'Rutsiro':                { province: 'Western', km: 110 },
  'Rusizi':                 { province: 'Western', km: 220 },
  // Northern Province
  'Burera':                 { province: 'Northern', km: 115 },
  'Gakenke':                { province: 'Northern', km: 85 },
  'Gicumbi':                { province: 'Northern', km: 55 },
  'Musanze':                { province: 'Northern', km: 110 },
  'Rulindo (Northern)':     { province: 'Northern', km: 40 },
  // Southern Province
  'Gisagara':               { province: 'Southern', km: 145 },
  'Huye':                   { province: 'Southern', km: 130 },
  'Kamonyi':                { province: 'Southern', km: 40 },
  'Muhanga':                { province: 'Southern', km: 55 },
  'Nyamagabe':              { province: 'Southern', km: 140 },
  'Nyanza':                 { province: 'Southern', km: 95 },
  'Nyaruguru':              { province: 'Southern', km: 165 },
  'Ruhango':                { province: 'Southern', km: 80 },
};

const BASE_FEE = 500;      // RWF base fee
const RATE_PER_KM = 10;    // RWF per km

const calcFee = (km) => Math.round(BASE_FEE + RATE_PER_KM * km);

// Group districts by province for the select
const PROVINCES = [...new Set(Object.values(RWANDA_DISTRICTS).map(d => d.province))];

const MyDeliveries = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [district, setDistrict] = useState('');
  const [sector, setSector] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const PER_PAGE = 2;

  const districtInfo = district ? RWANDA_DISTRICTS[district] : null;
  const fee = districtInfo ? calcFee(districtInfo.km) : 0;
  const fullAddress = district && streetAddress ? `${streetAddress}, ${district}, Rwanda` : '';

  const fetchDeliveries = async () => {
    try {
      const res = await api.get('/deliveries');
      setDeliveries(res.data);
    } catch { toast.error('Failed to load deliveries'); }
  };

  useEffect(() => { fetchDeliveries(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!district) return toast.error('Please select your district');
    if (!streetAddress.trim()) return toast.error('Please enter your street/sector address');
    setSubmitting(true);
    try {
      await api.post('/deliveries', {
        delivery_address: fullAddress,
        delivery_fee: fee,
        customer_id: user.id,
        notes: notes || null,
      });
      toast.success('Delivery request placed!');
      setDistrict('');
      setSector('');
      setStreetAddress('');
      setNotes('');
      setShowForm(false);
      fetchDeliveries();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="customer-page">
      <div className="page-header">
        <h1 className="page-title">🚚 My Deliveries</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Cancel' : '+ Request Delivery'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2>New Delivery Request</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            📍 Delivery from <strong>Kigali Downtown (Nyarugenge)</strong> to your location
          </p>

          <form onSubmit={handleCreate}>
            <div className="form-grid">
              {/* Province + District grouped select */}
              <div>
                <label className="form-label">District *</label>
                <select value={district} onChange={e => { setDistrict(e.target.value); setSector(''); }} required>
                  <option value="">Select District</option>
                  {PROVINCES.map(prov => (
                    <optgroup key={prov} label={`— ${prov} Province —`}>
                      {Object.entries(RWANDA_DISTRICTS)
                        .filter(([, v]) => v.province === prov)
                        .map(([name, v]) => (
                          <option key={name} value={name}>
                            {name} (~{v.km} km)
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* Street / Sector / Cell */}
              <div>
                <label className="form-label">Street / Sector / Cell *</label>
                <input
                  placeholder="e.g. Kimironko Sector, KG 123 St"
                  value={streetAddress}
                  onChange={e => setStreetAddress(e.target.value)}
                  required
                />
              </div>

              {/* Notes */}
              <div>
                <label className="form-label">Notes (optional)</label>
                <input
                  placeholder="Landmark, building name, floor..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Fee preview */}
            {district && (
              <div className="delivery-fee-preview">
                <div className="delivery-fee-row">
                  <span>📏 Distance</span>
                  <strong>~{districtInfo.km} km</strong>
                </div>
                <div className="delivery-fee-row">
                  <span>🏁 Base fee</span>
                  <span>RWF {BASE_FEE.toLocaleString()}</span>
                </div>
                <div className="delivery-fee-row">
                  <span>🛣️ Distance fee ({districtInfo.km} km × RWF {RATE_PER_KM})</span>
                  <span>RWF {(RATE_PER_KM * districtInfo.km).toLocaleString()}</span>
                </div>
                <div className="delivery-fee-row delivery-fee-total">
                  <span>💰 Total Delivery Fee</span>
                  <strong>RWF {fee.toLocaleString()}</strong>
                </div>
              </div>
            )}

            <div className="btn-group mt-1">
              <button type="submit" className="btn-primary" disabled={submitting || !district}>
                {submitting ? 'Placing...' : `✅ Place Request${district ? ` — RWF ${fee.toLocaleString()}` : ''}`}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {deliveries.length === 0 ? (
        <div className="card"><p className="no-results">No deliveries yet. Request one above!</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {deliveries.slice((page - 1) * PER_PAGE, page * PER_PAGE).map(d => (
            <div key={d.id} className="card" style={{ borderLeft: `4px solid ${statusColor[d.status] || '#94a3b8'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <strong>Delivery #{d.id}</strong>
                <span className={`badge badge-delivery-${d.status}`}>{d.status.replace(/_/g, ' ')}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.9rem' }}>
                <span>📍 <strong>Address:</strong> {d.delivery_address}</span>
                {d.driver_name && <span>🚗 <strong>Driver:</strong> {d.driver_name}</span>}
                <span>💰 <strong>Delivery Fee:</strong> <span style={{ color: 'var(--primary)', fontWeight: 700 }}>RWF {parseFloat(d.delivery_fee || 0).toLocaleString()}</span></span>
                {d.order_id && <span>📋 <strong>Order:</strong> #{d.order_id}</span>}
                {d.notes && <span>📝 <strong>Notes:</strong> {d.notes}</span>}
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  🕐 {new Date(d.created_at).toLocaleString()}
                </span>
              </div>

              {/* Progress tracker */}
              <div className="delivery-progress">
                {STATUSES.filter(s => s !== 'cancelled').map((s, i) => (
                  <div key={s} className={`delivery-step ${STATUSES.indexOf(d.status) >= i && d.status !== 'cancelled' ? 'active' : ''}`}>
                    <div className="delivery-step-dot" />
                    <span>{s.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
              {d.status === 'cancelled' && (
                <p style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '0.5rem' }}>❌ This delivery was cancelled.</p>
              )}
            </div>
          ))}
        </div>
      )}

      {deliveries.length > PER_PAGE && (
        <div className="pagination" style={{ marginTop: '1rem' }}>
          <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
          {Array.from({ length: Math.ceil(deliveries.length / PER_PAGE) }, (_, i) => (
            <button key={i} className={`page-btn ${page === i + 1 ? 'page-btn-active' : ''}`} onClick={() => setPage(i + 1)}>{i + 1}</button>
          ))}
          <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(deliveries.length / PER_PAGE)}>Next →</button>
        </div>
      )}
    </div>
  );
};

export default MyDeliveries;
