const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM materials ORDER BY name');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM materials WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, unit_type, unit_cost, supplier, inventory_qty, reorder_point } = req.body;
    if (!name || !unit_type) return res.status(400).json({ error: 'Name and unit_type required' });
    const { rows } = await pool.query(
      'INSERT INTO materials (name, unit_type, unit_cost, supplier, inventory_qty, reorder_point) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, unit_type, unit_cost || 0, supplier, inventory_qty || 0, reorder_point || 0]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, unit_type, unit_cost, supplier, inventory_qty, reorder_point } = req.body;
    await pool.query(
      'UPDATE materials SET name=$1, unit_type=$2, unit_cost=$3, supplier=$4, inventory_qty=$5, reorder_point=$6, last_updated=NOW() WHERE id=$7',
      [name, unit_type, unit_cost, supplier, inventory_qty, reorder_point, req.params.id]
    );
    const { rows } = await pool.query('SELECT * FROM materials WHERE id = $1', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM materials WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
