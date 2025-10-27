import { ActivityLog } from '@/types/logistics';

interface ActivityLogItemProps {
  log: ActivityLog;
}

export const ActivityLogItem = ({ log }: ActivityLogItemProps) => {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-primary rounded-full"></div>
        <div>
          <p className="text-sm font-medium text-foreground">{log.action}: {log.item_name}</p>
          <p className="text-xs text-muted-foreground">{log.user_name}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {new Date(log.created_at).toLocaleDateString()}
      </p>
    </div>
  );
};
