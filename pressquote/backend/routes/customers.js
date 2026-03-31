const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let result;
    if (search) {
      const q = `%${search}%`;
      result = await pool.query(
        'SELECT * FROM customers WHERE name ILIKE $1 OR email ILIKE $1 OR company ILIKE $1 ORDER BY name',
        [q]
      );
    } else {
      result = await pool.query('SELECT * FROM customers ORDER BY name');
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, company, address, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const { rows } = await pool.query(
      'INSERT INTO customers (name, email, phone, company, address, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, email, phone, company, address, notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, company, address, notes } = req.body;
    await pool.query(
      'UPDATE customers SET name=$1, email=$2, phone=$3, company=$4, address=$5, notes=$6, updated_at=NOW() WHERE id=$7',
      [name, email, phone, company, address, notes, req.params.id]
    );
    const { rows } = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM customers WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
