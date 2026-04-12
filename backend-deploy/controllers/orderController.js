const pool = require('../config/database');

exports.createOrder = async (req, res) => {
  const { table_id, waiter_id, items } = req.body;
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const orderResult = await client.query(
      'INSERT INTO orders (table_id, waiter_id) VALUES ($1, $2) RETURNING *',
      [table_id, waiter_id]
    );
    const order = orderResult.rows[0];
    
    let totalAmount = 0;
    for (const item of items) {
      await client.query(
        'INSERT INTO order_items (order_id, menu_item_id, quantity, price, special_instructions) VALUES ($1, $2, $3, $4, $5)',
        [order.id, item.menu_item_id, item.quantity, item.price, item.special_instructions]
      );
      totalAmount += item.price * item.quantity;
    }
    
    await client.query('UPDATE orders SET total_amount = $1 WHERE id = $2', [totalAmount, order.id]);
    await client.query('UPDATE tables SET status = $1 WHERE id = $2', ['occupied', table_id]);
    await client.query('COMMIT');
    
    res.status(201).json({ ...order, total_amount: totalAmount });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

exports.getOrders = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT o.*, t.table_number, u.username as waiter_name FROM orders o LEFT JOIN tables t ON o.table_id = t.id LEFT JOIN users u ON o.waiter_id = u.id ORDER BY o.created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getOrderById = async (req, res) => {
  const { id } = req.params;
  try {
    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    const itemsResult = await pool.query(
      'SELECT oi.*, mi.name FROM order_items oi LEFT JOIN menu_items mi ON oi.menu_item_id = mi.id WHERE oi.order_id = $1',
      [id]
    );
    res.json({ order: orderResult.rows[0], items: itemsResult.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
