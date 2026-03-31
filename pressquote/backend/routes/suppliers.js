const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Suppliers
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM suppliers ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, contact_email, contact_phone, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const { rows } = await pool.query(
      'INSERT INTO suppliers (name, contact_email, contact_phone, notes) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, contact_email, contact_phone, notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, contact_email, contact_phone, notes } = req.body;
    await pool.query(
      'UPDATE suppliers SET name=$1, contact_email=$2, contact_phone=$3, notes=$4 WHERE id=$5',
      [name, contact_email, contact_phone, notes, req.params.id]
    );
    const { rows } = await pool.query('SELECT * FROM suppliers WHERE id = $1', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM suppliers WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Outsourced items
router.get('/outsourced', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM outsourced_items ORDER BY supplier_name, item_name');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/outsourced', async (req, res) => {
  try {
    const { supplier_id, supplier_name, item_name, base_cost, shipping_cost, lead_time, order_link } = req.body;
    if (!item_name || !supplier_name) return res.status(400).json({ error: 'supplier_name and item_name required' });
    const { rows } = await pool.query(
      'INSERT INTO outsourced_items (supplier_id, supplier_name, item_name, base_cost, shipping_cost, lead_time, order_link) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [supplier_id, supplier_name, item_name, base_cost || 0, shipping_cost || 0, lead_time || 0, order_link]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/outsourced/:id', async (req, res) => {
  try {
    const { supplier_name, item_name, base_cost, shipping_cost, lead_time, order_link } = req.body;
    await pool.query(
      'UPDATE outsourced_items SET supplier_name=$1, item_name=$2, base_cost=$3, shipping_cost=$4, lead_time=$5, order_link=$6 WHERE id=$7',
      [supplier_name, item_name, base_cost, shipping_cost, lead_time, order_link, req.params.id]
    );
    const { rows } = await pool.query('SELECT * FROM outsourced_items WHERE id = $1', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/outsourced/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM outsourced_items WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
