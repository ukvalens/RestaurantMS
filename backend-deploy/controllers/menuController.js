const pool = require('../config/database');

exports.getCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM menu_categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createCategory = async (req, res) => {
  const { name, description } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO menu_categories (name, description) VALUES ($1, $2) RETURNING *',
      [name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  try {
    const result = await pool.query(
      'UPDATE menu_categories SET name = $1, description = $2 WHERE id = $3 RETURNING *',
      [name, description, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM menu_categories WHERE id = $1', [id]);
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMenuItems = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT mi.*, mc.name as category_name FROM menu_items mi LEFT JOIN menu_categories mc ON mi.category_id = mc.id ORDER BY mc.name, mi.name'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createMenuItem = async (req, res) => {
  const { category_id, name, description, price, image_url } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO menu_items (category_id, name, description, price, image_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [category_id, name, description, price, image_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateMenuItem = async (req, res) => {
  const { id } = req.params;
  const { name, description, price, is_available, category_id } = req.body;
  try {
    const result = await pool.query(
      'UPDATE menu_items SET name = $1, description = $2, price = $3, is_available = $4, category_id = COALESCE($5, category_id) WHERE id = $6 RETURNING *',
      [name, description, price, is_available, category_id || null, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.toggleItemAvailability = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'UPDATE menu_items SET is_available = NOT is_available WHERE id = $1 RETURNING *',
      [id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.uploadMenuItemImage = async (req, res) => {
  const { id } = req.params;
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const imageUrl = `/uploads/${req.file.filename}`;
    const result = await pool.query(
      'UPDATE menu_items SET image_url = $1 WHERE id = $2 RETURNING *',
      [imageUrl, id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteMenuItem = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE order_items SET menu_item_id = NULL WHERE menu_item_id = $1', [id]);
    await pool.query('DELETE FROM menu_items WHERE id = $1', [id]);
    res.json({ message: 'Menu item deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
