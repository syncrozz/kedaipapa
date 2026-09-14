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
  Shield,
  ShieldCheck,
  Cloud,
  CloudOff,
  RefreshCw,
} from 'lucide-react';
import { ActivePage } from '../../types';
import { useStore } from '../../context/StoreContext';
import { SupportModal } from '../common/SupportModal';

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
  const {
    store,
    currentUser,
    isAdminMode,
    openPinModal,
    exitAdminMode,
    cloudSyncStatus,
    lastCloudSync,
    syncAllToCloud,
    pullAllFromCloud,
  } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isManualSyncing, setIsManualSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState<string | null>(null);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

  const handleHeaderSync = async () => {
    setIsManualSyncing(true);
    try {
      const pulled = await pullAllFromCloud();
      await syncAllToCloud();
      setSyncToast(pulled ? 'Data diselaraskan dengan Cloud!' : 'Data tempatan disegerakkan');
      setTimeout(() => setSyncToast(null), 3000);
    } catch {
      setSyncToast('Ralat penyegerakan');
      setTimeout(() => setSyncToast(null), 3000);
    } finally {
      setIsManualSyncing(false);
    }
  };

  const navItems: { id: ActivePage; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'inventory', label: 'Inventory', icon: Boxes },
    { id: 'pos', label: 'POS', icon: ShoppingCart },
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
        <div className="w-full px-2.5 sm:px-4 lg:px-6">
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between min-h-13 sm:h-14 py-1.5 sm:py-0 w-full gap-y-1.5 gap-x-2 sm:gap-x-4">
            {/* Left: Brand / Store Badge & Mobile Menu */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                id="mobile-menu-toggle-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 hover:text-stone-900 focus:outline-hidden"
                aria-label="Toggle navigation"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div
                id="header-branding-home-trigger"
                role="button"
                tabIndex={0}
                aria-label="Kembali ke Dashboard Kedai PAPA"
                className="flex items-center gap-2 cursor-pointer hover:opacity-95 transition select-none group"
                onClick={() => {
                  onNavigate('dashboard');
                  setMobileMenuOpen(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onNavigate('dashboard');
                    setMobileMenuOpen(false);
                  }
                }}
              >
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                  <StoreIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-stone-900 tracking-tight text-sm sm:text-base leading-tight">
                      {store.name}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-0.5 lg:gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-item-${item.id}`}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs lg:text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-stone-900 text-white shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Cloud Sync Status Indicator (Header Top Right on Mobile, Inline on Desktop) */}
            <div className="flex items-center gap-1.5 shrink-0 ml-auto sm:ml-0">
              <div className="relative">
                <button
                  type="button"
                  id="header-cloud-sync-btn"
                  onClick={handleHeaderSync}
                  disabled={isManualSyncing}
                  title={`Firebase Cloud Sync: ${cloudSyncStatus} ${lastCloudSync ? `(Terakhir disegerakkan: ${lastCloudSync.toLocaleTimeString()})` : ''}. Klik untuk selaraskan data peranti ini dengan cloud.`}
                  className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 transition cursor-pointer text-xs"
                >
                  {isManualSyncing || cloudSyncStatus === 'SYNCING' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                      <span className="font-medium text-[11px] text-amber-800">
                        <span className="hidden xs:inline">Menyegerak...</span>
                        <span className="xs:hidden">Sync</span>
                      </span>
                    </>
                  ) : cloudSyncStatus === 'CONNECTED' ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="font-medium text-[11px] text-emerald-800">
                        <span className="hidden sm:inline">Cloud Sync Aktif</span>
                        <span className="sm:hidden text-[10px] xs:text-[11px]">Cloud</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <CloudOff className="w-3.5 h-3.5 text-stone-400" />
                      <span className="font-medium text-[11px] text-stone-600">
                        <span className="hidden sm:inline">Luar Talian</span>
                        <span className="sm:hidden text-[10px] xs:text-[11px]">Offline</span>
                      </span>
                    </>
                  )}
                </button>

                {/* Toast feedback tooltip */}
                {syncToast && (
                  <div className="absolute top-full mt-1.5 right-0 bg-stone-900 text-white text-[11px] px-2.5 py-1 rounded-md shadow-lg whitespace-nowrap z-50 animate-in fade-in zoom-in-95 duration-150">
                    {syncToast}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons: Admin Mode + Open POS (Reflows to clean sub-row on Mobile, In-line on Desktop) */}
            <div className="w-full sm:w-auto flex items-center gap-2 pt-1 sm:pt-0 border-t border-stone-100 sm:border-0 shrink-0">
              {/* Admin Mode Toggle Button (SES 4.4 Locked Part A: Default Orange [ Admin ], Active Green [ Admin Mode Aktif ]) */}
              <button
                type="button"
                id="header-admin-mode-btn"
                onClick={() => {
                  if (isAdminMode) {
                    exitAdminMode();
                  } else {
                    openPinModal();
                  }
                }}
                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition shadow-2xs cursor-pointer ${
                  isAdminMode
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                }`}
                title={isAdminMode ? 'Klik untuk keluar dari Mod Admin' : 'Klik untuk buka Mod Admin'}
              >
                {isAdminMode ? <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                <span className="whitespace-nowrap">{isAdminMode ? 'Admin Mode Aktif' : 'Admin'}</span>
              </button>

              {/* Role pill showing Admin / Store Owner */}
              <div className="hidden xl:flex items-center gap-1 px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200 text-[11px] text-stone-700">
                <UserCheck className="w-3 h-3 text-emerald-600" />
                <span className="font-semibold text-stone-900">{currentUser.role} (Owner)</span>
              </div>

              {/* Quick POS button */}
              {activePage !== 'pos' && (
                <button
                  type="button"
                  id="header-quick-pos-btn"
                  onClick={() => onNavigate('pos')}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition shadow-2xs cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">Open POS</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-200 bg-white px-4 pt-2 pb-4 space-y-2 animate-in slide-in-from-top-2 duration-150">
            {/* Mobile Cloud Sync & Admin Controls */}
            <div className="pb-2 space-y-1.5 border-b border-stone-100">
              <button
                type="button"
                id="mobile-cloud-sync-btn"
                onClick={handleHeaderSync}
                disabled={isManualSyncing}
                className="w-full flex items-center justify-between py-2 px-3 rounded-lg text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 transition"
              >
                <div className="flex items-center gap-2">
                  {isManualSyncing || cloudSyncStatus === 'SYNCING' ? (
                    <RefreshCw className="w-4 h-4 text-amber-600 animate-spin" />
                  ) : cloudSyncStatus === 'CONNECTED' ? (
                    <Cloud className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <CloudOff className="w-4 h-4 text-stone-400" />
                  )}
                  <span>
                    {isManualSyncing
                      ? 'Menyegerakkan Data...'
                      : cloudSyncStatus === 'CONNECTED'
                      ? 'Cloud Sync Aktif (Selaras)'
                      : 'Luar Talian'}
                  </span>
                </div>
                <span className="text-[10px] text-stone-500 font-mono">
                  {lastCloudSync ? lastCloudSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Segerak Sekarang'}
                </span>
              </button>

              <button
                type="button"
                id="mobile-admin-mode-btn"
                onClick={() => {
                  setMobileMenuOpen(false);
                  if (isAdminMode) {
                    exitAdminMode();
                  } else {
                    openPinModal();
                  }
                }}
                className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-white shadow-2xs ${
                  isAdminMode ? 'bg-emerald-600' : 'bg-orange-600'
                }`}
              >
                {isAdminMode ? <ShieldCheck className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                <span>{isAdminMode ? 'Admin Mode Aktif (Klik untuk Keluar)' : 'Akses Mod Admin'}</span>
              </button>
            </div>
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

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-4 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-2">
          {/* Footer Left: Developer Credit & WhatsApp Contact Shortcut */}
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span>
              Developed by{' '}
              <a
                href="https://www.syncrozz.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-stone-700 hover:text-stone-900 hover:underline font-normal transition-colors"
              >
                Syncrozz
              </a>
            </span>
            <a
              href="https://wa.me/60145313756"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp Syncrozz"
              className="inline-flex items-center opacity-85 hover:opacity-100 transition-opacity"
            >
              <img
                src="https://raw.githubusercontent.com/syncrozz/syncrozz-assets/main/logo/MAIN/Logo%20Whatapp%20v2.png"
                alt="WhatsApp Syncrozz"
                className="w-5 h-5 object-contain inline-block align-middle"
              />
            </a>
          </div>

          {/* Footer Right: Support CTA & Copyright */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="footer-support-btn"
              onClick={() => setIsSupportModalOpen(true)}
              className="inline-flex items-center gap-1 bg-stone-100 hover:bg-stone-200/70 dark:bg-white/[0.04] border border-stone-200/80 dark:border-white/5 text-stone-500 hover:text-stone-800 dark:text-white/50 text-[11px] font-normal px-2.5 py-1 rounded-full transition-colors cursor-pointer"
            >
              <span>Support</span>
              <span className="text-rose-400/60 leading-none">❤️</span>
            </button>

            <div className="text-stone-400 text-[11px]">
              &copy; {new Date().getFullYear()} Kedai PAPA
            </div>
          </div>
        </div>
      </footer>

      {/* Support Popup Modal */}
      <SupportModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
      />
    </div>
  );
};
