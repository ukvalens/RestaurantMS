const pool = require('../config/database');

const ensureTable = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS announcements (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      priority VARCHAR(20) DEFAULT 'normal',
      created_by INTEGER,
      created_by_name VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
};

const getAll = async (req, res) => {
  await ensureTable();
  const result = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
  res.json(result.rows);
};

const create = async (req, res) => {
  await ensureTable();
  const { title, message, priority = 'normal' } = req.body;
  if (!title || !message) return res.status(400).json({ error: 'Title and message are required' });
  const result = await pool.query(
    'INSERT INTO announcements (title, message, priority, created_by, created_by_name) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [title, message, priority, req.user.id, req.user.username]
  );
  res.status(201).json(result.rows[0]);
};

const remove = async (req, res) => {
  await ensureTable();
  await pool.query('DELETE FROM announcements WHERE id=$1', [req.params.id]);
  res.json({ message: 'Deleted' });
};

module.exports = { getAll, create, remove };
