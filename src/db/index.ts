import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface Sale {
  id?: number;
  date: string; // ISO string YYYY-MM-DD
  timestamp: number;
  productName: string;
  quantity: number;
  price: number;
  billImage?: Blob;
  billId?: string;
  billNumber?: string;
  customerNumber?: string;
}

export interface Attendance {
  id?: number;
  date: string; // ISO string YYYY-MM-DD
  timeIn?: string;
  timeOut?: string;
  location?: string;
  status: 'Present' | 'Week Off' | 'Leave';
}

export interface Target {
  id?: number;
  date: string; // ISO string YYYY-MM-DD
  dayTarget: number;
  dayAchievement: number;
  weekTarget: number;
  weekAchievement: number;
  eolTarget: number;
  eolAchieve: number;
}

export interface CRM {
  id?: number;
  date: string;
  timestamp: number;
  category: 'Installation' | 'Complaint' | 'Stock Issue';
  customerName: string;
  contactNumber: string;
  product: string;
  message: string;
  status: 'Open' | 'Closed';
}

export interface Settings {
  id: string; // 'user_settings'
  userName: string;
  empId: string;
  storeName?: string;
  storeLocation: string;
  theme: 'dark' | 'light';
  brandWebsite: string;
  demoLink: string;
  tollFree: string;
  aiApiKey: string;
  isLoggedIn: boolean;
  brandTarget: number;
  profilePhoto?: string;
  storeLat?: number;
  storeLng?: number;
}

interface SalesDB extends DBSchema {
  sales: {
    key: number;
    value: Sale;
    indexes: { 'by-date': string };
  };
  attendance: {
    key: number;
    value: Attendance;
    indexes: { 'by-date': string };
  };
  targets: {
    key: number;
    value: Target;
    indexes: { 'by-date': string };
  };
  crm: {
    key: number;
    value: CRM;
    indexes: { 'by-status': string };
  };
  settings: {
    key: string;
    value: Settings;
  };
}

const DB_NAME = 'SalesAppDB';
const DB_VERSION = 1;

export async function initDB(): Promise<IDBPDatabase<SalesDB>> {
  return openDB<SalesDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('sales')) {
        const store = db.createObjectStore('sales', { keyPath: 'id', autoIncrement: true });
        store.createIndex('by-date', 'date');
      }
      if (!db.objectStoreNames.contains('attendance')) {
        const store = db.createObjectStore('attendance', { keyPath: 'id', autoIncrement: true });
        store.createIndex('by-date', 'date');
      }
      if (!db.objectStoreNames.contains('targets')) {
        const store = db.createObjectStore('targets', { keyPath: 'id', autoIncrement: true });
        store.createIndex('by-date', 'date');
      }
      if (!db.objectStoreNames.contains('crm')) {
        const store = db.createObjectStore('crm', { keyPath: 'id', autoIncrement: true });
        store.createIndex('by-status', 'status');
      }
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'id' });
      }
    },
  });
}

export const dbPromise = initDB();
