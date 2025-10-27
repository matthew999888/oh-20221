import { UserRole } from '@/types/logistics';

export const userRoles: Record<string, UserRole> = {
  admin: { 
    name: 'Admin (Instructor)', 
    canEdit: true, 
    canDelete: true, 
    canCheckout: true, 
    canManageUsers: true 
  },
  logistics: { 
    name: 'Logistics Officer', 
    canEdit: true, 
    canDelete: false, 
    canCheckout: true, 
    canManageUsers: false 
  },
  cadet: { 
    name: 'Cadet User', 
    canEdit: false, 
    canDelete: false, 
    canCheckout: false, 
    canManageUsers: false 
  }
};
