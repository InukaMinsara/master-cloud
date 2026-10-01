import React from 'react';
import { Laptop, Smartphone, Monitor, Shield, LogOut, CheckCircle2 } from 'lucide-react';
import { api } from '@/services/api';
import { DeviceRecord } from '@/types/database';
import { formatDateRelative } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export function DevicePage() {
  const [devices, setDevices] = React.useState<DeviceRecord[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const loadDevices = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getDevices();
      setDevices(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const handleRevoke = async (id: string, name: string) => {
    await api.revokeDevice(id);
    toast.success(`Session for "${name}" has been revoked`);
    loadDevices();
  };

  const getPlatformIcon = (platform: string) => {
    if (platform.toLowerCase().includes('phone') || platform.toLowerCase().includes('ios') || platform.toLowerCase().includes('android')) {
      return <Smartphone className="h-5 w-5 text-purple-500" />;
    }
    if (platform.toLowerCase().includes('mac')) {
      return <Laptop className="h-5 w-5 text-blue-500" />;
    }
    return <Monitor className="h-5 w-5 text-emerald-500" />;
  };

  return (
    <div className="flex flex-col flex-1 h-full overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-border/60">
        <div>
          <h2 className="text-xl font-bold text-foreground">Device Center</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage active sessions across desktop browsers, sync clients, and mobile devices.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Active Sessions ({devices.length})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {devices.map((device) => (
            <div
              key={device.id}
              className={`p-5 rounded-3xl border transition-all ${
                device.is_current
                  ? 'border-primary/50 bg-primary/5 shadow-md'
                  : 'border-border bg-card hover:border-border/80'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/80">
                    {getPlatformIcon(device.platform)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-foreground">{device.device_name}</h4>
                      {device.is_current && (
                        <Badge variant="success" className="text-[10px] py-0 px-2">
                          This Device
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {device.platform} • {device.browser}
                    </p>
                  </div>
                </div>

                {!device.is_current && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevoke(device.id, device.device_name)}
                    className="rounded-xl h-8 text-xs text-destructive hover:bg-destructive/10 border-destructive/30"
                  >
                    <LogOut className="h-3.5 w-3.5 mr-1" /> Revoke
                  </Button>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span>IP: {device.ip_address || '127.0.0.1'}</span>
                <span>Active {formatDateRelative(device.last_active_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
