import { Item, ActivityLog, CheckoutLog, InventoryChange } from '@/types/logistics';

// Storage keys
const ITEMS_KEY = 'afjrotc_items';
const ACTIVITY_LOG_KEY = 'afjrotc_activity_log';
const CHECKOUT_LOG_KEY = 'afjrotc_checkout_log';
const INVENTORY_CHANGES_KEY = 'afjrotc_inventory_changes';
const AUTH_KEY = 'afjrotc_auth';
const USERS_KEY = 'afjrotc_users';

// Default admin password
const ADMIN_PASSWORD = 'admin123';

// User types
export interface LocalUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'lead' | 'staff' | 'member' | 'logistics' | 'cadet';
  created_at: string;
}

// Generate UUID
const generateId = () => crypto.randomUUID();

// Get current timestamp
const now = () => new Date().toISOString();

// ==================== AUTH ====================
export const localAuth = {
  login: (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      const session = {
        isLoggedIn: true,
        role: 'admin' as const,
        userId: 'admin-1',
        userName: 'Administrator',
        loginTime: now()
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      return true;
    }
    return false;
  },

  logout: () => {
    localStorage.removeItem(AUTH_KEY);
  },

  getSession: () => {
    const data = localStorage.getItem(AUTH_KEY);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  isLoggedIn: (): boolean => {
    const session = localAuth.getSession();
    return session?.isLoggedIn === true;
  }
};

// ==================== ITEMS ====================
export const localItems = {
  getAll: (): Item[] => {
    const data = localStorage.getItem(ITEMS_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  add: (item: Omit<Item, 'id' | 'created_at' | 'updated_at'>): Item => {
    const items = localItems.getAll();
    const newItem: Item = {
      ...item,
      id: generateId(),
      created_at: now(),
      updated_at: now()
    };
    items.unshift(newItem);
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
    return newItem;
  },

  update: (id: string, updates: Partial<Item>): Item | null => {
    const items = localItems.getAll();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    
    items[index] = { ...items[index], ...updates, updated_at: now() };
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items));
    return items[index];
  },

  delete: (id: string): boolean => {
    const items = localItems.getAll();
    const filtered = items.filter(item => item.id !== id);
    if (filtered.length === items.length) return false;
    
    localStorage.setItem(ITEMS_KEY, JSON.stringify(filtered));
    return true;
  },

  getById: (id: string): Item | undefined => {
    return localItems.getAll().find(item => item.id === id);
  }
};

// ==================== ACTIVITY LOG ====================
export const localActivityLog = {
  getAll: (): ActivityLog[] => {
    const data = localStorage.getItem(ACTIVITY_LOG_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  add: (log: Omit<ActivityLog, 'id' | 'created_at'>): ActivityLog => {
    const logs = localActivityLog.getAll();
    const newLog: ActivityLog = {
      ...log,
      id: generateId(),
      created_at: now()
    };
    logs.unshift(newLog);
    // Keep only last 100 entries
    const trimmed = logs.slice(0, 100);
    localStorage.setItem(ACTIVITY_LOG_KEY, JSON.stringify(trimmed));
    return newLog;
  },

  getRecent: (limit: number = 50): ActivityLog[] => {
    return localActivityLog.getAll().slice(0, limit);
  }
};

// ==================== CHECKOUT LOG ====================
export const localCheckoutLog = {
  getAll: (): CheckoutLog[] => {
    const data = localStorage.getItem(CHECKOUT_LOG_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  add: (log: Omit<CheckoutLog, 'id' | 'created_at'>): CheckoutLog => {
    const logs = localCheckoutLog.getAll();
    const newLog: CheckoutLog = {
      ...log,
      id: generateId(),
      created_at: now()
    };
    logs.unshift(newLog);
    localStorage.setItem(CHECKOUT_LOG_KEY, JSON.stringify(logs));
    return newLog;
  },

  update: (id: string, updates: Partial<CheckoutLog>): CheckoutLog | null => {
    const logs = localCheckoutLog.getAll();
    const index = logs.findIndex(log => log.id === id);
    if (index === -1) return null;
    
    logs[index] = { ...logs[index], ...updates };
    localStorage.setItem(CHECKOUT_LOG_KEY, JSON.stringify(logs));
    return logs[index];
  },

  getByItemId: (itemId: string): CheckoutLog[] => {
    return localCheckoutLog.getAll().filter(log => log.item_id === itemId);
  },

  getActiveByItemId: (itemId: string): CheckoutLog[] => {
    return localCheckoutLog.getAll().filter(
      log => log.item_id === itemId && log.status === 'out'
    );
  },

  getById: (id: string): CheckoutLog | undefined => {
    return localCheckoutLog.getAll().find(log => log.id === id);
  }
};

// ==================== INVENTORY CHANGES ====================
export const localInventoryChanges = {
  getAll: (): InventoryChange[] => {
    const data = localStorage.getItem(INVENTORY_CHANGES_KEY);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  add: (change: Omit<InventoryChange, 'id' | 'changed_at'>): InventoryChange => {
    const changes = localInventoryChanges.getAll();
    const newChange: InventoryChange = {
      ...change,
      id: generateId(),
      changed_at: now()
    };
    changes.unshift(newChange);
    localStorage.setItem(INVENTORY_CHANGES_KEY, JSON.stringify(changes));
    return newChange;
  }
};

// ==================== USERS (for display purposes) ====================
export const localUsers = {
  getAll: (): LocalUser[] => {
    const data = localStorage.getItem(USERS_KEY);
    if (!data) {
      // Return default admin user
      return [{
        id: 'admin-1',
        name: 'Administrator',
        email: 'admin@afjrotc.edu',
        role: 'admin',
        created_at: now()
      }];
    }
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  updateRole: (userId: string, newRole: LocalUser['role']): boolean => {
    const users = localUsers.getAll();
    const index = users.findIndex(u => u.id === userId);
    if (index === -1) return false;
    
    users[index].role = newRole;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  }
};

// ==================== SEED DATA ====================
export const seedDemoData = () => {
  // Only seed if no items exist
  if (localItems.getAll().length > 0) return;

  const demoItems: Omit<Item, 'id' | 'created_at' | 'updated_at'>[] = [
    {
      category: 'uniforms',
      name: 'Service Dress Coat (Male)',
      quantity: 25,
      in_use: 5,
      assigned_to: null,
      condition: 'good',
      location: 'Storage Room A',
      notes: 'Various sizes available'
    },
    {
      category: 'uniforms',
      name: 'ABU Pants',
      quantity: 40,
      in_use: 8,
      assigned_to: null,
      condition: 'good',
      location: 'Storage Room A',
      notes: ''
    },
    {
      category: 'drill',
      name: 'Drill Rifles',
      quantity: 15,
      in_use: 3,
      assigned_to: null,
      condition: 'good',
      location: 'Armory',
      notes: 'Demilitarized training rifles'
    },
    {
      category: 'pt',
      name: 'PT Shorts',
      quantity: 50,
      in_use: 10,
      assigned_to: null,
      condition: 'new',
      location: 'Storage Room B',
      notes: ''
    },
    {
      category: 'ceremonial',
      name: 'Color Guard Flags',
      quantity: 4,
      in_use: 0,
      assigned_to: null,
      condition: 'good',
      location: 'Ceremonial Closet',
      notes: 'US, State, AF, AFJROTC'
    },
    {
      category: 'tech',
      name: 'Flight Simulators',
      quantity: 3,
      in_use: 1,
      assigned_to: null,
      condition: 'good',
      location: 'Computer Lab',
      notes: 'Desktop flight sim setups'
    }
  ];

  demoItems.forEach(item => localItems.add(item));

  // Add some demo activity
  localActivityLog.add({
    user_id: 'admin-1',
    user_name: 'Administrator',
    action: 'System initialized',
    item_name: 'Demo data loaded',
    item_id: null
  });
};

