const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', (req, res) => {
  const db = getDb();
  const materials = db.prepare('SELECT * FROM materials ORDER BY name').all();
  res.json(materials);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const m = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
  if (!m) return res.status(404).json({ error: 'Not found' });
  res.json(m);
});

router.post('/', (req, res) => {
  const db = getDb();
  const { name, unit_type, unit_cost, supplier, inventory_qty, reorder_point } = req.body;
  if (!name || !unit_type) return res.status(400).json({ error: 'Name and unit_type required' });
  const result = db.prepare('INSERT INTO materials (name, unit_type, unit_cost, supplier, inventory_qty, reorder_point) VALUES (?, ?, ?, ?, ?, ?)').run(name, unit_type, unit_cost || 0, supplier, inventory_qty || 0, reorder_point || 0);
  const m = db.prepare('SELECT * FROM materials WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(m);
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { name, unit_type, unit_cost, supplier, inventory_qty, reorder_point } = req.body;
  db.prepare('UPDATE materials SET name=?, unit_type=?, unit_cost=?, supplier=?, inventory_qty=?, reorder_point=?, last_updated=CURRENT_TIMESTAMP WHERE id=?').run(name, unit_type, unit_cost, supplier, inventory_qty, reorder_point, req.params.id);
  const m = db.prepare('SELECT * FROM materials WHERE id = ?').get(req.params.id);
  res.json(m);
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM materials WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
