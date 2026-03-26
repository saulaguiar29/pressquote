const { getDb } = require('../database');

function createSchema() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'staff',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS company_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      company TEXT,
      address TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      contact_email TEXT,
      contact_phone TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      unit_type TEXT NOT NULL,
      unit_cost REAL NOT NULL DEFAULT 0,
      supplier TEXT,
      inventory_qty REAL DEFAULT 0,
      reorder_point REAL DEFAULT 0,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS outsourced_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER REFERENCES suppliers(id),
      supplier_name TEXT NOT NULL,
      item_name TEXT NOT NULL,
      base_cost REAL NOT NULL DEFAULT 0,
      shipping_cost REAL DEFAULT 0,
      lead_time INTEGER DEFAULT 0,
      order_link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      setup_time REAL DEFAULT 0,
      run_time_per_unit REAL DEFAULT 0,
      finishing_time REAL DEFAULT 0,
      complexity_multiplier REAL DEFAULT 1.0,
      default_margin REAL DEFAULT 40,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS product_template_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL REFERENCES product_templates(id) ON DELETE CASCADE,
      material_id INTEGER NOT NULL REFERENCES materials(id),
      quantity REAL DEFAULT 1,
      unit_type TEXT
    );

    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      rush_percent REAL DEFAULT 0,
      material_cost REAL DEFAULT 0,
      labor_cost REAL DEFAULT 0,
      design_cost REAL DEFAULT 0,
      outsourced_cost REAL DEFAULT 0,
      overhead_cost REAL DEFAULT 0,
      rush_fee REAL DEFAULT 0,
      subtotal REAL DEFAULT 0,
      final_price REAL DEFAULT 0,
      profit REAL DEFAULT 0,
      margin_percent REAL DEFAULT 0,
      email_subject TEXT,
      email_body TEXT,
      notes TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quote_line_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      quantity REAL DEFAULT 1,
      unit TEXT,
      unit_cost REAL DEFAULT 0,
      total_cost REAL DEFAULT 0,
      notes TEXT,
      sort_order INTEGER DEFAULT 0
    );
  `);

  console.log('Schema created successfully');
}

module.exports = { createSchema };
