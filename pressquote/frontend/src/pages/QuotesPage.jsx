import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Search, Plus, Zap, Wrench, FileText, Filter } from 'lucide-react';

const statusColors = {
  draft: 'badge-draft',
  sent: 'badge-sent',
  accepted: 'badge-accepted',
  declined: 'badge-declined',
};

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);
}

export default function QuotesPage() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchQuotes = useCallback(() => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    if (typeFilter) params.type = typeFilter;
    api.getQuotes(params)
      .then(({ quotes, total }) => { setQuotes(quotes); setTotal(total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, statusFilter, typeFilter]);

  useEffect(() => {
    const t = setTimeout(fetchQuotes, 200);
    return () => clearTimeout(t);
  }, [fetchQuotes]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title">Quotes</h1>
          <p className="text-slate-400 text-sm mt-0.5">{total} total quotes</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/quotes/quick')} className="btn-primary">
            <Zap size={14} /> Quick Quote
          </button>
          <button onClick={() => navigate('/quotes/custom')} className="btn-secondary">
            <Wrench size={14} /> Custom Job
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search quotes, customers..."
            className="form-input pl-9 py-2"
          />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="form-input w-36 py-2">
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="form-input w-36 py-2">
          <option value="">All Types</option>
          <option value="quick">Quick Quote</option>
          <option value="custom">Custom Job</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <span className="text-slate-400 text-sm">Loading quotes...</span>
          </div>
        ) : quotes.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={40} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No quotes found.{search ? ' Try adjusting your search.' : ' Create your first quote!'}</p>
            {!search && (
              <button onClick={() => navigate('/quotes/quick')} className="btn-primary mx-auto mt-4">
                <Plus size={14} /> Create Quote
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="table-header text-left">Quote #</th>
                  <th className="table-header text-left">Customer</th>
                  <th className="table-header text-left hidden md:table-cell">Project</th>
                  <th className="table-header text-center hidden sm:table-cell">Type</th>
                  <th className="table-header text-center">Status</th>
                  <th className="table-header text-right">Price</th>
                  <th className="table-header text-right hidden lg:table-cell">Margin</th>
                  <th className="table-header text-right hidden lg:table-cell">Due</th>
                  <th className="table-header text-right hidden md:table-cell">Created</th>
                </tr>
              </thead>
              <tbody>
                {quotes.map(q => (
                  <tr
                    key={q.id}
                    className="table-row cursor-pointer"
                    onClick={() => navigate(`/quotes/${q.id}/review`)}
                  >
                    <td className="table-cell font-mono text-blue-400 text-xs whitespace-nowrap">{q.quote_number}</td>
                    <td className="table-cell">
                      <div className="text-sm font-medium text-slate-200">{q.customer_name}</div>
                      {q.customer_company && <div className="text-xs text-slate-500">{q.customer_company}</div>}
                    </td>
                    <td className="table-cell text-slate-400 text-sm hidden md:table-cell">{q.project_name || '—'}</td>
                    <td className="table-cell text-center hidden sm:table-cell">
                      <span className={`badge ${q.type === 'quick' ? 'bg-blue-500/10 text-blue-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                        {q.type === 'quick' ? <Zap size={10} /> : <Wrench size={10} />}
                        {q.type}
                      </span>
                    </td>
                    <td className="table-cell text-center">
                      <span className={statusColors[q.status] || 'badge-draft'}>{q.status}</span>
                    </td>
                    <td className="table-cell text-right font-display font-semibold text-white whitespace-nowrap">{fmt(q.final_price)}</td>
                    <td className="table-cell text-right hidden lg:table-cell">
                      <span className={`text-sm font-mono ${q.margin_percent >= 35 ? 'text-emerald-400' : q.margin_percent >= 25 ? 'text-amber-400' : 'text-red-400'}`}>
                        {q.margin_percent ? q.margin_percent.toFixed(1) + '%' : '—'}
                      </span>
                    </td>
                    <td className="table-cell text-right text-slate-400 text-xs hidden lg:table-cell whitespace-nowrap">{q.due_date || '—'}</td>
                    <td className="table-cell text-right text-slate-500 text-xs hidden md:table-cell whitespace-nowrap">
                      {new Date(q.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
