import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Users, AlertCircle, Plus, Search, Trash2, Settings, History, LogOut, LogIn } from 'lucide-react';
import { Item, ActivityLog } from '@/types/logistics';
import { categories } from '@/data/categories';
import { userRoles } from '@/data/userRoles';
import { itemSchema } from '@/lib/validations';
import { Navigation } from '@/components/logistics/Navigation';
import { StatsCard } from '@/components/logistics/StatsCard';
import { CategoryCard } from '@/components/logistics/CategoryCard';
import { ActivityLogItem } from '@/components/logistics/ActivityLogItem';
import { QuantityEditor } from '@/components/logistics/QuantityEditor';
import { CheckoutDialog } from '@/components/logistics/CheckoutDialog';
import { CheckinDialog } from '@/components/logistics/CheckinDialog';
import { CheckoutHistoryDialog } from '@/components/logistics/CheckoutHistoryDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { localItems, localActivityLog, localCheckoutLog, localInventoryChanges, seedDemoData } from '@/lib/localData';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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
  const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
  const [showCheckinDialog, setShowCheckinDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [activeCheckouts, setActiveCheckouts] = useState<Array<{ id: string; cadet_name: string; quantity: number; checkout_date: string; notes?: string | null }>>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    // Seed demo data if needed
    seedDemoData();
    fetchItems();
    fetchActivityLog();
  }, [user, navigate]);

  const fetchItems = () => {
    try {
      const data = localItems.getAll();
      setItems(data);
    } catch (error: any) {
      toast.error('Error loading items: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLog = () => {
    try {
      const data = localActivityLog.getRecent(50);
      setActivityLog(data);
    } catch (error: any) {
      console.error('Error loading activity log:', error.message);
    }
  };

  const addActivity = (action: string, itemName: string, itemId?: string) => {
    if (!user) return;
    
    localActivityLog.add({
      user_id: user.id,
      user_name: user.name || 'Admin',
      action,
      item_name: itemName,
      item_id: itemId || null
    });
    fetchActivityLog();
  };

  const handleAddItem = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.currentTarget);
    const rawData = {
      category: formData.get('category') as string,
      name: formData.get('name') as string,
      quantity: parseInt(formData.get('quantity') as string),
      condition: formData.get('condition') as string,
      location: formData.get('location') as string,
      notes: (formData.get('notes') as string) || '',
    };

    try {
      const validatedData = itemSchema.parse(rawData);
      
      const newItem = localItems.add({
        category: validatedData.category,
        name: validatedData.name,
        quantity: validatedData.quantity,
        condition: validatedData.condition,
        location: validatedData.location,
        notes: validatedData.notes || '',
        in_use: 0,
        assigned_to: null
      });

      toast.success('Item added successfully!');
      setShowAddModal(false);
      fetchItems();
      addActivity('Added item', newItem.name, newItem.id);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        toast.error(error.errors[0].message);
      } else {
        toast.error('Error adding item: ' + error.message);
      }
    }
  };

  const handleCheckout = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedItem) return;

    if (!canCheckout) {
      toast.error('You do not have permission to check out items');
      return;
    }

    const formData = new FormData(e.currentTarget);
    const cadetName = (formData.get('cadetName') as string)?.trim();

    if (!cadetName) {
      toast.error('Cadet name is required');
      return;
    }

    try {
      localItems.update(selectedItem.id, {
        in_use: selectedItem.in_use + 1,
        assigned_to: cadetName
      });

      toast.success('Item checked out successfully!');
      setShowCheckoutModal(false);
      setSelectedItem(null);
      fetchItems();
      addActivity('Checked out', selectedItem.name, selectedItem.id);
    } catch (error: any) {
      toast.error('Error checking out item: ' + error.message);
    }
  };

  const handleCheckin = (item: Item) => {
    try {
      localItems.update(item.id, {
        in_use: Math.max(0, item.in_use - 1),
        assigned_to: null,
        due_date: null
      });

      toast.success('Item checked in successfully!');
      fetchItems();
      addActivity('Checked in', item.name, item.id);
    } catch (error: any) {
      toast.error('Error checking in item: ' + error.message);
    }
  };

  const handleDeleteItem = (item: Item) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete items');
      return;
    }

    if (!confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      localItems.delete(item.id);
      toast.success('Item deleted successfully!');
      fetchItems();
      addActivity('Deleted item', item.name, item.id);
    } catch (error: any) {
      toast.error('Error deleting item: ' + error.message);
    }
  };

  const handleUpdateQuantity = async (item: Item, newQuantity: number): Promise<void> => {
    if (!user) return;

    try {
      localInventoryChanges.add({
        item_id: item.id,
        item_name: item.name,
        old_quantity: item.quantity,
        new_quantity: newQuantity,
        changed_by: user.id,
        changed_by_name: user.name || 'Admin'
      });

      localItems.update(item.id, { quantity: newQuantity });

      toast.success('Quantity updated successfully!');
      fetchItems();
      addActivity(`Updated quantity from ${item.quantity} to ${newQuantity}`, item.name, item.id);
    } catch (error: any) {
      toast.error('Error updating quantity: ' + error.message);
      throw error;
    }
  };

  const handleNewCheckout = async (cadetName: string, quantity: number, notes?: string): Promise<void> => {
    if (!selectedItem || !user) return;

    try {
      const currentCheckouts = localCheckoutLog.getActiveByItemId(selectedItem.id);
      const totalCheckedOut = currentCheckouts.reduce((sum, c) => sum + c.quantity, 0);
      const available = selectedItem.quantity - totalCheckedOut;

      if (quantity > available) {
        toast.error(`Only ${available} items available`);
        return;
      }

      localCheckoutLog.add({
        cadet_name: cadetName,
        item_id: selectedItem.id,
        item_name: selectedItem.name,
        quantity: quantity,
        checkout_date: new Date().toISOString(),
        status: 'out',
        created_by: user.id,
        notes: notes || null
      });

      localItems.update(selectedItem.id, {
        in_use: totalCheckedOut + quantity
      });

      toast.success(`Checked out ${quantity}x ${selectedItem.name} to ${cadetName}`);
      fetchItems();
      addActivity(`Checked out ${quantity}x to ${cadetName}`, selectedItem.name, selectedItem.id);
    } catch (error: any) {
      toast.error('Error checking out item: ' + error.message);
      throw error;
    }
  };

  const handleNewCheckin = async (checkoutId: string): Promise<void> => {
    if (!selectedItem || !user) return;

    try {
      const checkout = localCheckoutLog.getById(checkoutId);
      if (!checkout) {
        toast.error('Checkout record not found');
        return;
      }

      localCheckoutLog.update(checkoutId, {
        checkin_date: new Date().toISOString(),
        status: 'returned'
      });

      localItems.update(selectedItem.id, {
        in_use: Math.max(0, selectedItem.in_use - checkout.quantity)
      });

      toast.success(`Checked in ${checkout.quantity}x ${selectedItem.name}`);
      fetchItems();
      addActivity(`Checked in ${checkout.quantity}x`, selectedItem.name, selectedItem.id);
    } catch (error: any) {
      toast.error('Error checking in item: ' + error.message);
      throw error;
    }
  };

  const handleCheckoutButtonClick = (item: Item) => {
    setSelectedItem(item);
    
    const checkouts = localCheckoutLog.getActiveByItemId(item.id);
    setActiveCheckouts(checkouts.map(c => ({
      id: c.id,
      cadet_name: c.cadet_name,
      quantity: c.quantity,
      checkout_date: c.checkout_date,
      notes: c.notes
    })));
    setShowCheckoutDialog(true);
  };

  const handleCheckinButtonClick = (item: Item) => {
    setSelectedItem(item);
    
    const checkouts = localCheckoutLog.getActiveByItemId(item.id);
    setActiveCheckouts(checkouts.map(c => ({
      id: c.id,
      cadet_name: c.cadet_name,
      quantity: c.quantity,
      checkout_date: c.checkout_date,
      notes: c.notes
    })));
    setShowCheckinDialog(true);
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
  const currentUserRole = userRole || 'admin';
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
        userName={user?.name || 'Admin'}
        userRole={userRoles[currentUserRole]?.name || 'Admin'}
        onLogout={signOut}
        canManageUsers={canManageUsers}
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
              onClick={() => navigate('/admin')}
              className="hidden md:flex items-center gap-2"
            >
              <Settings size={18} />
              Admin Panel
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
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Checked Out To</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Status</th>
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
                        <td className="px-4 py-3">
                          <QuantityEditor 
                            item={item} 
                            onSave={(newQty) => handleUpdateQuantity(item, newQty)}
                            canEdit={canEdit}
                          />
                        </td>
                         <td className="px-4 py-3 text-sm text-muted-foreground">
                           {item.in_use > 0 ? `${item.in_use} cadets` : '-'}
                         </td>
                         <td className="px-4 py-3 text-sm">
                           {item.in_use > 0 ? (
                             <span className="text-destructive font-medium">
                               {item.in_use} Checked Out
                             </span>
                           ) : (
                             <span className="text-green-600 font-medium">Available</span>
                           )}
                         </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full border ${getConditionColor(item.condition)}`}>
                            {item.condition.replace('-', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">{item.location}</td>
                         <td className="px-4 py-3">
                           <div className="flex gap-1">
                             {canCheckout && (
                               <>
                                 <Button variant="ghost" size="sm" onClick={() => handleCheckoutButtonClick(item)} title="Check Out">
                                   <LogOut size={16} />
                                 </Button>
                                 {item.in_use > 0 && (
                                   <Button variant="ghost" size="sm" onClick={() => handleCheckinButtonClick(item)} title="Check In">
                                     <LogIn size={16} />
                                   </Button>
                                 )}
                               </>
                             )}
                             <Button variant="ghost" size="sm" onClick={() => { setSelectedItem(item); setShowHistoryDialog(true); }}>
                               <History size={16} />
                             </Button>
                             {canDelete && (
                               <Button variant="ghost" size="sm" onClick={() => handleDeleteItem(item)} className="text-destructive">
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

      <CheckoutDialog
        item={selectedItem}
        open={showCheckoutDialog}
        onOpenChange={setShowCheckoutDialog}
        onCheckout={handleNewCheckout}
        activeCheckouts={activeCheckouts}
      />

      <CheckinDialog
        item={selectedItem}
        open={showCheckinDialog}
        onOpenChange={setShowCheckinDialog}
        onCheckin={handleNewCheckin}
        activeCheckouts={activeCheckouts}
      />

      <CheckoutHistoryDialog
        itemId={selectedItem?.id || null}
        itemName={selectedItem?.name || ''}
        open={showHistoryDialog}
        onOpenChange={setShowHistoryDialog}
      />

      <footer className="bg-card border-t border-border mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm text-muted-foreground">
            AFJROTC Logistics Management System • Aim High • Fly-Fight-Win
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Local Storage Mode - Data stored in browser
          </p>
        </div>
      </footer>
    </div>
  );
}
