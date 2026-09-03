const { pool } = require("../database");

async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Add company_id to all tenant-scoped tables
    const tables = [
      "users",
      "company_settings",
      "customers",
      "quotes",
      "materials",
      "product_templates",
      "suppliers",
      "outsourced_items",
      "integrations",
    ];
    for (const table of tables) {
      await client.query(
        `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id)`,
      );
    }

    // Fix company_settings unique constraint: drop global key unique, add (key, company_id) unique
    await client.query(
      `ALTER TABLE company_settings DROP CONSTRAINT IF EXISTS company_settings_key_key`,
    );
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'company_settings_key_company_id_key') THEN
          ALTER TABLE company_settings ADD CONSTRAINT company_settings_key_company_id_key UNIQUE (key, company_id);
        END IF;
      END $$
    `);

    // Fix integrations unique constraint to be (key, company_id)
    await client.query(
      `ALTER TABLE integrations DROP CONSTRAINT IF EXISTS integrations_key_key`,
    );
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'integrations_key_company_id_key') THEN
          ALTER TABLE integrations ADD CONSTRAINT integrations_key_company_id_key UNIQUE (key, company_id);
        END IF;
      END $$
    `);

    // Enable Row Level Security on every public table. Supabase auto-exposes public
    // tables over its PostgREST API to the `anon`/`authenticated` roles; without RLS,
    // that API can read/write any company's data with no login. We add no policies
    // here (default-deny for those roles) since this app's own DB connection uses the
    // `postgres` role, which has BYPASSRLS and is unaffected. All authorization for the
    // app itself continues to happen in Express middleware (see middleware/auth.js).
    const allTables = [
      "companies",
      "users",
      "company_settings",
      "customers",
      "suppliers",
      "materials",
      "outsourced_items",
      "product_templates",
      "product_template_materials",
      "quotes",
      "quote_line_items",
      "integrations",
    ];
    for (const table of allTables) {
      await client.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
    }

    await client.query("COMMIT");
    console.log("Migrations applied successfully");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Migration failed:", err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { runMigrations };
