import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../utils/api';
import { Settings, Save, CheckCircle, AlertCircle, Info, Link, Link2Off, RefreshCw } from 'lucide-react';
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
  const [searchParams, setSearchParams] = useSearchParams();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // QuickBooks state
  const [qbConnected, setQbConnected] = useState(false);
  const [qbLoading, setQbLoading] = useState(false);
  const [qbSyncing, setQbSyncing] = useState(false);
  const [qbMessage, setQbMessage] = useState('');

  useEffect(() => {
    api.getSettings().then(setSettings).finally(() => setLoading(false));
    api.qbStatus().then(r => setQbConnected(r.connected)).catch(() => {});

    // Handle redirect back from QuickBooks OAuth
    const qbParam = searchParams.get('qb');
    if (qbParam === 'connected') {
      setQbConnected(true);
      setQbMessage('QuickBooks connected successfully!');
      setSearchParams({});
      setTimeout(() => setQbMessage(''), 4000);
    } else if (qbParam === 'error') {
      setQbMessage('Failed to connect QuickBooks. Please try again.');
      setSearchParams({});
      setTimeout(() => setQbMessage(''), 4000);
    }
  }, []);

  const handleQbConnect = async () => {
    setQbLoading(true);
    try {
      const { url } = await api.qbAuthUrl();
      window.location.href = url;
    } catch (e) {
      setQbMessage('Failed to get QuickBooks auth URL.');
      setQbLoading(false);
    }
  };

  const handleQbDisconnect = async () => {
    if (!window.confirm('Disconnect QuickBooks?')) return;
    setQbLoading(true);
    try {
      await api.qbDisconnect();
      setQbConnected(false);
      setQbMessage('QuickBooks disconnected.');
      setTimeout(() => setQbMessage(''), 3000);
    } catch (e) {
      setQbMessage('Failed to disconnect.');
    } finally {
      setQbLoading(false);
    }
  };

  const handleQbSyncCustomers = async () => {
    setQbSyncing(true);
    setQbMessage('');
    try {
      const { imported, total } = await api.qbSyncCustomers();
      setQbMessage(`Synced ${total} customers from QuickBooks — ${imported} new imported.`);
      setTimeout(() => setQbMessage(''), 5000);
    } catch (e) {
      setQbMessage(`Sync failed: ${e.message}`);
    } finally {
      setQbSyncing(false);
    }
  };

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

  if (loading) return <div className="p-8 text-center text-gray-900">Loading settings...</div>;

  const isAdmin = user?.role === 'admin';

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="text-gray-900 text-sm mt-0.5">Configure pricing rates and company info</p>
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
                  <label className="text-sm font-medium text-gray-900">{field.label}</label>
                  <span className="text-xs text-gray-900 bg-navy-700 px-1.5 py-0.5 rounded">{field.unit}</span>
                </div>
                <p className="text-xs text-gray-900">{field.description}</p>
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

      {/* QuickBooks Integration */}
      <div className="card p-6 mb-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="section-title text-base flex items-center gap-2">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Intuit_QuickBooks_logo.svg/120px-Intuit_QuickBooks_logo.svg.png" alt="QuickBooks" className="h-5" />
              QuickBooks Online
            </h2>
            <p className="text-gray-900 text-sm mt-0.5">Export invoices and sync customers</p>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${qbConnected ? 'bg-forest-100 text-forest-700' : 'bg-gray-100 text-gray-900'}`}>
            {qbConnected ? 'Connected' : 'Not connected'}
          </div>
        </div>

        {qbMessage && (
          <div className={`flex items-center gap-2 rounded-lg px-3 py-2.5 mb-4 text-sm ${qbMessage.includes('success') || qbMessage.includes('Synced') ? 'bg-forest-50 text-forest-700 border border-forest-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
            {qbMessage}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {!qbConnected ? (
            <button onClick={handleQbConnect} disabled={qbLoading} className="btn-primary">
              {qbLoading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Link size={14} />}
              Connect QuickBooks
            </button>
          ) : (
            <>
              <button onClick={handleQbSyncCustomers} disabled={qbSyncing} className="btn-secondary">
                {qbSyncing ? <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" /> : <RefreshCw size={14} />}
                Sync Customers
              </button>
              <button onClick={handleQbDisconnect} disabled={qbLoading} className="btn-danger">
                <Link2Off size={14} /> Disconnect
              </button>
            </>
          )}
        </div>
      </div>

      {/* Rush pricing reference */}
      <div className="card p-6">
        <h2 className="section-title text-base mb-4">Rush Pricing Rules</h2>
        <p className="text-gray-900 text-sm mb-4">These rules are built into the pricing engine and apply automatically based on the due date.</p>
        <div className="space-y-2">
          {RUSH_RULES.map(rule => (
            <div key={rule.days} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-current" style={{ color: rule.color.replace('text-', '') }} />
                <span className="text-sm text-gray-900">{rule.days} until due</span>
              </div>
              <span className={`text-sm font-semibold font-mono ${rule.color}`}>{rule.fee}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
