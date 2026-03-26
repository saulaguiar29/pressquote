const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// Suppliers
router.get('/', (req, res) => {
  const db = getDb();
  const suppliers = db.prepare('SELECT * FROM suppliers ORDER BY name').all();
  res.json(suppliers);
});

router.post('/', (req, res) => {
  const db = getDb();
  const { name, contact_email, contact_phone, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const result = db.prepare('INSERT INTO suppliers (name, contact_email, contact_phone, notes) VALUES (?, ?, ?, ?)').run(name, contact_email, contact_phone, notes);
  const s = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(s);
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { name, contact_email, contact_phone, notes } = req.body;
  db.prepare('UPDATE suppliers SET name=?, contact_email=?, contact_phone=?, notes=? WHERE id=?').run(name, contact_email, contact_phone, notes, req.params.id);
  res.json(db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM suppliers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Outsourced items
router.get('/outsourced', (req, res) => {
  const db = getDb();
  const items = db.prepare('SELECT * FROM outsourced_items ORDER BY supplier_name, item_name').all();
  res.json(items);
});

router.post('/outsourced', (req, res) => {
  const db = getDb();
  const { supplier_id, supplier_name, item_name, base_cost, shipping_cost, lead_time, order_link } = req.body;
  if (!item_name || !supplier_name) return res.status(400).json({ error: 'supplier_name and item_name required' });
  const result = db.prepare('INSERT INTO outsourced_items (supplier_id, supplier_name, item_name, base_cost, shipping_cost, lead_time, order_link) VALUES (?, ?, ?, ?, ?, ?, ?)').run(supplier_id, supplier_name, item_name, base_cost || 0, shipping_cost || 0, lead_time || 0, order_link);
  const item = db.prepare('SELECT * FROM outsourced_items WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(item);
});

router.put('/outsourced/:id', (req, res) => {
  const db = getDb();
  const { supplier_name, item_name, base_cost, shipping_cost, lead_time, order_link } = req.body;
  db.prepare('UPDATE outsourced_items SET supplier_name=?, item_name=?, base_cost=?, shipping_cost=?, lead_time=?, order_link=? WHERE id=?').run(supplier_name, item_name, base_cost, shipping_cost, lead_time, order_link, req.params.id);
  res.json(db.prepare('SELECT * FROM outsourced_items WHERE id = ?').get(req.params.id));
});

router.delete('/outsourced/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM outsourced_items WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
