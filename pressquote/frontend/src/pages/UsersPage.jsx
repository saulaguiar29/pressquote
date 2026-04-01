import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Trash2, Shield, User, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isAdmin = currentUser?.role === 'admin';

  useEffect(() => {
    if (!isAdmin) return;
    api.getUsers().then(setUsers).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await api.register(form);
      const updated = await api.getUsers();
      setUsers(updated);
      setForm({ name: '', email: '', password: '', role: 'staff' });
      setShowForm(false);
      setSuccess(`Account created for ${form.name}`);
      setTimeout(() => setSuccess(''), 4000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove access for ${name}?`)) return;
    try {
      await api.deleteUser(id);
      setUsers(u => u.filter(x => x.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="card p-8 text-center">
          <Shield size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-900">Admin access required to manage users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Users</h1>
          <p className="text-gray-900 text-sm mt-0.5">Manage who has access to PressQuote</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setError(''); }} className="btn-primary">
          <UserPlus size={14} /> Add User
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-2 bg-forest-50 border border-forest-200 text-forest-700 rounded-lg px-4 py-3 mb-4 text-sm">
          <CheckCircle size={14} /> {success}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 mb-4 text-sm">
          <AlertCircle size={14} /> {error}
        </div>
      )}

      {/* Create user form */}
      {showForm && (
        <div className="card p-6 mb-5">
          <h2 className="section-title text-base mb-4">Create New Account</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                required
                placeholder="Jane Smith"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                required
                placeholder="jane@printshop.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Temporary password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="form-input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-900 hover:text-gray-900"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="form-input"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="sm:col-span-2 flex gap-2 pt-1">
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <UserPlus size={14} />}
                {saving ? 'Creating...' : 'Create Account'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users list */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-900">Loading users...</div>
        ) : (
          <table className="w-full">
            <thead className="border-b border-forest-100 bg-forest-50/50">
              <tr>
                <th className="table-header text-left">User</th>
                <th className="table-header text-left">Role</th>
                <th className="table-header text-left">Joined</th>
                <th className="table-header" />
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="table-row">
                  <td className="table-cell">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-forest-100 border border-forest-200 flex items-center justify-center text-forest-700 text-xs font-bold">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{u.name}</div>
                        <div className="text-gray-900 text-xs">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.role === 'admin' ? 'bg-forest-100 text-forest-700' : 'bg-gray-100 text-gray-900'
                    }`}>
                      {u.role === 'admin' ? <Shield size={10} /> : <User size={10} />}
                      {u.role}
                    </span>
                  </td>
                  <td className="table-cell text-gray-900 text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="table-cell text-right">
                    {u.id !== currentUser?.id && (
                      <button
                        onClick={() => handleDelete(u.id, u.name)}
                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                        title="Remove access"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
