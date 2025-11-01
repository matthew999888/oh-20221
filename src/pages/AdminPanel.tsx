import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Search, Filter, ArrowLeft, Users, UserCheck, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface UserWithRole {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'lead' | 'staff' | 'member' | 'logistics' | 'cadet';
  created_at: string;
}

export default function AdminPanel() {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'lead' | 'staff' | 'member' | 'logistics' | 'cadet'>('all');
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    // Redirect non-admins (only admins can access this page)
    if (userRole && userRole !== 'admin') {
      toast.error('Access denied: Admin privileges required');
      navigate('/');
      return;
    }

    if (userRole === 'admin') {
      fetchUsers();
    }
  }, [userRole, navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch profiles first
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, name, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Create a map of user_id to role for quick lookup
      const roleMap = new Map(
        rolesData?.map(r => [r.user_id, r.role]) || []
      );

      // Combine the data
      const usersWithRoles = profilesData?.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
        role: roleMap.get(user.id) || 'cadet'
      })) || [];

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast.error('Error loading users: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: 'admin' | 'lead' | 'staff' | 'member' | 'logistics' | 'cadet') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Role updated successfully!');
      fetchUsers();
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (error: any) {
      toast.error('Error updating role: ' + error.message);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: 'Admin',
      lead: 'Lead',
      staff: 'Staff',
      member: 'Member',
      logistics: 'Logistics Officer',
      cadet: 'Cadet User'
    };
    return labels[role as keyof typeof labels] || role;
  };

  const getRoleBadgeVariant = (role: string): "default" | "destructive" | "secondary" => {
    const variants = {
      admin: 'destructive' as const,
      lead: 'destructive' as const,
      staff: 'default' as const,
      member: 'secondary' as const,
      logistics: 'default' as const,
      cadet: 'secondary' as const
    };
    return variants[role as keyof typeof variants] || 'secondary';
  };

  const getRoleIcon = (role: string) => {
    const icons = {
      admin: Shield,
      lead: Shield,
      staff: UserCog,
      member: UserCheck,
      logistics: UserCog,
      cadet: UserCheck
    };
    const Icon = icons[role as keyof typeof icons] || UserCheck;
    return <Icon size={14} />;
  };

  const getStats = () => {
    const totalUsers = users.length;
    const admins = users.filter(u => u.role === 'admin').length;
    const leads = users.filter(u => u.role === 'lead').length;
    const staff = users.filter(u => u.role === 'staff').length;
    const members = users.filter(u => u.role === 'member').length;
    const logistics = users.filter(u => u.role === 'logistics').length;
    const cadets = users.filter(u => u.role === 'cadet').length;
    return { totalUsers, admins, leads, staff, members, logistics, cadets };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft size={18} />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Shield size={24} className="text-destructive" />
                  Admin Panel
                </h1>
                <p className="text-sm text-muted-foreground">Manage user roles and permissions</p>
              </div>
            </div>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Users</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Users size={24} className="text-primary" />
                {stats.totalUsers}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Admins</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Shield size={24} className="text-destructive" />
                {stats.admins}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Leads</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <Shield size={24} className="text-destructive" />
                {stats.leads}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Staff</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <UserCog size={24} className="text-primary" />
                {stats.staff}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Members</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <UserCheck size={24} className="text-muted-foreground" />
                {stats.members}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Logistics</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <UserCog size={24} className="text-primary" />
                {stats.logistics}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Cadets</CardDescription>
              <CardTitle className="text-3xl flex items-center gap-2">
                <UserCheck size={24} className="text-muted-foreground" />
                {stats.cadets}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>Search and filter users to manage their roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 text-muted-foreground" size={20} />
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter size={20} className="text-muted-foreground" />
                <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admins</SelectItem>
                    <SelectItem value="lead">Leads</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="member">Members</SelectItem>
                    <SelectItem value="logistics">Logistics Officers</SelectItem>
                    <SelectItem value="cadet">Cadets</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Users ({filteredUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 bg-accent/30 rounded-lg border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="font-semibold text-foreground">{user.name}</p>
                      <Badge variant={getRoleBadgeVariant(user.role)} className="flex items-center gap-1">
                        {getRoleIcon(user.role)}
                        {getRoleLabel(user.role)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Registered: {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedUser(user);
                      setShowEditModal(true);
                    }}
                    className="flex items-center gap-2"
                  >
                    <UserCog size={16} />
                    Edit Role
                  </Button>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No users found matching your filters
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Edit Role Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Change the role and permissions for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4 pt-4">
              <div>
                <Label>User Information</Label>
                <div className="mt-2 p-3 bg-accent/50 rounded-lg">
                  <p className="font-medium">{selectedUser.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              <div>
                <Label>Select New Role</Label>
                <Select
                  defaultValue={selectedUser.role}
                  onValueChange={(value) => handleRoleChange(selectedUser.id, value as any)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">
                      <div className="flex items-center gap-2">
                        <UserCheck size={16} />
                        <div>
                          <p className="font-medium">Member</p>
                          <p className="text-xs text-muted-foreground">View-only access</p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="cadet">
                      <div className="flex items-center gap-2">
                        <UserCheck size={16} />
                        <div>
                          <p className="font-medium">Cadet</p>
                          <p className="text-xs text-muted-foreground">View-only access (legacy)</p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="staff">
                      <div className="flex items-center gap-2">
                        <UserCog size={16} />
                        <div>
                          <p className="font-medium">Staff</p>
                          <p className="text-xs text-muted-foreground">Can add and edit inventory</p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="logistics">
                      <div className="flex items-center gap-2">
                        <UserCog size={16} />
                        <div>
                          <p className="font-medium">Logistics Officer</p>
                          <p className="text-xs text-muted-foreground">Can add and edit inventory (legacy)</p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="lead">
                      <div className="flex items-center gap-2">
                        <Shield size={16} />
                        <div>
                          <p className="font-medium">Lead</p>
                          <p className="text-xs text-muted-foreground">Full inventory access, no role management</p>
                        </div>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield size={16} />
                        <div>
                          <p className="font-medium">Admin</p>
                          <p className="text-xs text-muted-foreground">Full access including role management</p>
                        </div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="bg-accent/50 p-3 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> Changes take effect immediately and will update the user's permissions across the system.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
