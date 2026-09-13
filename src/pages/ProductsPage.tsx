import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  Trash2,
  Power,
  Image as ImageIcon,
  Check,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  History,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product, StockStatus } from '../types';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { InventoryService } from '../services/inventoryService';
import { PurchasingService } from '../services/purchasingService';
import { formatCurrency, formatDateTime } from '../services/formatters';

export const ProductsPage: React.FC = () => {
  const {
    store,
    products,
    purchases,
    addProduct,
    updateProduct,
    toggleProductActive,
    deleteProduct,
    isSkuAvailable,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [productStatusFilter, setProductStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<'ALL' | StockStatus>('ALL');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null);

  // Notifications / feedback
  const [notification, setNotification] = useState<{ type: 'success' | 'warning' | 'error'; message: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: 'Snacks & Biscuits',
    costPrice: 1.5,
    sellingPrice: 2.2,
    currentStock: 10,
    minimumStock: 5,
    imageUrl: '',
    active: true,
  });

  const [formError, setFormError] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Derived stock status mapping
  const getProductStockStatus = (p: Product): StockStatus => {
    return InventoryService.getStockStatus(p);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        query === '' ||
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query);

      const matchesCategory =
        selectedCategory === 'ALL' || p.category === selectedCategory;

      const matchesProductStatus =
        productStatusFilter === 'ALL'
          ? true
          : productStatusFilter === 'ACTIVE'
          ? p.active
          : !p.active;

      const pStockStatus = getProductStockStatus(p);
      const matchesStockStatus =
        stockStatusFilter === 'ALL' || pStockStatus === stockStatusFilter;

      return matchesSearch && matchesCategory && matchesProductStatus && matchesStockStatus;
    });
  }, [products, searchQuery, selectedCategory, productStatusFilter, stockStatusFilter]);

  const openAddModal = () => {
    setFormError(null);
    setFormData({
      sku: `KP-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      name: '',
      category: 'Snacks & Biscuits',
      costPrice: 1.5,
      sellingPrice: 2.2,
      currentStock: 10,
      minimumStock: 5,
      imageUrl: '',
      active: true,
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setFormError(null);
    setEditingProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      category: product.category,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      currentStock: product.currentStock,
      minimumStock: product.minimumStock,
      imageUrl: product.imageUrl || '',
      active: product.active,
    });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedName = formData.name.trim();
    const trimmedSku = formData.sku.trim();

    if (!trimmedName) {
      setFormError('Product name cannot be empty.');
      return;
    }
    if (!trimmedSku) {
      setFormError('Product SKU cannot be empty.');
      return;
    }
    if (!isSkuAvailable(trimmedSku)) {
      setFormError(`SKU "${trimmedSku}" already exists in this store. SKU must be unique.`);
      return;
    }
    if (Number(formData.costPrice) < 0) {
      setFormError('Cost price cannot be negative.');
      return;
    }
    if (Number(formData.sellingPrice) < 0) {
      setFormError('Selling price cannot be negative.');
      return;
    }
    if (Number(formData.currentStock) < 0) {
      setFormError('Opening stock cannot be negative.');
      return;
    }
    if (Number(formData.minimumStock) < 0) {
      setFormError('Minimum stock cannot be negative.');
      return;
    }

    try {
      const created = addProduct({
        sku: trimmedSku,
        name: trimmedName,
        category: formData.category.trim() || 'General',
        costPrice: Number(formData.costPrice),
        sellingPrice: Number(formData.sellingPrice),
        currentStock: Number(formData.currentStock),
        minimumStock: Number(formData.minimumStock),
        imageUrl: formData.imageUrl.trim() || undefined,
        active: formData.active,
      });

      setIsAddModalOpen(false);
      setNotification({
        type: 'success',
        message: `Product "${created.name}" (${created.sku}) added successfully with opening stock of ${created.currentStock} units.`,
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to add product.');
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setFormError(null);

    const trimmedName = formData.name.trim();
    const trimmedSku = formData.sku.trim();

    if (!trimmedName) {
      setFormError('Product name cannot be empty.');
      return;
    }
    if (!trimmedSku) {
      setFormError('Product SKU cannot be empty.');
      return;
    }
    if (!isSkuAvailable(trimmedSku, editingProduct.id)) {
      setFormError(`SKU "${trimmedSku}" is already in use by another product in this store.`);
      return;
    }
    if (Number(formData.costPrice) < 0) {
      setFormError('Cost price cannot be negative.');
      return;
    }
    if (Number(formData.sellingPrice) < 0) {
      setFormError('Selling price cannot be negative.');
      return;
    }
    if (Number(formData.minimumStock) < 0) {
      setFormError('Minimum stock cannot be negative.');
      return;
    }

    try {
      updateProduct(editingProduct.id, {
        sku: trimmedSku,
        name: trimmedName,
        category: formData.category.trim() || 'General',
        costPrice: Number(formData.costPrice),
        sellingPrice: Number(formData.sellingPrice),
        minimumStock: Number(formData.minimumStock),
        imageUrl: formData.imageUrl.trim() || undefined,
        active: formData.active,
      });

      setEditingProduct(null);
      setNotification({
        type: 'success',
        message: `Product "${trimmedName}" updated. Historical transactions remain immutable.`,
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update product.');
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingProduct) return;
    const result = deleteProduct(deletingProduct.id);
    setDeletingProduct(null);
    setNotification({
      type: result.success ? 'success' : 'warning',
      message: result.message,
    });
    setTimeout(() => setNotification(null), 6000);
  };

  // Profit calculation for add/edit preview
  const previewCost = Number(formData.costPrice) || 0;
  const previewSelling = Number(formData.sellingPrice) || 0;
  const previewProfit = previewSelling - previewCost;
  const previewMargin = previewSelling > 0 ? ((previewProfit / previewSelling) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight">
            Product Management
          </h1>
          <p className="text-sm text-stone-500">
            Define items, prices, cost structure, and active statuses for {store.name}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="add-product-btn"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition shadow-2xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Product</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          id="product-notification-banner"
          className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : notification.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : notification.type === 'warning' ? (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">{notification.message}</div>
          <button
            onClick={() => setNotification(null)}
            className="text-stone-400 hover:text-stone-700"
          >
            &times;
          </button>
        </div>
      )}

      {/* Architectural Concept Banner: Product Status vs Stock Status */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 flex items-start gap-3 text-xs text-stone-600">
        <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div>
            <strong className="text-stone-800">Section 8 & 9 — Architecture Decoupling:</strong>{' '}
            <span className="font-semibold text-emerald-800">Product Status</span> (Active / Inactive) determines whether an item is eligible for POS checkout.{' '}
            <span className="font-semibold text-stone-800">Stock Status</span> (Normal / Low Stock / Out of Stock) dynamically reflects on-hand inventory levels.
          </div>
          <div className="text-[11px] text-stone-500">
            Historical transaction snapshots remain immutable when current product prices are updated. Non-destructive deactivation protects audit trails.
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search by Product Name or SKU */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              id="product-search-input"
              type="text"
              placeholder="Search by product name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-stone-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200">
              <Filter className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-stone-500 font-medium">Category:</span>
              <select
                id="product-category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent font-semibold text-stone-800 focus:outline-hidden"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Product Status Filter: ALL, ACTIVE, INACTIVE */}
            <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200">
              <span className="text-stone-500 font-medium">Product Status:</span>
              <select
                id="product-status-filter"
                value={productStatusFilter}
                onChange={(e) => setProductStatusFilter(e.target.value as any)}
                className="bg-transparent font-semibold text-stone-800 focus:outline-hidden"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Inactive Only</option>
              </select>
            </div>

            {/* Stock Status Filter: ALL, NORMAL, LOW_STOCK, OUT_OF_STOCK */}
            <div className="flex items-center gap-1.5 bg-stone-50 px-2.5 py-1.5 rounded-lg border border-stone-200">
              <span className="text-stone-500 font-medium">Stock Status:</span>
              <select
                id="stock-status-filter"
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value as any)}
                className="bg-transparent font-semibold text-stone-800 focus:outline-hidden"
              >
                <option value="ALL">All Stock Levels</option>
                <option value="NORMAL">Normal Stock (≥ Min)</option>
                <option value="LOW_STOCK">Low Stock (&lt; Min)</option>
                <option value="OUT_OF_STOCK">Out of Stock (≤ 0)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filters Pill Bar if filtered */}
        {(searchQuery || selectedCategory !== 'ALL' || productStatusFilter !== 'ALL' || stockStatusFilter !== 'ALL') && (
          <div className="flex items-center gap-2 pt-2 border-t border-stone-100 text-xs text-stone-500">
            <span>Showing {filteredProducts.length} of {products.length} products</span>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setProductStatusFilter('ALL');
                setStockStatusFilter('ALL');
              }}
              className="text-emerald-700 hover:underline font-medium"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={Package}
              title="No products match your filters"
              description="Try adjusting your search query, status filters, or create a new product item."
              actionLabel="Add New Product"
              onAction={openAddModal}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500 font-semibold border-b border-stone-200">
                <tr>
                  <th className="px-5 py-3.5">Product & SKU</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5 text-right">Cost Price</th>
                  <th className="px-4 py-3.5 text-right">Selling Price</th>
                  <th className="px-4 py-3.5 text-right">Unit Margin</th>
                  <th className="px-4 py-3.5 text-center">Stock / Min</th>
                  <th className="px-4 py-3.5 text-center">Stock Status</th>
                  <th className="px-4 py-3.5 text-center">Product Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredProducts.map((p) => {
                  const unitProfit = p.sellingPrice - p.costPrice;
                  const unitMarginPct =
                    p.sellingPrice > 0
                      ? ((unitProfit / p.sellingPrice) * 100).toFixed(1)
                      : '0.0';
                  const stockStatus = getProductStockStatus(p);

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-stone-50/70 transition-colors ${
                        !p.active ? 'bg-stone-50/40 text-stone-500' : ''
                      }`}
                    >
                      {/* Product & SKU */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-stone-100 text-stone-400 flex items-center justify-center shrink-0 border border-stone-200">
                              <Package className="w-5 h-5 text-stone-400" />
                            </div>
                          )}
                          <div>
                            <div className={`font-semibold ${p.active ? 'text-stone-900' : 'text-stone-500'}`}>
                              {p.name}
                            </div>
                            <div className="text-xs font-mono text-stone-400 mt-0.5 flex items-center gap-2">
                              <span>{p.sku}</span>
                              {p.sku === 'TEST-001' && (
                                <span className="text-[10px] px-1 rounded bg-stone-200 text-stone-700 font-sans">
                                  Audit Control
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-4 text-xs text-stone-600">
                        <span className="px-2 py-0.5 rounded bg-stone-100 text-stone-700">
                          {p.category}
                        </span>
                      </td>

                      {/* Cost Price */}
                      <td className="px-4 py-4 text-right font-mono text-stone-600 text-xs">
                        {store.currency} {p.costPrice.toFixed(2)}
                      </td>

                      {/* Selling Price */}
                      <td className="px-4 py-4 text-right font-mono font-semibold text-stone-900">
                        {store.currency} {p.sellingPrice.toFixed(2)}
                      </td>

                      {/* Unit Profit */}
                      <td className="px-4 py-4 text-right">
                        {unitProfit > 0 ? (
                          <>
                            <div className="text-xs font-mono font-bold text-emerald-700">
                              +{store.currency} {unitProfit.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-stone-400">
                              {unitMarginPct}% margin
                            </div>
                          </>
                        ) : unitProfit === 0 ? (
                          <>
                            <div className="text-xs font-mono font-medium text-stone-500">
                              {store.currency} 0.00
                            </div>
                            <div className="text-[10px] text-stone-400">
                              Break-even
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="text-xs font-mono font-bold text-rose-700">
                              -{store.currency} {Math.abs(unitProfit).toFixed(2)}
                            </div>
                            <div className="text-[10px] text-rose-500">
                              Loss ({unitMarginPct}%)
                            </div>
                          </>
                        )}
                      </td>

                      {/* Stock / Min */}
                      <td className="px-4 py-4 text-center">
                        <div className="font-mono text-xs font-semibold text-stone-800">
                          <span className="text-sm font-bold text-stone-900">{p.currentStock}</span>
                          <span className="text-stone-400 ml-1">/ {p.minimumStock} min</span>
                        </div>
                      </td>

                      {/* Stock Status (NORMAL, LOW_STOCK, OUT_OF_STOCK) */}
                      <td className="px-4 py-4 text-center">
                        {stockStatus === 'NORMAL' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>NORMAL</span>
                          </span>
                        )}
                        {stockStatus === 'LOW_STOCK' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>LOW STOCK</span>
                          </span>
                        )}
                        {stockStatus === 'OUT_OF_STOCK' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-800 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>OUT OF STOCK</span>
                          </span>
                        )}
                      </td>

                      {/* Product Status (ACTIVE, INACTIVE) */}
                      <td className="px-4 py-4 text-center">
                        {p.active ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-stone-200 text-stone-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            title={p.active ? 'Deactivate product (hides from POS)' : 'Activate product for POS'}
                            onClick={() => toggleProductActive(p.id)}
                            className={`p-1.5 rounded-md transition ${
                              p.active
                                ? 'text-stone-400 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-stone-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedProductForHistory(p)}
                            title="View purchase and cost history"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 rounded-md transition"
                          >
                            <History className="w-3 h-3" />
                            <span>History</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            title="Edit product details"
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-stone-700 hover:text-stone-950 bg-stone-100 hover:bg-stone-200 rounded-md transition"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeletingProduct(p)}
                            title="Safe remove or deactivate"
                            className="p-1.5 rounded-md text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD PRODUCT MODAL */}
      <Modal
        id="add-product-modal"
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Retail Product"
        subtitle={`Assigns new unique SKU to store ${store.name}`}
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-sm">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                SKU / Barcode <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. KP-BISKUT-01"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
              <span className="text-[11px] text-stone-400 mt-0.5 block">
                Must be unique within {store.name}
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Snacks & Biscuits"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Cream-O Biscuits Pink & Ungu"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Cost Price ({store.currency}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.costPrice}
                onChange={(e) =>
                  setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Selling Price ({store.currency}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.sellingPrice}
                onChange={(e) =>
                  setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Dynamic Profit / Loss Calculation preview (Section 4) */}
          <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
            <span className="text-stone-600">Projected Unit Margin:</span>
            <div className="font-mono text-right">
              {previewProfit > 0 ? (
                <span className="font-bold text-emerald-700">
                  +{store.currency} {previewProfit.toFixed(2)} ({previewMargin}%)
                </span>
              ) : previewProfit === 0 ? (
                <span className="font-medium text-stone-600">
                  {store.currency} 0.00 (Break-even)
                </span>
              ) : (
                <span className="font-bold text-rose-600">
                  -{store.currency} {Math.abs(previewProfit).toFixed(2)} (Loss {previewMargin}%)
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Opening Stock Units <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.currentStock}
                onChange={(e) =>
                  setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
              <span className="text-[11px] text-stone-500 mt-0.5 block">
                Automatically logs initial traceable STOCK_IN movement.
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Minimum Stock Alert Level <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.minimumStock}
                onChange={(e) =>
                  setFormData({ ...formData, minimumStock: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
              <span className="text-[11px] text-stone-500 mt-0.5 block">
                Triggers Low Stock warning when stock &lt; minimum.
              </span>
            </div>
          </div>

          {/* Optional Image URL (Section 20) */}
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Image URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://images.unsplash.com/..."
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
            <span className="text-[11px] text-stone-400 mt-0.5 block">
              Leave blank if no image available. Products and POS remain 100% functional without an image.
            </span>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="new-product-active-checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500 cursor-pointer"
            />
            <label
              htmlFor="new-product-active-checkbox"
              className="text-xs font-medium text-stone-800 cursor-pointer"
            >
              Active for Sale (Inactive items are blocked from POS selection)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-stone-700 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition cursor-pointer"
            >
              Register Product
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT PRODUCT MODAL */}
      <Modal
        id="edit-product-modal"
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        title="Edit Product Details"
        subtitle={`Updating SKU: ${editingProduct?.sku}`}
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-sm">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                SKU Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
              <span className="text-[11px] text-stone-400 mt-0.5 block">
                Validated for uniqueness across active and inactive products
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Cost Price ({store.currency}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.costPrice}
                onChange={(e) =>
                  setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
              <span className="text-[11px] text-stone-400 mt-0.5 block">
                Modifying cost will not alter past sales snapshots
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Selling Price ({store.currency}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.sellingPrice}
                onChange={(e) =>
                  setFormData({ ...formData, sellingPrice: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Minimum Stock Alert Level <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              required
              value={formData.minimumStock}
              onChange={(e) =>
                setFormData({ ...formData, minimumStock: parseInt(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Image URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://..."
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
          </div>

          {/* Current Stock Notice (Section 6 & 10) */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-600 space-y-1">
            <div className="font-semibold text-stone-900">
              Current Stock: {editingProduct?.currentStock} units
            </div>
            <p className="text-[11px] text-stone-500">
              To preserve mathematical traceability, current stock cannot be arbitrarily overwritten here. Use the <strong>Inventory</strong> tab to record a Stock In or Stock Adjustment with an explicit reason.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="edit-product-active-checkbox"
              checked={formData.active}
              onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500 cursor-pointer"
            />
            <label
              htmlFor="edit-product-active-checkbox"
              className="text-xs font-medium text-stone-800 cursor-pointer"
            >
              Active for Sale (Uncheck to block this item from POS checkout)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setEditingProduct(null)}
              className="px-4 py-2 text-xs font-medium text-stone-700 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* CONFIRM DELETE / DEACTIVATE MODAL (Section 19) */}
      <Modal
        id="delete-product-modal"
        isOpen={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        title="Remove / Deactivate Product"
        subtitle={`Safety check for: ${deletingProduct?.name}`}
      >
        <div className="space-y-4 text-sm text-stone-600">
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong>Non-Destructive Audit Rule:</strong>
              <p>
                Products with historical sales or inventory movements cannot be hard-deleted, as doing so would invalidate past gross profit reports and mathematical traceability equations.
              </p>
              <p className="font-semibold">
                Such products will be automatically converted to <code>INACTIVE</code> status instead.
              </p>
            </div>
          </div>

          <p className="text-xs">
            Are you sure you want to remove <strong>{deletingProduct?.name}</strong> (SKU: <code>{deletingProduct?.sku}</code>)?
          </p>

          <div className="flex justify-end gap-2 pt-4 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setDeletingProduct(null)}
              className="px-4 py-2 text-xs font-medium text-stone-700 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 rounded-lg hover:bg-rose-700 transition cursor-pointer"
            >
              Confirm Removal
            </button>
          </div>
        </div>
      </Modal>

      {/* Product Purchase & Cost History Modal */}
      {selectedProductForHistory && (
        <Modal
          isOpen={!!selectedProductForHistory}
          onClose={() => setSelectedProductForHistory(null)}
          title={`Purchase & Cost History: ${selectedProductForHistory.name}`}
        >
          <div className="space-y-4 text-xs">
            <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 flex items-center justify-between">
              <div>
                <span className="text-stone-400 font-medium block uppercase text-[10px]">Product & SKU</span>
                <span className="font-bold text-stone-900 text-sm">{selectedProductForHistory.name}</span>
                <span className="text-stone-500 font-mono ml-2">({selectedProductForHistory.sku})</span>
              </div>
              <div className="text-right">
                <span className="text-stone-400 font-medium block uppercase text-[10px]">Current Cost Price</span>
                <span className="font-mono font-bold text-stone-900 text-sm">
                  {formatCurrency(selectedProductForHistory.costPrice, store.currency)}
                </span>
              </div>
            </div>

            {(() => {
              const history = PurchasingService.getProductPurchaseHistory(
                selectedProductForHistory.id,
                purchases
              );

              if (history.length === 0) {
                return (
                  <div className="py-8 text-center bg-stone-50 rounded-lg border border-stone-200 text-stone-500">
                    No completed purchases recorded for this product yet.
                  </div>
                );
              }

              return (
                <div className="rounded-lg border border-stone-200 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 uppercase font-semibold text-[10px]">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Supplier</th>
                        <th className="py-2 px-3">PO #</th>
                        <th className="py-2 px-3 text-center">Qty</th>
                        <th className="py-2 px-3 text-right">Unit Cost</th>
                        <th className="py-2 px-3 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {history.map((record, idx) => (
                        <tr key={idx} className="hover:bg-stone-50/70">
                          <td className="py-2 px-3 text-stone-600">
                            {formatDateTime(record.purchaseDate)}
                          </td>
                          <td className="py-2 px-3 font-medium text-stone-800">
                            {record.supplierNameSnapshot}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-stone-800">
                            {record.purchaseNumber}
                          </td>
                          <td className="py-2 px-3 text-center font-bold text-stone-800">
                            {record.quantity}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-800">
                            {formatCurrency(record.unitCost, store.currency)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-stone-900">
                            {formatCurrency(record.lineTotal, store.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}

            <p className="text-[11px] text-stone-500 italic">
              "How much have I been paying for this product?" — shows completed procurement records and received unit costs over time.
            </p>

            <div className="flex justify-end pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setSelectedProductForHistory(null)}
                className="px-4 py-2 text-xs font-medium text-stone-700 rounded-lg border border-stone-200 hover:bg-stone-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
