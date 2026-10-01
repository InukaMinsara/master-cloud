import React from 'react';
import { Activity, Upload, Download, Trash2, RotateCcw, Share2, MessageSquare, LogIn, ShieldAlert } from 'lucide-react';
import { api } from '@/services/api';
import { ActivityLogRecord } from '@/types/database';
import { formatDateTime, formatDateRelative } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export function ActivityPage() {
  const [logs, setLogs] = React.useState<ActivityLogRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setIsLoading(true);
    api.getActivityLogs(50)
      .then(setLogs)
      .finally(() => setIsLoading(false));
  }, []);

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'upload':
        return <Badge variant="success">Upload</Badge>;
      case 'download':
        return <Badge variant="info">Download</Badge>;
      case 'delete':
        return <Badge variant="destructive">Trash</Badge>;
      case 'permanent_delete':
        return <Badge variant="destructive">Purged</Badge>;
      case 'restore':
        return <Badge variant="warning">Restore</Badge>;
      case 'share':
        return <Badge variant="default">Share</Badge>;
      case 'login':
        return <Badge variant="secondary">Sign In</Badge>;
      default:
        return <Badge variant="outline">{action}</Badge>;
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border/60">
        <div>
          <h2 className="text-xl font-bold text-foreground">Activity & Audit Log</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Immutable security and file manipulation event trail across your account.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-border/80 overflow-hidden bg-card shadow-xl">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b border-border/60 bg-secondary/30 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="px-4 py-3.5">Action</th>
              <th className="px-4 py-3.5">Resource</th>
              <th className="px-4 py-3.5 hidden md:table-cell">Client Info</th>
              <th className="px-4 py-3.5 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-accent/40 transition-colors">
                <td className="px-4 py-3">
                  {getActionBadge(log.action)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground truncate max-w-xs sm:max-w-md">
                      {log.resource_name || log.resource_type}
                    </span>
                    <span className="text-[10px] text-muted-foreground capitalize">
                      {log.resource_type}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground">
                  <div className="flex flex-col text-[11px]">
                    <span>{log.ip_address || '127.0.0.1'}</span>
                    <span className="text-[10px] truncate max-w-[200px]">{log.user_agent || 'Browser'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-muted-foreground">
                  <div className="flex flex-col text-right">
                    <span className="font-medium text-foreground">{formatDateRelative(log.created_at)}</span>
                    <span className="text-[10px] text-muted-foreground">{formatDateTime(log.created_at)}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
