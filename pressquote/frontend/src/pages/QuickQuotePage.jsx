import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Zap, ChevronRight, ChevronLeft, Calculator, Package, Search, AlertCircle } from 'lucide-react';

const PAPER_OPTIONS = [
  '100lb Gloss Cover', '80lb Gloss Text', '60lb Uncoated Offset',
  '14pt Coated One Side', '80lb Matte Cover', 'Vinyl',
  'Custom / Other',
];
const FINISH_OPTIONS = [
  'Full Color (CMYK)', 'Black & White', '1 Color', '2 Color',
  'Full Color + Gloss Laminate', 'Full Color + Matte Laminate', 'Full Color + UV Coating',
];

function CustomerSelector({ onSelect, selected }) {
  const [name, setName] = useState(selected?.name || '');
  const [company, setCompany] = useState(selected?.company || '');
  const [email, setEmail] = useState(selected?.email || '');
  const [phone, setPhone] = useState(selected?.phone || '');
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [customerId, setCustomerId] = useState(selected?.id || null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (name.length < 1) { setResults([]); setShowDropdown(false); return; }
    const t = setTimeout(() => {
      api.getCustomers(name).then(r => { setResults(r); if (r.length > 0) setShowDropdown(true); }).catch(() => {});
    }, 200);
    return () => clearTimeout(t);
  }, [name]);

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const notify = (n, co, em, ph, id) => {
    onSelect(n.trim() ? { id, name: n.trim(), company: co, email: em, phone: ph } : null);
  };

  const handlePickResult = (c) => {
    setName(c.name); setCompany(c.company || ''); setEmail(c.email || ''); setPhone(c.phone || '');
    setCustomerId(c.id); setShowDropdown(false);
    onSelect({ id: c.id, name: c.name, company: c.company || '', email: c.email || '', phone: c.phone || '' });
  };

  return (
    <div className="space-y-4">
      <div className="form-group" ref={containerRef}>
        <label className="form-label">Customer Name <span className="text-red-500">*</span></label>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={name}
            onChange={e => { const v = e.target.value; setName(v); setCustomerId(null); notify(v, company, email, phone, null); }}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            placeholder="Start typing to search existing customers..."
            className="form-input pl-9"
          />
          {showDropdown && results.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-forest-100 rounded-lg shadow-card overflow-hidden">
              {results.slice(0, 6).map(c => (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => handlePickResult(c)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-forest-50 text-left transition-colors border-b border-forest-50 last:border-0"
                >
                  <div className="w-7 h-7 rounded-full bg-forest-100 flex items-center justify-center text-forest-700 text-xs font-bold shrink-0">
                    {c.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{c.name}</div>
                    {c.company && <div className="text-xs text-gray-600">{c.company}</div>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Business Name</label>
        <input
          type="text"
          value={company}
          onChange={e => { setCompany(e.target.value); notify(name, e.target.value, email, phone, customerId); }}
          placeholder="Company or business name"
          className="form-input"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => { setEmail(e.target.value); notify(name, company, e.target.value, phone, customerId); }}
            placeholder="customer@example.com"
            className="form-input"
          />
        </div>
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={e => { setPhone(e.target.value); notify(name, company, email, e.target.value, customerId); }}
            placeholder="(555) 000-0000"
            className="form-input"
          />
        </div>
      </div>
    </div>
  );
}

const STEPS = ['Customer', 'Product', 'Options', 'Pricing'];

export default function QuickQuotePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [customer, setCustomer] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [qty, setQty] = useState(250);
  const [paper, setPaper] = useState('');
  const [finish, setFinish] = useState('');
  const [designHours, setDesignHours] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => {
    api.getProducts().then(setProducts).catch(console.error);
  }, []);

  const calculatePricing = useCallback(async () => {
    if (!selectedProduct) return;
    setLoading(true);
    try {
      // Estimate material cost from template materials
      const matCost = (selectedProduct.materials || []).reduce((sum, m) => {
        return sum + (parseFloat(m.unit_cost || 0) * parseFloat(m.quantity || 1) * qty);
      }, 0) + (qty * 0.05); // baseline per-unit estimate

      const setupH = parseFloat(selectedProduct.setup_time || 0);
      const runH = parseFloat(selectedProduct.run_time_per_unit || 0) * qty;
      const finishH = parseFloat(selectedProduct.finishing_time || 0);
      const laborHours = setupH + runH + finishH;

      const result = await api.calculateQuote({
        materialCost: matCost,
        laborHours,
        designHours: parseFloat(designHours || 0),
        outsourcedCost: 0,
        dueDate,
        complexityMultiplier: parseFloat(selectedProduct.complexity_multiplier || 1),
      });
      setPricing(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [selectedProduct, qty, designHours, dueDate]);

  useEffect(() => {
    if (step === 3 && selectedProduct) calculatePricing();
  }, [step, selectedProduct, qty, designHours, dueDate, calculatePricing]);

  const handleSave = async () => {
    if (!customer || !selectedProduct || !pricing) return;
    setSaving(true);
    setError('');
    try {
      const matCost = (selectedProduct.materials || []).reduce((sum, m) => {
        return sum + (parseFloat(m.unit_cost || 0) * parseFloat(m.quantity || 1) * qty);
      }, 0) + (qty * 0.05);

      const setupH = parseFloat(selectedProduct.setup_time || 0);
      const runH = parseFloat(selectedProduct.run_time_per_unit || 0) * qty;
      const finishH = parseFloat(selectedProduct.finishing_time || 0);
      const laborHours = setupH + runH + finishH;

      const quote = await api.createQuote({
        customer_id: customer.id || null,
        customer_name: customer.name,
        project_name: selectedProduct.name,
        type: 'quick',
        product_template_id: selectedProduct.id,
        quantity: qty,
        paper_material: paper,
        color_finish: finish,
        due_date: dueDate,
        materialCost: matCost,
        laborHours,
        designHours: parseFloat(designHours || 0),
        outsourcedCost: 0,
        complexityMultiplier: parseFloat(selectedProduct.complexity_multiplier || 1),
      });
      navigate(`/quotes/${quote.id}/review`);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(p =>
    !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(productSearch.toLowerCase())
  );

  const grouped = filteredProducts.reduce((acc, p) => {
    const cat = p.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);

  const canAdvance = [
    !!customer,
    !!selectedProduct,
    !!(paper && finish),
    true,
  ][step];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-blue-500/15 border border-blue-500/20 rounded-xl flex items-center justify-center">
          <Zap size={17} className="text-blue-400" />
        </div>
        <div>
          <h1 className="page-title">Quick Quote</h1>
          <p className="text-gray-900 text-xs">Standard products • Fast turnaround</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-7">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                i === step ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' :
                i < step ? 'text-gray-900 cursor-pointer hover:text-black' :
                'text-gray-900 cursor-not-allowed'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                i < step ? 'bg-blue-500 text-white' :
                i === step ? 'bg-blue-500/30 text-blue-300' : 'bg-navy-600 text-gray-900'
              }`}>{i < step ? '✓' : i + 1}</span>
              {s}
            </button>
            {i < STEPS.length - 1 && <ChevronRight size={13} className="text-gray-900 mx-0.5" />}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 mb-4">
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <span className="text-red-300 text-sm">{error}</span>
        </div>
      )}

      <div className="card p-6 mb-5">
        {/* STEP 0 — Customer */}
        {step === 0 && (
          <div>
            <h2 className="section-title mb-1">Customer Info</h2>
            <p className="text-gray-900 text-sm mb-5">Enter customer details. Type a name to search existing customers.</p>
            <CustomerSelector onSelect={setCustomer} selected={customer} />
          </div>
        )}

        {/* STEP 1 — Product */}
        {step === 1 && (
          <div>
            <h2 className="section-title mb-1">Select Product</h2>
            <p className="text-gray-900 text-sm mb-4">Choose a product template to start the quote.</p>
            <div className="relative mb-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900" />
              <input
                type="text"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="Search products..."
                className="form-input pl-9"
              />
            </div>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
              {Object.entries(grouped).map(([cat, items]) => (
                <div key={cat}>
                  <div className="text-xs font-semibold text-gray-900 uppercase tracking-widest mb-2">{cat}</div>
                  <div className="grid gap-2">
                    {items.map(p => (
                      <button
                        key={p.id}
                        onClick={() => setSelectedProduct(p)}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                          selectedProduct?.id === p.id
                            ? 'border-blue-500/50 bg-blue-500/10 text-gray-900'
                            : 'border-border bg-navy-800 text-gray-900 hover:border-blue-500/30 hover:bg-navy-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{p.name}</span>
                          <span className="text-xs text-gray-900">×{p.complexity_multiplier} complexity</span>
                        </div>
                        <div className="text-xs text-gray-900 mt-0.5">
                          Setup: {p.setup_time}h · Run: {p.run_time_per_unit}h/unit · Finish: {p.finishing_time}h
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2 — Options */}
        {step === 2 && (
          <div>
            <h2 className="section-title mb-1">Job Options</h2>
            <p className="text-gray-900 text-sm mb-5">Specify quantity, material, and finish.</p>
            <div className="grid gap-5">
              <div className="form-group">
                <label className="form-label">Quantity</label>
                <input
                  type="number"
                  value={qty}
                  onChange={e => setQty(parseInt(e.target.value) || 1)}
                  min={1}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Paper / Material</label>
                <select value={paper} onChange={e => setPaper(e.target.value)} className="form-input">
                  <option value="">Select paper/material...</option>
                  {PAPER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Color / Finish</label>
                <select value={finish} onChange={e => setFinish(e.target.value)} className="form-input">
                  <option value="">Select finish...</option>
                  {FINISH_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Design Time (hours)</label>
                <input
                  type="number"
                  value={designHours}
                  onChange={e => setDesignHours(parseFloat(e.target.value) || 0)}
                  min={0}
                  step={0.25}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="form-input"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — Pricing Preview */}
        {step === 3 && (
          <div>
            <h2 className="section-title mb-1">Quote Summary</h2>
            <p className="text-gray-900 text-sm mb-5">Review the calculated price before saving.</p>

            <div className="mb-4 p-3 bg-navy-800 rounded-lg border border-border text-sm space-y-1">
              <div className="flex justify-between"><span className="text-gray-900">Customer</span><span className="text-gray-900">{customer?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-900">Product</span><span className="text-gray-900">{selectedProduct?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-900">Quantity</span><span className="text-gray-900">{qty.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-900">Material</span><span className="text-gray-900">{paper || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-900">Finish</span><span className="text-gray-900">{finish || '—'}</span></div>
              {dueDate && <div className="flex justify-between"><span className="text-gray-900">Due Date</span><span className="text-gray-900">{dueDate}</span></div>}
            </div>

            {loading ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-900 text-sm">Calculating...</span>
              </div>
            ) : pricing ? (
              <div className="space-y-2">
                {[
                  ['Materials', pricing.materialCost],
                  ['Labor', pricing.laborCost],
                  ['Design', pricing.designCost],
                  ['Overhead', pricing.overheadCost],
                ].map(([label, val]) => val > 0 && (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-900">{label}</span>
                    <span className="text-gray-900 font-mono">{fmt(val)}</span>
                  </div>
                ))}
                {pricing.rushFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-400">Rush Fee (+{pricing.rushPercent}%)</span>
                    <span className="text-amber-400 font-mono">{fmt(pricing.rushFee)}</span>
                  </div>
                )}
                <div className="border-t border-border pt-3 mt-3 flex justify-between">
                  <span className="font-display font-bold text-gray-900 text-lg">Total</span>
                  <span className="font-display font-bold text-2xl text-blue-400">{fmt(pricing.finalPrice)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-900">
                  <span>Estimated Margin</span>
                  <span className={pricing.marginPercent >= 35 ? 'text-emerald-400' : 'text-amber-400'}>
                    {pricing.marginPercent?.toFixed(1)}% · {fmt(pricing.profit)} profit
                  </span>
                </div>
                {pricing.rushPercent > 0 && (
                  <div className="text-xs text-amber-400/80 bg-amber-400/5 border border-amber-400/15 rounded-md px-2 py-1.5">
                    ⚡ Rush pricing applied: {pricing.daysUntilDue} days until due date
                  </div>
                )}
                <button onClick={calculatePricing} className="btn-ghost w-full justify-center mt-2 text-xs">
                  <Calculator size={12} /> Recalculate
                </button>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-900 text-sm">Failed to calculate. Please try again.</div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => step > 0 ? setStep(s => s - 1) : navigate('/quotes')}
          className="btn-secondary"
        >
          <ChevronLeft size={15} /> {step === 0 ? 'Cancel' : 'Back'}
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canAdvance}
            className={`btn-primary ${!canAdvance ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            Next <ChevronRight size={15} />
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving || loading || !pricing}
            className="btn-primary"
          >
            {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : <>Save Quote <ChevronRight size={15} /></>}
          </button>
        )}
      </div>
    </div>
  );
}
