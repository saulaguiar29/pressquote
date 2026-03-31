const express = require('express');
const router = express.Router();
const OAuthClient = require('intuit-oauth');
const { pool } = require('../database');
const authMiddleware = require('../middleware/auth');

function createOAuthClient() {
  return new OAuthClient({
    clientId: process.env.QB_CLIENT_ID,
    clientSecret: process.env.QB_CLIENT_SECRET,
    environment: process.env.QB_ENVIRONMENT || 'sandbox',
    redirectUri: process.env.QB_REDIRECT_URI,
  });
}

async function saveToken(key, value) {
  await pool.query(
    'INSERT INTO integrations (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()',
    [key, String(value)]
  );
}

async function getTokens() {
  const { rows } = await pool.query("SELECT key, value FROM integrations WHERE key LIKE 'qb_%'");
  const t = {};
  rows.forEach(r => { t[r.key] = r.value; });
  return t;
}

async function getValidAccessToken() {
  const t = await getTokens();
  if (!t.qb_access_token || !t.qb_realm_id) throw new Error('QuickBooks not connected');

  const expiry = parseInt(t.qb_token_expiry || '0');
  if (Date.now() > expiry - 5 * 60 * 1000) {
    const oauthClient = createOAuthClient();
    oauthClient.setToken({
      token_type: 'bearer',
      access_token: t.qb_access_token,
      refresh_token: t.qb_refresh_token,
      realmId: t.qb_realm_id,
    });
    const refreshed = await oauthClient.refresh();
    const newToken = refreshed.getJson();
    await saveToken('qb_access_token', newToken.access_token);
    if (newToken.refresh_token) await saveToken('qb_refresh_token', newToken.refresh_token);
    await saveToken('qb_token_expiry', String(Date.now() + (newToken.expires_in || 3600) * 1000));
    return { accessToken: newToken.access_token, realmId: t.qb_realm_id };
  }

  return { accessToken: t.qb_access_token, realmId: t.qb_realm_id };
}

async function qbRequest(method, path, accessToken, realmId, body = null) {
  const base = process.env.QB_ENVIRONMENT === 'production'
    ? `https://quickbooks.api.intuit.com/v3/company/${realmId}`
    : `https://sandbox-quickbooks.api.intuit.com/v3/company/${realmId}`;
  const sep = path.includes('?') ? '&' : '?';
  const url = `${base}${path}${sep}minorversion=65`;

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`QBO ${res.status}: ${text}`);
  }
  return res.json();
}

async function findOrCreateCustomer(accessToken, realmId, name, email) {
  const escaped = name.replace(/'/g, "''");
  const { QueryResponse } = await qbRequest('GET',
    `/query?query=${encodeURIComponent(`SELECT * FROM Customer WHERE DisplayName = '${escaped}' MAXRESULTS 1`)}`,
    accessToken, realmId
  );
  if (QueryResponse?.Customer?.[0]) return String(QueryResponse.Customer[0].Id);

  const body = { DisplayName: name };
  if (email) body.PrimaryEmailAddr = { Address: email };
  const { Customer } = await qbRequest('POST', '/customer', accessToken, realmId, body);
  return String(Customer.Id);
}

async function findOrCreateServiceItem(accessToken, realmId) {
  const { QueryResponse } = await qbRequest('GET',
    `/query?query=${encodeURIComponent("SELECT * FROM Item WHERE Name = 'PressQuote Services' MAXRESULTS 1")}`,
    accessToken, realmId
  );
  if (QueryResponse?.Item?.[0]) return String(QueryResponse.Item[0].Id);

  // Get an income account to attach to the item
  const acctRes = await qbRequest('GET',
    `/query?query=${encodeURIComponent("SELECT * FROM Account WHERE AccountType = 'Income' MAXRESULTS 1")}`,
    accessToken, realmId
  );
  const acct = acctRes?.QueryResponse?.Account?.[0];

  const body = {
    Name: 'PressQuote Services',
    Type: 'Service',
    IncomeAccountRef: acct ? { value: String(acct.Id), name: acct.Name } : { value: '1' },
  };
  const { Item } = await qbRequest('POST', '/item', accessToken, realmId, body);
  return String(Item.Id);
}

// GET /api/quickbooks/status
router.get('/status', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT value FROM integrations WHERE key = 'qb_realm_id'");
    res.json({ connected: !!rows[0]?.value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/quickbooks/auth-url
router.get('/auth-url', authMiddleware, (req, res) => {
  try {
    const oauthClient = createOAuthClient();
    const url = oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting],
      state: 'pressquote',
    });
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/quickbooks/callback  (no auth — called by Intuit redirect)
router.get('/callback', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  try {
    const oauthClient = createOAuthClient();
    const fullUrl = `${process.env.QB_REDIRECT_URI}?${new URLSearchParams(req.query).toString()}`;
    const authResponse = await oauthClient.createToken(fullUrl);
    const token = authResponse.getJson();
    const realmId = req.query.realmId;

    await saveToken('qb_access_token', token.access_token);
    await saveToken('qb_refresh_token', token.refresh_token);
    await saveToken('qb_realm_id', realmId);
    await saveToken('qb_token_expiry', String(Date.now() + (token.expires_in || 3600) * 1000));

    res.redirect(`${frontendUrl}/settings?qb=connected`);
  } catch (err) {
    console.error('QB callback error:', err);
    res.redirect(`${frontendUrl}/settings?qb=error`);
  }
});

// DELETE /api/quickbooks/disconnect
router.delete('/disconnect', authMiddleware, async (req, res) => {
  try {
    await pool.query("DELETE FROM integrations WHERE key LIKE 'qb_%'");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quickbooks/export-invoice/:quoteId
router.post('/export-invoice/:quoteId', authMiddleware, async (req, res) => {
  try {
    const { accessToken, realmId } = await getValidAccessToken();

    const { rows: quoteRows } = await pool.query(`
      SELECT q.*, c.email as customer_email
      FROM quotes q LEFT JOIN customers c ON c.id = q.customer_id
      WHERE q.id = $1
    `, [req.params.quoteId]);
    const quote = quoteRows[0];
    if (!quote) return res.status(404).json({ error: 'Quote not found' });

    const { rows: lineItems } = await pool.query(
      'SELECT * FROM quote_line_items WHERE quote_id = $1 ORDER BY sort_order',
      [req.params.quoteId]
    );

    const [customerId, itemId] = await Promise.all([
      findOrCreateCustomer(accessToken, realmId, quote.customer_name, quote.customer_email),
      findOrCreateServiceItem(accessToken, realmId),
    ]);

    // Build invoice lines from custom line items or cost breakdown
    let lines;
    if (lineItems.length > 0) {
      lines = lineItems
        .filter(item => parseFloat(item.total_cost) > 0)
        .map(item => ({
          Amount: parseFloat(item.total_cost),
          DetailType: 'SalesItemLineDetail',
          Description: item.description,
          SalesItemLineDetail: { ItemRef: { value: itemId } },
        }));
    } else {
      lines = [
        { label: 'Materials', value: quote.material_cost },
        { label: 'Labor', value: quote.labor_cost },
        { label: 'Design', value: quote.design_cost },
        { label: 'Outsourced Work', value: quote.outsourced_cost },
        { label: 'Overhead', value: quote.overhead_cost },
        { label: `Rush Fee (+${quote.rush_percent}%)`, value: quote.rush_fee },
      ]
        .filter(l => parseFloat(l.value) > 0)
        .map(l => ({
          Amount: parseFloat(l.value),
          DetailType: 'SalesItemLineDetail',
          Description: l.label,
          SalesItemLineDetail: { ItemRef: { value: itemId } },
        }));
    }

    const invoiceBody = {
      CustomerRef: { value: customerId },
      DocNumber: quote.quote_number,
      Line: lines,
    };
    if (quote.due_date) invoiceBody.DueDate = quote.due_date;
    if (quote.project_name) invoiceBody.CustomerMemo = { value: quote.project_name };

    const { Invoice } = await qbRequest('POST', '/invoice', accessToken, realmId, invoiceBody);
    res.json({ success: true, invoiceId: Invoice.Id, invoiceNumber: Invoice.DocNumber });
  } catch (err) {
    console.error('QB export error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/quickbooks/sync-customers
router.post('/sync-customers', authMiddleware, async (req, res) => {
  try {
    const { accessToken, realmId } = await getValidAccessToken();

    const { QueryResponse } = await qbRequest('GET',
      `/query?query=${encodeURIComponent('SELECT * FROM Customer WHERE Active = true MAXRESULTS 100')}`,
      accessToken, realmId
    );
    const qbCustomers = QueryResponse?.Customer || [];

    let imported = 0;
    for (const c of qbCustomers) {
      const name = c.DisplayName || c.FullyQualifiedName;
      const email = c.PrimaryEmailAddr?.Address || null;
      const phone = c.PrimaryPhone?.FreeFormNumber || null;
      const company = c.CompanyName || null;

      const { rows: existing } = await pool.query(
        'SELECT id FROM customers WHERE email = $1',
        [email]
      );
      if (!existing[0] && name) {
        await pool.query(
          'INSERT INTO customers (name, email, phone, company) VALUES ($1, $2, $3, $4)',
          [name, email, phone, company]
        );
        imported++;
      }
    }

    res.json({ success: true, imported, total: qbCustomers.length });
  } catch (err) {
    console.error('QB sync error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
