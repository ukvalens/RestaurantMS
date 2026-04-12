const pool = require('../config/database');

const deliveryQuery = `
  SELECT d.*,
    o.total_amount as order_amount,
    driver.username as driver_name, driver.email as driver_email,
    cust.username as customer_name, cust.email as customer_email
  FROM deliveries d
  LEFT JOIN orders o ON d.order_id = o.id
  LEFT JOIN users driver ON d.driver_id = driver.id
  LEFT JOIN users cust ON d.customer_id = cust.id
`;

exports.getDeliveries = async (req, res) => {
  try {
    const { role, id } = req.user;
    let result;
    if (role === 'delivery') {
      result = await pool.query(`${deliveryQuery} WHERE d.driver_id = $1 ORDER BY d.created_at DESC`, [id]);
    } else if (role === 'customer') {
      result = await pool.query(`${deliveryQuery} WHERE d.customer_id = $1 ORDER BY d.created_at DESC`, [id]);
    } else {
      result = await pool.query(`${deliveryQuery} ORDER BY d.created_at DESC`);
    }
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getDeliveryById = async (req, res) => {
  try {
    const result = await pool.query(`${deliveryQuery} WHERE d.id = $1`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.createDelivery = async (req, res) => {
  const { order_id, customer_id, driver_id, delivery_address, delivery_fee, notes } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO deliveries (order_id, customer_id, driver_id, delivery_address, delivery_fee, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [order_id || null, customer_id || null, driver_id || null, delivery_address, delivery_fee || 0, notes || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.updateDelivery = async (req, res) => {
  const { id } = req.params;
  const { driver_id, delivery_address, delivery_fee, status, notes } = req.body;
  try {
    const result = await pool.query(
      `UPDATE deliveries SET
        driver_id = COALESCE($1, driver_id),
        delivery_address = COALESCE($2, delivery_address),
        delivery_fee = COALESCE($3, delivery_fee),
        status = COALESCE($4, status),
        notes = COALESCE($5, notes),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 RETURNING *`,
      [driver_id || null, delivery_address || null, delivery_fee ?? null, status || null, notes ?? null, id]
    );
    res.json(result.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.deleteDelivery = async (req, res) => {
  try {
    await pool.query('DELETE FROM deliveries WHERE id = $1', [req.params.id]);
    res.json({ message: 'Delivery deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getDrivers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email FROM users WHERE role = 'delivery' ORDER BY username`
    );
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
