const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../database');
const authMiddleware = require('../middleware/auth');

function makeToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role, company_id: user.company_id },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function publicUser(u) {
  return { id: u.id, email: u.email, name: u.name, role: u.role, company_id: u.company_id };
}

// POST /api/auth/signup — create a new company + admin account (public)
router.post('/signup', async (req, res) => {
  const { companyName, name, email, password } = req.body;
  if (!companyName || !name || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: [company] } = await client.query(
      'INSERT INTO companies (name) VALUES ($1) RETURNING id',
      [companyName.trim()]
    );

    const hash = await bcrypt.hash(password, 10);
    const { rows: [user] } = await client.query(
      'INSERT INTO users (email, password_hash, name, role, company_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [email.toLowerCase().trim(), hash, name.trim(), 'admin', company.id]
    );

    const defaultSettings = [
      ['labor_rate', '45'], ['design_hourly_rate', '65'], ['overhead_percent', '30'],
      ['target_margin_percent', '40'], ['minimum_job_price', '25'], ['economic_multiplier', '1'],
      ['company_name', companyName.trim()], ['company_email', email.toLowerCase().trim()],
      ['company_phone', ''], ['company_address', ''],
    ];
    for (const [key, value] of defaultSettings) {
      await client.query(
        'INSERT INTO company_settings (key, value, company_id) VALUES ($1, $2, $3)',
        [key, value, company.id]
      );
    }

    await client.query('COMMIT');

    const token = makeToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = makeToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// GET /api/auth/users (admin only — scoped to same company)
router.get('/users', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { rows } = await pool.query(
      'SELECT id, email, name, role, created_at FROM users WHERE company_id = $1 ORDER BY created_at DESC',
      [req.user.company_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/auth/users/:id (admin only — scoped to same company)
router.delete('/users/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    if (String(req.params.id) === String(req.user.id)) return res.status(400).json({ error: 'Cannot delete your own account' });
    await pool.query('DELETE FROM users WHERE id = $1 AND company_id = $2', [req.params.id, req.user.company_id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/register (admin only — adds user to same company)
router.post('/register', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { email, password, name, role } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'Required fields missing' });

    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (email, password_hash, name, role, company_id) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [email.toLowerCase().trim(), hash, name, role || 'staff', req.user.company_id]
    );
    res.json({ id: rows[0].id, email, name, role: role || 'staff' });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
