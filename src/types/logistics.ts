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
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface User {
  name: string;
  role: 'admin' | 'logistics' | 'cadet';
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
  role: 'admin' | 'logistics' | 'cadet';
  name: string;
  created_at: string;
  created_by?: string | null;
}
