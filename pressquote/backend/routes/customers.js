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
        'SELECT * FROM customers WHERE company_id = $1 AND (name ILIKE $2 OR email ILIKE $2 OR company ILIKE $2) ORDER BY name',
        [req.user.company_id, q]
      );
    } else {
      result = await pool.query('SELECT * FROM customers WHERE company_id = $1 ORDER BY name', [req.user.company_id]);
    }
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM customers WHERE id = $1 AND company_id = $2', [req.params.id, req.user.company_id]);
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
      'INSERT INTO customers (name, email, phone, company, address, notes, company_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, email, phone, company, address, notes, req.user.company_id]
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
      'UPDATE customers SET name=$1, email=$2, phone=$3, company=$4, address=$5, notes=$6, updated_at=NOW() WHERE id=$7 AND company_id=$8',
      [name, email, phone, company, address, notes, req.params.id, req.user.company_id]
    );
    const { rows } = await pool.query('SELECT * FROM customers WHERE id = $1 AND company_id = $2', [req.params.id, req.user.company_id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM customers WHERE id = $1 AND company_id = $2', [req.params.id, req.user.company_id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
