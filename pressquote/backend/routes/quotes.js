const express = require('express');
const router = express.Router();
const { getDb } = require('../database');
const authMiddleware = require('../middleware/auth');
const { calculateQuote, calcTemplateHours } = require('../utils/pricingEngine');

router.use(authMiddleware);

function getSettings(db) {
  const rows = db.prepare('SELECT key, value FROM company_settings').all();
  const settings = {};
  rows.forEach(r => { settings[r.key] = r.value; });
  return settings;
}

function generateQuoteNumber(db) {
  const year = new Date().getFullYear();
  const count = db.prepare("SELECT COUNT(*) as cnt FROM quotes WHERE quote_number LIKE ?").get(`PQ-${year}-%`);
  const num = String((count?.cnt || 0) + 1).padStart(4, '0');
  return `PQ-${year}-${num}`;
}

// GET /api/quotes
router.get('/', (req, res) => {
  const db = getDb();
  const { search, status, type, limit = 50, offset = 0 } = req.query;

  let query = 'SELECT q.*, c.company as customer_company FROM quotes q LEFT JOIN customers c ON c.id = q.customer_id WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (q.quote_number LIKE ? OR q.customer_name LIKE ? OR q.project_name LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (status) { query += ' AND q.status = ?'; params.push(status); }
  if (type) { query += ' AND q.type = ?'; params.push(type); }

  query += ' ORDER BY q.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  const quotes = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as cnt FROM quotes').get()?.cnt || 0;
  res.json({ quotes, total });
});

// GET /api/quotes/stats
router.get('/stats', (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().split('T')[0];
  const monthStart = today.slice(0, 7) + '-01';

  const total = db.prepare("SELECT COUNT(*) as cnt FROM quotes").get()?.cnt || 0;
  const thisMonth = db.prepare("SELECT COUNT(*) as cnt FROM quotes WHERE created_at >= ?").get(monthStart)?.cnt || 0;
  const sent = db.prepare("SELECT COUNT(*) as cnt FROM quotes WHERE status = 'sent'").get()?.cnt || 0;
  const totalRevenue = db.prepare("SELECT COALESCE(SUM(final_price), 0) as total FROM quotes WHERE status IN ('sent','accepted')").get()?.total || 0;
  const avgMargin = db.prepare("SELECT AVG(margin_percent) as avg FROM quotes WHERE margin_percent > 0").get()?.avg || 0;
  const recent = db.prepare("SELECT q.*, c.company as customer_company FROM quotes q LEFT JOIN customers c ON c.id = q.customer_id ORDER BY q.created_at DESC LIMIT 5").all();

  res.json({ total, thisMonth, sent, totalRevenue, avgMargin, recent });
});

// GET /api/quotes/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const quote = db.prepare(`
    SELECT q.*, c.email as customer_email, c.phone as customer_phone, c.company as customer_company
    FROM quotes q
    LEFT JOIN customers c ON c.id = q.customer_id
    WHERE q.id = ?
  `).get(req.params.id);
  if (!quote) return res.status(404).json({ error: 'Not found' });
  const lineItems = db.prepare('SELECT * FROM quote_line_items WHERE quote_id = ? ORDER BY sort_order, id').all(req.params.id);
  res.json({ ...quote, lineItems });
});

// POST /api/quotes/calculate - calculate pricing without saving
router.post('/calculate', (req, res) => {
  const db = getDb();
  const settings = getSettings(db);
  const { materialCost, laborHours, designHours, outsourcedCost, dueDate, complexityMultiplier } = req.body;
  const result = calculateQuote({ materialCost, laborHours, designHours, outsourcedCost, settings, dueDate, complexityMultiplier });
  res.json(result);
});

// POST /api/quotes - create quote
router.post('/', (req, res) => {
  const db = getDb();
  const settings = getSettings(db);

  const {
    customer_id, customer_name, project_name, type, product_template_id,
    quantity, paper_material, color_finish, due_date, notes,
    // Pricing inputs
    materialCost, laborHours, designHours, outsourcedCost, complexityMultiplier,
    // Line items (for custom jobs)
    lineItems,
    // Pre-calculated (optional override)
    overridePricing,
  } = req.body;

  // Calculate pricing
  const pricing = calculateQuote({
    materialCost: parseFloat(materialCost || 0),
    laborHours: parseFloat(laborHours || 0),
    designHours: parseFloat(designHours || 0),
    outsourcedCost: parseFloat(outsourcedCost || 0),
    settings,
    dueDate: due_date,
    complexityMultiplier: parseFloat(complexityMultiplier || 1),
  });

  const quoteNumber = generateQuoteNumber(db);

  const result = db.prepare(`
    INSERT INTO quotes (
      quote_number, customer_id, customer_name, project_name, type, status,
      product_template_id, quantity, paper_material, color_finish, due_date,
      days_until_due, rush_percent, material_cost, labor_cost, design_cost,
      outsourced_cost, overhead_cost, rush_fee, subtotal, final_price,
      profit, margin_percent, notes, created_by
    ) VALUES (?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    quoteNumber, customer_id || null, customer_name, project_name, type || 'quick',
    product_template_id || null, quantity || 1, paper_material, color_finish, due_date,
    pricing.daysUntilDue, pricing.rushPercent,
    pricing.materialCost, pricing.laborCost, pricing.designCost,
    pricing.outsourcedCost, pricing.overheadCost, pricing.rushFee,
    pricing.subtotal, pricing.finalPrice,
    pricing.profit, pricing.marginPercent,
    notes, req.user.id
  );

  const quoteId = result.lastInsertRowid;

  // Insert line items
  if (lineItems && lineItems.length) {
    const stmt = db.prepare('INSERT INTO quote_line_items (quote_id, type, description, quantity, unit, unit_cost, total_cost, notes, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    lineItems.forEach((item, i) => {
      stmt.run(quoteId, item.type, item.description, item.quantity || 1, item.unit, item.unit_cost || 0, item.total_cost || 0, item.notes, i);
    });
  }

  const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(quoteId);
  const items = db.prepare('SELECT * FROM quote_line_items WHERE quote_id = ?').all(quoteId);
  res.status(201).json({ ...quote, lineItems: items, pricing });
});

// PUT /api/quotes/:id
router.put('/:id', (req, res) => {
  const db = getDb();
  const settings = getSettings(db);
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

  db.prepare(`
    UPDATE quotes SET
      customer_id=?, customer_name=?, project_name=?, type=?, product_template_id=?,
      quantity=?, paper_material=?, color_finish=?, due_date=?,
      days_until_due=?, rush_percent=?, material_cost=?, labor_cost=?, design_cost=?,
      outsourced_cost=?, overhead_cost=?, rush_fee=?, subtotal=?, final_price=?,
      profit=?, margin_percent=?, notes=?, status=?, email_subject=?, email_body=?,
      updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(
    customer_id || null, customer_name, project_name, type,
    product_template_id || null, quantity, paper_material, color_finish, due_date,
    pricing.daysUntilDue, pricing.rushPercent,
    pricing.materialCost, pricing.laborCost, pricing.designCost,
    pricing.outsourcedCost, pricing.overheadCost, pricing.rushFee,
    pricing.subtotal, pricing.finalPrice,
    pricing.profit, pricing.marginPercent,
    notes, status || 'draft', email_subject, email_body, id
  );

  if (lineItems !== undefined) {
    db.prepare('DELETE FROM quote_line_items WHERE quote_id = ?').run(id);
    if (lineItems.length) {
      const stmt = db.prepare('INSERT INTO quote_line_items (quote_id, type, description, quantity, unit, unit_cost, total_cost, notes, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
      lineItems.forEach((item, i) => {
        stmt.run(id, item.type, item.description, item.quantity || 1, item.unit, item.unit_cost || 0, item.total_cost || 0, item.notes, i);
      });
    }
  }

  const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(id);
  const items = db.prepare('SELECT * FROM quote_line_items WHERE quote_id = ?').all(id);
  res.json({ ...quote, lineItems: items, pricing });
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM quotes WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
