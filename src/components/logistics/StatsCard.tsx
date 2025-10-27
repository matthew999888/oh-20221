import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  colorClass: string;
}

export const StatsCard = ({ label, value, icon: Icon, colorClass }: StatsCardProps) => {
  return (
    <div className={cn(
      "bg-card rounded-lg shadow-md p-6 border-l-4 transition-all hover:shadow-lg",
      colorClass
    )}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{label}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{value}</p>
        </div>
        <Icon size={40} className="opacity-20" />
      </div>
    </div>
  );
};
