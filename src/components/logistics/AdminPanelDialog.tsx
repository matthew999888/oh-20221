import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Shield } from 'lucide-react';

interface UserWithRole {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'logistics' | 'cadet';
  created_at: string;
}

interface AdminPanelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminPanelDialog({ open, onOpenChange }: AdminPanelDialogProps) {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          name,
          created_at,
          user_roles (role)
        `)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const usersWithRoles = data?.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
        role: (user.user_roles as any)?.[0]?.role || 'cadet'
      })) || [];

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast.error('Error loading users: ' + error.message);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'logistics' | 'cadet') => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Role updated successfully!');
      fetchUsers();
    } catch (error: any) {
      toast.error('Error updating role: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Admin (Instructor)',
      logistics: 'Logistics Officer',
      cadet: 'Cadet User'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: 'bg-destructive/10 text-destructive',
      logistics: 'bg-primary/10 text-primary',
      cadet: 'bg-muted text-muted-foreground'
    };
    return colors[role as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Admin Panel - Manage User Roles</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-accent/50 border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              New users automatically receive Cadet role when they sign up. Update roles below to grant additional permissions.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-foreground mb-3">All Users</h3>
            <div className="space-y-2">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-accent/30 rounded-lg border border-border"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <span className={`inline-block mt-1 text-xs px-2 py-1 rounded-full ${getRoleBadgeColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </div>
                  <Select
                    value={user.role}
                    onValueChange={(value) => handleRoleChange(user.id, value as 'admin' | 'logistics' | 'cadet')}
                    disabled={loading}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cadet">
                        <div className="flex items-center gap-2">
                          <Shield size={14} />
                          <span>Cadet</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="logistics">
                        <div className="flex items-center gap-2">
                          <Shield size={14} />
                          <span>Logistics Officer</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="admin">
                        <div className="flex items-center gap-2">
                          <Shield size={14} />
                          <span>Admin</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
