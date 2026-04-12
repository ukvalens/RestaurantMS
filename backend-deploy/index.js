process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const tableRoutes = require('./routes/tableRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const deliveryRoutes = require('./routes/deliveryRoutes');
const pool = require('./config/database');

const app = express();

app.use(cors({
  origin: ['https://frontend-rouge-omega-41.vercel.app', 'https://restaurant-ms-one.vercel.app', 'https://restaurant-management-system-kappa-eight.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

app.get('/', (req, res) => res.json({ message: 'Restaurant Management System API', version: '1.0' }));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'healthy', timestamp: result.rows[0].now, database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected', error: error.message });
  }
});

// Also expose health under /api prefix
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'healthy', timestamp: result.rows[0].now, database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected', error: error.message });
  }
});

// Test endpoint - check if user exists
app.post('/test-login', async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) return res.status(400).json({ error: 'Email required' });
    const normalizedEmail = email.trim().toLowerCase();
    const result = await pool.query('SELECT id, username, email, role FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
    
    if (result.rows.length === 0) {
      return res.json({ found: false, message: 'User not found in database' });
    }
    
    res.json({ 
      found: true, 
      user: result.rows[0],
      message: 'User exists in database'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Diagnostic endpoint - check users table schema and count
app.get('/db-info', async (req, res) => {
  try {
    // Check table exists and columns
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    // Count users
    const countResult = await pool.query('SELECT COUNT(*) as total FROM users');
    
    // Get first user (if exists)
    const firstUserResult = await pool.query('SELECT id, username, email, role FROM users LIMIT 1');
    
    res.json({
      schema: schemaResult.rows,
      totalUsers: countResult.rows[0],
      sampleUser: firstUserResult.rows[0] || null,
      message: 'Database diagnostic info'
    });
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/deliveries', deliveryRoutes);

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
