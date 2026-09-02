import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, Circle, X, Layers, Package, FileText } from 'lucide-react';

const dismissKey = (companyId) => `pq_onboarding_dismissed_${companyId || 'default'}`;

// Lightweight first-run checklist. Steps are derived from real data (no separate
// "completed" state to keep in sync) so it always reflects what's actually true.
export default function OnboardingChecklist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem(dismissKey(user?.company_id)) === '1');
    Promise.all([api.getProducts(), api.getMaterials(), api.getQuoteStats()])
      .then(([products, materials, stats]) => {
        setCounts({ products: products.length, materials: materials.length, quotes: stats.total || 0 });
      })
      .catch(() => {});
  }, []);

  if (!counts || dismissed) return null;

  const steps = [
    {
      key: 'products',
      label: 'Add a product template',
      hint: 'Defines pricing rules for things you print often',
      done: counts.products > 0,
      icon: Layers,
      action: () => navigate('/products'),
    },
    {
      key: 'materials',
      label: 'Add a material',
      hint: 'Stock and costs used to price jobs accurately',
      done: counts.materials > 0,
      icon: Package,
      action: () => navigate('/materials'),
    },
    {
      key: 'quotes',
      label: 'Create your first quote',
      hint: 'Try Quick Quote once you have a product template',
      done: counts.quotes > 0,
      icon: FileText,
      action: () => navigate('/quotes/quick'),
    },
  ];

  const allDone = steps.every(s => s.done);
  if (allDone) return null;

  const dismiss = () => {
    localStorage.setItem(dismissKey(user?.company_id), '1');
    setDismissed(true);
  };

  const doneCount = steps.filter(s => s.done).length;

  return (
    <div className="card p-5 mb-6 border-blue-500/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="section-title text-base">Get set up</h2>
          <p className="text-gray-900 text-xs mt-0.5">{doneCount} of {steps.length} done — a couple quick steps before you're quoting</p>
        </div>
        <button onClick={dismiss} className="text-gray-900 hover:text-gray-700 p-1" title="Dismiss">
          <X size={16} />
        </button>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        {steps.map(step => {
          const Icon = step.icon;
          return (
            <button
              key={step.key}
              onClick={step.action}
              disabled={step.done}
              className={`text-left p-3 rounded-lg border transition-all ${
                step.done
                  ? 'border-forest-200 bg-forest-50 cursor-default'
                  : 'border-border hover:border-blue-500/40 hover:shadow-glow cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {step.done ? (
                  <CheckCircle2 size={15} className="text-forest-600" />
                ) : (
                  <Circle size={15} className="text-gray-900" />
                )}
                <Icon size={14} className="text-gray-900" />
                <span className="text-sm font-medium text-gray-900">{step.label}</span>
              </div>
              <p className="text-xs text-gray-900 pl-[21px]">{step.hint}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
