import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import { Users, Plus, Edit2, Trash2, AlertCircle, Search } from 'lucide-react';

const EMPTY = { name: '', email: '', phone: '', company: '', address: '', notes: '' };

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchCustomers = () => {
    setLoading(true);
    api.getCustomers(search).then(setCustomers).finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(fetchCustomers, 200);
    return () => clearTimeout(t);
  }, [search]);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setError(''); setModalOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ ...c }); setError(''); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name) { setError('Name required'); return; }
    setSaving(true);
    setError('');
    try {
      if (editing) {
        const updated = await api.updateCustomer(editing.id, form);
        setCustomers(prev => prev.map(c => c.id === editing.id ? updated : c));
      } else {
        const created = await api.createCustomer(form);
        setCustomers(prev => [...prev, created]);
      }
      setModalOpen(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer? Their quotes will remain.')) return;
    try {
      await api.deleteCustomer(id);
      setCustomers(prev => prev.filter(c => c.id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="text-gray-900 text-sm mt-0.5">{customers.length} customers</p>
        </div>
        <button onClick={openCreate} className="btn-primary"><Plus size={14} /> Add Customer</button>
      </div>

      <div className="relative mb-5">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-900" />
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search customers..." className="form-input pl-9 max-w-sm" />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-900">Loading...</div>
        ) : customers.length === 0 ? (
          <div className="p-12 text-center">
            <Users size={40} className="text-gray-900 mx-auto mb-3" />
            <p className="text-gray-900">{search ? 'No customers found.' : 'No customers yet.'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="table-header text-left">Name</th>
                  <th className="table-header text-left hidden md:table-cell">Company</th>
                  <th className="table-header text-left hidden md:table-cell">Email</th>
                  <th className="table-header text-left hidden lg:table-cell">Phone</th>
                  <th className="table-header text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => (
                  <tr key={c.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-blue-500/15 border border-blue-500/20 flex items-center justify-center text-blue-400 text-xs font-bold shrink-0">
                          {c.name[0]}
                        </div>
                        <span className="font-medium text-gray-900">{c.name}</span>
                      </div>
                    </td>
                    <td className="table-cell text-gray-900 hidden md:table-cell">{c.company || '—'}</td>
                    <td className="table-cell text-gray-900 text-sm hidden md:table-cell">{c.email || '—'}</td>
                    <td className="table-cell text-gray-900 text-sm hidden lg:table-cell">{c.phone || '—'}</td>
                    <td className="table-cell text-right">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(c)} className="btn-ghost p-1.5"><Edit2 size={12} /></button>
                        <button onClick={() => handleDelete(c.id)} className="btn-ghost p-1.5 text-red-400 hover:text-red-300"><Trash2 size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 mb-4">
            <AlertCircle size={14} className="text-red-400" /><span className="text-red-300 text-sm">{error}</span>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div className="form-group col-span-2">
            <label className="form-label">Full Name *</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="form-input" autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Company</label>
            <input type="text" value={form.company || ''} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input type="tel" value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="form-input" />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input type="text" value={form.address || ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} className="form-input" />
          </div>
          <div className="form-group col-span-2">
            <label className="form-label">Notes</label>
            <textarea value={form.notes || ''} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="form-input resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : editing ? 'Update' : 'Add Customer'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
