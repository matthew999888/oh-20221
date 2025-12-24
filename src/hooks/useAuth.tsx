import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { localAuth } from '@/lib/localData';

interface LocalUser {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: LocalUser | null;
  userRole: 'admin' | 'lead' | 'staff' | 'member' | 'logistics' | 'cadet' | null;
  loading: boolean;
  signOut: () => void;
  signIn: (password: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'lead' | 'staff' | 'member' | 'logistics' | 'cadet' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const session = localAuth.getSession();
    if (session?.isLoggedIn) {
      setUser({
        id: session.userId,
        email: 'admin@afjrotc.edu',
        name: session.userName
      });
      setUserRole(session.role);
    }
    setLoading(false);
  }, []);

  const signIn = (password: string): boolean => {
    const success = localAuth.login(password);
    if (success) {
      const session = localAuth.getSession();
      setUser({
        id: session.userId,
        email: 'admin@afjrotc.edu',
        name: session.userName
      });
      setUserRole(session.role);
    }
    return success;
  };

  const signOut = () => {
    localAuth.logout();
    setUser(null);
    setUserRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, userRole, loading, signOut, signIn }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
