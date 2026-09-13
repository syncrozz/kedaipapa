import React, { useState } from 'react';
import {
  Settings,
  Store,
  UserCheck,
  Shield,
  Layers,
  RotateCcw,
  CheckCircle2,
  Info,
  Users,
  Award,
  Plus,
  Edit2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { UserRole, StaffRole, StaffUser } from '../types';
import { VerificationAuditSuite } from '../components/verification/VerificationAuditSuite';
import { StaffService } from '../services/staffService';

export const SettingsPage: React.FC = () => {
  const {
    store,
    currentUser,
    updateStoreDetails,
    resetToDemo,
    staffUsers,
    addStaff,
    updateStaff,
    toggleStaffActive,
  } = useStore();

  // Store Profile State
  const [storeName, setStoreName] = useState(store.name);
  const [storeCode, setStoreCode] = useState(store.code);
  const [currency, setCurrency] = useState(store.currency);
  const [address, setAddress] = useState(store.address || '');
  const [phone, setPhone] = useState(store.phone || '');
  const [tagline, setTagline] = useState(store.tagline || '');
  const [receiptFooter, setReceiptFooter] = useState(store.receiptFooter || '');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Module Settings State
  const [enableCustomers, setEnableCustomers] = useState(store.settings?.enableCustomers !== false);
  const [enableLoyalty, setEnableLoyalty] = useState(store.settings?.enableLoyalty !== false);
  const [loyaltyPointsPerCurrency, setLoyaltyPointsPerCurrency] = useState(store.settings?.loyaltyPointsPerCurrency || 1);
  const [enableStaff, setEnableStaff] = useState(store.settings?.enableStaff !== false);
  const [moduleSettingsSuccess, setModuleSettingsSuccess] = useState(false);

  // Staff Modal State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [staffFormCode, setStaffFormCode] = useState('');
  const [staffFormName, setStaffFormName] = useState('');
  const [staffFormRole, setStaffFormRole] = useState<StaffRole>('CASHIER');
  const [staffFormActive, setStaffFormActive] = useState(true);
  const [staffFormError, setStaffFormError] = useState<string | null>(null);

  const handleSaveStore = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreDetails({
      name: storeName.trim(),
      code: storeCode.trim(),
      currency: currency.trim(),
      address: address.trim(),
      phone: phone.trim(),
      tagline: tagline.trim(),
      receiptFooter: receiptFooter.trim(),
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSaveModules = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreDetails({
      settings: {
        ...store.settings,
        enableCustomers,
        enableLoyalty,
        loyaltyPointsPerCurrency: Math.max(1, loyaltyPointsPerCurrency),
        enableStaff,
      },
    });
    setModuleSettingsSuccess(true);
    setTimeout(() => setModuleSettingsSuccess(false), 3000);
  };

  const handleOpenAddStaff = () => {
    setStaffFormCode(StaffService.generateNextStaffCode(staffUsers));
    setStaffFormName('');
    setStaffFormRole('CASHIER');
    setStaffFormActive(true);
    setStaffFormError(null);
    setEditingStaff(null);
    setIsStaffModalOpen(true);
  };

  const handleOpenEditStaff = (staff: StaffUser) => {
    setEditingStaff(staff);
    setStaffFormCode(staff.staffCode);
    setStaffFormName(staff.name);
    setStaffFormRole(staff.role);
    setStaffFormActive(staff.active);
    setStaffFormError(null);
    setIsStaffModalOpen(true);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    setStaffFormError(null);

    try {
      if (editingStaff) {
        updateStaff(editingStaff.id, {
          name: staffFormName.trim(),
          role: staffFormRole,
          active: staffFormActive,
        });
      } else {
        addStaff({
          staffCode: staffFormCode.trim(),
          name: staffFormName.trim(),
          role: staffFormRole,
          active: staffFormActive,
        });
      }
      setIsStaffModalOpen(false);
      setEditingStaff(null);
    } catch (err: any) {
      setStaffFormError(err.message || 'Validation error.');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
          Store & System Settings
        </h1>
        <p className="text-sm text-stone-500">
          Configure store profile parameters, optional retail modules, staff directory, and system verification.
        </p>
      </div>

      {/* Store Profile Card */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold text-stone-900">
              Retail Store Profile
            </h2>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
            Active Store
          </span>
        </div>

        <form onSubmit={handleSaveStore} className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Store Name
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Store Code (Identifier)
              </label>
              <input
                type="text"
                required
                value={storeCode}
                onChange={(e) => setStoreCode(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Operating Currency Symbol
              </label>
              <input
                type="text"
                required
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
              <span className="text-[11px] text-stone-400 mt-0.5 block">
                Default: RM (Malaysian Ringgit)
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Store Contact Phone
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Tagline / Subtitle
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Kedai Mesra Komuniti"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Receipt Footer Message
              </label>
              <input
                type="text"
                value={receiptFooter}
                onChange={(e) => setReceiptFooter(e.target.value)}
                placeholder="e.g. Terima kasih, sila datang lagi!"
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Store Physical Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {saveSuccess ? (
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Store profile updated successfully</span>
              </span>
            ) : <span />}

            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 transition shadow-xs"
            >
              Save Store Profile
            </button>
          </div>
        </form>
      </div>

      {/* Optional Retail Modules Settings (Part 07) */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <Layers className="w-5 h-5 text-emerald-700" />
          <h2 className="text-base font-bold text-stone-900">
            Optional Retail Modules (Part 07)
          </h2>
        </div>
        <p className="text-xs text-stone-500 mb-5">
          Enable or disable optional retail extensions. The core inventory and POS checkout logic remains 100% stable regardless of which optional modules are toggled.
        </p>

        <form onSubmit={handleSaveModules} className="space-y-4">
          <div className="space-y-3">
            {/* Customer Management */}
            <div className="p-4 rounded-xl border border-stone-200 flex items-start justify-between gap-4 bg-stone-50/60">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800 mt-0.5">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-stone-900">Customer Management</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    Enables customer directory, member profile lookup at POS register, and lifetime purchase history.
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={enableCustomers}
                  onChange={(e) => setEnableCustomers(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-700"></div>
              </label>
            </div>

            {/* Loyalty & Rewards */}
            <div className="p-4 rounded-xl border border-stone-200 flex items-start justify-between gap-4 bg-stone-50/60">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-800 mt-0.5">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-stone-900">Loyalty Points & Rewards</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    Accumulate points on completed checkout and track balances using immutable ledger audit trails.
                  </div>
                  {enableLoyalty && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="text-stone-600 font-medium">Award Ratio:</span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={loyaltyPointsPerCurrency}
                        onChange={(e) => setLoyaltyPointsPerCurrency(Number(e.target.value))}
                        className="w-16 px-2 py-0.5 border border-stone-300 rounded font-mono text-center text-xs"
                      />
                      <span className="text-stone-500 text-[11px]">pt(s) per {store.currency} 1.00 spent</span>
                    </div>
                  )}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={enableLoyalty}
                  onChange={(e) => setEnableLoyalty(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-700"></div>
              </label>
            </div>

            {/* Staff Attribution */}
            <div className="p-4 rounded-xl border border-stone-200 flex items-start justify-between gap-4 bg-stone-50/60">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-blue-100 text-blue-800 mt-0.5">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-semibold text-xs text-stone-900">Staff & Cashier Attribution</div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    Allow selecting active cashier at checkout and snapshots cashier name directly on receipts.
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={enableStaff}
                  onChange={(e) => setEnableStaff(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-700"></div>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {moduleSettingsSuccess ? (
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Module settings updated successfully</span>
              </span>
            ) : <span />}

            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 transition shadow-xs"
            >
              Update Module Settings
            </button>
          </div>
        </form>
      </div>

      {/* Staff Directory & Management Card (Part 07) */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold text-stone-900">
              Staff Directory ({staffUsers.length})
            </h2>
          </div>
          <button
            type="button"
            onClick={handleOpenAddStaff}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-800 text-white hover:bg-emerald-900 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Staff User</span>
          </button>
        </div>
        <p className="text-xs text-stone-500 mb-4">
          Manage cashier and staff credentials for register attribution and inventory movements.
        </p>

        <div className="divide-y divide-stone-200 border border-stone-200 rounded-lg overflow-hidden text-xs">
          {staffUsers.map((staff) => (
            <div key={staff.id} className="p-3 flex items-center justify-between bg-white hover:bg-stone-50/70 transition">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center font-bold text-stone-700 text-xs">
                  {staff.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-stone-900">{staff.name}</span>
                    <span className="font-mono text-[10px] text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded">
                      {staff.staffCode}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-stone-100 text-stone-700">
                      {staff.role}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleStaffActive(staff.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                    staff.active
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-stone-100 text-stone-500 border border-stone-200'
                  }`}
                >
                  {staff.active ? 'Active' : 'Inactive'}
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEditStaff(staff)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-100"
                  title="Edit staff details"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Staff Modal */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-800" />
                <h3 className="font-bold text-stone-900 text-sm">
                  {editingStaff ? 'Edit Staff Profile' : 'Add Staff User'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-4 space-y-3.5 text-xs">
              {staffFormError && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{staffFormError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Staff Code
                </label>
                <input
                  type="text"
                  value={staffFormCode}
                  onChange={(e) => setStaffFormCode(e.target.value.toUpperCase())}
                  disabled={!!editingStaff}
                  className="w-full px-3 py-1.5 font-mono rounded-lg border border-stone-300 focus:outline-none disabled:bg-stone-100"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={staffFormName}
                  onChange={(e) => setStaffFormName(e.target.value)}
                  placeholder="e.g. Siti Sarah"
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 focus:outline-none"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  System Role
                </label>
                <select
                  value={staffFormRole}
                  onChange={(e) => setStaffFormRole(e.target.value as StaffRole)}
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 focus:outline-none"
                >
                  <option value="CASHIER">CASHIER (Point of sale register)</option>
                  <option value="INVENTORY_STAFF">INVENTORY_STAFF (Stock In & Movements)</option>
                  <option value="MANAGER">MANAGER (Operations & Approvals)</option>
                  <option value="OWNER">OWNER (Full administrative access)</option>
                </select>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={staffFormActive}
                    onChange={(e) => setStaffFormActive(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-700"
                  />
                  <span className="text-stone-700 font-medium">Active staff user</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg border border-stone-300 text-stone-700 font-semibold hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-800 text-white font-semibold hover:bg-emerald-900 shadow-xs"
                >
                  {editingStaff ? 'Save Changes' : 'Create Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Regression & Verification Testing Suite */}
      <VerificationAuditSuite />

      {/* Data Integrity & Demo Reset Box */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-sm text-stone-900">
            Demo Data & State Reset
          </h3>
          <p className="text-xs text-stone-500 max-w-md mt-0.5">
            Reset all product records, inventory movements, sales, customers, and loyalty back to the initial Kedai PAPA pilot baseline.
          </p>
        </div>

        <button
          type="button"
          onClick={resetToDemo}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-stone-100 text-stone-800 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-stone-200 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Pilot Seed Data</span>
        </button>
      </div>
    </div>
  );
};

