const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const tableRoutes = require('./routes/tableRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const announcementRoutes = require('./routes/announcementRoutes');
const pool = require('./config/database');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/', (req, res) => {
  res.json({ message: 'Restaurant Management System API' });
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'healthy', 
      timestamp: result.rows[0].now,
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      database: 'disconnected',
      error: error.message 
    });
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

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/announcements', announcementRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Restaurant Management System API' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
