import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import { Layers, Plus, Edit2, Trash2, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';

const EMPTY = { name: '', category: '', setup_time: 0.5, run_time_per_unit: 0.002, finishing_time: 0.25, complexity_multiplier: 1.0, default_margin: 40, description: '' };
const CATEGORIES = ['Business Cards', 'Flyers', 'Posters', 'Brochures', 'Booklets', 'Banners', 'Labels', 'Envelopes', 'Stickers', 'Other'];

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    api.getProducts().then(setProducts).finally(() => setLoading(false));
  }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setError(''); setModalOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm({ ...p }); setError(''); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name) { setError('Name required'); return; }
    setSaving(true);
    setError('');
    try {
      if (editing) {
        const updated = await api.updateProduct(editing.id, form);
        setProducts(prev => prev.map(p => p.id === editing.id ? { ...updated, materials: p.materials } : p));
      } else {
        const created = await api.createProduct(form);
        setProducts(prev => [...prev, { ...created, materials: [] }]);
      }
      setModalOpen(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product template?')) return;
    try {
      await api.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  const grouped = products.reduce((acc, p) => {
    const cat = p.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(p);
    return acc;
  }, {});

  const totalHours = (p, qty = 100) => {
    return parseFloat(p.setup_time || 0) + (parseFloat(p.run_time_per_unit || 0) * qty) + parseFloat(p.finishing_time || 0);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title">Product Templates</h1>
          <p className="text-slate-400 text-sm mt-0.5">{products.length} templates</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={14} /> Add Template
        </button>
      </div>

      {loading ? (
        <div className="card p-8 text-center text-slate-400">Loading templates...</div>
      ) : products.length === 0 ? (
        <div className="card p-12 text-center">
          <Layers size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No product templates yet.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {Object.entries(grouped).map(([category, items]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{category}</span>
                <span className="text-xs text-slate-600">({items.length})</span>
              </div>
              <div className="card overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="table-header text-left">Name</th>
                      <th className="table-header text-right hidden md:table-cell">Setup (h)</th>
                      <th className="table-header text-right hidden md:table-cell">Run/unit (h)</th>
                      <th className="table-header text-right hidden md:table-cell">Finishing (h)</th>
                      <th className="table-header text-right hidden lg:table-cell">Complexity</th>
                      <th className="table-header text-right">Margin</th>
                      <th className="table-header text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(p => (
                      <React.Fragment key={p.id}>
                        <tr
                          className="table-row cursor-pointer"
                          onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                        >
                          <td className="table-cell">
                            <div className="flex items-center gap-2">
                              {expandedId === p.id ? <ChevronDown size={12} className="text-slate-400" /> : <ChevronRight size={12} className="text-slate-600" />}
                              <span className="font-medium text-slate-200">{p.name}</span>
                            </div>
                          </td>
                          <td className="table-cell text-right font-mono text-sm text-slate-300 hidden md:table-cell">{p.setup_time}h</td>
                          <td className="table-cell text-right font-mono text-sm text-slate-300 hidden md:table-cell">{p.run_time_per_unit}h</td>
                          <td className="table-cell text-right font-mono text-sm text-slate-300 hidden md:table-cell">{p.finishing_time}h</td>
                          <td className="table-cell text-right hidden lg:table-cell">
                            <span className={`badge ${p.complexity_multiplier > 1.2 ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-500/10 text-slate-400'}`}>
                              ×{p.complexity_multiplier}
                            </span>
                          </td>
                          <td className="table-cell text-right">
                            <span className={`badge ${p.default_margin >= 45 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                              {p.default_margin}%
                            </span>
                          </td>
                          <td className="table-cell text-right" onClick={e => e.stopPropagation()}>
                            <div className="flex justify-end gap-1">
                              <button onClick={() => openEdit(p)} className="btn-ghost p-1.5 text-xs"><Edit2 size={12} /></button>
                              <button onClick={() => handleDelete(p.id)} className="btn-ghost p-1.5 text-xs text-red-400 hover:text-red-300"><Trash2 size={12} /></button>
                            </div>
                          </td>
                        </tr>
                        {expandedId === p.id && (
                          <tr>
                            <td colSpan={7} className="px-8 py-3 bg-navy-800/40 border-b border-border/30">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-slate-500 text-xs uppercase tracking-wider block mb-0.5">100 units (labor)</span>
                                  <span className="text-slate-200 font-mono">{totalHours(p, 100).toFixed(2)}h</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 text-xs uppercase tracking-wider block mb-0.5">500 units</span>
                                  <span className="text-slate-200 font-mono">{totalHours(p, 500).toFixed(2)}h</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 text-xs uppercase tracking-wider block mb-0.5">Description</span>
                                  <span className="text-slate-300">{p.description || '—'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-500 text-xs uppercase tracking-wider block mb-0.5">Default Materials</span>
                                  <span className="text-slate-300">{p.materials?.length ? p.materials.map(m => m.material_name).join(', ') : 'None linked'}</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Template' : 'Add Product Template'} size="lg">
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 mb-4">
            <AlertCircle size={14} className="text-red-400" /><span className="text-red-300 text-sm">{error}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group col-span-2">
            <label className="form-label">Template Name *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="form-input" placeholder="e.g. Business Cards (Standard)" autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="form-input">
              <option value="">Select category...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Default Margin (%)</label>
            <input type="number" value={form.default_margin} onChange={e => setForm(f => ({ ...f, default_margin: parseFloat(e.target.value) || 40 }))} min={0} max={90} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Setup Time (hours)</label>
            <input type="number" value={form.setup_time} onChange={e => setForm(f => ({ ...f, setup_time: parseFloat(e.target.value) || 0 }))} min={0} step={0.25} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Run Time Per Unit (hours)</label>
            <input type="number" value={form.run_time_per_unit} onChange={e => setForm(f => ({ ...f, run_time_per_unit: parseFloat(e.target.value) || 0 }))} min={0} step={0.0001} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Finishing Time (hours)</label>
            <input type="number" value={form.finishing_time} onChange={e => setForm(f => ({ ...f, finishing_time: parseFloat(e.target.value) || 0 }))} min={0} step={0.25} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Complexity Multiplier</label>
            <input type="number" value={form.complexity_multiplier} onChange={e => setForm(f => ({ ...f, complexity_multiplier: parseFloat(e.target.value) || 1 }))} min={1} max={5} step={0.1} className="form-input" />
          </div>
          <div className="form-group col-span-2">
            <label className="form-label">Description</label>
            <textarea value={form.description || ''} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="form-input resize-none" placeholder="Optional description..." />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : editing ? 'Update Template' : 'Add Template'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
