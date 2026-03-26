const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/settings
router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM company_settings').all();
  const settings = {};
  rows.forEach(r => { settings[r.key] = r.value; });
  res.json(settings);
});

// PUT /api/settings
router.put('/', (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  const db = getDb();
  const updates = req.body;
  const stmt = db.prepare('INSERT INTO company_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP');
  const updateMany = db.transaction((obj) => {
    for (const [key, value] of Object.entries(obj)) {
      stmt.run(key, String(value));
    }
  });
  updateMany(updates);
  const rows = db.prepare('SELECT key, value FROM company_settings').all();
  const settings = {};
  rows.forEach(r => { settings[r.key] = r.value; });
  res.json(settings);
});

module.exports = router;
