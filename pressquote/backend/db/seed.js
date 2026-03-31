require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const { pool } = require('../database');
const { createSchema } = require('./schema');

async function seed() {
  await createSchema();

  // Users
  const hash = await bcrypt.hash('password123', 10);
  const { rows: userExists } = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@pressquote.com']);
  if (!userExists[0]) {
    await pool.query('INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4)', ['admin@pressquote.com', hash, 'Admin User', 'admin']);
    await pool.query('INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4)', ['staff@pressquote.com', hash, 'Staff User', 'staff']);
    console.log('Users seeded');
  }

  // Company settings
  const defaultSettings = [
    ['labor_rate', '45'],
    ['design_hourly_rate', '75'],
    ['overhead_percent', '20'],
    ['target_margin_percent', '40'],
    ['minimum_job_price', '25'],
    ['economic_multiplier', '1.0'],
    ['company_name', 'PrintCo'],
    ['company_email', 'quotes@printco.com'],
    ['company_phone', '555-867-5309'],
    ['company_address', '123 Press Way, Print City, PC 12345'],
  ];
  for (const [key, value] of defaultSettings) {
    await pool.query(
      'INSERT INTO company_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING',
      [key, value]
    );
  }
  console.log('Settings seeded');

  // Suppliers
  const { rows: supplierExists } = await pool.query('SELECT id FROM suppliers WHERE name = $1', ['Neenah Paper']);
  let supplierId = supplierExists[0]?.id;
  if (!supplierExists[0]) {
    const { rows } = await pool.query(
      'INSERT INTO suppliers (name, contact_email, contact_phone) VALUES ($1, $2, $3) RETURNING id',
      ['Neenah Paper', 'orders@neenah.com', '800-558-5061']
    );
    supplierId = rows[0].id;
  }

  // Materials
  const materials = [
    ['100lb Gloss Coated Cover', 'sheet', 0.08, 'Neenah Paper', 5000, 500],
    ['80lb Gloss Coated Text', 'sheet', 0.05, 'Neenah Paper', 10000, 1000],
    ['60lb Uncoated Offset', 'sheet', 0.03, 'Local Supplier', 20000, 2000],
    ['14pt Coated One Side', 'sheet', 0.12, 'Neenah Paper', 3000, 300],
    ['Vinyl Banner Material', 'sq ft', 1.20, 'Printex', 500, 50],
    ['Foam Core 3/16"', 'sheet', 3.50, 'Local Supplier', 100, 20],
    ['Black Ink (Toner)', 'unit', 0.01, 'HP', 999, 100],
    ['Color Ink (CMYK)', 'unit', 0.04, 'HP', 999, 100],
    ['Perfect Bind Glue', 'oz', 0.15, 'Bindery Supply Co', 200, 20],
    ['Saddle Stitch Wire', 'unit', 0.02, 'Bindery Supply Co', 5000, 500],
  ];
  for (const [name, unit_type, unit_cost, supplier, inventory_qty, reorder_point] of materials) {
    await pool.query(
      'INSERT INTO materials (name, unit_type, unit_cost, supplier, inventory_qty, reorder_point) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING',
      [name, unit_type, unit_cost, supplier, inventory_qty, reorder_point]
    );
  }
  console.log('Materials seeded');

  // Product templates
  const templates = [
    { name: 'Business Cards (Standard)', category: 'Business Cards', setup_time: 0.5, run_time_per_unit: 0.001, finishing_time: 0.25, complexity_multiplier: 1.0, default_margin: 45 },
    { name: 'Flyers (8.5x11)', category: 'Flyers', setup_time: 0.5, run_time_per_unit: 0.002, finishing_time: 0.1, complexity_multiplier: 1.0, default_margin: 40 },
    { name: 'Flyers (5.5x8.5)', category: 'Flyers', setup_time: 0.5, run_time_per_unit: 0.002, finishing_time: 0.1, complexity_multiplier: 1.0, default_margin: 40 },
    { name: 'Posters (11x17)', category: 'Posters', setup_time: 0.5, run_time_per_unit: 0.005, finishing_time: 0.1, complexity_multiplier: 1.2, default_margin: 42 },
    { name: 'Posters (18x24)', category: 'Posters', setup_time: 0.75, run_time_per_unit: 0.008, finishing_time: 0.1, complexity_multiplier: 1.3, default_margin: 42 },
    { name: 'Brochures (Tri-fold)', category: 'Brochures', setup_time: 1.0, run_time_per_unit: 0.003, finishing_time: 0.3, complexity_multiplier: 1.2, default_margin: 43 },
    { name: 'Brochures (Half-fold)', category: 'Brochures', setup_time: 0.75, run_time_per_unit: 0.003, finishing_time: 0.2, complexity_multiplier: 1.1, default_margin: 43 },
    { name: 'Booklets (Saddle Stitch)', category: 'Booklets', setup_time: 1.5, run_time_per_unit: 0.01, finishing_time: 1.0, complexity_multiplier: 1.5, default_margin: 45 },
    { name: 'Booklets (Perfect Bound)', category: 'Booklets', setup_time: 2.0, run_time_per_unit: 0.015, finishing_time: 1.5, complexity_multiplier: 1.8, default_margin: 48 },
    { name: 'Vinyl Banner', category: 'Banners', setup_time: 0.5, run_time_per_unit: 0.1, finishing_time: 0.5, complexity_multiplier: 1.3, default_margin: 50 },
  ];
  for (const t of templates) {
    const { rows: existing } = await pool.query('SELECT id FROM product_templates WHERE name = $1', [t.name]);
    if (!existing[0]) {
      await pool.query(
        'INSERT INTO product_templates (name, category, setup_time, run_time_per_unit, finishing_time, complexity_multiplier, default_margin) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [t.name, t.category, t.setup_time, t.run_time_per_unit, t.finishing_time, t.complexity_multiplier, t.default_margin]
      );
    }
  }
  console.log('Product templates seeded');

  // Outsourced items
  const outsourcedItems = [
    { supplier_name: 'FastSigns', item_name: 'Large Format Print (per sq ft)', base_cost: 3.50, shipping_cost: 15, lead_time: 3 },
    { supplier_name: 'Bindery Plus', item_name: 'Perfect Binding (per book)', base_cost: 2.25, shipping_cost: 25, lead_time: 5 },
    { supplier_name: 'Foil Works', item_name: 'Foil Stamping Setup', base_cost: 150, shipping_cost: 20, lead_time: 7 },
    { supplier_name: 'Die Shop', item_name: 'Die Cutting Setup', base_cost: 200, shipping_cost: 30, lead_time: 10 },
    { supplier_name: 'Emboss Co', item_name: 'Embossing Setup', base_cost: 175, shipping_cost: 20, lead_time: 7 },
  ];
  for (const item of outsourcedItems) {
    const { rows: existing } = await pool.query('SELECT id FROM outsourced_items WHERE item_name = $1', [item.item_name]);
    if (!existing[0]) {
      await pool.query(
        'INSERT INTO outsourced_items (supplier_name, item_name, base_cost, shipping_cost, lead_time) VALUES ($1, $2, $3, $4, $5)',
        [item.supplier_name, item.item_name, item.base_cost, item.shipping_cost, item.lead_time]
      );
    }
  }
  console.log('Outsourced items seeded');

  // Sample customers
  const sampleCustomers = [
    { name: 'Sarah Johnson', email: 'sarah@acmecorp.com', phone: '555-234-5678', company: 'Acme Corp' },
    { name: 'Mike Rodriguez', email: 'mike@startuphq.io', phone: '555-345-6789', company: 'Startup HQ' },
    { name: 'Lisa Chen', email: 'lisa.chen@retailco.com', phone: '555-456-7890', company: 'RetailCo' },
    { name: 'James Wilson', email: 'jwilson@lawfirm.com', phone: '555-567-8901', company: 'Wilson Law' },
    { name: 'Amanda Torres', email: 'amanda@eventpros.com', phone: '555-678-9012', company: 'Event Pros' },
  ];
  for (const c of sampleCustomers) {
    await pool.query(
      'INSERT INTO customers (name, email, phone, company) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      [c.name, c.email, c.phone, c.company]
    );
  }
  console.log('Customers seeded');

  console.log('\n✅ Seed complete!');
  console.log('📧 Login: admin@pressquote.com / password123');

  await pool.end();
}

seed().catch(err => { console.error(err); process.exit(1); });
