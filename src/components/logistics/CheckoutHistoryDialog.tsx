import { useState, useEffect } from 'react';
import { History, CheckCircle, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { CheckoutLog } from '@/types/logistics';

interface CheckoutHistoryDialogProps {
  itemId: string | null;
  itemName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheckoutHistoryDialog({ itemId, itemName, open, onOpenChange }: CheckoutHistoryDialogProps) {
  const [history, setHistory] = useState<CheckoutLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && itemId) {
      fetchHistory();
    }
  }, [open, itemId]);

  const fetchHistory = async () => {
    if (!itemId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('checkout_log')
        .select('*')
        .eq('item_id', itemId)
        .order('checkout_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching checkout history:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History size={20} />
            Checkout History
          </DialogTitle>
          <DialogDescription>
            History for "{itemName}"
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No checkout history for this item
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-accent/30 rounded-lg border border-border"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-foreground">{log.cadet_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {log.quantity}
                      </p>
                    </div>
                    <Badge variant={log.status === 'out' ? 'destructive' : 'secondary'}>
                      {log.status === 'out' ? (
                        <>
                          <XCircle size={12} className="mr-1" />
                          Checked Out
                        </>
                      ) : (
                        <>
                          <CheckCircle size={12} className="mr-1" />
                          Returned
                        </>
                      )}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>
                      Checked out: {new Date(log.checkout_date).toLocaleString()}
                    </p>
                    {log.checkin_date && (
                      <p>
                        Checked in: {new Date(log.checkin_date).toLocaleString()}
                      </p>
                    )}
                    {log.notes && (
                      <p className="mt-2 text-sm text-foreground/80 italic border-l-2 border-muted pl-2">
                        {log.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}