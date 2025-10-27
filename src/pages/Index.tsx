import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Users, AlertCircle, Plus, Search, Trash2, Settings } from 'lucide-react';
import { Item, ActivityLog } from '@/types/logistics';
import { categories } from '@/data/categories';
import { userRoles } from '@/data/userRoles';
import { Navigation } from '@/components/logistics/Navigation';
import { StatsCard } from '@/components/logistics/StatsCard';
import { CategoryCard } from '@/components/logistics/CategoryCard';
import { ActivityLogItem } from '@/components/logistics/ActivityLogItem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { AdminPanelDialog } from '@/components/logistics/AdminPanelDialog';

export default function Index() {
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState<'dashboard' | 'inventory'>('dashboard');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCondition, setFilterCondition] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchItems();
    fetchActivityLog();
  }, [user, navigate]);

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (error: any) {
      toast.error('Error loading items: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLog = async () => {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setActivityLog(data || []);
    } catch (error: any) {
      console.error('Error loading activity log:', error.message);
    }
  };

  const addActivity = async (action: string, itemName: string, itemId?: string) => {
    if (!user) return;

    try {
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        user_name: user.email || 'Unknown',
        action,
        item_name: itemName,
        item_id: itemId || null
      });

      fetchActivityLog();
    } catch (error: any) {
      console.error('Error logging activity:', error.message);
    }
  };

  const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.currentTarget);
    const newItem = {
      category: formData.get('category') as string,
      name: formData.get('name') as string,
      quantity: parseInt(formData.get('quantity') as string),
      in_use: 0,
      assigned_to: null,
      condition: formData.get('condition') as string,
      location: formData.get('location') as string,
      notes: formData.get('notes') as string || '',
      created_by: user.id
    };

    try {
      const { data, error } = await supabase
        .from('items')
        .insert(newItem)
        .select()
        .single();

      if (error) throw error;

      toast.success('Item added successfully!');
      setShowAddModal(false);
      fetchItems();
      addActivity('Added item', newItem.name, data.id);
    } catch (error: any) {
      toast.error('Error adding item: ' + error.message);
    }
  };

  const handleCheckout = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;

    const formData = new FormData(e.currentTarget);
    const cadetName = formData.get('cadetName') as string;
    const dueDate = formData.get('dueDate') as string;

    try {
      const { error } = await supabase
        .from('items')
        .update({
          in_use: selectedItem.in_use + 1,
          assigned_to: cadetName,
          due_date: dueDate
        })
        .eq('id', selectedItem.id);

      if (error) throw error;

      toast.success('Item checked out successfully!');
      setShowCheckoutModal(false);
      setSelectedItem(null);
      fetchItems();
      addActivity('Checked out', selectedItem.name, selectedItem.id);
    } catch (error: any) {
      toast.error('Error checking out item: ' + error.message);
    }
  };

  const handleCheckin = async (item: Item) => {
    try {
      const { error } = await supabase
        .from('items')
        .update({
          in_use: Math.max(0, item.in_use - 1),
          assigned_to: null,
          due_date: null
        })
        .eq('id', item.id);

      if (error) throw error;

      toast.success('Item checked in successfully!');
      fetchItems();
      addActivity('Checked in', item.name, item.id);
    } catch (error: any) {
      toast.error('Error checking in item: ' + error.message);
    }
  };

  const handleDeleteItem = async (item: Item) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', item.id);

      if (error) throw error;

      toast.success('Item deleted successfully!');
      fetchItems();
      addActivity('Deleted item', item.name);
    } catch (error: any) {
      toast.error('Error deleting item: ' + error.message);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.assigned_to?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || item.category === selectedCategory;
    const matchesCondition = filterCondition === 'all' || item.condition === filterCondition;
    return matchesSearch && matchesCategory && matchesCondition;
  });

  const getConditionColor = (condition: string) => {
    const colors = {
      'new': 'text-green-600 bg-green-50 border-green-200',
      'good': 'text-blue-600 bg-blue-50 border-blue-200',
      'needs-repair': 'text-yellow-600 bg-yellow-50 border-yellow-200',
      'unserviceable': 'text-red-600 bg-red-50 border-red-200'
    };
    return colors[condition as keyof typeof colors] || colors.good;
  };

  const getStats = () => {
    const total = items.reduce((sum, item) => sum + item.quantity, 0);
    const inUse = items.reduce((sum, item) => sum + item.in_use, 0);
    const lowStock = items.filter(item => (item.quantity - item.in_use) < 5).length;
    const needsRepair = items.filter(item => item.condition === 'needs-repair').length;
    return { total, inUse, lowStock, needsRepair };
  };

  const stats = getStats();
  const currentUserRole = userRole || 'cadet';
  const canEdit = userRoles[currentUserRole]?.canEdit || false;
  const canDelete = userRoles[currentUserRole]?.canDelete || false;
  const canCheckout = userRoles[currentUserRole]?.canCheckout || false;
  const canManageUsers = userRoles[currentUserRole]?.canManageUsers || false;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navigation
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        setSelectedCategory={setSelectedCategory}
        userName={user?.email || 'User'}
        userRole={userRoles[currentUserRole]?.name || 'User'}
        onLogout={signOut}
        canManageUsers={canManageUsers}
        onAdminClick={() => setShowAdminPanel(true)}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground">
              {currentPage === 'dashboard' ? 'Dashboard Overview' : 'Inventory Management'}
            </h2>
            <p className="text-muted-foreground mt-1">
              {currentPage === 'dashboard'
                ? "Monitor your unit's equipment and resources"
                : 'View and manage all inventory items'}
            </p>
          </div>
          {canManageUsers && (
            <Button
              onClick={() => setShowAdminPanel(true)}
              className="hidden md:flex items-center gap-2"
            >
              <Settings size={18} />
              Manage Access
            </Button>
          )}
        </div>

        {currentPage === 'dashboard' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                label="Total Items"
                value={stats.total}
                icon={Package}
                colorClass="border-primary"
              />
              <StatsCard
                label="Currently In Use"
                value={stats.inUse}
                icon={Users}
                colorClass="border-blue-600"
              />
              <StatsCard
                label="Low Stock Alerts"
                value={stats.lowStock}
                icon={AlertCircle}
                colorClass="border-yellow-600"
              />
              <StatsCard
                label="Needs Repair"
                value={stats.needsRepair}
                icon={AlertCircle}
                colorClass="border-red-600"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {categories.map(cat => {
                const catItems = items.filter(item => item.category === cat.id);
                const catTotal = catItems.reduce((sum, item) => sum + item.quantity, 0);
                const catInUse = catItems.reduce((sum, item) => sum + item.in_use, 0);
                return (
                  <CategoryCard
                    key={cat.id}
                    category={cat}
                    totalItems={catTotal}
                    inUse={catInUse}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                      setCurrentPage('inventory');
                    }}
                  />
                );
              })}
            </div>

            <div className="bg-card rounded-lg shadow-md p-6 border border-border">
              <h3 className="text-xl font-bold text-foreground mb-4">Recent Activity</h3>
              <div className="space-y-2">
                {activityLog.slice(0, 10).map((log) => (
                  <ActivityLogItem key={log.id} log={log} />
                ))}
                {activityLog.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">No recent activity</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-card rounded-lg shadow-md p-6 border border-border">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 text-muted-foreground" size={20} />
                  <Input
                    type="text"
                    placeholder="Search items or cadets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterCondition} onValueChange={setFilterCondition}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Conditions</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="needs-repair">Needs Repair</SelectItem>
                    <SelectItem value="unserviceable">Unserviceable</SelectItem>
                  </SelectContent>
                </Select>
                {canEdit && (
                  <Button onClick={() => setShowAddModal(true)}>
                    <Plus size={20} className="mr-2" />
                    Add Item
                  </Button>
                )}
              </div>

              {selectedCategory && (
                <div className="mb-4 flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Category:</span>
                  <span className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-medium">
                    {categories.find(c => c.id === selectedCategory)?.name}
                  </span>
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-sm text-primary hover:underline"
                  >
                    Clear filter
                  </button>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-accent">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Item</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Category</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Quantity</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">In Use</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Assigned To</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Condition</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Location</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredItems.map(item => (
                      <tr key={item.id} className="hover:bg-accent/50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-foreground">{item.name}</p>
                            {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {categories.find(c => c.id === item.category)?.icon}
                        </td>
                        <td className="px-4 py-3 text-sm text-foreground font-medium">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-foreground">{item.in_use}</td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{item.assigned_to || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full border ${getConditionColor(item.condition)}`}>
                            {item.condition.replace('-', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{item.location}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            {canCheckout && item.in_use < item.quantity && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => { setSelectedItem(item); setShowCheckoutModal(true); }}
                              >
                                Check Out
                              </Button>
                            )}
                            {item.in_use > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCheckin(item)}
                              >
                                Check In
                              </Button>
                            )}
                            {canDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteItem(item)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 size={16} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredItems.length === 0 && (
                  <div className="text-center py-12">
                    <Package size={48} className="mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No items found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Item Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddItem}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select name="category" required defaultValue={categories[0].id}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="name">Item Name</Label>
                <Input id="name" name="name" type="text" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input id="quantity" name="quantity" type="number" required min="0" defaultValue="0" />
                </div>
                <div>
                  <Label htmlFor="condition">Condition</Label>
                  <Select name="condition" required defaultValue="good">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="needs-repair">Needs Repair</SelectItem>
                      <SelectItem value="unserviceable">Unserviceable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="location">Storage Location</Label>
                <Input id="location" name="location" type="text" required />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" rows={3} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button type="submit" className="flex-1">Add Item</Button>
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Checkout Modal */}
      <Dialog open={showCheckoutModal} onOpenChange={(open) => { setShowCheckoutModal(open); if (!open) setSelectedItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check Out Item</DialogTitle>
          </DialogHeader>
          <div className="mb-4 p-4 bg-accent rounded-lg">
            <p className="font-semibold text-lg">{selectedItem?.name}</p>
            <p className="text-sm text-muted-foreground">Available: {selectedItem ? selectedItem.quantity - selectedItem.in_use : 0}</p>
          </div>
          <form onSubmit={handleCheckout}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="cadetName">Cadet Name</Label>
                <Input id="cadetName" name="cadetName" type="text" required />
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" name="dueDate" type="date" required />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button type="submit" className="flex-1">Check Out</Button>
              <Button type="button" variant="outline" onClick={() => { setShowCheckoutModal(false); setSelectedItem(null); }} className="flex-1">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AdminPanelDialog open={showAdminPanel} onOpenChange={setShowAdminPanel} />

      <footer className="bg-card border-t border-border mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-muted-foreground">
            AFJROTC Logistics Management System • Aim High • Fly-Fight-Win
          </p>
        </div>
      </footer>
    </div>
  );
}
