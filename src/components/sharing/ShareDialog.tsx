import React from 'react';
import {
  Link2,
  Copy,
  Check,
  QrCode,
  Lock,
  Calendar,
  Download,
  Trash2,
  Users,
  Shield,
  Globe,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useUIStore } from '@/stores/uiStore';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';
import { ShareLinkRecord, ShareRecord } from '@/types/database';
import { toast } from 'sonner';

export function ShareDialog() {
  const { shareModalItem, setShareModalItem } = useUIStore();
  const [activeTab, setActiveTab] = React.useState<'link' | 'invite'>('link');

  // Invite state
  const [inviteEmail, setInviteEmail] = React.useState('');
  const [invitePermission, setInvitePermission] = React.useState<'viewer' | 'commenter' | 'editor'>('viewer');
  const [shares, setShares] = React.useState<ShareRecord[]>([]);

  // Public link state
  const [links, setLinks] = React.useState<ShareLinkRecord[]>([]);
  const [hasPassword, setHasPassword] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [allowDownload, setAllowDownload] = React.useState(true);
  const [expiresInDays, setExpiresInDays] = React.useState<number | null>(null);
  const [showQrCode, setShowQrCode] = React.useState(false);
  const [copiedToken, setCopiedToken] = React.useState<string | null>(null);

  const isOpen = Boolean(shareModalItem);
  const item = shareModalItem?.item;
  const isFolder = shareModalItem?.isFolder ?? false;

  const loadData = React.useCallback(async () => {
    if (!item?.id) return;
    try {
      const [sharesData, linksData] = await Promise.all([
        api.getShares(item.id),
        api.getShareLinks(item.id),
      ]);
      setShares(sharesData);
      setLinks(linksData);
    } catch {
      // Ignored
    }
  }, [item?.id]);

  React.useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, loadData]);

  if (!isOpen || !item) return null;

  const handleCreateShareLink = async () => {
    let expiresAt: string | null = null;
    if (expiresInDays) {
      expiresAt = new Date(Date.now() + expiresInDays * 86400000).toISOString();
    }

    const newLink = await api.createShareLink({
      resourceType: isFolder ? 'folder' : 'file',
      resourceId: item.id,
      permission: 'viewer',
      hasPassword,
      password: hasPassword ? password : '',
      allowDownload,
      expiresAt,
    });

    setLinks(prev => [newLink, ...prev]);
    toast.success('Public share link generated');
  };

  const handleRevokeLink = async (linkId: string) => {
    await api.revokeShareLink(linkId);
    setLinks(prev => prev.filter(l => l.id !== linkId));
    toast.success('Share link revoked');
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      const newShare = await api.createShare(
        isFolder ? 'folder' : 'file',
        item.id,
        inviteEmail.trim(),
        invitePermission
      );
      setShares(prev => [...prev, newShare]);
      setInviteEmail('');
      toast.success(`Access granted to ${inviteEmail}`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to share');
    }
  };

  const handleRemoveShare = async (shareId: string) => {
    await api.deleteShare(shareId);
    setShares(prev => prev.filter(s => s.id !== shareId));
    toast.success('Access removed');
  };

  const copyToClipboard = (token: string) => {
    const fullUrl = `${window.location.origin}/share/${token}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedToken(token);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopiedToken(null), 2500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && setShareModalItem(null)} className="max-w-lg">
      <DialogHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <DialogTitle>Share "{item.name}"</DialogTitle>
        </div>
        <DialogDescription>
          Invite team members directly or create a secure public link.
        </DialogDescription>
      </DialogHeader>

      {/* Tabs */}
      <div className="flex border-b border-border mb-4">
        <button
          onClick={() => setActiveTab('link')}
          className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'link' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          <Link2 className="h-4 w-4" /> Public Links
        </button>
        <button
          onClick={() => setActiveTab('invite')}
          className={`flex-1 py-2 text-xs font-semibold border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
            activeTab === 'invite' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          <Users className="h-4 w-4" /> People & Collaborators
        </button>
      </div>

      {activeTab === 'link' ? (
        <div className="space-y-4">
          {/* Active Links */}
          {links.length > 0 ? (
            <div className="space-y-2">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Active Public Links
              </h5>
              {links.map((link) => {
                const fullUrl = `${window.location.origin}/share/${link.token}`;
                return (
                  <div key={link.id} className="p-3 rounded-xl border border-border bg-secondary/30 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        readOnly
                        value={fullUrl}
                        className="bg-transparent text-xs font-mono text-foreground truncate w-full select-all focus:outline-none"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(link.token)}
                          className="h-8 rounded-lg text-xs"
                        >
                          {copiedToken === link.token ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowQrCode(!showQrCode)}
                          className="h-8 rounded-lg text-xs"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleRevokeLink(link.id)}
                          className="h-8 rounded-lg text-xs"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {showQrCode && (
                      <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-inner my-2">
                        <QRCodeSVG value={fullUrl} size={140} />
                        <span className="text-[10px] text-gray-500 mt-2 font-mono">Scan QR Code</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span>{link.view_count} views</span>
                      <span>•</span>
                      <span>{link.download_count} downloads</span>
                      {link.has_password && <span>• Password protected</span>}
                      {link.expires_at && <span>• Expires {new Date(link.expires_at).toLocaleDateString()}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl border border-dashed border-border text-center space-y-3">
              <p className="text-xs text-muted-foreground">No active public link created yet.</p>

              {/* Options */}
              <div className="space-y-2 text-left pt-2 border-t border-border/40">
                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasPassword}
                    onChange={(e) => setHasPassword(e.target.checked)}
                    className="rounded"
                  />
                  <span>Require password to view / download</span>
                </label>
                {hasPassword && (
                  <Input
                    type="password"
                    placeholder="Enter security password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-8 text-xs rounded-lg"
                  />
                )}

                <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowDownload}
                    onChange={(e) => setAllowDownload(e.target.checked)}
                    className="rounded"
                  />
                  <span>Allow viewers to download</span>
                </label>

                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                  <span>Expiration:</span>
                  <select
                    value={expiresInDays || ''}
                    onChange={(e) => setExpiresInDays(e.target.value ? Number(e.target.value) : null)}
                    className="bg-secondary text-foreground text-xs rounded-lg p-1 border border-border"
                  >
                    <option value="">Never</option>
                    <option value="1">1 Day</option>
                    <option value="7">7 Days</option>
                    <option value="30">30 Days</option>
                  </select>
                </div>
              </div>

              <Button onClick={handleCreateShareLink} className="w-full text-xs rounded-xl">
                Create Public Link
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Invite user by email */
        <div className="space-y-4">
          <form onSubmit={handleInviteUser} className="space-y-2">
            <div className="flex gap-2">
              <Input
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
              <select
                value={invitePermission}
                onChange={(e) => setInvitePermission(e.target.value as any)}
                className="bg-secondary text-foreground text-xs rounded-xl px-2 border border-border"
              >
                <option value="viewer">Viewer</option>
                <option value="commenter">Commenter</option>
                <option value="editor">Editor</option>
              </select>
            </div>
            <Button type="submit" className="w-full text-xs rounded-xl">
              Send Invitation
            </Button>
          </form>

          {/* Current Collaborators */}
          <div className="space-y-2 pt-2">
            <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Current Access
            </h5>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 text-xs">
                <div>
                  <span className="font-semibold text-foreground">You (Owner)</span>
                </div>
                <span className="text-[11px] text-muted-foreground">Full Access</span>
              </div>

              {shares.map((share) => (
                <div key={share.id} className="flex items-center justify-between p-2.5 rounded-xl bg-secondary/30 text-xs">
                  <div>
                    <span className="font-medium text-foreground">{share.grantee_email}</span>
                    <span className="text-[10px] text-muted-foreground block capitalize">{share.permission}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveShare(share.id)}
                    className="text-destructive hover:underline text-[11px]"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
