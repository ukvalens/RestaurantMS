const pool = require('../config/database');

exports.getReservations = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT r.*, t.table_number FROM reservations r LEFT JOIN tables t ON r.table_id = t.id ORDER BY r.reservation_date, r.reservation_time'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createReservation = async (req, res) => {
  const { customer_name, customer_phone, customer_email, table_id, reservation_date, reservation_time, party_size, special_requests } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO reservations (customer_name, customer_phone, customer_email, table_id, reservation_date, reservation_time, party_size, special_requests) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [customer_name, customer_phone, customer_email, table_id, reservation_date, reservation_time, party_size, special_requests]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateReservationStatus = async (req, res) => {
  const { id } = req.params;
  const { status, customer_name, customer_phone, customer_email, table_id, reservation_date, reservation_time, party_size, special_requests } = req.body;
  try {
    let result;
    if (customer_name) {
      result = await pool.query(
        'UPDATE reservations SET status = $1, customer_name = $2, customer_phone = $3, customer_email = $4, table_id = $5, reservation_date = $6, reservation_time = $7, party_size = $8, special_requests = $9 WHERE id = $10 RETURNING *',
        [status, customer_name, customer_phone, customer_email, table_id, reservation_date, reservation_time, party_size, special_requests, id]
      );
    } else {
      result = await pool.query(
        'UPDATE reservations SET status = $1 WHERE id = $2 RETURNING *',
        [status, id]
      );
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteReservation = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM reservations WHERE id = $1', [id]);
    res.json({ message: 'Reservation deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
