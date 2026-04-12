process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const multer = require('multer');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 1,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000,
});

app.use(cors({ origin: '*' }));
app.use(express.json());

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

// Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch { res.status(400).json({ error: 'Invalid token' }); }
};
const roleCheck = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'Access forbidden' });

// ── AUTH ──────────────────────────────────────────────────────────────────────
app.post('/auth/register', async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPassword = password?.trim();
    const normalizedUsername = username?.trim();
    
    if (!normalizedEmail || !normalizedPassword || !normalizedUsername || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (!normalizedEmail.includes('@')) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    if (normalizedPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    const hashed = await bcrypt.hash(normalizedPassword, 10);
    const r = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1,$2,$3,$4) RETURNING id,username,email,role',
      [normalizedUsername, normalizedEmail, hashed, role]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { 
    if (e.message.includes('duplicate key')) {
      res.status(409).json({ error: 'Email already registered' });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPassword = password?.trim();
    
    if (!normalizedEmail || !normalizedPassword) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const r = await pool.query('SELECT * FROM users WHERE LOWER(email)=$1', [normalizedEmail]);
    if (!r.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = r.rows[0];
    if (user.reset_pending) return res.status(403).json({ error: 'Password reset pending. Check your email.' });
    if (!await bcrypt.compare(normalizedPassword, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role, avatar_url: user.avatar_url } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const r = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (!r.rows.length) return res.status(404).json({ error: 'No account with that email' });
    await pool.query('UPDATE users SET reset_pending=true WHERE id=$1', [r.rows[0].id]);
    const token = jwt.sign({ id: r.rows[0].id }, process.env.JWT_SECRET + '_reset', { expiresIn: '1h' });
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
    await transporter.sendMail({ from: `RestaurantMS <${process.env.EMAIL_USER}>`, to: email, subject: 'Password Reset', html: `<a href="${resetUrl}">${resetUrl}</a>` });
    res.json({ message: 'Reset link sent to your email' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/auth/reset-password', async (req, res) => {
  const { token, password } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET + '_reset');
    const hashed = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password=$1, reset_pending=false WHERE id=$2', [hashed, decoded.id]);
    res.json({ message: 'Password reset successful' });
  } catch { res.status(400).json({ error: 'Invalid or expired token' }); }
});

app.put('/auth/profile', authMiddleware, async (req, res) => {
  const { username, email } = req.body;
  try {
    const r = await pool.query('UPDATE users SET username=$1,email=$2 WHERE id=$3 RETURNING id,username,email,role,avatar_url', [username, email, req.user.id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/auth/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const r = await pool.query('SELECT * FROM users WHERE id=$1', [req.user.id]);
    if (!await bcrypt.compare(currentPassword, r.rows[0].password)) return res.status(400).json({ error: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password=$1 WHERE id=$2', [hashed, req.user.id]);
    res.json({ message: 'Password changed successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/auth/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const r = await pool.query('UPDATE users SET avatar_url=$1 WHERE id=$2 RETURNING id,username,email,role,avatar_url', [base64, req.user.id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/auth/users', authMiddleware, roleCheck('admin'), async (req, res) => {
  try {
    const r = await pool.query('SELECT id,username,email,role,created_at FROM users ORDER BY created_at DESC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/auth/users', authMiddleware, roleCheck('admin'), async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const r = await pool.query('INSERT INTO users (username,email,password,role) VALUES ($1,$2,$3,$4) RETURNING id,username,email,role,created_at', [username, email, hashed, role]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/auth/users/:id', authMiddleware, roleCheck('admin'), async (req, res) => {
  const { username, email, role } = req.body;
  try {
    const r = await pool.query('UPDATE users SET username=$1,email=$2,role=$3 WHERE id=$4 RETURNING id,username,email,role,created_at', [username, email, role, req.params.id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/auth/users/:id', authMiddleware, roleCheck('admin'), async (req, res) => {
  try {
    if (+req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── MENU ──────────────────────────────────────────────────────────────────────
app.get('/menu/categories', authMiddleware, async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM menu_categories ORDER BY name')).rows); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/menu/categories', authMiddleware, roleCheck('admin', 'manager'), async (req, res) => {
  const { name, description } = req.body;
  try {
    const r = await pool.query('INSERT INTO menu_categories (name,description) VALUES ($1,$2) RETURNING *', [name, description]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/menu/items', authMiddleware, async (req, res) => {
  try {
    const r = await pool.query('SELECT mi.*,mc.name as category_name FROM menu_items mi LEFT JOIN menu_categories mc ON mi.category_id=mc.id ORDER BY mc.name,mi.name');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/menu/items', authMiddleware, roleCheck('admin', 'manager'), async (req, res) => {
  const { category_id, name, description, price, image_url } = req.body;
  try {
    const r = await pool.query('INSERT INTO menu_items (category_id,name,description,price,image_url) VALUES ($1,$2,$3,$4,$5) RETURNING *', [category_id, name, description, price, image_url]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/menu/items/:id', authMiddleware, roleCheck('admin', 'manager'), async (req, res) => {
  const { name, description, price, is_available } = req.body;
  try {
    const r = await pool.query('UPDATE menu_items SET name=$1,description=$2,price=$3,is_available=$4 WHERE id=$5 RETURNING *', [name, description, price, is_available, req.params.id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/menu/items/:id', authMiddleware, roleCheck('admin', 'manager'), async (req, res) => {
  try {
    await pool.query('UPDATE order_items SET menu_item_id=NULL WHERE menu_item_id=$1', [req.params.id]);
    await pool.query('DELETE FROM menu_items WHERE id=$1', [req.params.id]);
    res.json({ message: 'Menu item deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── TABLES ────────────────────────────────────────────────────────────────────
app.get('/tables', authMiddleware, async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM tables ORDER BY table_number')).rows); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/tables', authMiddleware, roleCheck('admin', 'manager'), async (req, res) => {
  const { table_number, capacity } = req.body;
  try {
    const r = await pool.query('INSERT INTO tables (table_number,capacity) VALUES ($1,$2) RETURNING *', [table_number, capacity]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/tables/:id', authMiddleware, async (req, res) => {
  const { status } = req.body;
  try {
    const r = await pool.query('UPDATE tables SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ORDERS ────────────────────────────────────────────────────────────────────
app.get('/orders', authMiddleware, async (req, res) => {
  try {
    const r = await pool.query('SELECT o.*,t.table_number,u.username as waiter_name FROM orders o LEFT JOIN tables t ON o.table_id=t.id LEFT JOIN users u ON o.waiter_id=u.id ORDER BY o.created_at DESC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/orders/:id', authMiddleware, async (req, res) => {
  try {
    const order = await pool.query('SELECT * FROM orders WHERE id=$1', [req.params.id]);
    const items = await pool.query('SELECT oi.*,mi.name FROM order_items oi LEFT JOIN menu_items mi ON oi.menu_item_id=mi.id WHERE oi.order_id=$1', [req.params.id]);
    res.json({ order: order.rows[0], items: items.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/orders', authMiddleware, async (req, res) => {
  const { table_id, waiter_id, items } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const order = (await client.query('INSERT INTO orders (table_id,waiter_id) VALUES ($1,$2) RETURNING *', [table_id, waiter_id])).rows[0];
    let total = 0;
    for (const item of items) {
      await client.query('INSERT INTO order_items (order_id,menu_item_id,quantity,price,special_instructions) VALUES ($1,$2,$3,$4,$5)', [order.id, item.menu_item_id, item.quantity, item.price, item.special_instructions]);
      total += item.price * item.quantity;
    }
    await client.query('UPDATE orders SET total_amount=$1 WHERE id=$2', [total, order.id]);
    await client.query('UPDATE tables SET status=$1 WHERE id=$2', ['occupied', table_id]);
    await client.query('COMMIT');
    res.status(201).json({ ...order, total_amount: total });
  } catch (e) { await client.query('ROLLBACK'); res.status(500).json({ error: e.message }); }
  finally { client.release(); }
});

app.put('/orders/:id', authMiddleware, async (req, res) => {
  const { status } = req.body;
  try {
    const r = await pool.query('UPDATE orders SET status=$1,updated_at=CURRENT_TIMESTAMP WHERE id=$2 RETURNING *', [status, req.params.id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── RESERVATIONS ──────────────────────────────────────────────────────────────
app.get('/reservations', authMiddleware, async (req, res) => {
  try {
    const r = await pool.query('SELECT r.*,t.table_number FROM reservations r LEFT JOIN tables t ON r.table_id=t.id ORDER BY r.reservation_date,r.reservation_time');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/reservations', authMiddleware, async (req, res) => {
  const { customer_name, customer_phone, customer_email, table_id, reservation_date, reservation_time, party_size, special_requests } = req.body;
  try {
    const r = await pool.query(
      'INSERT INTO reservations (customer_name,customer_phone,customer_email,table_id,reservation_date,reservation_time,party_size,special_requests) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [customer_name, customer_phone, customer_email, table_id, reservation_date, reservation_time, party_size, special_requests]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/reservations/:id', authMiddleware, async (req, res) => {
  const { status } = req.body;
  try {
    const r = await pool.query('UPDATE reservations SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PAYMENTS ──────────────────────────────────────────────────────────────────
app.get('/payments', authMiddleware, roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const r = await pool.query('SELECT p.*,o.table_id FROM payments p LEFT JOIN orders o ON p.order_id=o.id ORDER BY p.created_at DESC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/payments', authMiddleware, async (req, res) => {
  const { order_id, amount, payment_method, transaction_id } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = (await client.query('INSERT INTO payments (order_id,amount,payment_method,payment_status,transaction_id) VALUES ($1,$2,$3,$4,$5) RETURNING *', [order_id, amount, payment_method, 'completed', transaction_id])).rows[0];
    await client.query('UPDATE orders SET status=$1 WHERE id=$2', ['completed', order_id]);
    const o = await client.query('SELECT table_id FROM orders WHERE id=$1', [order_id]);
    if (o.rows[0]?.table_id) await client.query('UPDATE tables SET status=$1 WHERE id=$2', ['available', o.rows[0].table_id]);
    await client.query('COMMIT');
    res.status(201).json(r);
  } catch (e) { await client.query('ROLLBACK'); res.status(500).json({ error: e.message }); }
  finally { client.release(); }
});

// ── ANNOUNCEMENTS ─────────────────────────────────────────────────────────────
const ensureAnnouncementsTable = () => pool.query(`CREATE TABLE IF NOT EXISTS announcements (id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, message TEXT NOT NULL, priority VARCHAR(20) DEFAULT 'normal', created_by INTEGER, created_by_name VARCHAR(100), created_at TIMESTAMP DEFAULT NOW())`);

app.get('/announcements', authMiddleware, async (req, res) => {
  try {
    await ensureAnnouncementsTable();
    res.json((await pool.query('SELECT * FROM announcements ORDER BY created_at DESC')).rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/announcements', authMiddleware, roleCheck('admin', 'manager'), async (req, res) => {
  const { title, message, priority = 'normal' } = req.body;
  try {
    await ensureAnnouncementsTable();
    if (!title || !message) return res.status(400).json({ error: 'Title and message are required' });
    const r = await pool.query('INSERT INTO announcements (title,message,priority,created_by,created_by_name) VALUES ($1,$2,$3,$4,$5) RETURNING *', [title, message, priority, req.user.id, req.user.username]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/announcements/:id', authMiddleware, roleCheck('admin', 'manager'), async (req, res) => {
  try {
    await pool.query('DELETE FROM announcements WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = app;
