import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Settings, Save, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SETTING_FIELDS = [
  {
    key: 'labor_rate',
    label: 'Labor Rate',
    unit: '$/hr',
    description: 'Hourly rate for press and production labor',
    type: 'number',
    step: 0.5,
  },
  {
    key: 'design_hourly_rate',
    label: 'Design Hourly Rate',
    unit: '$/hr',
    description: 'Hourly rate for graphic design work',
    type: 'number',
    step: 0.5,
  },
  {
    key: 'overhead_percent',
    label: 'Overhead Percent',
    unit: '%',
    description: 'Applied to subtotal to cover rent, utilities, equipment depreciation',
    type: 'number',
    step: 1,
  },
  {
    key: 'target_margin_percent',
    label: 'Target Margin',
    unit: '%',
    description: 'Target profit margin applied to all quotes',
    type: 'number',
    step: 1,
  },
  {
    key: 'minimum_job_price',
    label: 'Minimum Job Price',
    unit: '$',
    description: 'No quote will be calculated below this amount',
    type: 'number',
    step: 1,
  },
  {
    key: 'economic_multiplier',
    label: 'Economic Multiplier',
    unit: '×',
    description: 'Apply a market/economic adjustment to all quotes (1.0 = no adjustment)',
    type: 'number',
    step: 0.05,
  },
];

const COMPANY_FIELDS = [
  { key: 'company_name', label: 'Company Name', type: 'text' },
  { key: 'company_email', label: 'Quote Email', type: 'email' },
  { key: 'company_phone', label: 'Phone', type: 'tel' },
  { key: 'company_address', label: 'Address', type: 'text' },
];

const RUSH_RULES = [
  { days: '14+ days', fee: 'No rush fee', color: 'text-emerald-400' },
  { days: '7–13 days', fee: '+10%', color: 'text-blue-400' },
  { days: '3–6 days', fee: '+25%', color: 'text-amber-400' },
  { days: '0–2 days', fee: '+50%', color: 'text-red-400' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getSettings().then(setSettings).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-400">Loading settings...</div>;

  const isAdmin = user?.role === 'admin';

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="text-slate-400 text-sm mt-0.5">Configure pricing rates and company info</p>
        </div>
        {isAdmin && (
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</> :
             saved ? <><CheckCircle size={14} /> Saved!</> : <><Save size={14} /> Save Settings</>}
          </button>
        )}
      </div>

      {!isAdmin && (
        <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-4 py-3 mb-5">
          <Info size={14} className="text-blue-400 shrink-0" />
          <span className="text-blue-300 text-sm">Settings are view-only for staff. Contact an admin to make changes.</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-5">
          <AlertCircle size={14} className="text-red-400 shrink-0" />
          <span className="text-red-300 text-sm">{error}</span>
        </div>
      )}

      {/* Pricing rates */}
      <div className="card p-6 mb-5">
        <h2 className="section-title text-base mb-5 flex items-center gap-2">
          <Settings size={15} className="text-blue-400" />
          Pricing Rates
        </h2>
        <div className="grid gap-5">
          {SETTING_FIELDS.map(field => (
            <div key={field.key} className="flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <label className="text-sm font-medium text-slate-200">{field.label}</label>
                  <span className="text-xs text-slate-500 bg-navy-700 px-1.5 py-0.5 rounded">{field.unit}</span>
                </div>
                <p className="text-xs text-slate-500">{field.description}</p>
              </div>
              <input
                type={field.type}
                value={settings[field.key] || ''}
                onChange={e => setSettings(s => ({ ...s, [field.key]: e.target.value }))}
                disabled={!isAdmin}
                step={field.step}
                min={0}
                className={`form-input w-28 text-right font-mono ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Company info */}
      <div className="card p-6 mb-5">
        <h2 className="section-title text-base mb-5">Company Information</h2>
        <div className="grid gap-4">
          {COMPANY_FIELDS.map(field => (
            <div key={field.key} className="form-group">
              <label className="form-label">{field.label}</label>
              <input
                type={field.type}
                value={settings[field.key] || ''}
                onChange={e => setSettings(s => ({ ...s, [field.key]: e.target.value }))}
                disabled={!isAdmin}
                className={`form-input ${!isAdmin ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Rush pricing reference */}
      <div className="card p-6">
        <h2 className="section-title text-base mb-4">Rush Pricing Rules</h2>
        <p className="text-slate-400 text-sm mb-4">These rules are built into the pricing engine and apply automatically based on the due date.</p>
        <div className="space-y-2">
          {RUSH_RULES.map(rule => (
            <div key={rule.days} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-current" style={{ color: rule.color.replace('text-', '') }} />
                <span className="text-sm text-slate-300">{rule.days} until due</span>
              </div>
              <span className={`text-sm font-semibold font-mono ${rule.color}`}>{rule.fee}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
