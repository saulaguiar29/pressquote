# 🖨️ PressQuote — Print Shop Quoting Software

A full-stack SaaS application for print shops to generate fast, accurate, profitable quotes for standard and custom print jobs.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Quick Quote** | 4-step wizard for standard products (cards, flyers, posters, banners, booklets) |
| **Custom Job** | Line-item builder for complex work (materials, labor, design, outsourced, equipment) |
| **Pricing Engine** | Shared engine with overhead, target margin, rush pricing, and minimum price enforcement |
| **Quote Review** | Detailed breakdown, profit/margin display, email draft, and status tracking |
| **Quote History** | Searchable, filterable list of all quotes |
| **Materials DB** | CRUD admin with low-stock alerts and reorder points |
| **Product Templates** | Category-grouped templates with labor time presets |
| **Suppliers & Outsourced** | Vendor costs and lead times for use in quotes |
| **Customers** | Customer directory with inline search |
| **Settings** | Labor rate, design rate, overhead %, margin %, minimum price, economic multiplier |
| **Auth** | JWT-based login with admin/staff roles |

---

## ⚡ Rush Pricing Rules

Automatically applied based on due date:

| Days Until Due | Surcharge |
|---|---|
| 14+ days | No rush fee |
| 7–13 days | +10% |
| 3–6 days | +25% |
| 0–2 days | +50% |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, React Router 6, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js 22, Express 4 |
| **Database** | SQLite (Node.js built-in `node:sqlite`, no install needed) |
| **Auth** | JWT via `jsonwebtoken` + `bcryptjs` |
| **Fonts** | Syne (display) + DM Sans (body) + JetBrains Mono |

---

## 🚀 Getting Started

### Requirements
- **Node.js 22+** (required for built-in SQLite support)
- npm

### 1. Install dependencies

```bash
# Install both backend and frontend
npm run setup

# OR install separately:
npm install --prefix backend
npm install --prefix frontend
```

### 2. Seed the database

```bash
npm run seed
```

This creates the SQLite database and populates it with:
- 2 demo users (admin + staff)
- 10 company settings
- 10 materials
- 10 product templates
- 5 outsourced vendor items
- 5 sample customers

### 3. Start the backend API

```bash
npm run start:api
# → Running on http://localhost:3001
```

### 4. Start the frontend

In a second terminal:

```bash
npm run start:ui
# → Running on http://localhost:5173
```

### 5. Open PressQuote

Navigate to: **http://localhost:5173**

---

## 🔐 Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@pressquote.com | password123 |
| Staff | staff@pressquote.com | password123 |

**Admin** can edit settings. **Staff** can create and manage quotes.

---

## 📁 Project Structure

```
pressquote/
├── backend/
│   ├── db/
│   │   ├── schema.js          ← Database schema (all 13 tables)
│   │   └── seed.js            ← Demo data seed script
│   ├── middleware/
│   │   └── auth.js            ← JWT auth middleware
│   ├── routes/
│   │   ├── auth.js            ← Login, register, /me
│   │   ├── customers.js       ← Customer CRUD
│   │   ├── materials.js       ← Materials CRUD
│   │   ├── products.js        ← Product template CRUD
│   │   ├── quotes.js          ← Quote CRUD + stats
│   │   ├── settings.js        ← Company settings
│   │   └── suppliers.js       ← Suppliers + outsourced items
│   ├── utils/
│   │   └── pricingEngine.js   ← Core pricing logic (shared)
│   ├── database.js            ← SQLite connection
│   ├── server.js              ← Express app entry
│   └── .env                   ← JWT secret, port
│
└── frontend/
    └── src/
        ├── components/
        │   ├── Layout.jsx     ← Sidebar navigation shell
        │   └── Modal.jsx      ← Reusable modal
        ├── context/
        │   └── AuthContext.jsx ← Auth state & login/logout
        ├── pages/
        │   ├── DashboardPage.jsx    ← Stats + recent quotes
        │   ├── QuotesPage.jsx       ← Quote history & search
        │   ├── QuickQuotePage.jsx   ← 4-step quick quote wizard
        │   ├── CustomJobPage.jsx    ← Line-item custom job form
        │   ├── QuoteReviewPage.jsx  ← Review, email, save, status
        │   ├── MaterialsPage.jsx    ← Materials admin
        │   ├── ProductsPage.jsx     ← Product template admin
        │   ├── SuppliersPage.jsx    ← Suppliers + outsourced admin
        │   ├── CustomersPage.jsx    ← Customer admin
        │   ├── SettingsPage.jsx     ← Company settings
        │   └── LoginPage.jsx        ← Auth login
        └── utils/
            └── api.js         ← All API fetch helpers
```

---

## ⚙️ Pricing Engine Logic

Located in `backend/utils/pricingEngine.js`. Used by both Quick Quote and Custom Job.

```
Final Price =
  (materialCost + laborCost×complexity + designCost + outsourcedCost)
  × (1 + overhead%)
  × economicMultiplier
  ÷ (1 - targetMargin%)
  × rushMultiplier

→ enforced minimum: max(calculated, minimumJobPrice)
```

**Profit** = Final Price − (subtotal + overhead)  
**Margin %** = (Profit / Final Price) × 100

---

## 🔌 Extending the App

### Add real email sending
1. Add `nodemailer` or `@sendgrid/mail` to backend
2. Create `POST /api/quotes/:id/send-email` route
3. Wire the "Send Email" button in `QuoteReviewPage.jsx`

### Add PDF export
1. Add `puppeteer` or `pdfkit` to backend
2. Create `GET /api/quotes/:id/pdf` route
3. Render a quote template to PDF

### Add customer portal
1. Create a separate JWT role for `customer`
2. Add read-only quote view routes
3. Allow accept/decline via signed URL

---

## 📝 Environment Variables

`backend/.env`:
```
PORT=3001
JWT_SECRET=your_secret_here
NODE_ENV=development
```

---

## 📄 License

MIT — free to use, extend, and deploy.
