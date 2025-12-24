import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function Auth() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = signIn(password);
      if (success) {
        toast.success('Signed in successfully!');
        navigate('/');
      } else {
        toast.error('Invalid password');
      }
    } catch (error: any) {
      toast.error('Authentication error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <div className="bg-card rounded-lg shadow-elegant p-8 max-w-md w-full border border-border">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🦅</div>
          <h1 className="text-3xl font-bold text-foreground">AFJROTC</h1>
          <h2 className="text-xl text-muted-foreground">Logistics Management</h2>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <Label htmlFor="password" className="text-foreground">Admin Password</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-3 text-muted-foreground" size={20} />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="pl-10"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border">
          <div className="text-sm text-muted-foreground text-center">
            <p className="font-medium text-foreground mb-2">Default Password: admin123</p>
            <p>This is a simplified version without cloud backend.</p>
            <p className="mt-1">All data is stored locally in your browser.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
