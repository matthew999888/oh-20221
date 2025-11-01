import { useState } from 'react';
import { Minus, Plus, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Item } from '@/types/logistics';

interface QuantityEditorProps {
  item: Item;
  onSave: (newQuantity: number) => Promise<void>;
  canEdit: boolean;
}

export function QuantityEditor({ item, onSave, canEdit }: QuantityEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [quantity, setQuantity] = useState(item.quantity);
  const [isSaving, setIsSaving] = useState(false);

  if (!canEdit) {
    return <span className="font-semibold text-foreground">{item.quantity}</span>;
  }

  const handleSave = async () => {
    if (quantity === item.quantity) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      await onSave(quantity);
      setIsEditing(false);
    } catch (error) {
      setQuantity(item.quantity); // Reset on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setQuantity(item.quantity);
    setIsEditing(false);
  };

  const increment = () => setQuantity(prev => Math.min(prev + 1, 10000));
  const decrement = () => setQuantity(prev => Math.max(prev - 1, 0));

  if (!isEditing) {
    return (
      <div className="flex items-center gap-2">
        <span className="font-semibold text-foreground">{item.quantity}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsEditing(true)}
          className="h-7 px-2 text-xs"
        >
          Edit
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="h-7 w-7"
        onClick={decrement}
        disabled={isSaving}
      >
        <Minus size={14} />
      </Button>
      <Input
        type="number"
        value={quantity}
        onChange={(e) => setQuantity(Math.max(0, Math.min(10000, parseInt(e.target.value) || 0)))}
        className="h-7 w-16 text-center px-1"
        disabled={isSaving}
        min={0}
        max={10000}
      />
      <Button
        variant="outline"
        size="icon"
        className="h-7 w-7"
        onClick={increment}
        disabled={isSaving}
      >
        <Plus size={14} />
      </Button>
      <Button
        variant="default"
        size="icon"
        className="h-7 w-7"
        onClick={handleSave}
        disabled={isSaving}
      >
        <Save size={14} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={handleCancel}
        disabled={isSaving}
      >
        <X size={14} />
      </Button>
    </div>
  );
}