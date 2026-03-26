import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import { Truck, Plus, Edit2, Trash2, AlertCircle, ExternalLink } from 'lucide-react';

const EMPTY_SUPPLIER = { name: '', contact_email: '', contact_phone: '', notes: '' };
const EMPTY_ITEM = { supplier_name: '', item_name: '', base_cost: 0, shipping_cost: 0, lead_time: 0, order_link: '' };

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [outsourced, setOutsourced] = useState([]);
  const [tab, setTab] = useState('outsourced');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('item'); // 'item' | 'supplier'
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_ITEM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.getSuppliers(), api.getOutsourcedItems()])
      .then(([s, o]) => { setSuppliers(s); setOutsourced(o); })
      .finally(() => setLoading(false));
  }, []);

  const openCreate = (type) => {
    setModalType(type);
    setEditing(null);
    setForm(type === 'item' ? EMPTY_ITEM : EMPTY_SUPPLIER);
    setError('');
    setModalOpen(true);
  };

  const openEdit = (item, type) => {
    setModalType(type);
    setEditing(item);
    setForm({ ...item });
    setError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (modalType === 'item') {
        if (!form.item_name || !form.supplier_name) { setError('Supplier name and item name required'); setSaving(false); return; }
        if (editing) {
          const u = await api.updateOutsourcedItem(editing.id, form);
          setOutsourced(prev => prev.map(i => i.id === editing.id ? u : i));
        } else {
          const c = await api.createOutsourcedItem(form);
          setOutsourced(prev => [...prev, c]);
        }
      } else {
        if (!form.name) { setError('Name required'); setSaving(false); return; }
        if (editing) {
          const u = await api.updateSupplier(editing.id, form);
          setSuppliers(prev => prev.map(s => s.id === editing.id ? u : s));
        } else {
          const c = await api.createSupplier(form);
          setSuppliers(prev => [...prev, c]);
        }
      }
      setModalOpen(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, type) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      if (type === 'item') {
        await api.deleteOutsourcedItem(id);
        setOutsourced(prev => prev.filter(i => i.id !== id));
      } else {
        await api.deleteSupplier(id);
        setSuppliers(prev => prev.filter(s => s.id !== id));
      }
    } catch (e) {
      alert(e.message);
    }
  };

  const fmt = (n) => `$${parseFloat(n || 0).toFixed(2)}`;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title">Suppliers &amp; Outsourced</h1>
          <p className="text-slate-400 text-sm mt-0.5">Manage vendor costs for quotes</p>
        </div>
        <button onClick={() => openCreate(tab === 'outsourced' ? 'item' : 'supplier')} className="btn-primary">
          <Plus size={14} /> Add {tab === 'outsourced' ? 'Item' : 'Supplier'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-border">
        {['outsourced', 'suppliers'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
              tab === t ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-300'
            }`}
          >
            {t === 'outsourced' ? `Outsourced Items (${outsourced.length})` : `Suppliers (${suppliers.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-8 text-center text-slate-400">Loading...</div>
      ) : tab === 'outsourced' ? (
        <div className="card overflow-hidden">
          {outsourced.length === 0 ? (
            <div className="p-12 text-center"><Truck size={40} className="text-slate-600 mx-auto mb-3" /><p className="text-slate-400">No outsourced items yet.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="table-header text-left">Item</th>
                    <th className="table-header text-left hidden md:table-cell">Supplier</th>
                    <th className="table-header text-right">Base Cost</th>
                    <th className="table-header text-right hidden md:table-cell">Shipping</th>
                    <th className="table-header text-right">Total Cost</th>
                    <th className="table-header text-center hidden lg:table-cell">Lead Time</th>
                    <th className="table-header text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {outsourced.map(item => (
                    <tr key={item.id} className="table-row">
                      <td className="table-cell">
                        <div className="font-medium text-slate-200">{item.item_name}</div>
                        {item.order_link && <a href={item.order_link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 flex items-center gap-1 mt-0.5" onClick={e => e.stopPropagation()}>Order link <ExternalLink size={10} /></a>}
                      </td>
                      <td className="table-cell text-slate-400 hidden md:table-cell">{item.supplier_name}</td>
                      <td className="table-cell text-right font-mono text-sm text-slate-200">{fmt(item.base_cost)}</td>
                      <td className="table-cell text-right font-mono text-sm text-slate-400 hidden md:table-cell">{fmt(item.shipping_cost)}</td>
                      <td className="table-cell text-right font-mono text-sm font-semibold text-white">{fmt((item.base_cost || 0) + (item.shipping_cost || 0))}</td>
                      <td className="table-cell text-center hidden lg:table-cell">
                        <span className={`badge ${item.lead_time <= 3 ? 'bg-emerald-500/10 text-emerald-400' : item.lead_time <= 7 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'}`}>
                          {item.lead_time}d
                        </span>
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(item, 'item')} className="btn-ghost p-1.5"><Edit2 size={12} /></button>
                          <button onClick={() => handleDelete(item.id, 'item')} className="btn-ghost p-1.5 text-red-400 hover:text-red-300"><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          {suppliers.length === 0 ? (
            <div className="p-12 text-center"><Truck size={40} className="text-slate-600 mx-auto mb-3" /><p className="text-slate-400">No suppliers yet.</p></div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="table-header text-left">Supplier</th>
                  <th className="table-header text-left hidden md:table-cell">Email</th>
                  <th className="table-header text-left hidden md:table-cell">Phone</th>
                  <th className="table-header text-left hidden lg:table-cell">Notes</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map(s => (
                  <tr key={s.id} className="table-row">
                    <td className="table-cell font-medium text-slate-200">{s.name}</td>
                    <td className="table-cell text-slate-400 text-sm hidden md:table-cell">{s.contact_email || '—'}</td>
                    <td className="table-cell text-slate-400 text-sm hidden md:table-cell">{s.contact_phone || '—'}</td>
                    <td className="table-cell text-slate-400 text-sm hidden lg:table-cell">{s.notes || '—'}</td>
                    <td className="table-cell text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(s, 'supplier')} className="btn-ghost p-1.5"><Edit2 size={12} /></button>
                        <button onClick={() => handleDelete(s.id, 'supplier')} className="btn-ghost p-1.5 text-red-400 hover:text-red-300"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Edit ${modalType === 'item' ? 'Item' : 'Supplier'}` : `Add ${modalType === 'item' ? 'Outsourced Item' : 'Supplier'}`}>
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 mb-4">
            <AlertCircle size={14} className="text-red-400" /><span className="text-red-300 text-sm">{error}</span>
          </div>
        )}
        {modalType === 'item' ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group col-span-2">
              <label className="form-label">Item Name *</label>
              <input type="text" value={form.item_name || ''} onChange={e => setForm(f => ({ ...f, item_name: e.target.value }))} className="form-input" autoFocus />
            </div>
            <div className="form-group col-span-2">
              <label className="form-label">Supplier Name *</label>
              <input type="text" value={form.supplier_name || ''} onChange={e => setForm(f => ({ ...f, supplier_name: e.target.value }))} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Base Cost ($)</label>
              <input type="number" value={form.base_cost || 0} onChange={e => setForm(f => ({ ...f, base_cost: parseFloat(e.target.value) || 0 }))} min={0} step={0.01} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Shipping Cost ($)</label>
              <input type="number" value={form.shipping_cost || 0} onChange={e => setForm(f => ({ ...f, shipping_cost: parseFloat(e.target.value) || 0 }))} min={0} step={0.01} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Lead Time (days)</label>
              <input type="number" value={form.lead_time || 0} onChange={e => setForm(f => ({ ...f, lead_time: parseInt(e.target.value) || 0 }))} min={0} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Order Link (optional)</label>
              <input type="url" value={form.order_link || ''} onChange={e => setForm(f => ({ ...f, order_link: e.target.value }))} className="form-input" placeholder="https://..." />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group col-span-2">
              <label className="form-label">Supplier Name *</label>
              <input type="text" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="form-input" autoFocus />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input type="email" value={form.contact_email || ''} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} className="form-input" />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input type="tel" value={form.contact_phone || ''} onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))} className="form-input" />
            </div>
            <div className="form-group col-span-2">
              <label className="form-label">Notes</label>
              <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="form-input resize-none" />
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : editing ? 'Update' : 'Add'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
