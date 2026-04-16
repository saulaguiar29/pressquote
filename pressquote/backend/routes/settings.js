const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT key, value FROM company_settings WHERE company_id = $1',
      [req.user.company_id]
    );
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/settings
router.put('/', async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  try {
    const updates = req.body;
    for (const [key, value] of Object.entries(updates)) {
      await pool.query(
        'INSERT INTO company_settings (key, value, company_id) VALUES ($1, $2, $3) ON CONFLICT (key, company_id) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()',
        [key, String(value), req.user.company_id]
      );
    }
    const { rows } = await pool.query(
      'SELECT key, value FROM company_settings WHERE company_id = $1',
      [req.user.company_id]
    );
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
