import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  FileText, TrendingUp, DollarSign, CheckCircle,
  Zap, Wrench, ArrowRight, Clock, BarChart3
} from 'lucide-react';

const statusColors = {
  draft: 'badge-draft',
  sent: 'badge-sent',
  accepted: 'badge-accepted',
  declined: 'badge-declined',
};

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getQuoteStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="page-title">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-slate-400 mt-1 text-sm">Here's what's happening with your quotes today.</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <button
          onClick={() => navigate('/quotes/quick')}
          className="card p-5 text-left hover:border-blue-500/40 hover:shadow-glow transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-blue-500/15 border border-blue-500/20 rounded-xl flex items-center justify-center group-hover:bg-blue-500/25 transition-colors">
              <Zap size={18} className="text-blue-400" />
            </div>
            <div className="flex-1">
              <div className="font-display font-semibold text-white text-base">Quick Quote</div>
              <div className="text-slate-400 text-sm mt-0.5">Standard products — fast &amp; simple</div>
            </div>
            <ArrowRight size={16} className="text-slate-600 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all mt-1" />
          </div>
        </button>

        <button
          onClick={() => navigate('/quotes/custom')}
          className="card p-5 text-left hover:border-blue-500/40 hover:shadow-glow transition-all group"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-indigo-500/15 border border-indigo-500/20 rounded-xl flex items-center justify-center group-hover:bg-indigo-500/25 transition-colors">
              <Wrench size={18} className="text-indigo-400" />
            </div>
            <div className="flex-1">
              <div className="font-display font-semibold text-white text-base">Custom Job</div>
              <div className="text-slate-400 text-sm mt-0.5">Complex work with line items</div>
            </div>
            <ArrowRight size={16} className="text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all mt-1" />
          </div>
        </button>
      </div>

      {/* Stats */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-3 bg-navy-600 rounded w-16 mb-3" />
              <div className="h-7 bg-navy-600 rounded w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Total Quotes</span>
              <FileText size={14} className="text-slate-500" />
            </div>
            <div className="font-display text-3xl font-bold text-white">{stats?.total || 0}</div>
            <div className="text-slate-500 text-xs">{stats?.thisMonth || 0} this month</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Sent</span>
              <CheckCircle size={14} className="text-emerald-500" />
            </div>
            <div className="font-display text-3xl font-bold text-white">{stats?.sent || 0}</div>
            <div className="text-emerald-500 text-xs">awaiting response</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Revenue</span>
              <DollarSign size={14} className="text-blue-400" />
            </div>
            <div className="font-display text-2xl font-bold text-white">{fmt(stats?.totalRevenue)}</div>
            <div className="text-slate-500 text-xs">sent + accepted</div>
          </div>

          <div className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Avg Margin</span>
              <TrendingUp size={14} className="text-blue-400" />
            </div>
            <div className="font-display text-3xl font-bold text-white">
              {stats?.avgMargin ? stats.avgMargin.toFixed(1) : '—'}%
            </div>
            <div className="text-slate-500 text-xs">across all quotes</div>
          </div>
        </div>
      )}

      {/* Recent quotes */}
      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-slate-400" />
            <span className="section-title text-base">Recent Quotes</span>
          </div>
          <button onClick={() => navigate('/quotes')} className="btn-ghost text-xs py-1.5 px-2.5">
            View all <ArrowRight size={12} />
          </button>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-navy-700/50 rounded animate-pulse" />)}
          </div>
        ) : !stats?.recent?.length ? (
          <div className="p-10 text-center">
            <BarChart3 size={36} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No quotes yet. Create your first one above!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="table-header text-left">Quote #</th>
                  <th className="table-header text-left">Customer</th>
                  <th className="table-header text-left hidden md:table-cell">Project</th>
                  <th className="table-header text-left hidden md:table-cell">Type</th>
                  <th className="table-header text-right">Price</th>
                  <th className="table-header text-center">Status</th>
                  <th className="table-header text-center hidden md:table-cell">Margin</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map(q => (
                  <tr
                    key={q.id}
                    className="table-row cursor-pointer"
                    onClick={() => navigate(`/quotes/${q.id}/review`)}
                  >
                    <td className="table-cell font-mono text-blue-400 text-xs">{q.quote_number}</td>
                    <td className="table-cell text-slate-200 font-medium">{q.customer_name}</td>
                    <td className="table-cell text-slate-400 hidden md:table-cell">{q.project_name || '—'}</td>
                    <td className="table-cell hidden md:table-cell">
                      <span className={`badge ${q.type === 'quick' ? 'bg-blue-500/10 text-blue-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                        {q.type === 'quick' ? <Zap size={10} /> : <Wrench size={10} />}
                        {q.type}
                      </span>
                    </td>
                    <td className="table-cell text-right font-display font-semibold text-white">{fmt(q.final_price)}</td>
                    <td className="table-cell text-center">
                      <span className={statusColors[q.status] || 'badge-draft'}>{q.status}</span>
                    </td>
                    <td className="table-cell text-center text-slate-300 hidden md:table-cell text-sm font-mono">
                      {q.margin_percent ? q.margin_percent.toFixed(1) + '%' : '—'}
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
