const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', (req, res) => {
  const db = getDb();
  const { search } = req.query;
  let customers;
  if (search) {
    const q = `%${search}%`;
    customers = db.prepare('SELECT * FROM customers WHERE name LIKE ? OR email LIKE ? OR company LIKE ? ORDER BY name').all(q, q, q);
  } else {
    customers = db.prepare('SELECT * FROM customers ORDER BY name').all();
  }
  res.json(customers);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Not found' });
  res.json(customer);
});

router.post('/', (req, res) => {
  const db = getDb();
  const { name, email, phone, company, address, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const result = db.prepare('INSERT INTO customers (name, email, phone, company, address, notes) VALUES (?, ?, ?, ?, ?, ?)').run(name, email, phone, company, address, notes);
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(customer);
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { name, email, phone, company, address, notes } = req.body;
  db.prepare('UPDATE customers SET name=?, email=?, phone=?, company=?, address=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(name, email, phone, company, address, notes, req.params.id);
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  res.json(customer);
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
