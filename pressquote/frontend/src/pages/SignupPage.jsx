import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Printer, Eye, EyeOff, AlertCircle, Building2 } from 'lucide-react';
import { api } from '../utils/api';

export default function SignupPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ companyName: '', name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api.signupCompany(form);
      localStorage.setItem('pq_token', data.token);
      // Re-use login flow by triggering a fresh /me fetch via page reload
      window.location.href = '/';
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #16a34a 0%, #dcfce7 50%, #ffffff 100%)' }}
    >
      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/80 border border-white/60 rounded-2xl mb-4 shadow-lg">
            <Printer size={26} className="text-green-700" />
          </div>
          <h1 className="font-display text-3xl font-bold text-gray-900">PressQuote</h1>
          <p className="text-gray-900 text-sm mt-1">Print Shop Quoting Software</p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building2 size={18} className="text-green-700" />
            <h2 className="font-display text-lg font-semibold text-gray-900">Create your company account</h2>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 mb-4">
              <AlertCircle size={15} className="text-red-400 shrink-0" />
              <span className="text-red-600 text-sm">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input
                type="text"
                value={form.companyName}
                onChange={set('companyName')}
                className="form-input"
                placeholder="Acme Print Shop"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input
                type="text"
                value={form.name}
                onChange={set('name')}
                className="form-input"
                placeholder="Jane Smith"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                className="form-input"
                placeholder="jane@printshop.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  className="form-input pr-10"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-border text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-green-700 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
