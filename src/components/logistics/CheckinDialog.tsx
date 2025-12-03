import { useState } from 'react';
import { CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Item } from '@/types/logistics';

interface CheckinDialogProps {
  item: Item | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckin: (checkoutId: string) => Promise<void>;
  activeCheckouts: Array<{ id: string; cadet_name: string; quantity: number; checkout_date: string; notes?: string | null }>;
}

export function CheckinDialog({ item, open, onOpenChange, onCheckin, activeCheckouts }: CheckinDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCheckoutId, setSelectedCheckoutId] = useState<string | null>(null);

  if (!item) return null;

  const handleCheckin = async () => {
    if (!selectedCheckoutId) return;
    
    setIsLoading(true);
    try {
      await onCheckin(selectedCheckoutId);
      setSelectedCheckoutId(null);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check In Item</DialogTitle>
          <DialogDescription>
            Return "{item.name}" to available inventory
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="p-3 bg-accent/50 rounded-lg">
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground">{item.category}</p>
            <p className="text-sm text-muted-foreground">
              Total: {item.quantity} | Checked Out: {item.in_use}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Select checkout to return:</p>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activeCheckouts.map((checkout) => (
                <button
                  key={checkout.id}
                  onClick={() => setSelectedCheckoutId(checkout.id)}
                  className={`w-full p-3 rounded-lg border-2 transition-colors text-left ${
                    selectedCheckoutId === checkout.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{checkout.cadet_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {checkout.quantity}
                      </p>
                      {checkout.notes && (
                        <p className="text-xs text-muted-foreground italic mt-1 border-l-2 border-muted pl-2">
                          {checkout.notes}
                        </p>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(checkout.checkout_date).toLocaleDateString()}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCheckin}
              disabled={isLoading || !selectedCheckoutId}
              className="flex-1"
              variant="default"
            >
              <CheckCircle className="mr-2" size={16} />
              Check In
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
      </DialogContent>
    </Dialog>
  );
}
