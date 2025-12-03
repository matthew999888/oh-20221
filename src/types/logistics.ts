export interface Item {
  id: string;
  category: string;
  name: string;
  quantity: number;
  in_use: number;
  assigned_to: string | null;
  condition: string;
  location: string;
  notes: string;
  due_date?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
  checked_out_by?: string | null;
  checkout_date?: string | null;
  checkout_status?: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface User {
  name: string;
  role: 'admin' | 'lead' | 'staff' | 'member' | 'logistics' | 'cadet';
  email: string;
}

export interface UserRole {
  name: string;
  canEdit: boolean;
  canDelete: boolean;
  canCheckout: boolean;
  canManageUsers: boolean;
}

export interface ActivityLog {
  id: string;
  user_id: string | null;
  user_name: string;
  action: string;
  item_name: string;
  item_id: string | null;
  created_at: string;
}

export interface AllowedEmail {
  id: string;
  email: string;
  role: 'admin' | 'lead' | 'staff' | 'member' | 'logistics' | 'cadet';
  name: string;
  created_at: string;
  created_by?: string | null;
}

export interface CheckoutLog {
  id: string;
  cadet_name: string;
  item_id: string | null;
  item_name: string;
  quantity: number;
  checkout_date: string;
  checkin_date?: string | null;
  status: string;
  created_by?: string | null;
  created_at: string;
  notes?: string | null;
}

export interface InventoryChange {
  id: string;
  item_id: string | null;
  item_name: string;
  old_quantity: number;
  new_quantity: number;
  changed_by?: string | null;
  changed_by_name: string;
  changed_at: string;
}
