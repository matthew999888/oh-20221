import { UserRole } from '@/types/logistics';

export const userRoles: Record<string, UserRole> = {
  admin: { 
    name: 'Admin', 
    canEdit: true, 
    canDelete: true, 
    canCheckout: true, 
    canManageUsers: true 
  },
  lead: { 
    name: 'Lead', 
    canEdit: true, 
    canDelete: true, 
    canCheckout: true, 
    canManageUsers: false 
  },
  staff: { 
    name: 'Staff', 
    canEdit: true, 
    canDelete: false, 
    canCheckout: true, 
    canManageUsers: false 
  },
  member: { 
    name: 'Member', 
    canEdit: false, 
    canDelete: false, 
    canCheckout: false, 
    canManageUsers: false 
  },
  // Legacy roles for backward compatibility
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
