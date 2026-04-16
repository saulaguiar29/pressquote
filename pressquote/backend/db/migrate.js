const { pool } = require('../database');

async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Add company_id to all tenant-scoped tables
    const tables = ['users', 'company_settings', 'customers', 'quotes', 'materials', 'product_templates', 'suppliers', 'outsourced_items'];
    for (const table of tables) {
      await client.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id)`);
    }

    // Fix company_settings unique constraint: drop global key unique, add (key, company_id) unique
    await client.query(`ALTER TABLE company_settings DROP CONSTRAINT IF EXISTS company_settings_key_key`);
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_settings_key_company_id_key') THEN
          ALTER TABLE company_settings ADD CONSTRAINT company_settings_key_company_id_key UNIQUE (key, company_id);
        END IF;
      END $$
    `);

    await client.query('COMMIT');
    console.log('Migrations applied successfully');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { runMigrations };
