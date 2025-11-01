import { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Item } from '@/types/logistics';

interface CheckoutDialogProps {
  item: Item | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckout: (cadetName: string) => Promise<void>;
  onCheckin: () => Promise<void>;
}

export function CheckoutDialog({ item, open, onOpenChange, onCheckout, onCheckin }: CheckoutDialogProps) {
  const [cadetName, setCadetName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!item) return null;

  const isCheckedOut = item.checkout_status === 'out' && item.checked_out_by;

  const handleCheckout = async () => {
    if (!cadetName.trim()) return;
    
    setIsLoading(true);
    try {
      await onCheckout(cadetName);
      setCadetName('');
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckin = async () => {
    setIsLoading(true);
    try {
      await onCheckin();
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isCheckedOut ? 'Check In Item' : 'Check Out Item'}
          </DialogTitle>
          <DialogDescription>
            {isCheckedOut 
              ? `Return "${item.name}" to available inventory`
              : `Assign "${item.name}" to a cadet`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="p-3 bg-accent/50 rounded-lg">
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground">{item.category}</p>
            <p className="text-sm text-muted-foreground">Available: {item.quantity - item.in_use}</p>
          </div>

          {isCheckedOut ? (
            <div className="space-y-4">
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-sm font-medium">Currently checked out to:</p>
                <p className="text-lg font-semibold text-destructive">{item.checked_out_by}</p>
                {item.checkout_date && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Since: {new Date(item.checkout_date).toLocaleDateString()}
                  </p>
                )}
              </div>
              
              <Button
                onClick={handleCheckin}
                disabled={isLoading}
                className="w-full"
                variant="default"
              >
                <CheckCircle className="mr-2" size={16} />
                Check In Item
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="cadetName">Cadet Name</Label>
                <Input
                  id="cadetName"
                  placeholder="Enter cadet name..."
                  value={cadetName}
                  onChange={(e) => setCadetName(e.target.value)}
                  className="mt-2"
                  disabled={isLoading}
                  maxLength={100}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCheckout}
                  disabled={isLoading || !cadetName.trim()}
                  className="flex-1"
                  variant="default"
                >
                  <XCircle className="mr-2" size={16} />
                  Check Out
                </Button>
                <Button
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}