const express = require('express');
const router = express.Router();
const { pool } = require('../database');
const authMiddleware = require('../middleware/auth');
const { calculateQuote } = require('../utils/pricingEngine');

router.use(authMiddleware);

async function getSettings() {
  const { rows } = await pool.query('SELECT key, value FROM company_settings');
  const settings = {};
  rows.forEach(r => { settings[r.key] = r.value; });
  return settings;
}

async function generateQuoteNumber() {
  const year = new Date().getFullYear();
  const { rows } = await pool.query(
    "SELECT COUNT(*) as cnt FROM quotes WHERE quote_number LIKE $1",
    [`PQ-${year}-%`]
  );
  const num = String((parseInt(rows[0].cnt) || 0) + 1).padStart(4, '0');
  return `PQ-${year}-${num}`;
}

// GET /api/quotes
router.get('/', async (req, res) => {
  try {
    const { search, status, type, limit = 50, offset = 0 } = req.query;

    let query = 'SELECT q.*, c.company as customer_company FROM quotes q LEFT JOIN customers c ON c.id = q.customer_id WHERE 1=1';
    const params = [];
    let paramIdx = 0;

    if (search) {
      paramIdx++;
      const s = `%${search}%`;
      params.push(s);
      query += ` AND (q.quote_number ILIKE $${paramIdx} OR q.customer_name ILIKE $${paramIdx} OR q.project_name ILIKE $${paramIdx})`;
    }
    if (status) {
      paramIdx++;
      query += ` AND q.status = $${paramIdx}`;
      params.push(status);
    }
    if (type) {
      paramIdx++;
      query += ` AND q.type = $${paramIdx}`;
      params.push(type);
    }

    paramIdx++;
    query += ` ORDER BY q.created_at DESC LIMIT $${paramIdx}`;
    params.push(parseInt(limit));
    paramIdx++;
    query += ` OFFSET $${paramIdx}`;
    params.push(parseInt(offset));

    const { rows: quotes } = await pool.query(query, params);
    const { rows: countRows } = await pool.query('SELECT COUNT(*) as cnt FROM quotes');
    const total = parseInt(countRows[0].cnt) || 0;
    res.json({ quotes, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/quotes/stats
router.get('/stats', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.slice(0, 7) + '-01';

    const [totalRes, monthRes, sentRes, revenueRes, marginRes, recentRes] = await Promise.all([
      pool.query("SELECT COUNT(*) as cnt FROM quotes"),
      pool.query("SELECT COUNT(*) as cnt FROM quotes WHERE created_at >= $1", [monthStart]),
      pool.query("SELECT COUNT(*) as cnt FROM quotes WHERE status = 'sent'"),
      pool.query("SELECT COALESCE(SUM(final_price), 0) as total FROM quotes WHERE status IN ('sent','accepted')"),
      pool.query("SELECT AVG(margin_percent) as avg FROM quotes WHERE margin_percent > 0"),
      pool.query("SELECT q.*, c.company as customer_company FROM quotes q LEFT JOIN customers c ON c.id = q.customer_id ORDER BY q.created_at DESC LIMIT 5"),
    ]);

    res.json({
      total: parseInt(totalRes.rows[0].cnt) || 0,
      thisMonth: parseInt(monthRes.rows[0].cnt) || 0,
      sent: parseInt(sentRes.rows[0].cnt) || 0,
      totalRevenue: parseFloat(revenueRes.rows[0].total) || 0,
      avgMargin: parseFloat(marginRes.rows[0].avg) || 0,
      recent: recentRes.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/quotes/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT q.*, c.email as customer_email, c.phone as customer_phone, c.company as customer_company
      FROM quotes q
      LEFT JOIN customers c ON c.id = q.customer_id
      WHERE q.id = $1
    `, [req.params.id]);
    if (!rows[0]) return res.status(404).json({ error: 'Not found' });
    const { rows: lineItems } = await pool.query(
      'SELECT * FROM quote_line_items WHERE quote_id = $1 ORDER BY sort_order, id',
      [req.params.id]
    );
    res.json({ ...rows[0], lineItems });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/quotes/calculate - calculate pricing without saving
router.post('/calculate', async (req, res) => {
  try {
    const settings = await getSettings();
    const { materialCost, laborHours, designHours, outsourcedCost, dueDate, complexityMultiplier } = req.body;
    const result = calculateQuote({ materialCost, laborHours, designHours, outsourcedCost, settings, dueDate, complexityMultiplier });
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/quotes - create quote
router.post('/', async (req, res) => {
  try {
    const settings = await getSettings();

    const {
      customer_id, customer_name, project_name, type, product_template_id,
      quantity, paper_material, color_finish, due_date, notes,
      materialCost, laborHours, designHours, outsourcedCost, complexityMultiplier,
      lineItems,
    } = req.body;

    const pricing = calculateQuote({
      materialCost: parseFloat(materialCost || 0),
      laborHours: parseFloat(laborHours || 0),
      designHours: parseFloat(designHours || 0),
      outsourcedCost: parseFloat(outsourcedCost || 0),
      settings,
      dueDate: due_date,
      complexityMultiplier: parseFloat(complexityMultiplier || 1),
    });

    const quoteNumber = await generateQuoteNumber();

    const { rows } = await pool.query(`
      INSERT INTO quotes (
        quote_number, customer_id, customer_name, project_name, type, status,
        product_template_id, quantity, paper_material, color_finish, due_date,
        days_until_due, rush_percent, material_cost, labor_cost, design_cost,
        outsourced_cost, overhead_cost, rush_fee, subtotal, final_price,
        profit, margin_percent, notes, created_by
      ) VALUES ($1,$2,$3,$4,$5,'draft',$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
      RETURNING id
    `, [
      quoteNumber, customer_id || null, customer_name, project_name, type || 'quick',
      product_template_id || null, quantity || 1, paper_material, color_finish, due_date,
      pricing.daysUntilDue, pricing.rushPercent,
      pricing.materialCost, pricing.laborCost, pricing.designCost,
      pricing.outsourcedCost, pricing.overheadCost, pricing.rushFee,
      pricing.subtotal, pricing.finalPrice,
      pricing.profit, pricing.marginPercent,
      notes, req.user.id,
    ]);

    const quoteId = rows[0].id;

    if (lineItems && lineItems.length) {
      for (let i = 0; i < lineItems.length; i++) {
        const item = lineItems[i];
        await pool.query(
          'INSERT INTO quote_line_items (quote_id, type, description, quantity, unit, unit_cost, total_cost, notes, sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
          [quoteId, item.type, item.description, item.quantity || 1, item.unit, item.unit_cost || 0, item.total_cost || 0, item.notes, i]
        );
      }
    }

    const { rows: quote } = await pool.query('SELECT * FROM quotes WHERE id = $1', [quoteId]);
    const { rows: items } = await pool.query('SELECT * FROM quote_line_items WHERE quote_id = $1', [quoteId]);
    res.status(201).json({ ...quote[0], lineItems: items, pricing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/quotes/:id
router.put('/:id', async (req, res) => {
  try {
    const settings = await getSettings();
    const { id } = req.params;

    const {
      customer_id, customer_name, project_name, type, product_template_id,
      quantity, paper_material, color_finish, due_date, notes,
      materialCost, laborHours, designHours, outsourcedCost, complexityMultiplier,
      lineItems, status, email_subject, email_body,
    } = req.body;

    const pricing = calculateQuote({
      materialCost: parseFloat(materialCost || 0),
      laborHours: parseFloat(laborHours || 0),
      designHours: parseFloat(designHours || 0),
      outsourcedCost: parseFloat(outsourcedCost || 0),
      settings,
      dueDate: due_date,
      complexityMultiplier: parseFloat(complexityMultiplier || 1),
    });

    await pool.query(`
      UPDATE quotes SET
        customer_id=$1, customer_name=$2, project_name=$3, type=$4, product_template_id=$5,
        quantity=$6, paper_material=$7, color_finish=$8, due_date=$9,
        days_until_due=$10, rush_percent=$11, material_cost=$12, labor_cost=$13, design_cost=$14,
        outsourced_cost=$15, overhead_cost=$16, rush_fee=$17, subtotal=$18, final_price=$19,
        profit=$20, margin_percent=$21, notes=$22, status=$23, email_subject=$24, email_body=$25,
        updated_at=NOW()
      WHERE id=$26
    `, [
      customer_id || null, customer_name, project_name, type,
      product_template_id || null, quantity, paper_material, color_finish, due_date,
      pricing.daysUntilDue, pricing.rushPercent,
      pricing.materialCost, pricing.laborCost, pricing.designCost,
      pricing.outsourcedCost, pricing.overheadCost, pricing.rushFee,
      pricing.subtotal, pricing.finalPrice,
      pricing.profit, pricing.marginPercent,
      notes, status || 'draft', email_subject, email_body, id,
    ]);

    if (lineItems !== undefined) {
      await pool.query('DELETE FROM quote_line_items WHERE quote_id = $1', [id]);
      if (lineItems.length) {
        for (let i = 0; i < lineItems.length; i++) {
          const item = lineItems[i];
          await pool.query(
            'INSERT INTO quote_line_items (quote_id, type, description, quantity, unit, unit_cost, total_cost, notes, sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
            [id, item.type, item.description, item.quantity || 1, item.unit, item.unit_cost || 0, item.total_cost || 0, item.notes, i]
          );
        }
      }
    }

    const { rows: quote } = await pool.query('SELECT * FROM quotes WHERE id = $1', [id]);
    const { rows: items } = await pool.query('SELECT * FROM quote_line_items WHERE quote_id = $1', [id]);
    res.json({ ...quote[0], lineItems: items, pricing });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM quotes WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
