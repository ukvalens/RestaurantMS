const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const pool = require('../config/database');

exports.register = async (req, res) => {
  const { username, email, password, role } = req.body;
  console.log('[Register] Request:', { username, email, role });
  
  try {
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPassword = password?.trim();
    const normalizedUsername = username?.trim();
    
    if (!normalizedEmail || !normalizedPassword || !normalizedUsername || !role) {
      console.log('[Register] Missing required fields');
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    if (!normalizedEmail.includes('@')) {
      console.log('[Register] Invalid email format:', normalizedEmail);
      return res.status(400).json({ error: 'Invalid email format' });
    }
    
    if (normalizedPassword.length < 6) {
      console.log('[Register] Password too short');
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    // Validate role
    const validRoles = ['admin', 'manager', 'waiter', 'chef', 'customer', 'delivery'];
    if (!validRoles.includes(role)) {
      console.log('[Register] Invalid role:', role);
      return res.status(400).json({ error: 'Invalid role. Must be: admin, manager, waiter, chef, or customer' });
    }
    
    console.log('[Register] Hashing password...');
    const hashedPassword = await bcrypt.hash(normalizedPassword, 10);
    
    console.log('[Register] Inserting into database:', { username: normalizedUsername, email: normalizedEmail, role });
    const result = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role',
      [normalizedUsername, normalizedEmail, hashedPassword, role]
    );
    
    console.log('[Register] Success! Created user:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('[Register] Error:', error.message, error.code, error.detail);
    
    if (error.code === '23505' || error.message.includes('duplicate key')) {
      console.log('[Register] Duplicate email error');
      res.status(409).json({ error: 'Email already registered' });
    } else if (error.code === '23502') {
      console.log('[Register] Not null constraint violation');
      res.status(400).json({ error: 'Missing required database fields' });
    } else if (error.code === '23514') {
      console.log('[Register] Check constraint violation - invalid role probably');
      res.status(400).json({ error: 'Invalid role value' });
    } else {
      res.status(500).json({ error: error.message, code: error.code });
    }
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPassword = password?.trim();
    
    if (!normalizedEmail || !normalizedPassword) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const result = await pool.query('SELECT id, username, email, password, role, avatar_url, reset_pending FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
    if (result.rows.length === 0) {
      console.log('[Login] User not found for email:', normalizedEmail);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    console.log('[Login] User found:', user.username, '| Reset pending:', user.reset_pending);
    
    if (user.reset_pending) {
      return res.status(403).json({ error: 'Password reset is pending. Please check your email to reset your password before logging in.' });
    }
    
    const validPassword = await bcrypt.compare(normalizedPassword, user.password);
    console.log('[Login] Password match:', validPassword);
    
    if (!validPassword) {
      console.log('[Login] Invalid password for user:', user.username);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    const responseUser = { 
      id: user.id, 
      username: user.username, 
      email: user.email, 
      role: user.role
    };
    
    // Only include avatar_url if it exists
    if (user.avatar_url) {
      responseUser.avatar_url = user.avatar_url;
    }
    
    console.log('[Login] Success for user:', user.username);
    res.json({ token, user: responseUser });
  } catch (error) {
    console.error('[Login] Error:', error.message, error.stack);
    res.status(500).json({ error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const normalizedEmail = email?.trim().toLowerCase();
    const result = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [normalizedEmail]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'No account with that email' });

    await pool.query('UPDATE users SET reset_pending = true WHERE id = $1', [result.rows[0].id]);
    const token = jwt.sign({ id: result.rows[0].id }, process.env.JWT_SECRET + '_reset', { expiresIn: '1h' });
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    await transporter.sendMail({
      from: `RestaurantMS <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset Request',
      html: `<p>Click the link below to reset your password. It expires in 1 hour.</p>
             <a href="${resetUrl}">${resetUrl}</a>`,
    });

    res.json({ message: 'Reset link sent to your email' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  const { token, password } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET + '_reset');
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password = $1, reset_pending = false WHERE id = $2', [hashedPassword, decoded.id]);
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(400).json({ error: 'Invalid or expired token' });
  }
};

exports.updateProfile = async (req, res) => {
  const { username, email } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET username = $1, email = $2 WHERE id = $3 RETURNING id, username, email, role, avatar_url',
      [username, email, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const avatarUrl = req.file.path; // Cloudinary URL
    const result = await pool.query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2 RETURNING id, username, email, role, avatar_url',
      [avatarUrl, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createUser = async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, created_at',
      [username, email, hashedPassword, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, role } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET username = $1, email = $2, role = $3 WHERE id = $4 RETURNING id, username, email, role, created_at',
      [username, email, role, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    if (+id === req.user.id) return res.status(400).json({ error: 'Cannot delete your own account' });
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.resetUserPassword = async (req, res) => {
  const { userId, newPassword } = req.body;
  try {
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1, reset_pending = false WHERE id = $2', [hashed, userId]);
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.user.id]);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
