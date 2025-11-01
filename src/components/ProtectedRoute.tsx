import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, userRole } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Allow access to logistics page only for admin, lead, and staff
  const canAccessLogistics = userRole === 'admin' || userRole === 'lead' || userRole === 'staff' || userRole === 'logistics';
  
  // If user doesn't have logistics access, redirect them
  if (!canAccessLogistics && window.location.pathname === '/') {
    return <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Access Restricted</h1>
        <p className="text-muted-foreground">You don't have permission to access the logistics panel.</p>
      </div>
    </div>;
  }

  return <>{children}</>;
}
