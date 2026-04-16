const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { rows: templates } = await pool.query(
      'SELECT * FROM product_templates WHERE company_id = $1 ORDER BY category, name',
      [req.user.company_id]
    );
    const result = await Promise.all(templates.map(async t => {
      const { rows: materials } = await pool.query(`
        SELECT ptm.*, m.name as material_name, m.unit_type, m.unit_cost, m.supplier
        FROM product_template_materials ptm
        JOIN materials m ON m.id = ptm.material_id
        WHERE ptm.template_id = $1
      `, [t.id]);
      return { ...t, materials };
    }));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM product_templates WHERE id = $1 AND company_id = $2',
      [req.params.id, req.user.company_id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    const { rows: materials } = await pool.query(`
      SELECT ptm.*, m.name as material_name, m.unit_type, m.unit_cost, m.supplier
      FROM product_template_materials ptm
      JOIN materials m ON m.id = ptm.material_id
      WHERE ptm.template_id = $1
    `, [req.params.id]);
    res.json({ ...rows[0], materials });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, category, setup_time, run_time_per_unit, finishing_time, complexity_multiplier, default_margin, description, materials } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });

    const { rows } = await pool.query(
      'INSERT INTO product_templates (name, category, setup_time, run_time_per_unit, finishing_time, complexity_multiplier, default_margin, description, company_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      [name, category, setup_time || 0, run_time_per_unit || 0, finishing_time || 0, complexity_multiplier || 1.0, default_margin || 40, description, req.user.company_id]
    );
    const templateId = rows[0].id;

    if (materials && materials.length) {
      for (const m of materials) {
        await pool.query(
          'INSERT INTO product_template_materials (template_id, material_id, quantity, unit_type) VALUES ($1, $2, $3, $4)',
          [templateId, m.material_id, m.quantity || 1, m.unit_type]
        );
      }
    }

    const { rows: t } = await pool.query('SELECT * FROM product_templates WHERE id = $1', [templateId]);
    res.status(201).json(t[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, category, setup_time, run_time_per_unit, finishing_time, complexity_multiplier, default_margin, description, materials } = req.body;

    await pool.query(
      'UPDATE product_templates SET name=$1, category=$2, setup_time=$3, run_time_per_unit=$4, finishing_time=$5, complexity_multiplier=$6, default_margin=$7, description=$8, updated_at=NOW() WHERE id=$9 AND company_id=$10',
      [name, category, setup_time, run_time_per_unit, finishing_time, complexity_multiplier, default_margin, description, req.params.id, req.user.company_id]
    );

    if (materials !== undefined) {
      await pool.query('DELETE FROM product_template_materials WHERE template_id = $1', [req.params.id]);
      if (materials.length) {
        for (const m of materials) {
          await pool.query(
            'INSERT INTO product_template_materials (template_id, material_id, quantity, unit_type) VALUES ($1, $2, $3, $4)',
            [req.params.id, m.material_id, m.quantity || 1, m.unit_type]
          );
        }
      }
    }

    const { rows } = await pool.query('SELECT * FROM product_templates WHERE id = $1', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM product_templates WHERE id = $1 AND company_id = $2', [req.params.id, req.user.company_id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
