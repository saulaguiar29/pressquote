const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', (req, res) => {
  const db = getDb();
  const templates = db.prepare('SELECT * FROM product_templates ORDER BY category, name').all();
  // Attach materials to each template
  const result = templates.map(t => {
    const materials = db.prepare(`
      SELECT ptm.*, m.name as material_name, m.unit_type, m.unit_cost, m.supplier
      FROM product_template_materials ptm
      JOIN materials m ON m.id = ptm.material_id
      WHERE ptm.template_id = ?
    `).all(t.id);
    return { ...t, materials };
  });
  res.json(result);
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const t = db.prepare('SELECT * FROM product_templates WHERE id = ?').get(req.params.id);
  if (!t) return res.status(404).json({ error: 'Not found' });
  const materials = db.prepare(`
    SELECT ptm.*, m.name as material_name, m.unit_type, m.unit_cost, m.supplier
    FROM product_template_materials ptm
    JOIN materials m ON m.id = ptm.material_id
    WHERE ptm.template_id = ?
  `).all(t.id);
  res.json({ ...t, materials });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { name, category, setup_time, run_time_per_unit, finishing_time, complexity_multiplier, default_margin, description, materials } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  
  const result = db.prepare('INSERT INTO product_templates (name, category, setup_time, run_time_per_unit, finishing_time, complexity_multiplier, default_margin, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    name, category, setup_time || 0, run_time_per_unit || 0, finishing_time || 0, complexity_multiplier || 1.0, default_margin || 40, description
  );
  const templateId = result.lastInsertRowid;

  if (materials && materials.length) {
    const matStmt = db.prepare('INSERT INTO product_template_materials (template_id, material_id, quantity, unit_type) VALUES (?, ?, ?, ?)');
    for (const m of materials) {
      matStmt.run(templateId, m.material_id, m.quantity || 1, m.unit_type);
    }
  }

  const t = db.prepare('SELECT * FROM product_templates WHERE id = ?').get(templateId);
  res.status(201).json(t);
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const { name, category, setup_time, run_time_per_unit, finishing_time, complexity_multiplier, default_margin, description, materials } = req.body;
  
  db.prepare('UPDATE product_templates SET name=?, category=?, setup_time=?, run_time_per_unit=?, finishing_time=?, complexity_multiplier=?, default_margin=?, description=?, updated_at=CURRENT_TIMESTAMP WHERE id=?').run(
    name, category, setup_time, run_time_per_unit, finishing_time, complexity_multiplier, default_margin, description, req.params.id
  );

  if (materials !== undefined) {
    db.prepare('DELETE FROM product_template_materials WHERE template_id = ?').run(req.params.id);
    if (materials.length) {
      const matStmt = db.prepare('INSERT INTO product_template_materials (template_id, material_id, quantity, unit_type) VALUES (?, ?, ?, ?)');
      for (const m of materials) {
        matStmt.run(req.params.id, m.material_id, m.quantity || 1, m.unit_type);
      }
    }
  }

  res.json(db.prepare('SELECT * FROM product_templates WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM product_templates WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
