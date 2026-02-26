import { create } from 'zustand';
import { dbPromise, Settings, Sale, Attendance, Target, CRM } from '../db';
import { format } from 'date-fns';

interface AppState {
  settings: Settings | null;
  isInitialized: boolean;
  sales: Sale[];
  attendance: Attendance[];
  targets: Target[];
  crmIssues: CRM[];
  loadSettings: () => Promise<void>;
  updateSettings: (settings: Partial<Settings>) => Promise<void>;
  loadSales: () => Promise<void>;
  addSale: (sale: Omit<Sale, 'id'>) => Promise<void>;
  updateSale: (sale: Sale) => Promise<void>;
  deleteSale: (id: number) => Promise<void>;
  loadAttendance: () => Promise<void>;
  markAttendance: (attendance: Omit<Attendance, 'id'>) => Promise<void>;
  loadTargets: () => Promise<void>;
  saveTarget: (target: Omit<Target, 'id'>) => Promise<void>;
  loadCRMIssues: () => Promise<void>;
  addCRMIssue: (issue: Omit<CRM, 'id'>) => Promise<void>;
  updateCRMIssue: (issue: CRM) => Promise<void>;
}

const defaultSettings: Settings = {
  id: 'user_settings',
  userName: '',
  empId: '',
  storeName: '',
  storeLocation: '',
  theme: 'dark',
  brandWebsite: '',
  demoLink: '',
  tollFree: '',
  aiApiKey: '',
  isLoggedIn: false,
  brandTarget: 500000,
  profilePhoto: '',
  storeLat: undefined,
  storeLng: undefined,
};

export const useStore = create<AppState>((set, get) => ({
  settings: null,
  isInitialized: false,
  sales: [],
  attendance: [],
  targets: [],
  crmIssues: [],

  loadSettings: async () => {
    const db = await dbPromise;
    let settings = await db.get('settings', 'user_settings');
    if (!settings) {
      await db.put('settings', defaultSettings);
      settings = defaultSettings;
    }
    set({ settings, isInitialized: true });
    
    // Apply theme
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  updateSettings: async (newSettings) => {
    const db = await dbPromise;
    const current = get().settings || defaultSettings;
    const updated = { ...current, ...newSettings };
    await db.put('settings', updated);
    set({ settings: updated });
    
    if (updated.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  loadSales: async () => {
    const db = await dbPromise;
    const sales = await db.getAll('sales');
    set({ sales: sales.sort((a, b) => b.timestamp - a.timestamp) });
  },

  addSale: async (sale) => {
    const db = await dbPromise;
    await db.add('sales', sale);
    await get().loadSales();
  },

  updateSale: async (sale) => {
    const db = await dbPromise;
    await db.put('sales', sale);
    await get().loadSales();
  },

  deleteSale: async (id) => {
    const db = await dbPromise;
    await db.delete('sales', id);
    await get().loadSales();
  },

  loadAttendance: async () => {
    const db = await dbPromise;
    const attendance = await db.getAll('attendance');
    set({ attendance });
  },

  markAttendance: async (attendanceRecord) => {
    const db = await dbPromise;
    const existing = await db.getAllFromIndex('attendance', 'by-date', attendanceRecord.date);
    if (existing.length > 0) {
      await db.put('attendance', { ...attendanceRecord, id: existing[0].id });
    } else {
      await db.add('attendance', attendanceRecord);
    }
    await get().loadAttendance();
  },

  loadTargets: async () => {
    const db = await dbPromise;
    const targets = await db.getAll('targets');
    set({ targets });
  },

  saveTarget: async (targetRecord) => {
    const db = await dbPromise;
    const existing = await db.getAllFromIndex('targets', 'by-date', targetRecord.date);
    if (existing.length > 0) {
      await db.put('targets', { ...targetRecord, id: existing[0].id });
    } else {
      await db.add('targets', targetRecord);
    }
    await get().loadTargets();
  },

  loadCRMIssues: async () => {
    const db = await dbPromise;
    const crmIssues = await db.getAll('crm');
    set({ crmIssues: crmIssues.sort((a, b) => b.timestamp - a.timestamp) });
  },

  addCRMIssue: async (issue) => {
    const db = await dbPromise;
    await db.add('crm', issue);
    await get().loadCRMIssues();
  },

  updateCRMIssue: async (issue) => {
    const db = await dbPromise;
    await db.put('crm', issue);
    await get().loadCRMIssues();
  }
}));
