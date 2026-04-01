import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { getCategoryOptions } from '../utils/productConfig';
import {
  Zap, ChevronRight, ChevronLeft, Calculator, Search, AlertCircle,
  CreditCard, FileText, BookOpen, Layers, Image, Flag, Mail, Tag,
  Package, ArrowLeft,
} from 'lucide-react';

// ─── Category icon + colour config ──────────────────────────────────────────
const CATEGORY_ICONS = {
  'Business Cards': CreditCard,
  'Flyers': FileText,
  'Brochures': BookOpen,
  'Booklets': Layers,
  'Posters': Image,
  'Banners': Flag,
  'Postcards': Mail,
  'Stickers': Tag,
  'Signs': Tag,
};
const DEFAULT_ICON = Package;

const PALETTE = [
  { bg: 'bg-blue-500/10',    border: 'border-blue-500/20',   hover: 'hover:border-blue-500/50 hover:shadow-card',   icon: 'text-blue-400'   },
  { bg: 'bg-forest-100',     border: 'border-forest-200',    hover: 'hover:border-forest-500 hover:shadow-card',    icon: 'text-forest-600' },
  { bg: 'bg-purple-500/10',  border: 'border-purple-500/20', hover: 'hover:border-purple-500/50 hover:shadow-card', icon: 'text-purple-400' },
  { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',  hover: 'hover:border-amber-500/50 hover:shadow-card',  icon: 'text-amber-400'  },
  { bg: 'bg-rose-500/10',    border: 'border-rose-500/20',   hover: 'hover:border-rose-500/50 hover:shadow-card',   icon: 'text-rose-400'   },
  { bg: 'bg-teal-500/10',    border: 'border-teal-500/20',   hover: 'hover:border-teal-500/50 hover:shadow-card',   icon: 'text-teal-400'   },
  { bg: 'bg-indigo-500/10',  border: 'border-indigo-500/20', hover: 'hover:border-indigo-500/50 hover:shadow-card', icon: 'text-indigo-400' },
  { bg: 'bg-orange-500/10',  border: 'border-orange-500/20', hover: 'hover:border-orange-500/50 hover:shadow-card', icon: 'text-orange-400' },
];

// ─── CustomerSelector ────────────────────────────────────────────────────────
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

// ─── Category Grid ────────────────────────────────────────────────────────────
function CategoryGrid({ categories, search, onSearchChange, onSelect }) {
  const filtered = categories.filter(({ name }) =>
    !search || name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="relative mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search products..."
          className="form-input pl-9"
          autoFocus
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-500 text-sm">No products match "{search}"</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map(({ name, count }, i) => {
            const Icon = CATEGORY_ICONS[name] || DEFAULT_ICON;
            const color = PALETTE[i % PALETTE.length];
            return (
              <button
                key={name}
                onClick={() => onSelect(name)}
                className={`flex flex-col items-center gap-3 p-5 rounded-xl border ${color.border} ${color.hover} transition-all text-center group`}
              >
                <div className={`w-12 h-12 rounded-xl ${color.bg} border ${color.border} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                  <Icon size={22} className={color.icon} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900 leading-snug">{name}</div>
                  {count > 1 && (
                    <div className="text-xs text-gray-500 mt-0.5">{count} variants</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Pill selector helper ─────────────────────────────────────────────────────
function PillGroup({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
            value === opt
              ? 'bg-forest-700 text-white border-forest-700'
              : 'border-forest-200 text-gray-700 hover:border-forest-400 hover:bg-forest-50'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ─── Product Detail Panel ─────────────────────────────────────────────────────
function ProductDetailPanel({
  category,
  qty, onQtyChange,
  size, onSizeChange,
  paper, onPaperChange,
  finish, onFinishChange,
  designHours, onDesignHoursChange,
  dueDate, onDueDateChange,
  notes, onNotesChange,
  onBack,
}) {
  const opts = getCategoryOptions(category);
  const Icon = CATEGORY_ICONS[category] || DEFAULT_ICON;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="btn-ghost py-1.5 px-2.5 text-xs">
          <ArrowLeft size={13} /> All Products
        </button>
        <div className="flex items-center gap-2 text-gray-700">
          <Icon size={15} />
          <span className="font-semibold text-gray-900">{category}</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Quantity */}
        <div className="form-group">
          <label className="form-label">Quantity</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {opts.qtyPresets.map(n => (
              <button
                key={n}
                type="button"
                onClick={() => onQtyChange(n)}
                className={`px-3 py-1.5 rounded-lg text-sm border font-medium transition-all ${
                  qty === n
                    ? 'bg-forest-700 text-white border-forest-700'
                    : 'border-forest-200 text-gray-700 hover:border-forest-400 hover:bg-forest-50'
                }`}
              >
                {n.toLocaleString()}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={qty}
            onChange={e => onQtyChange(parseInt(e.target.value) || 1)}
            min={1}
            placeholder="Or enter a custom quantity"
            className="form-input"
          />
        </div>

        {/* Size */}
        <div className="form-group">
          <label className="form-label">Size / Dimensions</label>
          <PillGroup options={opts.sizes} value={size} onChange={onSizeChange} />
        </div>

        {/* Material */}
        <div className="form-group">
          <label className="form-label">Material / Stock</label>
          <select value={paper} onChange={e => onPaperChange(e.target.value)} className="form-input">
            <option value="">Select a material...</option>
            {opts.materials.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Finish */}
        <div className="form-group">
          <label className="form-label">Finish</label>
          <PillGroup options={opts.finishes} value={finish} onChange={onFinishChange} />
        </div>

        {/* Design time + due date */}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group">
            <label className="form-label">Design Time (hrs)</label>
            <input
              type="number"
              value={designHours}
              onChange={e => onDesignHoursChange(parseFloat(e.target.value) || 0)}
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
              onChange={e => onDueDateChange(e.target.value)}
              className="form-input"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="form-group">
          <label className="form-label">Notes / Special Instructions</label>
          <textarea
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
            placeholder="Bleed requirements, special finishes, file format, delivery instructions..."
            className="form-input resize-none"
            rows={3}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Steps ────────────────────────────────────────────────────────────────────
const STEPS = ['Customer', 'Product', 'Pricing'];

// ─── Main page ────────────────────────────────────────────────────────────────
export default function QuickQuotePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  // Customer
  const [customer, setCustomer] = useState(null);

  // Product
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [productSearch, setProductSearch] = useState('');

  // Specs (collected on the product detail panel)
  const [qty, setQty] = useState(250);
  const [size, setSize] = useState('');
  const [paper, setPaper] = useState('');
  const [finish, setFinish] = useState('');
  const [designHours, setDesignHours] = useState(0);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // Pricing
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getProducts().then(setProducts).catch(console.error);
  }, []);

  // Derive category list from API products
  const categories = useMemo(() => {
    const map = {};
    products.forEach(p => {
      const cat = p.category || 'Other';
      if (!map[cat]) map[cat] = { name: cat, count: 0, product: p };
      map[cat].count += 1;
    });
    return Object.values(map);
  }, [products]);

  // When user picks a category, auto-select the first matching product template
  // and seed the spec fields with sensible defaults for that category.
  const handleCategorySelect = (cat) => {
    const match = products.find(p => (p.category || 'Other') === cat) || null;
    const opts = getCategoryOptions(cat);
    setSelectedCategory(cat);
    setSelectedProduct(match);
    setSize(opts.sizes[0] || '');
    setPaper(opts.materials[0] || '');
    setFinish(opts.finishes[0] || '');
    setQty(opts.qtyPresets[1] ?? opts.qtyPresets[0] ?? 250);
    setNotes('');
    setPricing(null);
  };

  const handleCategoryBack = () => {
    setSelectedCategory(null);
    setSelectedProduct(null);
    setPricing(null);
  };

  // ── Pricing calculation ───────────────────────────────────────────────────
  const calculatePricing = useCallback(async () => {
    if (!selectedProduct) return;
    setLoading(true);
    try {
      const matCost =
        (selectedProduct.materials || []).reduce(
          (sum, m) => sum + parseFloat(m.unit_cost || 0) * parseFloat(m.quantity || 1) * qty,
          0
        ) + qty * 0.05;

      const setupH  = parseFloat(selectedProduct.setup_time || 0);
      const runH    = parseFloat(selectedProduct.run_time_per_unit || 0) * qty;
      const finishH = parseFloat(selectedProduct.finishing_time || 0);

      const result = await api.calculateQuote({
        materialCost: matCost,
        laborHours: setupH + runH + finishH,
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
    if (step === 2 && selectedProduct) calculatePricing();
  }, [step, selectedProduct, qty, designHours, dueDate, calculatePricing]);

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!customer || !selectedProduct || !pricing) return;
    setSaving(true);
    setError('');
    try {
      const matCost =
        (selectedProduct.materials || []).reduce(
          (sum, m) => sum + parseFloat(m.unit_cost || 0) * parseFloat(m.quantity || 1) * qty,
          0
        ) + qty * 0.05;

      const setupH  = parseFloat(selectedProduct.setup_time || 0);
      const runH    = parseFloat(selectedProduct.run_time_per_unit || 0) * qty;
      const finishH = parseFloat(selectedProduct.finishing_time || 0);

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
        laborHours: setupH + runH + finishH,
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

  const fmt = (n) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);

  // Step 1 is complete once the user is on the detail panel with a product selected
  const canAdvance = [
    !!customer,
    !!(selectedCategory && selectedProduct && qty > 0),
    true,
  ][step];

  // Back button: step 1 + detail panel → back to grid, otherwise prev step / cancel
  const handleBack = () => {
    if (step === 1 && selectedCategory) {
      handleCategoryBack();
    } else if (step > 0) {
      setStep(s => s - 1);
    } else {
      navigate('/quotes');
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-blue-500/15 border border-blue-500/20 rounded-xl flex items-center justify-center">
          <Zap size={17} className="text-blue-400" />
        </div>
        <div>
          <h1 className="page-title">Quick Quote</h1>
          <p className="text-gray-600 text-xs">Standard products • Fast turnaround</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-7">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <button
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                i === step
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                  : i < step
                  ? 'text-gray-900 cursor-pointer hover:text-black'
                  : 'text-gray-400 cursor-not-allowed'
              }`}
            >
              <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ${
                i < step
                  ? 'bg-blue-500 text-white'
                  : i === step
                  ? 'bg-blue-500/30 text-blue-300'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                {i < step ? '✓' : i + 1}
              </span>
              {s}
            </button>
            {i < STEPS.length - 1 && (
              <ChevronRight size={13} className="text-gray-300 mx-0.5" />
            )}
          </React.Fragment>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 mb-4">
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      <div className="card p-6 mb-5">

        {/* ── STEP 0 — Customer ─────────────────────────────────────────── */}
        {step === 0 && (
          <div>
            <h2 className="section-title mb-1">Customer Info</h2>
            <p className="text-gray-500 text-sm mb-5">
              Enter customer details. Type a name to search existing customers.
            </p>
            <CustomerSelector onSelect={setCustomer} selected={customer} />
          </div>
        )}

        {/* ── STEP 1 — Product ──────────────────────────────────────────── */}
        {step === 1 && (
          <div>
            {!selectedCategory ? (
              <>
                <h2 className="section-title mb-1">Select a Product</h2>
                <p className="text-gray-500 text-sm mb-5">
                  Choose a category to get started.
                </p>
                <CategoryGrid
                  categories={categories}
                  search={productSearch}
                  onSearchChange={setProductSearch}
                  onSelect={handleCategorySelect}
                />
              </>
            ) : (
              <ProductDetailPanel
                category={selectedCategory}
                qty={qty}             onQtyChange={setQty}
                size={size}           onSizeChange={setSize}
                paper={paper}         onPaperChange={setPaper}
                finish={finish}       onFinishChange={setFinish}
                designHours={designHours} onDesignHoursChange={setDesignHours}
                dueDate={dueDate}     onDueDateChange={setDueDate}
                notes={notes}         onNotesChange={setNotes}
                onBack={handleCategoryBack}
              />
            )}
          </div>
        )}

        {/* ── STEP 2 — Pricing ──────────────────────────────────────────── */}
        {step === 2 && (
          <div>
            <h2 className="section-title mb-1">Quote Summary</h2>
            <p className="text-gray-500 text-sm mb-5">
              Review the calculated price before saving.
            </p>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm space-y-1.5">
              <div className="flex justify-between"><span className="text-gray-500">Customer</span><span className="font-medium text-gray-900">{customer?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Product</span><span className="font-medium text-gray-900">{selectedCategory}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Size</span><span className="font-medium text-gray-900">{size || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Quantity</span><span className="font-medium text-gray-900">{qty.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Material</span><span className="font-medium text-gray-900">{paper || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Finish</span><span className="font-medium text-gray-900">{finish || '—'}</span></div>
              {dueDate && <div className="flex justify-between"><span className="text-gray-500">Due</span><span className="font-medium text-gray-900">{dueDate}</span></div>}
              {notes && <div className="flex justify-between gap-4"><span className="text-gray-500 shrink-0">Notes</span><span className="font-medium text-gray-900 text-right">{notes}</span></div>}
            </div>

            {loading ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-gray-500 text-sm">Calculating...</span>
              </div>
            ) : pricing ? (
              <div className="space-y-2">
                {[
                  ['Materials', pricing.materialCost],
                  ['Labor',     pricing.laborCost],
                  ['Design',    pricing.designCost],
                  ['Overhead',  pricing.overheadCost],
                ].map(([label, val]) => val > 0 && (
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{label}</span>
                    <span className="text-gray-900 font-mono">{fmt(val)}</span>
                  </div>
                ))}
                {pricing.rushFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-500">Rush Fee (+{pricing.rushPercent}%)</span>
                    <span className="text-amber-500 font-mono">{fmt(pricing.rushFee)}</span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-3 mt-3 flex justify-between items-baseline">
                  <span className="font-display font-bold text-gray-900 text-lg">Total</span>
                  <span className="font-display font-bold text-2xl text-blue-500">{fmt(pricing.finalPrice)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Estimated Margin</span>
                  <span className={pricing.marginPercent >= 35 ? 'text-emerald-500' : 'text-amber-500'}>
                    {pricing.marginPercent?.toFixed(1)}% · {fmt(pricing.profit)} profit
                  </span>
                </div>
                {pricing.rushPercent > 0 && (
                  <div className="text-xs text-amber-500/80 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
                    ⚡ Rush pricing applied — {pricing.daysUntilDue} days until due date
                  </div>
                )}
                <button onClick={calculatePricing} className="btn-ghost w-full justify-center mt-2 text-xs">
                  <Calculator size={12} /> Recalculate
                </button>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 text-sm">
                Failed to calculate. <button onClick={calculatePricing} className="text-blue-500 underline">Try again</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={handleBack} className="btn-secondary">
          <ChevronLeft size={15} />
          {step === 0 ? 'Cancel' : (step === 1 && selectedCategory) ? 'Products' : 'Back'}
        </button>

        {step < 2 ? (
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
            className={`btn-primary ${(saving || loading || !pricing) ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {saving
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
              : <>Save Quote <ChevronRight size={15} /></>
            }
          </button>
        )}
      </div>
    </div>
  );
}
