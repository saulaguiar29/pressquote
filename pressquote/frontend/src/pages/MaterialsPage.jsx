import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import { Package, Plus, Edit2, Trash2, AlertCircle, AlertTriangle } from 'lucide-react';

const EMPTY = { name: '', unit_type: 'sheet', unit_cost: 0, supplier: '', inventory_qty: 0, reorder_point: 0 };
const UNIT_TYPES = ['sheet', 'sq ft', 'unit', 'oz', 'lb', 'roll', 'each', 'set', 'box', 'linear ft'];

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getMaterials().then(setMaterials).finally(() => setLoading(false));
  }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setError(''); setModalOpen(true); };
  const openEdit = (m) => { setEditing(m); setForm({ ...m }); setError(''); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name || !form.unit_type) { setError('Name and unit type required'); return; }
    setSaving(true);
    setError('');
    try {
      if (editing) {
        const updated = await api.updateMaterial(editing.id, form);
        setMaterials(prev => prev.map(m => m.id === editing.id ? updated : m));
      } else {
        const created = await api.createMaterial(form);
        setMaterials(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
      }
      setModalOpen(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this material?')) return;
    try {
      await api.deleteMaterial(id);
      setMaterials(prev => prev.filter(m => m.id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  const fmt = (n) => `$${parseFloat(n || 0).toFixed(4)}`;
  const lowStock = materials.filter(m => m.inventory_qty <= m.reorder_point && m.reorder_point > 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title">Materials</h1>
          <p className="text-gray-900 text-sm mt-0.5">{materials.length} items in database</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={14} /> Add Material
        </button>
      </div>

      {lowStock.length > 0 && (
        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 mb-5">
          <AlertTriangle size={14} className="text-amber-400 shrink-0" />
          <span className="text-amber-300 text-sm">
            {lowStock.length} material{lowStock.length > 1 ? 's' : ''} below reorder point: {lowStock.map(m => m.name).join(', ')}
          </span>
        </div>
      )}

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-900">Loading materials...</div>
        ) : materials.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={40} className="text-gray-900 mx-auto mb-3" />
            <p className="text-gray-900">No materials yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="table-header text-left">Name</th>
                  <th className="table-header text-left hidden md:table-cell">Unit</th>
                  <th className="table-header text-right">Unit Cost</th>
                  <th className="table-header text-left hidden lg:table-cell">Supplier</th>
                  <th className="table-header text-right hidden lg:table-cell">Inventory</th>
                  <th className="table-header text-right hidden lg:table-cell">Reorder At</th>
                  <th className="table-header text-center">Stock</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {materials.map(m => {
                  const low = m.reorder_point > 0 && m.inventory_qty <= m.reorder_point;
                  return (
                    <tr key={m.id} className="table-row">
                      <td className="table-cell font-medium text-gray-900">{m.name}</td>
                      <td className="table-cell text-gray-900 hidden md:table-cell">{m.unit_type}</td>
                      <td className="table-cell text-right font-mono text-sm text-gray-900">{fmt(m.unit_cost)}</td>
                      <td className="table-cell text-gray-900 hidden lg:table-cell">{m.supplier || '—'}</td>
                      <td className="table-cell text-right text-gray-900 hidden lg:table-cell">{parseFloat(m.inventory_qty || 0).toLocaleString()}</td>
                      <td className="table-cell text-right text-gray-900 hidden lg:table-cell">{parseFloat(m.reorder_point || 0).toLocaleString()}</td>
                      <td className="table-cell text-center">
                        <span className={`badge ${low ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          {low ? '⚠ Low' : '✓ OK'}
                        </span>
                      </td>
                      <td className="table-cell text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(m)} className="btn-ghost p-1.5 text-xs"><Edit2 size={12} /></button>
                          <button onClick={() => handleDelete(m.id)} className="btn-ghost p-1.5 text-xs text-red-400 hover:text-red-300"><Trash2 size={12} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Material' : 'Add Material'}>
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 mb-4">
            <AlertCircle size={14} className="text-red-400" /><span className="text-red-300 text-sm">{error}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group col-span-2">
            <label className="form-label">Material Name *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="form-input" placeholder="e.g. 100lb Gloss Cover" autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Unit Type *</label>
            <select value={form.unit_type} onChange={e => setForm(f => ({ ...f, unit_type: e.target.value }))} className="form-input">
              {UNIT_TYPES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Unit Cost ($)</label>
            <input type="number" value={form.unit_cost} onChange={e => setForm(f => ({ ...f, unit_cost: parseFloat(e.target.value) || 0 }))} min={0} step={0.001} className="form-input" />
          </div>
          <div className="form-group col-span-2">
            <label className="form-label">Supplier</label>
            <input type="text" value={form.supplier || ''} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} className="form-input" placeholder="Supplier name" />
          </div>
          <div className="form-group">
            <label className="form-label">Inventory Qty</label>
            <input type="number" value={form.inventory_qty} onChange={e => setForm(f => ({ ...f, inventory_qty: parseFloat(e.target.value) || 0 }))} min={0} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Reorder Point</label>
            <input type="number" value={form.reorder_point} onChange={e => setForm(f => ({ ...f, reorder_point: parseFloat(e.target.value) || 0 }))} min={0} className="form-input" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : editing ? 'Update Material' : 'Add Material'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
