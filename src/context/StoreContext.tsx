/**
 * Kedai PAPA POS - Store Context & State Management
 * Part 01: Foundation & Application Architecture
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Store,
  Product,
  InventoryMovement,
  Sale,
  CartItem,
  UserProfile,
  Supplier,
  Purchase,
  Customer,
  LoyaltyLedgerEntry,
  StaffUser,
  StoreBackupPayload,
  CommitUpsertPayload,
  UpsertImportCommitResult,
} from '../types';
import {
  INITIAL_STORE,
  INITIAL_PRODUCTS,
  INITIAL_MOVEMENTS,
  INITIAL_SALES,
  INITIAL_SUPPLIERS,
  INITIAL_PURCHASES,
  INITIAL_CUSTOMERS,
  INITIAL_LOYALTY_LEDGER,
  INITIAL_STAFF,
} from '../services/seedData';
import { InventoryService } from '../services/inventoryService';
import { SalesService, ProcessSaleOptions } from '../services/salesService';
import { SupplierService, CreateSupplierInput, UpdateSupplierInput } from '../services/supplierService';
import { PurchasingService, CreatePurchaseInput, CompletePurchaseResult } from '../services/purchasingService';
import { CustomerService, CreateCustomerInput, UpdateCustomerInput } from '../services/customerService';
import { LoyaltyService } from '../services/loyaltyService';
import { StaffService, CreateStaffInput, UpdateStaffInput } from '../services/staffService';
import { SmartInputService } from '../services/smartInputService';
import { ProductService, ProductDeleteEligibility } from '../services/productService';
import {
  StorageService,
  STORAGE_KEYS,
  CURRENT_SCHEMA_VERSION,
} from '../services/storageService';
import { AdminAuthService } from '../services/adminAuthService';
import { AdminPinModal } from '../components/common/AdminPinModal';
import { FirebaseService, CloudSyncStatus } from '../services/firebaseService';

interface StoreContextType {
  store: Store;
  currentUser: UserProfile;
  products: Product[];
  movements: InventoryMovement[];
  sales: Sale[];
  suppliers: Supplier[];
  purchases: Purchase[];
  customers: Customer[];
  loyaltyLedger: LoyaltyLedgerEntry[];
  staffUsers: StaffUser[];
  activeStaff: StaffUser | null;
  isLoading: boolean;
  // Multi-Device Cloud Sync (Firebase Firestore)
  cloudSyncStatus: CloudSyncStatus;
  lastCloudSync: Date | null;
  syncAllToCloud: () => Promise<void>;
  // Admin Mode Controls (Part A & Part J)
  isAdminMode: boolean;
  isPinModalOpen: boolean;
  openPinModal: (description?: string, onApproved?: () => void) => void;
  closePinModal: () => void;
  enterAdminMode: (pin: string) => { success: boolean; error?: string };
  exitAdminMode: () => void;
  requireAdmin: (action: () => void, description?: string) => void;
  // Core Domain Operations
  addProduct: (newProduct: Omit<Product, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>) => Product;
  importProducts: (newProducts: Omit<Product, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>[]) => number;
  commitProductsUpsertImport: (payload: CommitUpsertPayload) => UpsertImportCommitResult;
  updateProduct: (id: string, updates: Partial<Product>) => Product;
  toggleProductActive: (id: string) => void;
  deleteProduct: (
    id: string,
    confirmWithStock?: boolean
  ) => { success: boolean; message: string; action?: 'DELETED' | 'BLOCKED' };
  deactivateProduct: (id: string) => { success: boolean; message: string };
  checkProductDeleteEligibility: (id: string) => ProductDeleteEligibility;
  isSkuAvailable: (sku: string, excludeProductId?: string) => boolean;
  recordStockIn: (productId: string, quantity: number, reason: string, referenceId?: string) => void;
  recordAdjustment: (productId: string, quantityChange: number, reason: string) => void;
  recordReturn: (productId: string, quantity: number, reason: string, referenceId?: string) => void;
  processSale: (
    cartItems: CartItem[],
    optionsOrDiscount?: number | ProcessSaleOptions,
    notes?: string
  ) => Sale;
  // Supplier & Purchasing Domain Operations (Part 05)
  addSupplier: (input: CreateSupplierInput) => Supplier;
  updateSupplier: (id: string, updates: UpdateSupplierInput) => Supplier;
  toggleSupplierActive: (id: string) => void;
  deleteSupplier: (id: string) => { success: boolean; message: string };
  isSupplierCodeAvailable: (code: string, excludeId?: string) => boolean;
  createPurchase: (input: CreatePurchaseInput) => Purchase;
  completePurchase: (purchaseId: string) => CompletePurchaseResult;
  cancelPurchase: (purchaseId: string) => Purchase;
  // Customer & Loyalty Domain Operations (Part 07)
  addCustomer: (input: CreateCustomerInput) => Customer;
  updateCustomer: (id: string, updates: UpdateCustomerInput) => Customer;
  toggleCustomerActive: (id: string) => void;
  deleteCustomer: (id: string) => { success: boolean; message: string };
  isCustomerCodeAvailable: (code: string, excludeId?: string) => boolean;
  awardLoyaltyPoints: (sale: Sale, customerId: string) => LoyaltyLedgerEntry | null;
  redeemLoyaltyPoints: (customerId: string, points: number, referenceId: string, description?: string) => LoyaltyLedgerEntry;
  // Staff Operations (Part 07)
  addStaff: (input: CreateStaffInput) => StaffUser;
  updateStaff: (id: string, updates: UpdateStaffInput) => StaffUser;
  toggleStaffActive: (id: string) => void;
  setActiveStaff: (staff: StaffUser | null) => void;
  resetToDemo: () => void;
  updateStoreDetails: (details: Partial<Store>) => void;
  // Backup & Recovery Operations (Part 08)
  exportStoreData: () => StoreBackupPayload;
  downloadBackup: () => void;
  restoreStoreData: (payload: StoreBackupPayload) => { success: boolean; message: string };
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Ensure schema version is stamped on initialization
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SCHEMA_VERSION, String(CURRENT_SCHEMA_VERSION));
    } catch {
      // Ignore if localStorage unavailable
    }
  }, []);

  const [store, setStore] = useState<Store>(() => {
    return StorageService.safeParse<Store>(
      localStorage.getItem(STORAGE_KEYS.STORE),
      INITIAL_STORE,
      (val) => !!val && typeof val === 'object' && !Array.isArray(val) && !!(val as any).id
    );
  });

  // Current primary role: Admin / Store Owner (foundation ready for future roles)
  const [currentUser] = useState<UserProfile>({
    id: 'user-owner-001',
    name: 'Pak Samad (Store Owner)',
    role: 'ADMIN',
    storeId: INITIAL_STORE.id,
  });

  const [products, setProducts] = useState<Product[]>(() => {
    return StorageService.safeParse<Product[]>(
      localStorage.getItem(STORAGE_KEYS.PRODUCTS),
      INITIAL_PRODUCTS,
      (val) => Array.isArray(val)
    );
  });

  const [movements, setMovements] = useState<InventoryMovement[]>(() => {
    return StorageService.safeParse<InventoryMovement[]>(
      localStorage.getItem(STORAGE_KEYS.MOVEMENTS),
      INITIAL_MOVEMENTS,
      (val) => Array.isArray(val)
    );
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    return StorageService.safeParse<Sale[]>(
      localStorage.getItem(STORAGE_KEYS.SALES),
      INITIAL_SALES,
      (val) => Array.isArray(val)
    );
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    return StorageService.safeParse<Supplier[]>(
      localStorage.getItem(STORAGE_KEYS.SUPPLIERS),
      INITIAL_SUPPLIERS,
      (val) => Array.isArray(val)
    );
  });

  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    return StorageService.safeParse<Purchase[]>(
      localStorage.getItem(STORAGE_KEYS.PURCHASES),
      INITIAL_PURCHASES,
      (val) => Array.isArray(val)
    );
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    return StorageService.safeParse<Customer[]>(
      localStorage.getItem(STORAGE_KEYS.CUSTOMERS),
      INITIAL_CUSTOMERS,
      (val) => Array.isArray(val)
    );
  });

  const [loyaltyLedger, setLoyaltyLedger] = useState<LoyaltyLedgerEntry[]>(() => {
    return StorageService.safeParse<LoyaltyLedgerEntry[]>(
      localStorage.getItem(STORAGE_KEYS.LOYALTY),
      INITIAL_LOYALTY_LEDGER,
      (val) => Array.isArray(val)
    );
  });

  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() => {
    return StorageService.safeParse<StaffUser[]>(
      localStorage.getItem(STORAGE_KEYS.STAFF),
      INITIAL_STAFF,
      (val) => Array.isArray(val)
    );
  });

  const [activeStaff, setActiveStaff] = useState<StaffUser | null>(() => {
    return INITIAL_STAFF.find((s) => s.role === 'CASHIER') || INITIAL_STAFF[0] || null;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STORE, JSON.stringify(store));
  }, [store]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
  }, [movements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PURCHASES, JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOYALTY, JSON.stringify(loyaltyLedger));
  }, [loyaltyLedger]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staffUsers));
  }, [staffUsers]);

  // Multi-Device Cloud Sync State & Real-time Integration
  const [cloudSyncStatus, setCloudSyncStatus] = useState<CloudSyncStatus>('SYNCING');
  const [lastCloudSync, setLastCloudSync] = useState<Date | null>(null);

  const syncAllToCloud = async () => {
    setCloudSyncStatus('SYNCING');
    try {
      await FirebaseService.syncStore(store);
      for (const p of products) await FirebaseService.syncProduct(p);
      for (const m of movements) await FirebaseService.syncMovement(m);
      for (const s of sales) await FirebaseService.syncSale(s);
      for (const sup of suppliers) await FirebaseService.syncSupplier(sup);
      for (const pur of purchases) await FirebaseService.syncPurchase(pur);
      for (const c of customers) await FirebaseService.syncCustomer(c);
      for (const l of loyaltyLedger) await FirebaseService.syncLoyaltyEntry(l);
      for (const stf of staffUsers) await FirebaseService.syncStaffUser(stf);
      setCloudSyncStatus('CONNECTED');
      setLastCloudSync(new Date());
    } catch (err) {
      console.warn('Manual cloud sync notice:', err);
      setCloudSyncStatus('CONNECTED');
    }
  };

  useEffect(() => {
    let unsubStatus: (() => void) | undefined;
    let isMounted = true;

    async function initCloudSync() {
      unsubStatus = FirebaseService.onStatusChange((status, lastSynced) => {
        if (!isMounted) return;
        setCloudSyncStatus(status);
        setLastCloudSync(lastSynced);
      });

      // Validate connection to server
      await FirebaseService.testConnection();

      // Bootstrap initial seed data if cloud database is empty
      await FirebaseService.bootstrapCloudDataIfEmpty({
        store,
        products,
        movements,
        sales,
        suppliers,
        purchases,
        customers,
        loyaltyLedger,
        staffUsers,
      });

      // Real-time listener: receive updates instantly when another tablet/device updates data
      FirebaseService.subscribeToRealtimeUpdates({
        onProductsUpdated: (remoteProducts) => {
          if (!isMounted || !remoteProducts || remoteProducts.length === 0) return;
          setProducts(remoteProducts);
        },
        onMovementsUpdated: (remoteMovements) => {
          if (!isMounted || !remoteMovements) return;
          setMovements(remoteMovements);
        },
        onSalesUpdated: (remoteSales) => {
          if (!isMounted || !remoteSales) return;
          setSales(remoteSales);
        },
        onSuppliersUpdated: (remoteSuppliers) => {
          if (!isMounted || !remoteSuppliers) return;
          setSuppliers(remoteSuppliers);
        },
        onPurchasesUpdated: (remotePurchases) => {
          if (!isMounted || !remotePurchases) return;
          setPurchases(remotePurchases);
        },
        onCustomersUpdated: (remoteCustomers) => {
          if (!isMounted || !remoteCustomers) return;
          setCustomers(remoteCustomers);
        },
        onLoyaltyUpdated: (remoteLoyalty) => {
          if (!isMounted || !remoteLoyalty) return;
          setLoyaltyLedger(remoteLoyalty);
        },
        onStaffUpdated: (remoteStaff) => {
          if (!isMounted || !remoteStaff) return;
          setStaffUsers(remoteStaff);
        },
        onStoreUpdated: (remoteStore) => {
          if (!isMounted || !remoteStore) return;
          setStore(remoteStore);
        },
      });
    }

    initCloudSync();

    return () => {
      isMounted = false;
      if (unsubStatus) unsubStatus();
      FirebaseService.unsubscribeAll();
    };
  }, []);

  // Admin Mode state (SES 4.4 Locked Part A & Part J)
  const [isAdminMode, setIsAdminMode] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [adminActionDesc, setAdminActionDesc] = useState<string | undefined>(undefined);
  const [pendingAdminAction, setPendingAdminAction] = useState<(() => void) | null>(null);

  const openPinModal = (desc?: string, onApproved?: () => void) => {
    setAdminActionDesc(desc);
    if (onApproved) {
      setPendingAdminAction(() => onApproved);
    } else {
      setPendingAdminAction(null);
    }
    setIsPinModalOpen(true);
  };

  const closePinModal = () => {
    setIsPinModalOpen(false);
    setPendingAdminAction(null);
    setAdminActionDesc(undefined);
  };

  const enterAdminMode = (pin: string) => {
    const res = AdminAuthService.verifyPin(pin);
    if (res.success) {
      setIsAdminMode(true);
      setIsPinModalOpen(false);
      if (pendingAdminAction) {
        const actionToRun = pendingAdminAction;
        setPendingAdminAction(null);
        actionToRun();
      }
    }
    return res;
  };

  const exitAdminMode = () => {
    setIsAdminMode(false);
    setPendingAdminAction(null);
  };

  const requireAdmin = (action: () => void, desc?: string) => {
    if (isAdminMode) {
      action();
    } else {
      openPinModal(desc, action);
    }
  };

  /**
   * Check SKU uniqueness across all products within the store context
   */
  const isSkuAvailable = (sku: string, excludeProductId?: string): boolean => {
    if (!sku || !sku.trim()) return false;
    const normalized = sku.trim().toLowerCase();
    return !products.some(
      (p) => p.sku.trim().toLowerCase() === normalized && p.id !== excludeProductId
    );
  };

  /**
   * Add a new product into the catalog.
   * Enforces Part 02 Section 4 & 5 validations.
   * If initial currentStock is specified > 0, an initial STOCK_IN movement is automatically logged.
   */
  const addProduct = (
    newProductData: Omit<Product, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>
  ): Product => {
    const trimmedName = newProductData.name?.trim() || '';
    if (!trimmedName) {
      throw new Error('Product name cannot be empty.');
    }

    const trimmedSku = newProductData.sku?.trim() || '';
    if (!trimmedSku) {
      throw new Error('Product SKU cannot be empty.');
    }

    if (!isSkuAvailable(trimmedSku)) {
      throw new Error(`SKU "${trimmedSku}" is already in use by another product in this store.`);
    }

    const costPrice = Number(newProductData.costPrice);
    if (isNaN(costPrice) || costPrice < 0) {
      throw new Error('Cost price cannot be negative.');
    }

    const sellingPrice = Number(newProductData.sellingPrice);
    if (isNaN(sellingPrice) || sellingPrice < 0) {
      throw new Error('Selling price cannot be negative.');
    }

    const openingStock = Number(newProductData.currentStock ?? 0);
    if (isNaN(openingStock) || openingStock < 0) {
      throw new Error('Opening stock cannot be negative.');
    }

    const minimumStock = Number(newProductData.minimumStock ?? 0);
    if (isNaN(minimumStock) || minimumStock < 0) {
      throw new Error('Minimum stock cannot be negative.');
    }

    const productId = `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const createdProduct: Product = {
      ...newProductData,
      id: productId,
      storeId: store.id,
      name: trimmedName,
      sku: trimmedSku,
      costPrice,
      sellingPrice,
      currentStock: openingStock,
      minimumStock,
      active: newProductData.active ?? true,
      createdAt: now,
      updatedAt: now,
    };

    setProducts((prev) => [createdProduct, ...prev]);
    FirebaseService.syncProduct(createdProduct);

    // Data Integrity Principle: If opening stock > 0, log traceable STOCK_IN movement!
    if (createdProduct.currentStock > 0) {
      const initialMovement: InventoryMovement = {
        id: `mov-init-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        storeId: store.id,
        productId: createdProduct.id,
        productName: createdProduct.name,
        type: 'STOCK_IN',
        quantity: createdProduct.currentStock,
        previousStock: 0,
        newStock: createdProduct.currentStock,
        referenceId: `OPENING-${createdProduct.sku}`,
        reason: 'Opening stock',
        createdAt: now,
      };
      setMovements((prev) => [initialMovement, ...prev]);
      FirebaseService.syncMovement(initialMovement);
    }

    return createdProduct;
  };

  /**
   * Safe atomic upsert import for products (SES 4.4 Locked & Safe Upsert Mode).
   * - Inserts new products and registers opening STOCK_IN movements.
   * - Updates existing product catalog fields (name, category, costPrice, sellingPrice, minStock, active).
   * - CRITICAL: Never modifies currentStock or inventory movements of existing products.
   * - Atomic: Validates everything before applying; either all changes commit or none do.
   */
  const commitProductsUpsertImport = (
    payload: CommitUpsertPayload
  ): UpsertImportCommitResult => {
    const { newItems, updateItems, skippedCount = 0, invalidCount = 0 } = payload;
    const now = new Date().toISOString();

    // 1. Validation phase (Atomic guarantee)
    // Check updateItems: all existingProductId must exist
    for (const u of updateItems) {
      const found = products.find((p) => p.id === u.existingProductId);
      if (!found) {
        throw new Error(`Atomic Import Aborted: Produk sedia ada dengan ID "${u.existingProductId}" tidak dijumpai.`);
      }
    }

    // Check newItems: no SKU collision with existing products (unless part of update)
    const existingSkuMap = new Map(products.map((p) => [SmartInputService.normalizeCode(p.sku), p.id]));
    const newSkuSet = new Set<string>();

    for (const n of newItems) {
      const normalizedSku = SmartInputService.normalizeCode(n.sku);
      if (!normalizedSku) {
        throw new Error('Atomic Import Aborted: Terdapat item baru dengan SKU kosong.');
      }
      if (newSkuSet.has(normalizedSku)) {
        throw new Error(`Atomic Import Aborted: Terdapat duplikasi SKU "${normalizedSku}" dalam kumpulan item baru.`);
      }
      newSkuSet.add(normalizedSku);

      if (existingSkuMap.has(normalizedSku)) {
        throw new Error(`Atomic Import Aborted: SKU "${normalizedSku}" sudah wujud dalam katalog.`);
      }
    }

    // 2. Prepare mutations
    const updateMap = new Map<string, (typeof updateItems)[0]>();
    updateItems.forEach((u) => updateMap.set(u.existingProductId, u));

    const nextProducts: Product[] = products.map((prod) => {
      const updateData = updateMap.get(prod.id);
      if (updateData) {
        return {
          ...prod,
          name: updateData.name,
          category: updateData.category,
          costPrice: updateData.costPrice,
          sellingPrice: updateData.sellingPrice,
          minimumStock: updateData.minimumStock,
          active: updateData.active,
          updatedAt: now,
          // Note: currentStock is strictly preserved from prod.currentStock!
          // Note: id is strictly preserved from prod.id!
          // Note: sku is strictly preserved from prod.sku!
        };
      }
      return prod;
    });

    const addedProducts: Product[] = [];
    const openingMovements: InventoryMovement[] = [];

    newItems.forEach((item, idx) => {
      const id = `prod-import-${Date.now()}-${idx}`;
      const product: Product = {
        ...item,
        id,
        storeId: store.id,
        createdAt: now,
        updatedAt: now,
      };
      addedProducts.push(product);

      if (item.currentStock > 0) {
        openingMovements.push({
          id: `mov-imp-${Date.now()}-${idx}`,
          storeId: store.id,
          productId: id,
          productName: item.name,
          type: 'STOCK_IN',
          quantity: item.currentStock,
          previousStock: 0,
          newStock: item.currentStock,
          reason: 'Import CSV Pembukaan Stok',
          adjustedBySnapshot: currentUser.name,
          createdAt: now,
        });
      }
    });

    const finalProducts = [...nextProducts, ...addedProducts];
    const finalMovements = [...openingMovements, ...movements];

    // 3. Commit state & storage atomically
    setProducts(finalProducts);
    setMovements(finalMovements);
    StorageService.safeSet(STORAGE_KEYS.PRODUCTS, finalProducts);
    StorageService.safeSet(STORAGE_KEYS.MOVEMENTS, finalMovements);

    return {
      newCount: addedProducts.length,
      updatedCount: updateItems.length,
      skippedCount,
      invalidCount,
    };
  };

  /**
   * Bulk import validated products from CSV (SES 4.4 Locked Part D).
   * Automatically initializes opening inventory movements for stock > 0.
   */
  const importProducts = (
    newItems: Omit<Product, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>[]
  ): number => {
    if (!newItems || newItems.length === 0) return 0;
    const res = commitProductsUpsertImport({
      mode: 'SKIP_EXISTING',
      newItems,
      updateItems: [],
    });
    return res.newCount;
  };

  /**
   * Update product metadata (cost, price, name, etc.).
   * Note: Direct stock mutations are forbidden; must be done via movement methods!
   * Historical transaction snapshots are never modified.
   */
  const updateProduct = (id: string, updates: Partial<Product>): Product => {
    const existing = products.find((p) => p.id === id);
    if (!existing) {
      throw new Error('Product not found.');
    }

    if (updates.name !== undefined && !updates.name.trim()) {
      throw new Error('Product name cannot be empty.');
    }

    if (updates.sku !== undefined) {
      const trimmedSku = updates.sku.trim();
      if (!trimmedSku) {
        throw new Error('Product SKU cannot be empty.');
      }
      if (!isSkuAvailable(trimmedSku, id)) {
        throw new Error(`SKU "${trimmedSku}" is already in use by another product in this store.`);
      }
    }

    if (updates.costPrice !== undefined && (isNaN(Number(updates.costPrice)) || Number(updates.costPrice) < 0)) {
      throw new Error('Cost price cannot be negative.');
    }

    if (updates.sellingPrice !== undefined && (isNaN(Number(updates.sellingPrice)) || Number(updates.sellingPrice) < 0)) {
      throw new Error('Selling price cannot be negative.');
    }

    if (updates.minimumStock !== undefined && (isNaN(Number(updates.minimumStock)) || Number(updates.minimumStock) < 0)) {
      throw new Error('Minimum stock cannot be negative.');
    }

    // Guard: Disallow direct arbitrary alteration of currentStock without movement audit
    const safeUpdates = { ...updates };
    delete safeUpdates.currentStock;

    let updatedResult: Product = existing;
    setProducts((prev) =>
      prev.map((prod) => {
        if (prod.id === id) {
          updatedResult = {
            ...prod,
            ...safeUpdates,
            updatedAt: new Date().toISOString(),
          };
          return updatedResult;
        }
        return prod;
      })
    );

    FirebaseService.syncProduct(updatedResult);
    return updatedResult;
  };

  /**
   * Toggle product active/inactive status safely
   */
  const toggleProductActive = (id: string) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    updateProduct(id, { active: !target.active });
  };

  /**
   * Determine delete eligibility for a product:
   * Inspects historical sales, purchases, movements, and current stock.
   */
  const checkProductDeleteEligibility = (id: string): ProductDeleteEligibility => {
    const target = products.find((p) => p.id === id);
    if (!target) {
      return {
        canHardDelete: false,
        hasHistoricalReferences: false,
        hasStockWithoutHistory: false,
        historyDetails: { salesCount: 0, purchasesCount: 0, movementsCount: 0 },
        suggestedAction: 'DEACTIVATE',
        reason: 'Produk tidak dijumpai.',
      };
    }
    return ProductService.checkDeleteEligibility(target, sales, purchases, movements);
  };

  /**
   * Product Deletion Semantics:
   * HARD DELETE is ONLY permitted when product has zero authoritative historical references
   * (Sales, SaleItems, Purchases, PurchaseItems, InventoryMovements beyond opening, Returns, Adjustments).
   * If any historical reference exists, hard delete is strictly rejected.
   * If product has currentStock > 0 without history, explicit stock confirmation is required.
   */
  const deleteProduct = (
    id: string,
    confirmWithStock: boolean = false
  ): { success: boolean; message: string; action?: 'DELETED' | 'BLOCKED' } => {
    const target = products.find((p) => p.id === id);
    if (!target) {
      return { success: false, message: 'Produk tidak dijumpai.', action: 'BLOCKED' };
    }

    try {
      const outcome = ProductService.hardDeleteProduct(
        id,
        products,
        movements,
        sales,
        purchases,
        confirmWithStock
      );
      setProducts(outcome.updatedProducts);
      setMovements(outcome.updatedMovements);
      FirebaseService.deleteProduct(id);
      return {
        success: true,
        message: outcome.message,
        action: 'DELETED',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Tidak dapat memadam produk.',
        action: 'BLOCKED',
      };
    }
  };

  /**
   * Deactivate a product:
   * Sets active = false while preserving all historical references, audit trails, and financial records.
   */
  const deactivateProduct = (id: string): { success: boolean; message: string } => {
    const target = products.find((p) => p.id === id);
    if (!target) {
      return { success: false, message: 'Produk tidak dijumpai.' };
    }

    try {
      const outcome = ProductService.deactivateProduct(id, products);
      setProducts(outcome.updatedProducts);
      FirebaseService.syncProduct(outcome.deactivatedProduct);
      return {
        success: true,
        message: outcome.message,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Tidak dapat menyahaktifkan produk.',
      };
    }
  };

  /**
   * Traceable Return (customer return or stock recovery)
   */
  const recordReturn = (
    productId: string,
    quantity: number,
    reason: string,
    referenceId?: string
  ) => {
    if (quantity <= 0) {
      throw new Error('Return quantity must be greater than zero.');
    }
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) throw new Error('Product not found.');

    const { updatedProduct, movement } = InventoryService.applyMovement(
      targetProduct,
      {
        productId,
        type: 'RETURN',
        quantity,
        reason: reason || 'Customer return item',
        referenceId,
      },
      store.id
    );

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? updatedProduct : p))
    );
    setMovements((prev) => [movement, ...prev]);
    FirebaseService.syncProduct(updatedProduct);
    FirebaseService.syncMovement(movement);
  };

  /**
   * Traceable Stock In (supplier delivery or replenishment)
   */
  const recordStockIn = (
    productId: string,
    quantity: number,
    reason: string,
    referenceId?: string
  ) => {
    if (quantity <= 0) {
      throw new Error('Stock in quantity must be greater than zero.');
    }

    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) throw new Error('Product not found.');

    const { updatedProduct, movement } = InventoryService.applyMovement(
      targetProduct,
      {
        productId,
        type: 'STOCK_IN',
        quantity,
        reason: reason || 'Restock replenishment',
        referenceId,
      },
      store.id
    );

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? updatedProduct : p))
    );
    setMovements((prev) => [movement, ...prev]);
    FirebaseService.syncProduct(updatedProduct);
    FirebaseService.syncMovement(movement);
  };

  /**
   * Traceable Stock Adjustment (spoilage, damage, physical inventory audit discrepancy)
   */
  const recordAdjustment = (
    productId: string,
    quantityChange: number,
    reason: string
  ) => {
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) throw new Error('Product not found.');

    const { updatedProduct, movement } = InventoryService.applyMovement(
      targetProduct,
      {
        productId,
        type: 'ADJUSTMENT',
        quantity: quantityChange,
        reason,
      },
      store.id
    );

    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? updatedProduct : p))
    );
    setMovements((prev) => [movement, ...prev]);
    FirebaseService.syncProduct(updatedProduct);
    FirebaseService.syncMovement(movement);
  };

  /**
   * POS Sale Processing (Part 03: Atomic Checkout):
   * 1. Pre-validates items, active status, authoritative stock, and payment
   * 2. Snapshots costs & selling prices
   * 3. Allocates discounts deterministically
   * 4. Decreases stock & generates SALE inventory movements
   * 5. Atomically commits changes with double-submission & zero-partial-state guarantees
   */
  const processSale = (
    cartItems: CartItem[],
    optionsOrDiscount: number | ProcessSaleOptions = 0,
    notes?: string
  ): Sale => {
    const productsMap = new Map<string, Product>(products.map((p) => [p.id, p]));

    // Atomic execution: validation happens inside processSale BEFORE any state mutation.
    // If anything fails, an error is thrown and no state is changed.
    const result = SalesService.processSale(
      cartItems,
      productsMap,
      store.id,
      sales,
      optionsOrDiscount,
      notes
    );

    // Update products stock atomically
    setProducts((prev) => {
      const updatedMap = new Map<string, Product>(result.updatedProducts.map((p) => [p.id, p]));
      return prev.map((p) => updatedMap.get(p.id) || p);
    });

    // Add inventory movements
    setMovements((prev) => [...result.newMovements, ...prev]);

    // Add sale record
    setSales((prev) => [result.sale, ...prev]);

    // Cloud sync for sale, updated products, and movements
    FirebaseService.syncSale(result.sale);
    result.updatedProducts.forEach((p) => FirebaseService.syncProduct(p));
    result.newMovements.forEach((m) => FirebaseService.syncMovement(m));

    // Handle Loyalty point accumulation for customer if enabled
    const opts = typeof optionsOrDiscount === 'object' ? optionsOrDiscount : {};
    const customerId = opts.customerId || result.sale.customerId;
    const isLoyaltyEnabled = store.settings?.enableLoyalty !== false;

    if (customerId && isLoyaltyEnabled && result.sale.status === 'COMPLETED') {
      const targetCustomer = customers.find((c) => c.id === customerId);
      if (targetCustomer) {
        const ratio = store.settings?.loyaltyPointsPerCurrency || 1;
        const newEntry = LoyaltyService.awardPointsForSale(
          result.sale,
          customerId,
          loyaltyLedger,
          ratio
        );
        if (newEntry) {
          setLoyaltyLedger((prev) => [newEntry, ...prev]);
          FirebaseService.syncLoyaltyEntry(newEntry);
        }
      }
    }

    return result.sale;
  };

  // Customer Management (Part 07)
  const isCustomerCodeAvailable = (code: string, excludeId?: string): boolean => {
    return CustomerService.isCustomerCodeUnique(code, customers, excludeId);
  };

  const addCustomer = (input: CreateCustomerInput): Customer => {
    const created = CustomerService.createCustomer(input, customers);
    setCustomers((prev) => [created, ...prev]);
    FirebaseService.syncCustomer(created);
    return created;
  };

  const updateCustomer = (id: string, updates: UpdateCustomerInput): Customer => {
    const updated = CustomerService.updateCustomer(id, updates, customers);
    setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)));
    FirebaseService.syncCustomer(updated);
    return updated;
  };

  const toggleCustomerActive = (id: string) => {
    const target = customers.find((c) => c.id === id);
    if (!target) return;
    updateCustomer(id, { active: !target.active });
  };

  const deleteCustomer = (id: string): { success: boolean; message: string } => {
    const target = customers.find((c) => c.id === id);
    if (!target) {
      return { success: false, message: 'Customer not found.' };
    }
    const check = CustomerService.canDeleteCustomer(id, sales);
    if (!check.canDelete) {
      updateCustomer(id, { active: false });
      return {
        success: false,
        message: check.reason || 'Customer has purchase history and was deactivated.',
      };
    }
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    FirebaseService.deleteCustomer(id);
    return {
      success: true,
      message: `Customer "${target.customerName}" was successfully removed.`,
    };
  };

  // Loyalty & Rewards (Part 07)
  const awardLoyaltyPoints = (sale: Sale, customerId: string): LoyaltyLedgerEntry | null => {
    const ratio = store.settings?.loyaltyPointsPerCurrency || 1;
    const entry = LoyaltyService.awardPointsForSale(sale, customerId, loyaltyLedger, ratio);
    if (entry) {
      setLoyaltyLedger((prev) => [entry, ...prev]);
      FirebaseService.syncLoyaltyEntry(entry);
    }
    return entry;
  };

  const redeemLoyaltyPoints = (
    customerId: string,
    points: number,
    referenceId: string,
    description?: string
  ): LoyaltyLedgerEntry => {
    const entry = LoyaltyService.redeemPoints(
      customerId,
      points,
      referenceId,
      loyaltyLedger,
      description
    );
    setLoyaltyLedger((prev) => [entry, ...prev]);
    FirebaseService.syncLoyaltyEntry(entry);
    return entry;
  };

  // Staff Foundation (Part 07)
  const addStaff = (input: CreateStaffInput): StaffUser => {
    const created = StaffService.createStaff(input, staffUsers);
    setStaffUsers((prev) => [created, ...prev]);
    FirebaseService.syncStaffUser(created);
    return created;
  };

  const updateStaff = (id: string, updates: UpdateStaffInput): StaffUser => {
    const updated = StaffService.updateStaff(id, updates, staffUsers);
    setStaffUsers((prev) => prev.map((s) => (s.id === id ? updated : s)));
    if (activeStaff && activeStaff.id === id) {
      setActiveStaff(updated);
    }
    FirebaseService.syncStaffUser(updated);
    return updated;
  };

  const toggleStaffActive = (id: string) => {
    const target = staffUsers.find((s) => s.id === id);
    if (!target) return;
    updateStaff(id, { active: !target.active });
  };

  const isSupplierCodeAvailable = (code: string, excludeId?: string): boolean => {
    return SupplierService.isSupplierCodeUnique(code, suppliers, excludeId);
  };

  const addSupplier = (input: CreateSupplierInput): Supplier => {
    const created = SupplierService.createSupplier(input, suppliers);
    setSuppliers((prev) => [created, ...prev]);
    FirebaseService.syncSupplier(created);
    return created;
  };

  const updateSupplier = (id: string, updates: UpdateSupplierInput): Supplier => {
    const updated = SupplierService.updateSupplier(id, updates, suppliers);
    setSuppliers((prev) => prev.map((s) => (s.id === id ? updated : s)));
    FirebaseService.syncSupplier(updated);
    return updated;
  };

  const toggleSupplierActive = (id: string) => {
    const target = suppliers.find((s) => s.id === id);
    if (!target) return;
    updateSupplier(id, { active: !target.active });
  };

  const deleteSupplier = (id: string): { success: boolean; message: string } => {
    const target = suppliers.find((s) => s.id === id);
    if (!target) {
      return { success: false, message: 'Supplier not found.' };
    }

    const check = SupplierService.canDeleteSupplier(id, purchases);
    if (!check.canDelete) {
      updateSupplier(id, { active: false });
      return {
        success: false,
        message: `Supplier "${target.supplierName}" has historical purchase records. It was safely deactivated (Active: false) to preserve audit trails.`,
      };
    }

    setSuppliers((prev) => prev.filter((s) => s.id !== id));
    FirebaseService.deleteSupplier(id);
    return {
      success: true,
      message: `Supplier "${target.supplierName}" was successfully removed.`,
    };
  };

  const createPurchase = (input: CreatePurchaseInput): Purchase => {
    const suppliersMap = new Map<string, Supplier>(suppliers.map((s) => [s.id, s]));
    const productsMap = new Map<string, Product>(products.map((p) => [p.id, p]));
    const draft = PurchasingService.createDraftPurchase(input, suppliersMap, productsMap, purchases);
    setPurchases((prev) => [draft, ...prev]);
    FirebaseService.syncPurchase(draft);
    return draft;
  };

  const completePurchase = (purchaseId: string): CompletePurchaseResult => {
    const purchase = purchases.find((p) => p.id === purchaseId);
    if (!purchase) {
      throw new Error('Purchase not found.');
    }

    const suppliersMap = new Map<string, Supplier>(suppliers.map((s) => [s.id, s]));
    const productsMap = new Map<string, Product>(products.map((p) => [p.id, p]));

    const result = PurchasingService.completePurchase(
      purchase,
      suppliersMap,
      productsMap,
      store.id
    );

    // Update products atomically
    setProducts((prev) => {
      const updatedMap = new Map<string, Product>(result.updatedProducts.map((p) => [p.id, p]));
      return prev.map((p) => updatedMap.get(p.id) || p);
    });

    // Add inventory movements
    setMovements((prev) => [...result.newMovements, ...prev]);

    // Update purchase in purchases list
    setPurchases((prev) =>
      prev.map((p) => (p.id === purchaseId ? result.completedPurchase : p))
    );

    FirebaseService.syncPurchase(result.completedPurchase);
    result.updatedProducts.forEach((p) => FirebaseService.syncProduct(p));
    result.newMovements.forEach((m) => FirebaseService.syncMovement(m));

    return result;
  };

  const cancelPurchase = (purchaseId: string): Purchase => {
    const purchase = purchases.find((p) => p.id === purchaseId);
    if (!purchase) {
      throw new Error('Purchase not found.');
    }

    const cancelled = PurchasingService.cancelPurchase(purchase);
    setPurchases((prev) =>
      prev.map((p) => (p.id === purchaseId ? cancelled : p))
    );
    FirebaseService.syncPurchase(cancelled);
    return cancelled;
  };

  const updateStoreDetails = (details: Partial<Store>) => {
    const updatedStore = {
      ...store,
      ...details,
      updatedAt: new Date().toISOString(),
    };
    setStore(updatedStore);
    FirebaseService.syncStore(updatedStore);
  };

  const resetToDemo = () => {
    setStore(INITIAL_STORE);
    setProducts(INITIAL_PRODUCTS);
    setMovements(INITIAL_MOVEMENTS);
    setSales(INITIAL_SALES);
    setSuppliers(INITIAL_SUPPLIERS);
    setPurchases(INITIAL_PURCHASES);
    setCustomers(INITIAL_CUSTOMERS);
    setLoyaltyLedger(INITIAL_LOYALTY_LEDGER);
    setStaffUsers(INITIAL_STAFF);
    setActiveStaff(INITIAL_STAFF.find((s) => s.role === 'CASHIER') || INITIAL_STAFF[0] || null);
    localStorage.removeItem(STORAGE_KEYS.STORE);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.MOVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    localStorage.removeItem(STORAGE_KEYS.SUPPLIERS);
    localStorage.removeItem(STORAGE_KEYS.PURCHASES);
    localStorage.removeItem(STORAGE_KEYS.CUSTOMERS);
    localStorage.removeItem(STORAGE_KEYS.LOYALTY);
    localStorage.removeItem(STORAGE_KEYS.STAFF);
  };

  const exportStoreData = (): StoreBackupPayload => {
    return StorageService.createBackupPayload({
      store,
      products,
      movements,
      sales,
      suppliers,
      purchases,
      customers,
      loyaltyLedger,
      staffUsers,
    });
  };

  const downloadBackup = (): void => {
    const payload = exportStoreData();
    StorageService.downloadBackup(payload);
  };

  const restoreStoreData = (payload: StoreBackupPayload): { success: boolean; message: string } => {
    const validation = StorageService.validateBackupPayload(payload);
    if (!validation.isValid || !validation.data) {
      throw new Error(validation.error || 'Invalid backup structure.');
    }

    const data = validation.data;
    setStore(data.store);
    setProducts(data.products);
    setMovements(data.movements);
    setSales(data.sales);
    setSuppliers(data.suppliers);
    setPurchases(data.purchases);
    setCustomers(data.customers);
    setLoyaltyLedger(data.loyaltyLedger);
    setStaffUsers(data.staffUsers);
    setActiveStaff(data.staffUsers.find((s) => s.role === 'CASHIER') || data.staffUsers[0] || null);

    return {
      success: true,
      message: `Store data successfully restored from backup (${data.products.length} products, ${data.sales.length} sales, ${data.purchases.length} purchases).`,
    };
  };

  return (
    <StoreContext.Provider
      value={{
        store,
        currentUser,
        products,
        movements,
        sales,
        suppliers,
        purchases,
        customers,
        loyaltyLedger,
        staffUsers,
        activeStaff,
        isLoading,
        isAdminMode,
        isPinModalOpen,
        openPinModal,
        closePinModal,
        enterAdminMode,
        exitAdminMode,
        requireAdmin,
        addProduct,
        importProducts,
        commitProductsUpsertImport,
        updateProduct,
        toggleProductActive,
        deleteProduct,
        deactivateProduct,
        checkProductDeleteEligibility,
        isSkuAvailable,
        recordStockIn,
        recordAdjustment,
        recordReturn,
        processSale,
        addSupplier,
        updateSupplier,
        toggleSupplierActive,
        deleteSupplier,
        isSupplierCodeAvailable,
        createPurchase,
        completePurchase,
        cancelPurchase,
        addCustomer,
        updateCustomer,
        toggleCustomerActive,
        deleteCustomer,
        isCustomerCodeAvailable,
        awardLoyaltyPoints,
        redeemLoyaltyPoints,
        addStaff,
        updateStaff,
        toggleStaffActive,
        setActiveStaff,
        resetToDemo,
        updateStoreDetails,
        exportStoreData,
        downloadBackup,
        restoreStoreData,
        cloudSyncStatus,
        lastCloudSync,
        syncAllToCloud,
      }}
    >
      {children}
      <AdminPinModal
        isOpen={isPinModalOpen}
        onClose={closePinModal}
        onSuccess={() => {
          setIsAdminMode(true);
          if (pendingAdminAction) {
            const actionToRun = pendingAdminAction;
            setPendingAdminAction(null);
            actionToRun();
          }
        }}
        actionDescription={adminActionDesc}
      />
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
