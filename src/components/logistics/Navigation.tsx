import { useState } from 'react';
import { LogOut, Menu, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavigationProps {
  currentPage: string;
  setCurrentPage: (page: 'dashboard' | 'inventory') => void;
  setSelectedCategory: (category: string | null) => void;
  userName: string;
  userRole: string;
  onLogout: () => void;
  canManageUsers: boolean;
  onAdminClick: () => void;
}

export const Navigation = ({ 
  currentPage,
  setCurrentPage,
  setSelectedCategory,
  userName,
  userRole,
  onLogout,
  canManageUsers,
  onAdminClick
}: NavigationProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-gradient-to-r from-primary via-primary/90 to-accent text-primary-foreground shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-4">
            <span className="text-3xl">🦅</span>
            <div>
              <h1 className="text-xl font-bold">AFJROTC</h1>
              <p className="text-xs text-primary-foreground/80">Logistics Management</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <Button
              variant={currentPage === 'dashboard' ? 'secondary' : 'ghost'}
              onClick={() => { setCurrentPage('dashboard'); setSelectedCategory(null); }}
            >
              Dashboard
            </Button>
            <Button
              variant={currentPage === 'inventory' ? 'secondary' : 'ghost'}
              onClick={() => { setCurrentPage('inventory'); setSelectedCategory(null); }}
            >
              Inventory
            </Button>
            {canManageUsers && (
              <Button variant="ghost" size="icon" onClick={onAdminClick}>
                <Settings size={20} />
              </Button>
            )}
            <div className="flex items-center gap-3 border-l border-primary-foreground/20 pl-6">
              <div className="text-right">
                <p className="text-sm font-medium">{userName}</p>
                <p className="text-xs text-primary-foreground/70">{userRole}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onLogout}>
                <LogOut size={20} />
              </Button>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Button
              variant={currentPage === 'dashboard' ? 'secondary' : 'ghost'}
              onClick={() => { setCurrentPage('dashboard'); setSelectedCategory(null); setMobileMenuOpen(false); }}
              className="w-full"
            >
              Dashboard
            </Button>
            <Button
              variant={currentPage === 'inventory' ? 'secondary' : 'ghost'}
              onClick={() => { setCurrentPage('inventory'); setSelectedCategory(null); setMobileMenuOpen(false); }}
              className="w-full"
            >
              Inventory
            </Button>
            {canManageUsers && (
              <Button variant="ghost" onClick={() => { onAdminClick(); setMobileMenuOpen(false); }} className="w-full">
                <Settings size={18} className="mr-2" />
                Admin Panel
              </Button>
            )}
            <div className="border-t border-primary-foreground/20 pt-2 mt-2">
              <p className="px-4 py-1 text-sm font-medium">{userName}</p>
              <p className="px-4 text-xs text-primary-foreground/70">{userRole}</p>
              <Button variant="ghost" onClick={() => { onLogout(); setMobileMenuOpen(false); }} className="w-full mt-2">
                <LogOut size={18} className="mr-2" />
                Logout
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
