import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  Boxes,
  ShoppingCart,
  Truck,
  Building2,
  Users,
  BarChart3,
  Settings,
  Store as StoreIcon,
  Menu,
  X,
  UserCheck,
  RotateCcw,
} from 'lucide-react';
import { ActivePage } from '../../types';
import { useStore } from '../../context/StoreContext';

interface AppShellProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activePage,
  onNavigate,
  children,
}) => {
  const { store, currentUser, resetToDemo } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const navItems: { id: ActivePage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'pos', label: 'POS / Sales', icon: ShoppingCart },
    { id: 'purchases', label: 'Purchases', icon: Truck },
    { id: 'suppliers', label: 'Suppliers', icon: Building2 },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleNavClick = (page: ActivePage) => {
    onNavigate(page);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-sans antialiased">
      {/* Top Application Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Brand / Store Badge */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                id="mobile-menu-toggle-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100 hover:text-stone-900 focus:outline-hidden"
                aria-label="Toggle navigation"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('dashboard')}>
                <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold shadow-xs">
                  <StoreIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 tracking-tight text-base sm:text-lg">
                      {store.name}
                    </span>
                    <span className="text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      Pilot Store
                    </span>
                  </div>
                  <span className="text-xs text-stone-500 hidden sm:inline-block">
                    Retail POS & Inventory System
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-stone-900 text-white shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right: Active Role Badge & POS Quick Launch */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Role pill showing Admin / Store Owner */}
              <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-xs text-stone-700">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-medium">Role:</span>
                <span className="font-semibold text-stone-900">{currentUser.role} (Owner)</span>
              </div>

              {/* Quick POS button */}
              {activePage !== 'pos' && (
                <button
                  type="button"
                  id="header-quick-pos-btn"
                  onClick={() => onNavigate('pos')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs sm:text-sm font-semibold hover:bg-emerald-700 transition shadow-2xs"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>Open POS</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200 bg-white px-4 pt-2 pb-4 space-y-1 animate-in slide-in-from-top-2 duration-150">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  id={`mobile-nav-${item.id}`}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                    isActive
                      ? 'bg-stone-900 text-white font-semibold'
                      : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            <div className="pt-2 mt-2 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 px-2">
              <span>Active User: {currentUser.name}</span>
              <span className="font-semibold text-emerald-700">{currentUser.role}</span>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* Footer with architecture discipline note & Reset button */}
      <footer className="bg-white border-t border-stone-200 py-4 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-700">Kedai PAPA POS</span>
            <span>•</span>
            <span>Part 01 Foundation</span>
            <span>•</span>
            <span className="text-stone-400">PRODUCT → INVENTORY → POS → SALES → GROSS PROFIT</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="inline-flex items-center gap-1 text-stone-500 hover:text-stone-800 transition"
              title="Reset state to initial pilot demo records"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo State</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-stone-200 p-6 max-w-sm w-full">
            <h4 className="text-base font-bold text-stone-900 mb-2">Reset Demo State?</h4>
            <p className="text-xs text-stone-600 mb-4">
              This will reload the initial Kedai PAPA pilot catalog, opening stock movements, and initial sales.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  resetToDemo();
                  setShowResetConfirm(false);
                }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700"
              >
                Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
