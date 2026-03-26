import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import {
  Wrench, Plus, Trash2, Calculator, ChevronRight,
  Package, Clock, Paintbrush, Truck, Settings, AlertCircle, Search
} from 'lucide-react';

const LINE_TYPES = [
  { value: 'material', label: 'Material', icon: Package, color: 'text-blue-400' },
  { value: 'labor', label: 'Labor', icon: Clock, color: 'text-emerald-400' },
  { value: 'design', label: 'Design', icon: Paintbrush, color: 'text-purple-400' },
  { value: 'outsourced', label: 'Outsourced', icon: Truck, color: 'text-amber-400' },
  { value: 'equipment', label: 'Equipment', icon: Settings, color: 'text-slate-400' },
];

const typeColors = {
  material: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  labor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  design: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  outsourced: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  equipment: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

function LineItemRow({ item, index, onChange, onRemove, materials, outsourcedItems }) {
  return (
    <div className="grid grid-cols-12 gap-2 items-start py-2 border-b border-border/40 last:border-0">
      <div className="col-span-12 sm:col-span-2">
        <select
          value={item.type}
          onChange={e => onChange(index, 'type', e.target.value)}
          className="form-input text-xs py-1.5"
        >
          {LINE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div className="col-span-12 sm:col-span-4">
        <input
          type="text"
          value={item.description}
          onChange={e => onChange(index, 'description', e.target.value)}
          placeholder="Description..."
          className="form-input text-xs py-1.5"
        />
      </div>
      <div className="col-span-4 sm:col-span-2">
        <input
          type="number"
          value={item.quantity}
          onChange={e => onChange(index, 'quantity', parseFloat(e.target.value) || 0)}
          placeholder="Qty"
          min={0}
          step={0.01}
          className="form-input text-xs py-1.5"
        />
      </div>
      <div className="col-span-4 sm:col-span-2">
        <input
          type="number"
          value={item.unit_cost}
          onChange={e => onChange(index, 'unit_cost', parseFloat(e.target.value) || 0)}
          placeholder="Unit cost"
          min={0}
          step={0.01}
          className="form-input text-xs py-1.5"
        />
      </div>
      <div className="col-span-3 sm:col-span-1 flex items-center justify-end">
        <span className="text-xs font-mono text-slate-300">
          ${((item.quantity || 0) * (item.unit_cost || 0)).toFixed(2)}
        </span>
      </div>
      <div className="col-span-1 flex items-center justify-center">
        <button onClick={() => onRemove(index)} className="text-slate-600 hover:text-red-400 transition-colors p-0.5">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

export default function CustomJobPage() {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [designHours, setDesignHours] = useState(0);
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState([
    { type: 'material', description: '', quantity: 1, unit_cost: 0, unit: '' },
    { type: 'labor', description: 'Press time', quantity: 1, unit_cost: 0, unit: 'hr' },
  ]);
  const [outsourcedItems, setOutsourcedItems] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [pricing, setPricing] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getMaterials().then(setMaterials).catch(() => {});
    api.getOutsourcedItems().then(setOutsourcedItems).catch(() => {});
  }, []);

  const addLineItem = (type = 'material') => {
    setLineItems(prev => [...prev, { type, description: '', quantity: 1, unit_cost: 0, unit: '' }]);
  };

  const updateLineItem = (index, field, value) => {
    setLineItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeLineItem = (index) => {
    setLineItems(prev => prev.filter((_, i) => i !== index));
  };

  const getTotals = () => {
    const materialCost = lineItems.filter(i => i.type === 'material' || i.type === 'equipment').reduce((s, i) => s + (i.quantity * i.unit_cost), 0);
    const laborHours = lineItems.filter(i => i.type === 'labor').reduce((s, i) => s + (i.quantity * (i.unit_cost > 0 ? 1 : i.quantity)), 0);
    const laborCostRaw = lineItems.filter(i => i.type === 'labor').reduce((s, i) => s + (i.quantity * i.unit_cost), 0);
    const designCostRaw = lineItems.filter(i => i.type === 'design').reduce((s, i) => s + (i.quantity * i.unit_cost), 0);
    const outsourcedCost = lineItems.filter(i => i.type === 'outsourced').reduce((s, i) => s + (i.quantity * i.unit_cost), 0);
    const allLaborHours = lineItems.filter(i => i.type === 'labor').reduce((s, i) => s + i.quantity, 0);
    const allDesignHours = lineItems.filter(i => i.type === 'design').reduce((s, i) => s + i.quantity, 0);
    const lineTotal = lineItems.reduce((s, i) => s + (i.quantity * i.unit_cost), 0);
    return { materialCost, allLaborHours, allDesignHours, outsourcedCost, lineTotal, laborCostRaw, designCostRaw };
  };

  const handleCalculate = async () => {
    setCalculating(true);
    setError('');
    try {
      const { materialCost, allLaborHours, allDesignHours, outsourcedCost } = getTotals();
      const result = await api.calculateQuote({
        materialCost,
        laborHours: allLaborHours + parseFloat(designHours || 0) * 0,
        designHours: allDesignHours + parseFloat(designHours || 0),
        outsourcedCost,
        dueDate,
        complexityMultiplier: 1,
      });
      setPricing(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setCalculating(false);
    }
  };

  const handleSave = async () => {
    if (!customerName.trim()) { setError('Customer name is required'); return; }
    setSaving(true);
    setError('');
    try {
      const { materialCost, allLaborHours, allDesignHours, outsourcedCost } = getTotals();
      const enrichedItems = lineItems.map(item => ({
        ...item,
        total_cost: item.quantity * item.unit_cost,
      }));

      const quote = await api.createQuote({
        customer_name: customerName,
        project_name: projectName,
        type: 'custom',
        due_date: dueDate,
        notes,
        materialCost,
        laborHours: allLaborHours,
        designHours: allDesignHours + parseFloat(designHours || 0),
        outsourcedCost,
        complexityMultiplier: 1,
        lineItems: enrichedItems,
      });
      navigate(`/quotes/${quote.id}/review`);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const fmt = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);
  const { lineTotal } = getTotals();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-indigo-500/15 border border-indigo-500/20 rounded-xl flex items-center justify-center">
          <Wrench size={17} className="text-indigo-400" />
        </div>
        <div>
          <h1 className="page-title">Custom Job</h1>
          <p className="text-slate-400 text-xs">Complex work with full line-item control</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 mb-4">
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <span className="text-red-300 text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left — Job info + line items */}
        <div className="lg:col-span-2 space-y-5">
          {/* Job Details */}
          <div className="card p-5">
            <h2 className="section-title text-base mb-4">Job Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label className="form-label">Customer Name *</label>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer name..." className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input type="text" value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="e.g. Annual Report 2024" className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="form-input" min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="form-group">
                <label className="form-label">Additional Design Hours</label>
                <input type="number" value={designHours} onChange={e => setDesignHours(parseFloat(e.target.value) || 0)} min={0} step={0.25} className="form-input" />
              </div>
              <div className="form-group sm:col-span-2">
                <label className="form-label">Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Job notes..." rows={2} className="form-input resize-none" />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="section-title text-base">Line Items</h2>
              <div className="text-xs text-slate-400 font-mono">
                Subtotal: <span className="text-white font-semibold">{fmt(lineTotal)}</span>
              </div>
            </div>

            {/* Column headers */}
            <div className="hidden sm:grid grid-cols-12 gap-2 mb-1 px-0">
              {['Type', 'Description', 'Qty', 'Unit Cost', 'Total', ''].map((h, i) => (
                <div key={i} className={`text-xs text-slate-600 font-medium uppercase tracking-wider ${
                  i === 0 ? 'col-span-2' : i === 1 ? 'col-span-4' : i === 2 ? 'col-span-2' : i === 3 ? 'col-span-2' : i === 4 ? 'col-span-1' : 'col-span-1'
                }`}>{h}</div>
              ))}
            </div>

            <div className="space-y-0">
              {lineItems.map((item, i) => (
                <LineItemRow
                  key={i}
                  item={item}
                  index={i}
                  onChange={updateLineItem}
                  onRemove={removeLineItem}
                  materials={materials}
                  outsourcedItems={outsourcedItems}
                />
              ))}
            </div>

            {lineItems.length === 0 && (
              <div className="text-center py-6 text-slate-500 text-sm">No line items yet. Add one below.</div>
            )}

            {/* Add buttons */}
            <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-border">
              {LINE_TYPES.map(t => {
                const Icon = t.icon;
                return (
                  <button key={t.value} onClick={() => addLineItem(t.value)} className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-all hover:opacity-90 ${typeColors[t.value]}`}>
                    <Icon size={11} />
                    Add {t.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right — Pricing panel */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="section-title text-base mb-4">Price Calculation</h2>

            {/* Summary breakdown */}
            <div className="space-y-2 mb-4">
              {(() => {
                const { materialCost, allLaborHours, allDesignHours, outsourcedCost, lineTotal, laborCostRaw, designCostRaw } = getTotals();
                return (
                  <>
                    <div className="flex justify-between text-sm"><span className="text-slate-400">Materials</span><span className="text-slate-300 font-mono">{fmt(materialCost)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-400">Labor ({allLaborHours.toFixed(1)}h)</span><span className="text-slate-300 font-mono">{fmt(laborCostRaw)}</span></div>
                    {allDesignHours > 0 && <div className="flex justify-between text-sm"><span className="text-slate-400">Design ({allDesignHours.toFixed(1)}h)</span><span className="text-slate-300 font-mono">{fmt(designCostRaw)}</span></div>}
                    {parseFloat(designHours) > 0 && <div className="flex justify-between text-sm"><span className="text-slate-400">+Design overhead</span><span className="text-slate-300 font-mono">{designHours}h</span></div>}
                    {outsourcedCost > 0 && <div className="flex justify-between text-sm"><span className="text-amber-400">Outsourced</span><span className="text-amber-400 font-mono">{fmt(outsourcedCost)}</span></div>}
                  </>
                );
              })()}
            </div>

            <button onClick={handleCalculate} disabled={calculating} className="btn-primary w-full justify-center mb-4">
              {calculating ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Calculating...</> : <><Calculator size={14} />Calculate Price</>}
            </button>

            {pricing && (
              <div className="space-y-2 pt-4 border-t border-border">
                <div className="flex justify-between text-sm"><span className="text-slate-400">Overhead</span><span className="text-slate-300 font-mono">{fmt(pricing.overheadCost)}</span></div>
                {pricing.rushFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-400">Rush (+{pricing.rushPercent}%)</span>
                    <span className="text-amber-400 font-mono">{fmt(pricing.rushFee)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-border">
                  <span className="font-display font-bold text-white text-lg">Total</span>
                  <span className="font-display font-bold text-xl text-blue-400">{fmt(pricing.finalPrice)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Margin</span>
                  <span className={pricing.marginPercent >= 35 ? 'text-emerald-400' : 'text-amber-400'}>
                    {pricing.marginPercent?.toFixed(1)}% · {fmt(pricing.profit)} profit
                  </span>
                </div>
                {pricing.rushPercent > 0 && (
                  <div className="text-xs text-amber-400/80 bg-amber-400/5 border border-amber-400/15 rounded px-2 py-1.5 mt-2">
                    ⚡ {pricing.daysUntilDue} days until due — rush pricing applied
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick reference: outsourced items */}
          {outsourcedItems.length > 0 && (
            <div className="card p-4">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Outsourced Vendor Costs</h3>
              <div className="space-y-2">
                {outsourcedItems.slice(0, 5).map(item => (
                  <button
                    key={item.id}
                    onClick={() => addLineItem('outsourced') && updateLineItem(lineItems.length, 'description', item.item_name) && updateLineItem(lineItems.length, 'unit_cost', item.base_cost + item.shipping_cost)}
                    className="w-full text-left px-2.5 py-2 rounded-md hover:bg-navy-700 transition-colors group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-300">{item.item_name}</span>
                      <span className="text-xs font-mono text-amber-400">{fmt(item.base_cost)}</span>
                    </div>
                    <div className="text-xs text-slate-600">{item.supplier_name} · {item.lead_time}d lead</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving || !customerName.trim()}
            className={`btn-primary w-full justify-center py-3 ${(saving || !customerName.trim()) ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> : <>Save Quote <ChevronRight size={15} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
