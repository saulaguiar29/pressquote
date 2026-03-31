const { Pool, types } = require('pg');

// Parse NUMERIC columns as JS numbers instead of strings
types.setTypeParser(1700, val => parseFloat(val));
// Parse INT8 (bigint) as JS numbers
types.setTypeParser(20, val => parseInt(val, 10));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

module.exports = { pool };
