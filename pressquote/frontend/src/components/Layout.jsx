import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FileText, Zap, Wrench, Package, Layers,
  Truck, Users, Settings, LogOut, ChevronRight, Printer,
  Plus, Menu, X
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { path: '/quotes', label: 'Quotes', icon: FileText },
  { divider: true, label: 'Create' },
  { path: '/quotes/quick', label: 'Quick Quote', icon: Zap },
  { path: '/quotes/custom', label: 'Custom Job', icon: Wrench },
  { divider: true, label: 'Admin' },
  { path: '/materials', label: 'Materials', icon: Package },
  { path: '/products', label: 'Products', icon: Layers },
  { path: '/suppliers', label: 'Suppliers', icon: Truck },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-glow-sm">
            <Printer size={16} className="text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-white text-base leading-none">PressQuote</div>
            <div className="text-slate-500 text-xs mt-0.5">Print Shop Quoting</div>
          </div>
        </div>
      </div>

      {/* Quick action */}
      <div className="px-3 py-3 border-b border-border">
        <button
          onClick={() => { navigate('/quotes/quick'); setMobileOpen(false); }}
          className="btn-primary w-full justify-center text-sm py-2.5"
        >
          <Plus size={15} />
          New Quote
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
        {navItems.map((item, i) => {
          if (item.divider) return (
            <div key={i} className="px-2 pt-4 pb-1">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-widest">{item.label}</span>
            </div>
          );
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => isActive ? 'sidebar-item-active' : 'sidebar-item'}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-3 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-xs font-bold">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-slate-200 truncate">{user?.name}</div>
            <div className="text-xs text-slate-500 capitalize">{user?.role}</div>
          </div>
          <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors p-1" title="Logout">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-navy-900 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-56 bg-navy-800 border-r border-border shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-56 bg-navy-800 border-r border-border flex flex-col">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/60" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-navy-800 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
              <Printer size={12} className="text-white" />
            </div>
            <span className="font-display font-bold text-white text-sm">PressQuote</span>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-slate-400 hover:text-white p-1">
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
