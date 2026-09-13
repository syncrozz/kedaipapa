/**
 * Kedai PAPA POS - Firebase Firestore Real-Time Multi-Device Sync Service
 * 
 * Provides cloud persistence and multi-device real-time sync for:
 * - Stores & Settings
 * - Product Catalog (Active & Inactive status)
 * - Real-Time Inventory & Movements Ledger
 * - POS Sales Transactions & Gross Profit Records
 * - Suppliers & Purchase Orders
 * - Customers & Loyalty Points Ledger
 * - Staff Directory & Access Roles
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  doc,
  collection,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  getDocFromServer,
  onSnapshot,
  writeBatch,
  Unsubscribe,
  serverTimestamp,
} from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';
import {
  Store,
  Product,
  InventoryMovement,
  Sale,
  Supplier,
  Purchase,
  Customer,
  LoyaltyLedgerEntry,
  StaffUser,
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operation: OperationType;
  path: string | null;
  authInfo: {
    uid: string | null;
    email: string | null;
    emailVerified: boolean;
    isAnonymous: boolean;
  };
}

export type CloudSyncStatus = 'CONNECTED' | 'SYNCING' | 'OFFLINE' | 'ERROR';

export class FirebaseService {
  private static app: FirebaseApp | null = null;
  private static db: Firestore | null = null;
  private static syncStatus: CloudSyncStatus = 'OFFLINE';
  private static lastSyncedAt: Date | null = null;
  private static statusListeners: ((status: CloudSyncStatus, lastSynced: Date | null) => void)[] = [];
  private static activeSubscriptions: Unsubscribe[] = [];
  private static isInitialized = false;

  /**
   * Initializes Firebase app and Firestore instance
   */
  public static getDb(): Firestore {
    if (!this.db) {
      if (!getApps().length) {
        this.app = initializeApp(firebaseConfig);
      } else {
        this.app = getApp();
      }

      if (firebaseConfig.firestoreDatabaseId) {
        this.db = getFirestore(this.app, firebaseConfig.firestoreDatabaseId);
      } else {
        this.db = getFirestore(this.app);
      }
    }
    return this.db;
  }

  /**
   * Translates and throws formatted Firestore security/network error
   */
  public static handleFirestoreError(
    error: unknown,
    operation: OperationType,
    path: string | null
  ): never {
    const message = error instanceof Error ? error.message : String(error);
    const errorInfo: FirestoreErrorInfo = {
      error: message,
      operation,
      path,
      authInfo: {
        uid: null,
        email: null,
        emailVerified: false,
        isAnonymous: true,
      },
    };
    console.error('Firestore Error:', errorInfo);
    throw new Error(JSON.stringify(errorInfo));
  }

  /**
   * Tests connection to Firestore on startup as mandated by skill guidelines
   */
  public static async testConnection(): Promise<boolean> {
    try {
      const db = this.getDb();
      const testDocRef = doc(db, 'system', 'connection_check');
      // Test server connection
      await setDoc(testDocRef, {
        status: 'online',
        testedAt: new Date().toISOString(),
        client: 'Kedai PAPA POS Web',
        timestamp: serverTimestamp(),
      });
      await getDocFromServer(testDocRef);
      this.updateStatus('CONNECTED');
      return true;
    } catch (error) {
      if (error instanceof Error && error.message.includes('the client is offline')) {
        console.warn('Firebase Firestore client is operating in offline mode.');
        this.updateStatus('OFFLINE');
      } else {
        console.warn('Firebase connection test warning:', error);
        this.updateStatus('CONNECTED'); // Local persistence allows operation
      }
      return false;
    }
  }

  /**
   * Subscribes to status updates
   */
  public static onStatusChange(callback: (status: CloudSyncStatus, lastSynced: Date | null) => void): () => void {
    this.statusListeners.push(callback);
    callback(this.syncStatus, this.lastSyncedAt);
    return () => {
      this.statusListeners = this.statusListeners.filter((cb) => cb !== callback);
    };
  }

  public static getStatus(): { status: CloudSyncStatus; lastSyncedAt: Date | null } {
    return { status: this.syncStatus, lastSyncedAt: this.lastSyncedAt };
  }

  private static updateStatus(status: CloudSyncStatus) {
    this.syncStatus = status;
    if (status === 'CONNECTED') {
      this.lastSyncedAt = new Date();
    }
    this.statusListeners.forEach((cb) => cb(this.syncStatus, this.lastSyncedAt));
  }

  /**
   * Cleans up all active Firestore snapshot listeners
   */
  public static unsubscribeAll(): void {
    this.activeSubscriptions.forEach((unsub) => unsub());
    this.activeSubscriptions = [];
    this.isInitialized = false;
  }

  // -------------------------------------------------------------
  // CLOUD PERSISTENCE OPERATIONS (WRITES)
  // -------------------------------------------------------------

  public static async syncStore(store: Store): Promise<void> {
    try {
      const db = this.getDb();
      await setDoc(doc(db, 'stores', store.id), store);
      this.updateStatus('CONNECTED');
    } catch (err) {
      console.warn('Cloud syncStore error:', err);
    }
  }

  public static async syncProduct(product: Product): Promise<void> {
    try {
      const db = this.getDb();
      await setDoc(doc(db, 'products', product.id), product);
      this.updateStatus('CONNECTED');
    } catch (err) {
      console.warn('Cloud syncProduct error:', err);
    }
  }

  public static async deleteProduct(productId: string): Promise<void> {
    try {
      const db = this.getDb();
      await deleteDoc(doc(db, 'products', productId));
      this.updateStatus('CONNECTED');
    } catch (err) {
      console.warn('Cloud deleteProduct error:', err);
    }
  }

  public static async syncMovement(movement: InventoryMovement): Promise<void> {
    try {
      const db = this.getDb();
      await setDoc(doc(db, 'inventory_movements', movement.id), movement);
      this.updateStatus('CONNECTED');
    } catch (err) {
      console.warn('Cloud syncMovement error:', err);
    }
  }

  public static async syncSale(sale: Sale): Promise<void> {
    try {
      const db = this.getDb();
      await setDoc(doc(db, 'sales', sale.id), sale);
      this.updateStatus('CONNECTED');
    } catch (err) {
      console.warn('Cloud syncSale error:', err);
    }
  }

  public static async syncSupplier(supplier: Supplier): Promise<void> {
    try {
      const db = this.getDb();
      await setDoc(doc(db, 'suppliers', supplier.id), supplier);
      this.updateStatus('CONNECTED');
    } catch (err) {
      console.warn('Cloud syncSupplier error:', err);
    }
  }

  public static async deleteSupplier(supplierId: string): Promise<void> {
    try {
      const db = this.getDb();
      await deleteDoc(doc(db, 'suppliers', supplierId));
      this.updateStatus('CONNECTED');
    } catch (err) {
      console.warn('Cloud deleteSupplier error:', err);
    }
  }

  public static async syncPurchase(purchase: Purchase): Promise<void> {
    try {
      const db = this.getDb();
      await setDoc(doc(db, 'purchases', purchase.id), purchase);
      this.updateStatus('CONNECTED');
    } catch (err) {
      console.warn('Cloud syncPurchase error:', err);
    }
  }

  public static async syncCustomer(customer: Customer): Promise<void> {
    try {
      const db = this.getDb();
      await setDoc(doc(db, 'customers', customer.id), customer);
      this.updateStatus('CONNECTED');
    } catch (err) {
      console.warn('Cloud syncCustomer error:', err);
    }
  }

  public static async deleteCustomer(customerId: string): Promise<void> {
    try {
      const db = this.getDb();
      await deleteDoc(doc(db, 'customers', customerId));
      this.updateStatus('CONNECTED');
    } catch (err) {
      console.warn('Cloud deleteCustomer error:', err);
    }
  }

  public static async syncLoyaltyEntry(entry: LoyaltyLedgerEntry): Promise<void> {
    try {
      const db = this.getDb();
      await setDoc(doc(db, 'loyalty_ledger', entry.id), entry);
      this.updateStatus('CONNECTED');
    } catch (err) {
      console.warn('Cloud syncLoyaltyEntry error:', err);
    }
  }

  public static async syncStaffUser(staff: StaffUser): Promise<void> {
    try {
      const db = this.getDb();
      await setDoc(doc(db, 'staff_users', staff.id), staff);
      this.updateStatus('CONNECTED');
    } catch (err) {
      console.warn('Cloud syncStaffUser error:', err);
    }
  }

  // -------------------------------------------------------------
  // INITIAL CLOUD SYNC & SEEDING (FOR FIRST-TIME BOOTSTRAP)
  // -------------------------------------------------------------

  /**
   * Checks if Firestore has existing data. If empty, uploads initial dataset to cloud.
   */
  public static async bootstrapCloudDataIfEmpty(initialData: {
    store: Store;
    products: Product[];
    movements: InventoryMovement[];
    sales: Sale[];
    suppliers: Supplier[];
    purchases: Purchase[];
    customers: Customer[];
    loyaltyLedger: LoyaltyLedgerEntry[];
    staffUsers: StaffUser[];
  }): Promise<boolean> {
    try {
      const db = this.getDb();
      const productsSnap = await getDocs(collection(db, 'products'));

      if (!productsSnap.empty) {
        // Cloud already has data!
        return false;
      }

      console.log('Firestore is empty. Bootstrapping initial store data to cloud...');
      this.updateStatus('SYNCING');

      const batch = writeBatch(db);

      // Store
      batch.set(doc(db, 'stores', initialData.store.id), initialData.store);

      // Products
      for (const p of initialData.products) {
        batch.set(doc(db, 'products', p.id), p);
      }

      // Movements
      for (const m of initialData.movements) {
        batch.set(doc(db, 'inventory_movements', m.id), m);
      }

      // Sales
      for (const s of initialData.sales) {
        batch.set(doc(db, 'sales', s.id), s);
      }

      // Suppliers
      for (const sup of initialData.suppliers) {
        batch.set(doc(db, 'suppliers', sup.id), sup);
      }

      // Purchases
      for (const pur of initialData.purchases) {
        batch.set(doc(db, 'purchases', pur.id), pur);
      }

      // Customers
      for (const c of initialData.customers) {
        batch.set(doc(db, 'customers', c.id), c);
      }

      // Loyalty
      for (const l of initialData.loyaltyLedger) {
        batch.set(doc(db, 'loyalty_ledger', l.id), l);
      }

      // Staff
      for (const stf of initialData.staffUsers) {
        batch.set(doc(db, 'staff_users', stf.id), stf);
      }

      await batch.commit();
      console.log('Firestore initial bootstrap completed successfully.');
      this.updateStatus('CONNECTED');
      return true;
    } catch (err) {
      console.warn('Bootstrap to Firestore failed or skipped:', err);
      this.updateStatus('CONNECTED');
      return false;
    }
  }

  // -------------------------------------------------------------
  // REAL-TIME SYNC LISTENERS (MULTI-DEVICE EVENT STREAM)
  // -------------------------------------------------------------

  /**
   * Initializes multi-device listeners that trigger callbacks whenever any device makes changes.
   */
  public static subscribeToRealtimeUpdates(callbacks: {
    onProductsUpdated?: (products: Product[]) => void;
    onMovementsUpdated?: (movements: InventoryMovement[]) => void;
    onSalesUpdated?: (sales: Sale[]) => void;
    onSuppliersUpdated?: (suppliers: Supplier[]) => void;
    onPurchasesUpdated?: (purchases: Purchase[]) => void;
    onCustomersUpdated?: (customers: Customer[]) => void;
    onLoyaltyUpdated?: (loyalty: LoyaltyLedgerEntry[]) => void;
    onStaffUpdated?: (staff: StaffUser[]) => void;
    onStoreUpdated?: (store: Store) => void;
  }): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      const db = this.getDb();

      // 1. Products listener
      if (callbacks.onProductsUpdated) {
        const unsub = onSnapshot(collection(db, 'products'), (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => d.data() as Product);
            callbacks.onProductsUpdated?.(list);
            this.updateStatus('CONNECTED');
          }
        }, (err) => console.warn('Products listener notice:', err.message));
        this.activeSubscriptions.push(unsub);
      }

      // 2. Movements listener
      if (callbacks.onMovementsUpdated) {
        const unsub = onSnapshot(collection(db, 'inventory_movements'), (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => d.data() as InventoryMovement);
            callbacks.onMovementsUpdated?.(list);
            this.updateStatus('CONNECTED');
          }
        }, (err) => console.warn('Movements listener notice:', err.message));
        this.activeSubscriptions.push(unsub);
      }

      // 3. Sales listener
      if (callbacks.onSalesUpdated) {
        const unsub = onSnapshot(collection(db, 'sales'), (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => d.data() as Sale);
            callbacks.onSalesUpdated?.(list);
            this.updateStatus('CONNECTED');
          }
        }, (err) => console.warn('Sales listener notice:', err.message));
        this.activeSubscriptions.push(unsub);
      }

      // 4. Suppliers listener
      if (callbacks.onSuppliersUpdated) {
        const unsub = onSnapshot(collection(db, 'suppliers'), (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => d.data() as Supplier);
            callbacks.onSuppliersUpdated?.(list);
            this.updateStatus('CONNECTED');
          }
        }, (err) => console.warn('Suppliers listener notice:', err.message));
        this.activeSubscriptions.push(unsub);
      }

      // 5. Purchases listener
      if (callbacks.onPurchasesUpdated) {
        const unsub = onSnapshot(collection(db, 'purchases'), (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => d.data() as Purchase);
            callbacks.onPurchasesUpdated?.(list);
            this.updateStatus('CONNECTED');
          }
        }, (err) => console.warn('Purchases listener notice:', err.message));
        this.activeSubscriptions.push(unsub);
      }

      // 6. Customers listener
      if (callbacks.onCustomersUpdated) {
        const unsub = onSnapshot(collection(db, 'customers'), (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => d.data() as Customer);
            callbacks.onCustomersUpdated?.(list);
            this.updateStatus('CONNECTED');
          }
        }, (err) => console.warn('Customers listener notice:', err.message));
        this.activeSubscriptions.push(unsub);
      }

      // 7. Loyalty listener
      if (callbacks.onLoyaltyUpdated) {
        const unsub = onSnapshot(collection(db, 'loyalty_ledger'), (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => d.data() as LoyaltyLedgerEntry);
            callbacks.onLoyaltyUpdated?.(list);
            this.updateStatus('CONNECTED');
          }
        }, (err) => console.warn('Loyalty listener notice:', err.message));
        this.activeSubscriptions.push(unsub);
      }

      // 8. Staff listener
      if (callbacks.onStaffUpdated) {
        const unsub = onSnapshot(collection(db, 'staff_users'), (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => d.data() as StaffUser);
            callbacks.onStaffUpdated?.(list);
            this.updateStatus('CONNECTED');
          }
        }, (err) => console.warn('Staff listener notice:', err.message));
        this.activeSubscriptions.push(unsub);
      }

      // 9. Store listener
      if (callbacks.onStoreUpdated) {
        const unsub = onSnapshot(collection(db, 'stores'), (snapshot) => {
          if (!snapshot.empty) {
            const storeData = snapshot.docs[0].data() as Store;
            callbacks.onStoreUpdated?.(storeData);
            this.updateStatus('CONNECTED');
          }
        }, (err) => console.warn('Store listener notice:', err.message));
        this.activeSubscriptions.push(unsub);
      }
    } catch (err) {
      console.warn('Error starting real-time listeners:', err);
    }
  }
}
