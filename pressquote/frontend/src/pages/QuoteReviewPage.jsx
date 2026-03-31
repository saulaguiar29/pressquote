import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import {
  CheckCircle, Edit3, Send, ArrowLeft, Printer, DollarSign,
  TrendingUp, Clock, AlertCircle, Mail, Save, Loader, Zap, Wrench
} from 'lucide-react';

const STATUS_OPTS = ['draft', 'sent', 'accepted', 'declined'];

const statusColors = {
  draft: 'badge-draft',
  sent: 'badge-sent',
  accepted: 'badge-accepted',
  declined: 'badge-declined',
};

function fmt(n) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);
}

export default function QuoteReviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('draft');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [showEmail, setShowEmail] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [qbConnected, setQbConnected] = useState(false);
  const [qbExporting, setQbExporting] = useState(false);
  const [qbResult, setQbResult] = useState('');

  useEffect(() => {
    api.qbStatus().then(r => setQbConnected(r.connected)).catch(() => {});
    api.getQuote(id)
      .then(q => {
        setQuote(q);
        setStatus(q.status);
        setEmailSubject(q.email_subject || `Quote ${q.quote_number} from PrintCo — ${q.customer_name}`);
        setEmailBody(q.email_body || generateEmailBody(q));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  function generateEmailBody(q) {
    return `Hi ${q.customer_name.split(' ')[0]},

Thank you for reaching out. Please find your quote details below:

Quote Number: ${q.quote_number}
Project: ${q.project_name || q.customer_name}
Due Date: ${q.due_date || 'TBD'}

QUOTE TOTAL: ${fmt(q.final_price)}

This quote is valid for 30 days. Please reply to this email or call us to approve, request changes, or ask any questions.

Thank you for your business!

Best regards,
PrintCo`;
  }

  const handleQbExport = async () => {
    setQbExporting(true);
    setQbResult('');
    try {
      const { invoiceNumber } = await api.qbExportInvoice(id);
      setQbResult(`Exported to QuickBooks as invoice ${invoiceNumber}`);
    } catch (e) {
      setQbResult(`Export failed: ${e.message}`);
    } finally {
      setQbExporting(false);
    }
  };

  const handleSave = async (newStatus = status) => {
    setSaving(true);
    setError('');
    try {
      const updated = await api.updateQuote(id, {
        ...quote,
        customer_id: quote.customer_id,
        customer_name: quote.customer_name,
        project_name: quote.project_name,
        type: quote.type,
        quantity: quote.quantity,
        due_date: quote.due_date,
        materialCost: quote.material_cost,
        laborHours: 0,
        designHours: 0,
        outsourcedCost: quote.outsourced_cost,
        complexityMultiplier: 1,
        status: newStatus,
        email_subject: emailSubject,
        email_body: emailBody,
        notes: quote.notes,
        lineItems: quote.lineItems || [],
      });
      setQuote(updated);
      setStatus(newStatus);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader size={24} className="text-blue-400 animate-spin" />
    </div>
  );

  if (!quote) return (
    <div className="p-6 text-center text-slate-400">
      {error || 'Quote not found.'}
    </div>
  );

  const rows = [
    { label: 'Materials', value: quote.material_cost, color: '' },
    { label: 'Labor', value: quote.labor_cost, color: '' },
    { label: 'Design', value: quote.design_cost, color: '' },
    { label: 'Outsourced', value: quote.outsourced_cost, color: '' },
    { label: 'Overhead', value: quote.overhead_cost, color: 'text-slate-400' },
    { label: `Rush Fee (+${quote.rush_percent || 0}%)`, value: quote.rush_fee, color: 'text-amber-400', hide: !quote.rush_fee },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/quotes')} className="btn-ghost p-2">
            <ArrowLeft size={15} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="page-title">{quote.quote_number}</h1>
              <span className={statusColors[status]}>{status}</span>
            </div>
            <div className="text-slate-400 text-sm mt-0.5">
              {quote.customer_name} {quote.customer_company ? `· ${quote.customer_company}` : ''}
              {quote.project_name ? ` · ${quote.project_name}` : ''}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={status}
            onChange={e => { setStatus(e.target.value); handleSave(e.target.value); }}
            className="form-input text-sm py-1.5 w-36"
          >
            {STATUS_OPTS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <button onClick={() => setShowEmail(!showEmail)} className="btn-secondary">
            <Mail size={14} /> Email Draft
          </button>
          {qbConnected && (
            <button onClick={handleQbExport} disabled={qbExporting} className="btn-secondary">
              {qbExporting ? <Loader size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              {qbExporting ? 'Exporting...' : 'Export to QB'}
            </button>
          )}
          <button onClick={() => handleSave()} disabled={saving} className="btn-primary">
            {saving ? <Loader size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
            {saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 mb-4">
          <AlertCircle size={14} className="text-red-400" />
          <span className="text-red-300 text-sm">{error}</span>
        </div>
      )}
      {qbResult && (
        <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 mb-4 text-sm ${qbResult.includes('failed') ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-forest-50 text-forest-700 border border-forest-200'}`}>
          <CheckCircle size={14} />
          {qbResult}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main breakdown */}
        <div className="lg:col-span-2 space-y-5">
          {/* Price summary */}
          <div className="card p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="text-slate-400 text-sm">Final Quote Price</div>
                <div className="font-display text-4xl font-bold text-white mt-1">{fmt(quote.final_price)}</div>
              </div>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                quote.type === 'quick' ? 'bg-blue-500/15 border border-blue-500/20' : 'bg-indigo-500/15 border border-indigo-500/20'
              }`}>
                {quote.type === 'quick' ? <Zap size={18} className="text-blue-400" /> : <Wrench size={18} className="text-indigo-400" />}
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-2 mb-4">
              {rows.filter(r => !r.hide && r.value > 0).map(r => (
                <div key={r.label} className="flex justify-between items-center py-1 border-b border-border/30 last:border-0">
                  <span className={`text-sm ${r.color || 'text-slate-400'}`}>{r.label}</span>
                  <span className={`font-mono text-sm ${r.color || 'text-slate-200'}`}>{fmt(r.value)}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-border">
              <span className="font-display font-bold text-white">Total</span>
              <span className="font-display font-bold text-2xl text-blue-400">{fmt(quote.final_price)}</span>
            </div>

            {quote.rush_percent > 0 && (
              <div className="mt-3 text-xs text-amber-400/80 bg-amber-400/5 border border-amber-400/15 rounded px-3 py-2">
                ⚡ Rush pricing applied — {quote.days_until_due} days until due date
              </div>
            )}
          </div>

          {/* Line items (custom jobs) */}
          {quote.lineItems?.length > 0 && (
            <div className="card">
              <div className="px-5 py-4 border-b border-border">
                <h2 className="section-title text-base">Line Items</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="table-header text-left">Type</th>
                      <th className="table-header text-left">Description</th>
                      <th className="table-header text-right">Qty</th>
                      <th className="table-header text-right">Unit Cost</th>
                      <th className="table-header text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quote.lineItems.map((item, i) => (
                      <tr key={i} className="table-row">
                        <td className="table-cell">
                          <span className="text-xs capitalize text-slate-400">{item.type}</span>
                        </td>
                        <td className="table-cell text-slate-200">{item.description}</td>
                        <td className="table-cell text-right text-slate-300 font-mono text-xs">{item.quantity}</td>
                        <td className="table-cell text-right text-slate-300 font-mono text-xs">{fmt(item.unit_cost)}</td>
                        <td className="table-cell text-right font-mono text-sm text-white">{fmt(item.total_cost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Email draft */}
          {showEmail && (
            <div className="card p-5">
              <h2 className="section-title text-base mb-4 flex items-center gap-2">
                <Mail size={15} className="text-blue-400" /> Email Draft
              </h2>
              <div className="space-y-3">
                <div className="form-group">
                  <label className="form-label">To</label>
                  <input value={quote.customer_email || ''} readOnly className="form-input text-slate-400 cursor-default" placeholder="Customer email not on file" />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject</label>
                  <input type="text" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Body</label>
                  <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} rows={10} className="form-input resize-none font-mono text-xs" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleSave()} className="btn-primary flex-1 justify-center">
                    <Save size={14} /> Save Draft
                  </button>
                  <button
                    onClick={() => { handleSave('sent'); }}
                    className="btn-secondary flex-1 justify-center"
                  >
                    <Send size={14} /> Mark as Sent
                  </button>
                </div>
                <p className="text-xs text-slate-500 text-center">Email sending integration can be connected via SMTP or SendGrid.</p>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Profit stats */}
          <div className="card p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Profitability</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign size={13} className="text-emerald-400" />
                  <span className="text-xs text-slate-400">Estimated Profit</span>
                </div>
                <div className="font-display font-bold text-xl text-emerald-400">{fmt(quote.profit)}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp size={13} className="text-blue-400" />
                  <span className="text-xs text-slate-400">Margin</span>
                </div>
                <div className={`font-display font-bold text-xl ${quote.margin_percent >= 35 ? 'text-blue-400' : 'text-amber-400'}`}>
                  {quote.margin_percent?.toFixed(1)}%
                </div>
                <div className="w-full h-1.5 bg-navy-600 rounded-full mt-2">
                  <div
                    className={`h-1.5 rounded-full ${quote.margin_percent >= 35 ? 'bg-blue-500' : quote.margin_percent >= 25 ? 'bg-amber-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(quote.margin_percent, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Job details */}
          <div className="card p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Job Details</h3>
            <div className="space-y-2 text-sm">
              {[
                ['Type', quote.type === 'quick' ? 'Quick Quote' : 'Custom Job'],
                ['Quantity', quote.quantity?.toLocaleString()],
                ['Material', quote.paper_material],
                ['Finish', quote.color_finish],
                ['Due Date', quote.due_date],
                ['Days Until Due', quote.days_until_due != null ? `${quote.days_until_due} days` : null],
                ['Created', new Date(quote.created_at).toLocaleDateString()],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-slate-500 shrink-0">{k}</span>
                  <span className="text-slate-200 text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {quote.notes && (
            <div className="card p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Notes</h3>
              <p className="text-sm text-slate-300">{quote.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate(`/quotes/quick`)}
              className="btn-secondary w-full justify-center text-xs"
            >
              Duplicate as New Quote
            </button>
            <button
              onClick={() => { if (window.confirm('Delete this quote?')) { api.deleteQuote(id).then(() => navigate('/quotes')); } }}
              className="btn-danger w-full justify-center text-xs"
            >
              Delete Quote
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
