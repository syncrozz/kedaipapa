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
  // Core Domain Operations
  addProduct: (newProduct: Omit<Product, 'id' | 'storeId' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => Product;
  toggleProductActive: (id: string) => void;
  deleteProduct: (id: string) => { success: boolean; message: string };
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
}

const STORAGE_KEYS = {
  STORE: 'kedai_papa_store_v1',
  PRODUCTS: 'kedai_papa_products_v1',
  MOVEMENTS: 'kedai_papa_movements_v1',
  SALES: 'kedai_papa_sales_v1',
  SUPPLIERS: 'kedai_papa_suppliers_v1',
  PURCHASES: 'kedai_papa_purchases_v1',
  CUSTOMERS: 'kedai_papa_customers_v1',
  LOYALTY: 'kedai_papa_loyalty_v1',
  STAFF: 'kedai_papa_staff_v1',
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [store, setStore] = useState<Store>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STORE);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_STORE;
  });

  // Current primary role: Admin / Store Owner (foundation ready for future roles)
  const [currentUser] = useState<UserProfile>({
    id: 'user-owner-001',
    name: 'Pak Samad (Store Owner)',
    role: 'ADMIN',
    storeId: INITIAL_STORE.id,
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (saved) {
      try {
        const parsed: Product[] = JSON.parse(saved);
        const testProd = INITIAL_PRODUCTS.find((p) => p.sku === 'TEST-001');
        if (testProd && !parsed.some((p) => p.sku === 'TEST-001')) {
          return [testProd, ...parsed];
        }
        return parsed;
      } catch { /* ignore */ }
    }
    return INITIAL_PRODUCTS;
  });

  const [movements, setMovements] = useState<InventoryMovement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
    if (saved) {
      try {
        const parsed: InventoryMovement[] = JSON.parse(saved);
        const testMov = INITIAL_MOVEMENTS.find((m) => m.id === 'mov-init-test-001');
        if (testMov && !parsed.some((m) => m.productId === 'prod-test-001')) {
          return [testMov, ...parsed];
        }
        return parsed;
      } catch { /* ignore */ }
    }
    return INITIAL_MOVEMENTS;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_SALES;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_SUPPLIERS;
  });

  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PURCHASES);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_PURCHASES;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_CUSTOMERS;
  });

  const [loyaltyLedger, setLoyaltyLedger] = useState<LoyaltyLedgerEntry[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOYALTY);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_LOYALTY_LEDGER;
  });

  const [staffUsers, setStaffUsers] = useState<StaffUser[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STAFF);
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_STAFF;
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
    }

    return createdProduct;
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
   * Safe Product Removal:
   * Rejects destructive hard-deletion if product has historical sales or movements,
   * switching to soft deactivation (active = false) to maintain audit integrity.
   */
  const deleteProduct = (id: string): { success: boolean; message: string } => {
    const target = products.find((p) => p.id === id);
    if (!target) {
      return { success: false, message: 'Product not found.' };
    }

    const hasSales = sales.some((s) => s.items.some((i) => i.productId === id));
    const nonOpeningMovements = movements.filter(
      (m) => m.productId === id && m.reason.toLowerCase() !== 'opening stock'
    );

    if (hasSales || nonOpeningMovements.length > 0) {
      updateProduct(id, { active: false });
      return {
        success: false,
        message: `Product "${target.name}" has historical transactions or inventory movements. It was safely deactivated (Active: false) to preserve audit trails.`,
      };
    }

    setProducts((prev) => prev.filter((p) => p.id !== id));
    setMovements((prev) => prev.filter((m) => m.productId !== id));
    return {
      success: true,
      message: `Product "${target.name}" was successfully removed.`,
    };
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
    return created;
  };

  const updateCustomer = (id: string, updates: UpdateCustomerInput): Customer => {
    const updated = CustomerService.updateCustomer(id, updates, customers);
    setCustomers((prev) => prev.map((c) => (c.id === id ? updated : c)));
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
    return entry;
  };

  // Staff Foundation (Part 07)
  const addStaff = (input: CreateStaffInput): StaffUser => {
    const created = StaffService.createStaff(input, staffUsers);
    setStaffUsers((prev) => [created, ...prev]);
    return created;
  };

  const updateStaff = (id: string, updates: UpdateStaffInput): StaffUser => {
    const updated = StaffService.updateStaff(id, updates, staffUsers);
    setStaffUsers((prev) => prev.map((s) => (s.id === id ? updated : s)));
    if (activeStaff && activeStaff.id === id) {
      setActiveStaff(updated);
    }
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
    return created;
  };

  const updateSupplier = (id: string, updates: UpdateSupplierInput): Supplier => {
    const updated = SupplierService.updateSupplier(id, updates, suppliers);
    setSuppliers((prev) => prev.map((s) => (s.id === id ? updated : s)));
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
    return cancelled;
  };

  const updateStoreDetails = (details: Partial<Store>) => {
    setStore((prev) => ({
      ...prev,
      ...details,
      updatedAt: new Date().toISOString(),
    }));
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
        addProduct,
        updateProduct,
        toggleProductActive,
        deleteProduct,
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
      }}
    >
      {children}
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
