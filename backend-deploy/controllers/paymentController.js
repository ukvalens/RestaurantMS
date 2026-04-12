const pool = require('../config/database');

exports.createPayment = async (req, res) => {
  const { order_id, amount, payment_method, transaction_id } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const result = await client.query(
      'INSERT INTO payments (order_id, amount, payment_method, payment_status, transaction_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [order_id, amount, payment_method, 'completed', transaction_id]
    );
    
    await client.query('UPDATE orders SET status = $1 WHERE id = $2', ['completed', order_id]);
    
    const orderResult = await client.query('SELECT table_id FROM orders WHERE id = $1', [order_id]);
    if (orderResult.rows[0]?.table_id) {
      await client.query('UPDATE tables SET status = $1 WHERE id = $2', ['available', orderResult.rows[0].table_id]);
    }
    
    await client.query('COMMIT');
    res.status(201).json(result.rows[0]);
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

exports.getPayments = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT p.*, o.table_id FROM payments p LEFT JOIN orders o ON p.order_id = o.id ORDER BY p.created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
