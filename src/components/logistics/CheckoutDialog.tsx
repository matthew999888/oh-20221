import { useState } from 'react';
import { XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Item } from '@/types/logistics';

interface CheckoutDialogProps {
  item: Item | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCheckout: (cadetName: string, quantity: number, notes?: string) => Promise<void>;
  activeCheckouts?: Array<{ id: string; cadet_name: string; quantity: number; checkout_date: string; notes?: string | null }>;
}

export function CheckoutDialog({ item, open, onOpenChange, onCheckout, activeCheckouts = [] }: CheckoutDialogProps) {
  const [cadetName, setCadetName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!item) return null;

  const totalCheckedOut = activeCheckouts.reduce((sum, checkout) => sum + checkout.quantity, 0);
  const availableQuantity = item.quantity - totalCheckedOut;

  const handleCheckout = async () => {
    if (!cadetName.trim() || quantity < 1 || quantity > availableQuantity) return;
    
    setIsLoading(true);
    try {
      await onCheckout(cadetName, quantity, notes.trim() || undefined);
      setCadetName('');
      setQuantity(1);
      setNotes('');
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Check Out Item</DialogTitle>
          <DialogDescription>
            Assign "{item.name}" to a cadet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          <div className="p-3 bg-accent/50 rounded-lg">
            <p className="font-medium">{item.name}</p>
            <p className="text-sm text-muted-foreground">{item.category}</p>
            <p className="text-sm text-muted-foreground">
              Total: {item.quantity} | Available: {availableQuantity}
            </p>
          </div>

          {activeCheckouts.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Currently Checked Out:</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {activeCheckouts.map((checkout) => (
                  <div key={checkout.id} className="p-2 bg-muted/50 rounded text-sm">
                    <span className="font-medium">{checkout.cadet_name}</span>
                    <span className="text-muted-foreground"> × {checkout.quantity}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({new Date(checkout.checkout_date).toLocaleDateString()})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="cadetName">Cadet Name</Label>
              <Input
                id="cadetName"
                placeholder="Enter cadet name..."
                value={cadetName}
                onChange={(e) => setCadetName(e.target.value)}
                className="mt-2"
                disabled={isLoading || availableQuantity === 0}
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={availableQuantity}
                placeholder="Enter quantity..."
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(availableQuantity, parseInt(e.target.value) || 1)))}
                className="mt-2"
                disabled={isLoading || availableQuantity === 0}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Max available: {availableQuantity}
              </p>
            </div>

            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this checkout..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-2"
                disabled={isLoading || availableQuantity === 0}
                maxLength={500}
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {notes.length}/500 characters
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCheckout}
                disabled={isLoading || !cadetName.trim() || availableQuantity === 0 || quantity < 1}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}