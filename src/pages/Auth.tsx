import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Mail, Lock, User } from 'lucide-react';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: name
            }
          }
        });

        if (error) throw error;

        toast.success('Account created! You can now sign in.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        toast.success('Signed in successfully!');
        navigate('/');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication error');
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
          {isSignUp && (
            <div>
              <Label htmlFor="name" className="text-foreground">Full Name</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-3 text-muted-foreground" size={20} />
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="pl-10"
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="email" className="text-foreground">Email Address</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-3 text-muted-foreground" size={20} />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@school.edu"
                required
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-3 text-muted-foreground" size={20} />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="pl-10"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-border">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-sm text-primary hover:underline"
          >
            {isSignUp
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </button>
        </div>

        <div className="mt-4 text-xs text-muted-foreground text-center">
          <p>Demo accounts: instructor@school.edu, logistics@school.edu, cadet@school.edu</p>
          <p className="mt-1">Password: any password (6+ characters)</p>
        </div>
      </div>
    </div>
  );
}
