const BASE_URL = (import.meta.env.VITE_API_URL || '') + '/api';

function getToken() {
  return localStorage.getItem('pq_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('pq_token');
    window.location.href = '/login';
    return;
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  signupCompany: (data) => request('/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request('/auth/me'),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getUsers: () => request('/auth/users'),
  deleteUser: (id) => request(`/auth/users/${id}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: JSON.stringify(data) }),

  // Customers
  getCustomers: (search) => request(`/customers${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  getCustomer: (id) => request(`/customers/${id}`),
  createCustomer: (data) => request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  updateCustomer: (id, data) => request(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCustomer: (id) => request(`/customers/${id}`, { method: 'DELETE' }),

  // Materials
  getMaterials: () => request('/materials'),
  createMaterial: (data) => request('/materials', { method: 'POST', body: JSON.stringify(data) }),
  updateMaterial: (id, data) => request(`/materials/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteMaterial: (id) => request(`/materials/${id}`, { method: 'DELETE' }),

  // Suppliers
  getSuppliers: () => request('/suppliers'),
  createSupplier: (data) => request('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  updateSupplier: (id, data) => request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSupplier: (id) => request(`/suppliers/${id}`, { method: 'DELETE' }),

  // Outsourced items
  getOutsourcedItems: () => request('/suppliers/outsourced'),
  createOutsourcedItem: (data) => request('/suppliers/outsourced', { method: 'POST', body: JSON.stringify(data) }),
  updateOutsourcedItem: (id, data) => request(`/suppliers/outsourced/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteOutsourcedItem: (id) => request(`/suppliers/outsourced/${id}`, { method: 'DELETE' }),

  // Product templates
  getProducts: () => request('/products'),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),

  // Quotes
  getQuotes: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/quotes${q ? `?${q}` : ''}`);
  },
  getQuoteStats: () => request('/quotes/stats'),
  getQuote: (id) => request(`/quotes/${id}`),
  calculateQuote: (data) => request('/quotes/calculate', { method: 'POST', body: JSON.stringify(data) }),
  createQuote: (data) => request('/quotes', { method: 'POST', body: JSON.stringify(data) }),
  updateQuote: (id, data) => request(`/quotes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteQuote: (id) => request(`/quotes/${id}`, { method: 'DELETE' }),

  // QuickBooks
  qbStatus: () => request('/quickbooks/status'),
  qbAuthUrl: () => request('/quickbooks/auth-url'),
  qbDisconnect: () => request('/quickbooks/disconnect', { method: 'DELETE' }),
  qbExportInvoice: (quoteId) => request(`/quickbooks/export-invoice/${quoteId}`, { method: 'POST' }),
  qbSyncCustomers: () => request('/quickbooks/sync-customers', { method: 'POST' }),
};
