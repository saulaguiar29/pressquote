const { pool } = require('../database');

async function createSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS companies (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS company_settings (
      id SERIAL PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS customers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      company TEXT,
      address TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      contact_email TEXT,
      contact_phone TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS materials (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      unit_type TEXT NOT NULL,
      unit_cost NUMERIC NOT NULL DEFAULT 0,
      supplier TEXT,
      inventory_qty NUMERIC DEFAULT 0,
      reorder_point NUMERIC DEFAULT 0,
      last_updated TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS outsourced_items (
      id SERIAL PRIMARY KEY,
      supplier_id INTEGER REFERENCES suppliers(id),
      supplier_name TEXT NOT NULL,
      item_name TEXT NOT NULL,
      base_cost NUMERIC NOT NULL DEFAULT 0,
      shipping_cost NUMERIC DEFAULT 0,
      lead_time INTEGER DEFAULT 0,
      order_link TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS product_templates (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      setup_time NUMERIC DEFAULT 0,
      run_time_per_unit NUMERIC DEFAULT 0,
      finishing_time NUMERIC DEFAULT 0,
      complexity_multiplier NUMERIC DEFAULT 1.0,
      default_margin NUMERIC DEFAULT 40,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS product_template_materials (
      id SERIAL PRIMARY KEY,
      template_id INTEGER NOT NULL REFERENCES product_templates(id) ON DELETE CASCADE,
      material_id INTEGER NOT NULL REFERENCES materials(id),
      quantity NUMERIC DEFAULT 1,
      unit_type TEXT
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id SERIAL PRIMARY KEY,
      quote_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER REFERENCES customers(id),
      customer_name TEXT NOT NULL,
      project_name TEXT,
      type TEXT NOT NULL DEFAULT 'quick',
      status TEXT NOT NULL DEFAULT 'draft',
      product_template_id INTEGER REFERENCES product_templates(id),
      quantity INTEGER DEFAULT 1,
      paper_material TEXT,
      color_finish TEXT,
      due_date DATE,
      days_until_due INTEGER,
      rush_percent NUMERIC DEFAULT 0,
      material_cost NUMERIC DEFAULT 0,
      labor_cost NUMERIC DEFAULT 0,
      design_cost NUMERIC DEFAULT 0,
      outsourced_cost NUMERIC DEFAULT 0,
      overhead_cost NUMERIC DEFAULT 0,
      rush_fee NUMERIC DEFAULT 0,
      subtotal NUMERIC DEFAULT 0,
      final_price NUMERIC DEFAULT 0,
      profit NUMERIC DEFAULT 0,
      margin_percent NUMERIC DEFAULT 0,
      email_subject TEXT,
      email_body TEXT,
      notes TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS quote_line_items (
      id SERIAL PRIMARY KEY,
      quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      quantity NUMERIC DEFAULT 1,
      unit TEXT,
      unit_cost NUMERIC DEFAULT 0,
      total_cost NUMERIC DEFAULT 0,
      notes TEXT,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS integrations (
      id SERIAL PRIMARY KEY,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log('Schema created successfully');
}

module.exports = { createSchema };
