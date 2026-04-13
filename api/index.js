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
  max: 20,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

app.use(cors({ origin: '*' }));
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const ext = file.originalname.split('.').pop().toLowerCase();
    cb(null, allowed.test(ext));
  },
});

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

const r = express.Router();
app.use('/api', r);
app.use('/', r);

r.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ db: 'connected', jwt: !!process.env.JWT_SECRET, dbUrl: !!process.env.DATABASE_URL });
  } catch (e) {
    res.json({ db: 'failed', error: e.message, jwt: !!process.env.JWT_SECRET, dbUrl: !!process.env.DATABASE_URL });
  }
});

r.get('/db-info', async (req, res) => {
  try {
    const schemaResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    const countResult = await pool.query('SELECT COUNT(*) as total FROM users');
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

// ── AUTH ──────────────────────────────────────────────────────────────────────
r.post('/auth/register', async (req, res) => {
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
    createNotification('new_user', '👤 New User Registered', `${normalizedUsername} (${normalizedEmail}) just created a ${role} account. Review their role and permissions.`, 'admin', '/app/users');
  } catch (e) { 
    if (e.message.includes('duplicate key')) {
      res.status(409).json({ error: 'Email already registered' });
    } else {
      res.status(500).json({ error: e.message });
    }
  }
});

r.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPassword = password?.trim();
    
    if (!normalizedEmail || !normalizedPassword) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const r2 = await pool.query('SELECT * FROM users WHERE email = $1 OR LOWER(email) = $1', [normalizedEmail]);
    if (!r2.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = r2.rows[0];
    if (user.reset_pending) return res.status(403).json({ error: 'Password reset pending. Check your email.' });
    const valid = await bcrypt.compare(normalizedPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role, avatar_url: user.avatar_url } });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.post('/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const r = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (!r.rows.length) return res.status(404).json({ error: 'No account with that email' });
    await pool.query('UPDATE users SET reset_pending=true WHERE id=$1', [r.rows[0].id]);
    const token = jwt.sign({ id: r.rows[0].id }, process.env.JWT_SECRET + '_reset', { expiresIn: '1h' });
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
    await transporter.sendMail({
      from: `RestaurantMS <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Reset Your RestaurantMS Password',
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">

        <!-- Header -->
        <tr><td style="background:#1e1b4b;border-radius:12px 12px 0 0;padding:32px 40px;text-align:center">
          <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px">
            &#127860; RestaurantMS
          </h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.65);font-size:13px">Restaurant Management System</p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;padding:40px">
          <h2 style="margin:0 0 8px;color:#1e293b;font-size:20px;font-weight:700">Password Reset Request</h2>
          <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6">
            Hi <strong style="color:#1e293b">${r.rows[0].username}</strong>,<br><br>
            We received a request to reset the password for your RestaurantMS account.
            Click the button below to set a new password. This link expires in <strong>1 hour</strong>.
          </p>

          <!-- CTA Button -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0 32px">
              <a href="${resetUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:10px;letter-spacing:0.02em">
                Reset My Password
              </a>
            </td></tr>
          </table>

          <!-- Divider -->
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 24px">

          <p style="margin:0 0 8px;color:#64748b;font-size:13px;line-height:1.6">
            If the button doesn't work, copy and paste this link into your browser:
          </p>
          <p style="margin:0 0 24px;word-break:break-all">
            <a href="${resetUrl}" style="color:#4f46e5;font-size:13px">${resetUrl}</a>
          </p>

          <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6">
            If you didn't request a password reset, you can safely ignore this email.
            Your password will remain unchanged.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#f8fafc;border-radius:0 0 12px 12px;padding:24px 40px;text-align:center;border-top:1px solid #e2e8f0">
          <p style="margin:0 0 4px;color:#94a3b8;font-size:12px">&copy; ${new Date().getFullYear()} RestaurantMS &mdash; All rights reserved</p>
          <p style="margin:0;color:#94a3b8;font-size:12px">This is an automated message, please do not reply.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
    });
    res.json({ message: 'Reset link sent to your email' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.post('/auth/reset-password', async (req, res) => {
  const { token, password } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET + '_reset');
    const hashed = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password=$1, reset_pending=false WHERE id=$2', [hashed, decoded.id]);
    res.json({ message: 'Password reset successful' });
  } catch { res.status(400).json({ error: 'Invalid or expired token' }); }
});

r.put('/auth/profile', authMiddleware, async (req, res) => {
  const { username, email } = req.body;
  try {
    const r = await pool.query('UPDATE users SET username=$1,email=$2 WHERE id=$3 RETURNING id,username,email,role,avatar_url', [username, email, req.user.id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.put('/auth/change-password', authMiddleware, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const r = await pool.query('SELECT * FROM users WHERE id=$1', [req.user.id]);
    if (!await bcrypt.compare(currentPassword, r.rows[0].password)) return res.status(400).json({ error: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password=$1 WHERE id=$2', [hashed, req.user.id]);
    res.json({ message: 'Password changed successfully' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.post('/auth/avatar/remove', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('UPDATE users SET avatar_url=NULL WHERE id=$1 RETURNING id,username,email,role,avatar_url', [req.user.id]);
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.post('/auth/avatar', authMiddleware, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const r = await pool.query('UPDATE users SET avatar_url=$1 WHERE id=$2 RETURNING id,username,email,role,avatar_url', [base64, req.user.id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.get('/auth/users', authMiddleware, roleCheck('admin'), async (req, res) => {
  try {
    const r = await pool.query('SELECT id,username,email,role,created_at FROM users ORDER BY created_at DESC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.post('/auth/users', authMiddleware, roleCheck('admin'), async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const r = await pool.query('INSERT INTO users (username,email,password,role) VALUES ($1,$2,$3,$4) RETURNING id,username,email,role,created_at', [username, email, hashed, role]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.put('/auth/users/:id', authMiddleware, roleCheck('admin'), async (req, res) => {
  const { username, email, role } = req.body;
  try {
    const r = await pool.query('UPDATE users SET username=$1,email=$2,role=$3 WHERE id=$4 RETURNING id,username,email,role,created_at', [username, email, role, req.params.id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.delete('/auth/users/:id', authMiddleware, roleCheck('admin'), async (req, res) => {
  try {
    if (+req.params.id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
    await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
    res.json({ message: 'User deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.post('/auth/reset-user-password', authMiddleware, roleCheck('admin'), async (req, res) => {
  const { userId, newPassword } = req.body;
  try {
    if (!userId || !newPassword) return res.status(400).json({ error: 'User ID and new password are required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    if (+userId === req.user.id) return res.status(400).json({ error: 'Cannot reset your own password this way' });
    const hashed = await bcrypt.hash(newPassword, 10);
    const r = await pool.query('UPDATE users SET password=$1 WHERE id=$2 RETURNING id,username,email,role', [hashed, userId]);
    if (!r.rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Password reset successfully', user: r.rows[0] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PERMISSIONS ───────────────────────────────────────────────────────────────
const DEFAULT_PERMISSIONS = {
  admin:    ['dashboard','tables','menu','orders','reservations','payments','users','deliveries','announcements','reports'],
  manager:  ['dashboard','tables','menu','orders','reservations','payments','deliveries','announcements','reports'],
  waiter:   ['dashboard','tables','menu','orders','reservations','announcements'],
  delivery: ['dashboard','deliveries','announcements'],
  customer: ['dashboard','menu','reserve','my-reservations','my-orders','my-deliveries','announcements'],
};
const ALL_PERMISSIONS = ['dashboard','tables','menu','orders','reservations','payments','users','deliveries','announcements','reports','reserve','my-reservations','my-orders','my-deliveries'];

// Always read from DB — no in-memory cache (Vercel serverless = stateless)
r.get('/auth/permissions', async (req, res) => {
  try {
    await pool.query(`CREATE TABLE IF NOT EXISTS role_permissions (role VARCHAR(20) PRIMARY KEY, permissions TEXT NOT NULL)`);
    // Seed defaults for any missing roles
    for (const [role, perms] of Object.entries(DEFAULT_PERMISSIONS)) {
      await pool.query(`INSERT INTO role_permissions (role, permissions) VALUES ($1,$2) ON CONFLICT (role) DO NOTHING`, [role, JSON.stringify(perms)]);
    }
    const rows = (await pool.query('SELECT role, permissions FROM role_permissions')).rows;
    const map = {};
    rows.forEach(row => { map[row.role] = JSON.parse(row.permissions); });
    res.json({ permissions: map, allPermissions: ALL_PERMISSIONS });
  } catch (e) {
    // Fallback to defaults if DB fails
    res.json({ permissions: DEFAULT_PERMISSIONS, allPermissions: ALL_PERMISSIONS });
  }
});

r.put('/auth/permissions', authMiddleware, roleCheck('admin'), async (req, res) => {
  const { role, permissions } = req.body;
  if (!role || !Array.isArray(permissions)) return res.status(400).json({ error: 'role and permissions[] required' });
  try {
    await pool.query(`INSERT INTO role_permissions (role, permissions) VALUES ($1,$2) ON CONFLICT (role) DO UPDATE SET permissions=$2`, [role, JSON.stringify(permissions)]);
    res.json({ role, permissions });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── MENU ──────────────────────────────────────────────────────────────────────
r.get('/menu/items/public', async (req, res) => {
  try {
    const r = await pool.query('SELECT mi.*,mc.name as category_name FROM menu_items mi LEFT JOIN menu_categories mc ON mi.category_id=mc.id WHERE mi.is_available=true ORDER BY mc.name,mi.name');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.get('/menu/categories', authMiddleware, async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM menu_categories ORDER BY name')).rows); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

r.post('/menu/categories', authMiddleware, roleCheck('admin', 'manager'), async (req, res) => {
  const { name, description } = req.body;
  try {
    const r = await pool.query('INSERT INTO menu_categories (name,description) VALUES ($1,$2) RETURNING *', [name, description]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.get('/menu/items', authMiddleware, async (req, res) => {
  try {
    const r = await pool.query('SELECT mi.*,mc.name as category_name FROM menu_items mi LEFT JOIN menu_categories mc ON mi.category_id=mc.id ORDER BY mc.name,mi.name');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.post('/menu/items', authMiddleware, roleCheck('admin', 'manager'), async (req, res) => {
  const { category_id, name, description, price, image_url } = req.body;
  try {
    const r = await pool.query('INSERT INTO menu_items (category_id,name,description,price,image_url) VALUES ($1,$2,$3,$4,$5) RETURNING *', [category_id, name, description, price, image_url]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.put('/menu/items/:id', authMiddleware, roleCheck('admin', 'manager'), async (req, res) => {
  const { name, description, price, is_available } = req.body;
  try {
    const r = await pool.query('UPDATE menu_items SET name=$1,description=$2,price=$3,is_available=$4 WHERE id=$5 RETURNING *', [name, description, price, is_available, req.params.id]);
    res.json(r.rows[0]);
    // Low stock alert when item marked unavailable
    if (is_available === false || is_available === 'false') {
      createNotification('low_stock', '⚠️ Item Unavailable', `Menu item "${name}" has been marked as unavailable.`, 'manager', '/app/menu');
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.delete('/menu/items/:id', authMiddleware, roleCheck('admin', 'manager'), async (req, res) => {
  try {
    await pool.query('UPDATE order_items SET menu_item_id=NULL WHERE menu_item_id=$1', [req.params.id]);
    await pool.query('DELETE FROM menu_items WHERE id=$1', [req.params.id]);
    res.json({ message: 'Menu item deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.patch('/menu/items/:id/availability', authMiddleware, roleCheck('admin', 'manager'), async (req, res) => {
  try {
    const r = await pool.query(
      'UPDATE menu_items SET is_available = NOT is_available WHERE id=$1 RETURNING *',
      [req.params.id]
    );
    if (!r.rows.length) return res.status(404).json({ error: 'Item not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.post('/menu/items/:id/image', authMiddleware, roleCheck('admin', 'manager'), upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const base64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const r = await pool.query('UPDATE menu_items SET image_url=$1 WHERE id=$2 RETURNING *', [base64, req.params.id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── TABLES ────────────────────────────────────────────────────────────────────
r.get('/tables', authMiddleware, async (req, res) => {
  try { res.json((await pool.query('SELECT * FROM tables ORDER BY table_number')).rows); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

r.post('/tables', authMiddleware, roleCheck('admin', 'manager'), async (req, res) => {
  const { table_number, capacity } = req.body;
  try {
    const r = await pool.query('INSERT INTO tables (table_number,capacity) VALUES ($1,$2) RETURNING *', [table_number, capacity]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.put('/tables/:id', authMiddleware, async (req, res) => {
  const { status } = req.body;
  try {
    const r = await pool.query('UPDATE tables SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.delete('/tables/:id', authMiddleware, roleCheck('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM tables WHERE id=$1', [req.params.id]);
    res.json({ message: 'Table deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ORDERS ────────────────────────────────────────────────────────────────────
r.get('/orders', authMiddleware, async (req, res) => {
  try {
    const r = await pool.query('SELECT o.*,t.table_number,u.username as waiter_name FROM orders o LEFT JOIN tables t ON o.table_id=t.id LEFT JOIN users u ON o.waiter_id=u.id ORDER BY o.created_at DESC');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.get('/orders/:id', authMiddleware, async (req, res) => {
  try {
    const order = await pool.query(
      'SELECT o.*, t.table_number, u.username as waiter_name FROM orders o LEFT JOIN tables t ON o.table_id=t.id LEFT JOIN users u ON o.waiter_id=u.id WHERE o.id=$1',
      [req.params.id]
    );
    const items = await pool.query('SELECT oi.*,mi.name FROM order_items oi LEFT JOIN menu_items mi ON oi.menu_item_id=mi.id WHERE oi.order_id=$1', [req.params.id]);
    res.json({ order: order.rows[0], items: items.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.post('/orders', authMiddleware, async (req, res) => {
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
    // Notify staff of new order
    createNotification('new_order', '🛒 New Order Placed', `Order #${order.id} placed for Table ${table_id} — RWF ${total.toFixed(0)}`, 'waiter', '/app/orders');
  } catch (e) { await client.query('ROLLBACK'); res.status(500).json({ error: e.message }); }
  finally { client.release(); }
});

r.put('/orders/:id', authMiddleware, async (req, res) => {
  const { status } = req.body;
  try {
    const r = await pool.query('UPDATE orders SET status=$1,updated_at=CURRENT_TIMESTAMP WHERE id=$2 RETURNING *', [status, req.params.id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.delete('/orders/:id', authMiddleware, roleCheck('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM order_items WHERE order_id=$1', [req.params.id]);
    await pool.query('DELETE FROM orders WHERE id=$1', [req.params.id]);
    res.json({ message: 'Order deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── RESERVATIONS ──────────────────────────────────────────────────────────────
r.get('/reservations', authMiddleware, async (req, res) => {
  try {
    const r = await pool.query('SELECT r.*,t.table_number FROM reservations r LEFT JOIN tables t ON r.table_id=t.id ORDER BY r.reservation_date,r.reservation_time');
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.post('/reservations', authMiddleware, async (req, res) => {
  const { customer_name, customer_phone, customer_email, table_id, reservation_date, reservation_time, party_size, special_requests } = req.body;
  try {
    const r = await pool.query(
      'INSERT INTO reservations (customer_name,customer_phone,customer_email,table_id,reservation_date,reservation_time,party_size,special_requests) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [customer_name, customer_phone, customer_email, table_id, reservation_date, reservation_time, party_size, special_requests]
    );
    res.status(201).json(r.rows[0]);
    // Notify staff of new reservation
    createNotification('reservation', '📅 New Reservation', `${customer_name} reserved Table ${table_id} on ${reservation_date} at ${reservation_time} (party of ${party_size})`, 'manager', '/app/reservations');
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.put('/reservations/:id', authMiddleware, async (req, res) => {
  const { status } = req.body;
  try {
    const r = await pool.query('UPDATE reservations SET status=$1 WHERE id=$2 RETURNING *', [status, req.params.id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.delete('/reservations/:id', authMiddleware, roleCheck('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM reservations WHERE id=$1', [req.params.id]);
    res.json({ message: 'Reservation deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── PAYMENTS ──────────────────────────────────────────────────────────────────
r.get('/payments', authMiddleware, async (req, res) => {
  try {
    const { role, id } = req.user;
    let result;
    if (role === 'customer' || role === 'waiter') {
      // Customers/waiters only see payments for their own orders
      result = await pool.query(
        `SELECT p.*,o.table_id FROM payments p LEFT JOIN orders o ON p.order_id=o.id WHERE o.waiter_id=$1 ORDER BY p.created_at DESC`,
        [id]
      );
    } else {
      result = await pool.query('SELECT p.*,o.table_id FROM payments p LEFT JOIN orders o ON p.order_id=o.id ORDER BY p.created_at DESC');
    }
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.post('/payments', authMiddleware, async (req, res) => {
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

r.delete('/payments/:id', authMiddleware, roleCheck('admin'), async (req, res) => {
  try {
    await pool.query('DELETE FROM payments WHERE id=$1', [req.params.id]);
    res.json({ message: 'Payment deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── DELIVERIES ───────────────────────────────────────────────────────────────
const deliveryQuery = `SELECT d.*, o.total_amount as order_amount, driver.username as driver_name, driver.email as driver_email, cust.username as customer_name, cust.email as customer_email FROM deliveries d LEFT JOIN orders o ON d.order_id=o.id LEFT JOIN users driver ON d.driver_id=driver.id LEFT JOIN users cust ON d.customer_id=cust.id`;

r.get('/deliveries/drivers', authMiddleware, roleCheck('admin','manager','waiter'), async (req, res) => {
  try { res.json((await pool.query(`SELECT id,username,email FROM users WHERE role='delivery' ORDER BY username`)).rows); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

r.get('/deliveries', authMiddleware, async (req, res) => {
  try {
    const { role, id } = req.user;
    let result;
    if (role === 'delivery') result = await pool.query(`${deliveryQuery} WHERE d.driver_id=$1 ORDER BY d.created_at DESC`, [id]);
    else if (role === 'customer') result = await pool.query(`${deliveryQuery} WHERE d.customer_id=$1 ORDER BY d.created_at DESC`, [id]);
    else result = await pool.query(`${deliveryQuery} ORDER BY d.created_at DESC`);
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.get('/deliveries/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`${deliveryQuery} WHERE d.id=$1`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.post('/deliveries', authMiddleware, roleCheck('admin','manager','waiter','customer'), async (req, res) => {
  const { order_id, customer_id, driver_id, delivery_address, delivery_fee, notes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO deliveries (order_id,customer_id,driver_id,delivery_address,delivery_fee,notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [order_id||null, customer_id||null, driver_id||null, delivery_address, delivery_fee||0, notes||null]
    );
    res.status(201).json(result.rows[0]);
    createNotification('delivery', '🚚 New Delivery Request', `Delivery to "${delivery_address}" has been created.`, 'delivery', '/app/deliveries');
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.put('/deliveries/:id', authMiddleware, roleCheck('admin','manager','waiter','delivery'), async (req, res) => {
  const { driver_id, delivery_address, delivery_fee, status, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE deliveries SET driver_id=COALESCE($1,driver_id), delivery_address=COALESCE($2,delivery_address), delivery_fee=COALESCE($3,delivery_fee), status=COALESCE($4,status), notes=COALESCE($5,notes), updated_at=CURRENT_TIMESTAMP WHERE id=$6 RETURNING *`,
      [driver_id||null, delivery_address||null, delivery_fee??null, status||null, notes??null, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.delete('/deliveries/:id', authMiddleware, roleCheck('admin','manager'), async (req, res) => {
  try {
    await pool.query('DELETE FROM deliveries WHERE id=$1', [req.params.id]);
    res.json({ message: 'Delivery deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── NOTIFICATIONS ────────────────────────────────────────────────────────────
const ensureNotificationsTable = () => pool.query(`
  CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    role_target VARCHAR(20) DEFAULT 'all',
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    link VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

const createNotification = async (type, title, message, role_target = 'all', link = null) => {
  try {
    await ensureNotificationsTable();
    const roleFilter =
      role_target === 'all'  ? `WHERE role IN ('admin','manager','waiter','delivery','customer')` :
      role_target === 'admin' ? `WHERE role = 'admin'` :
      `WHERE role = '${role_target}' OR role = 'admin' OR role = 'manager'`;
    const users = await pool.query(`SELECT id FROM users ${roleFilter}`);
    for (const u of users.rows) {
      await pool.query(
        `INSERT INTO notifications (type,title,message,role_target,user_id,link) VALUES ($1,$2,$3,$4,$5,$6)`,
        [type, title, message, role_target, u.id, link]
      );
    }
  } catch (e) { console.error('Notification error:', e.message); }
};

// Get notifications for current user
r.get('/notifications', authMiddleware, async (req, res) => {
  try {
    await ensureNotificationsTable();
    const result = await pool.query(
      `SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Get unread count
r.get('/notifications/unread-count', authMiddleware, async (req, res) => {
  try {
    await ensureNotificationsTable();
    const result = await pool.query(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id=$1 AND is_read=false`,
      [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Mark one as read
r.put('/notifications/:id/read', authMiddleware, async (req, res) => {
  try {
    await pool.query(`UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Mark all as read
r.put('/notifications/read-all', authMiddleware, async (req, res) => {
  try {
    await pool.query(`UPDATE notifications SET is_read=true WHERE user_id=$1`, [req.user.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete a notification
r.delete('/notifications/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query(`DELETE FROM notifications WHERE id=$1 AND user_id=$2`, [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ANNOUNCEMENTS ─────────────────────────────────────────────────────────────
const ensureAnnouncementsTable = () => pool.query(`CREATE TABLE IF NOT EXISTS announcements (id SERIAL PRIMARY KEY, title VARCHAR(255) NOT NULL, message TEXT NOT NULL, priority VARCHAR(20) DEFAULT 'normal', created_by INTEGER, created_by_name VARCHAR(100), created_at TIMESTAMP DEFAULT NOW())`);

r.get('/announcements', authMiddleware, async (req, res) => {
  try {
    await ensureAnnouncementsTable();
    res.json((await pool.query('SELECT * FROM announcements ORDER BY created_at DESC')).rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.post('/announcements', authMiddleware, roleCheck('admin', 'manager'), async (req, res) => {
  const { title, message, priority = 'normal' } = req.body;
  try {
    await ensureAnnouncementsTable();
    if (!title || !message) return res.status(400).json({ error: 'Title and message are required' });
    const userRow = await pool.query('SELECT username FROM users WHERE id=$1', [req.user.id]);
    const username = userRow.rows[0]?.username || 'Unknown';
    const result = await pool.query('INSERT INTO announcements (title,message,priority,created_by,created_by_name) VALUES ($1,$2,$3,$4,$5) RETURNING *', [title, message, priority, req.user.id, username]);
    res.status(201).json(result.rows[0]);
    const icon = priority === 'urgent' ? '🔴' : priority === 'info' ? '🔵' : '📢';
    createNotification('announcement', `${icon} ${title}`, message, 'all', '/app/announcements');
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── ANNOUNCEMENT REPLIES (must be before DELETE /:id to avoid route conflict) ──
const ensureRepliesTable = () => pool.query(`
  CREATE TABLE IF NOT EXISTS announcement_replies (
    id SERIAL PRIMARY KEY,
    announcement_id INTEGER NOT NULL,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  )
`);

r.get('/announcements/:id/replies', authMiddleware, async (req, res) => {
  try {
    await ensureRepliesTable();
    const result = await pool.query(
      'SELECT * FROM announcement_replies WHERE announcement_id=$1 ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.post('/announcements/:id/replies', authMiddleware, async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });
  try {
    await ensureRepliesTable();
    const userRow = await pool.query('SELECT username FROM users WHERE id=$1', [req.user.id]);
    const username = userRow.rows[0]?.username || 'Unknown';
    const result = await pool.query(
      'INSERT INTO announcement_replies (announcement_id, user_id, username, message) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.params.id, req.user.id, username, message.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.delete('/announcements/:announcementId/replies/:replyId', authMiddleware, async (req, res) => {
  try {
    const canDelete = ['admin', 'manager'].includes(req.user.role);
    const query = canDelete
      ? 'DELETE FROM announcement_replies WHERE id=$1'
      : 'DELETE FROM announcement_replies WHERE id=$1 AND user_id=$2';
    const params = canDelete ? [req.params.replyId] : [req.params.replyId, req.user.id];
    await pool.query(query, params);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

r.delete('/announcements/:id', authMiddleware, roleCheck('admin', 'manager'), async (req, res) => {
  try {
    await pool.query('DELETE FROM announcement_replies WHERE announcement_id=$1', [req.params.id]);
    await pool.query('DELETE FROM announcements WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = app;
