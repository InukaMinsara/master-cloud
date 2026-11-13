import React, { useState } from 'react';
import { X, Shield, Lock, Globe, Code, Copy, Check, Eye, Download, Printer } from 'lucide-react';
import { DocSecuritySettings } from '../types';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MasterDocsSecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentTitle: string;
  security?: DocSecuritySettings;
  onSaveSecurity: (sec: DocSecuritySettings) => void;
}

export function MasterDocsSecurityModal({
  isOpen,
  onClose,
  documentTitle,
  security,
  onSaveSecurity,
}: MasterDocsSecurityModalProps) {
  const [sec, setSec] = useState<DocSecuritySettings>(
    () =>
      security || {
        isPublic: false,
        isPasswordProtected: false,
        allowDownload: true,
        allowPrint: true,
        allowComments: true,
        allowCopy: true,
        isLocked: false,
      }
  );

  const [password, setPassword] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  if (!isOpen) return null;

  const publicUrl = `${window.location.origin}/canvas/docs/view/${encodeURIComponent(
    documentTitle.toLowerCase().replace(/\s+/g, '-')
  )}`;
  const embedCode = `<iframe src="${publicUrl}" width="100%" height="800px" frameborder="0" allowfullscreen></iframe>`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
    toast.success('Public link copied to clipboard');
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
    toast.success('Embed iframe code copied');
  };

  const handleSave = () => {
    onSaveSecurity(sec);
    toast.success('Security and publishing permissions saved');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Document Security, Permissions & Publishing</h2>
              <p className="text-xs text-muted-foreground">Manage public web viewing, iframe embeds, password locks, and rights</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Public Sharing / Publishing */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-foreground">Public Web Publishing</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!sec.isPublic}
                  onChange={(e) => setSec({ ...sec, isPublic: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {sec.isPublic && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={publicUrl}
                    className="flex-1 text-xs rounded-xl bg-background border border-border px-3 py-2 font-mono"
                  />
                  <Button size="sm" variant="outline" onClick={handleCopyLink} className="rounded-xl text-xs gap-1.5">
                    {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy Link
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={embedCode}
                    className="flex-1 text-xs rounded-xl bg-background border border-border px-3 py-2 font-mono truncate"
                  />
                  <Button size="sm" variant="outline" onClick={handleCopyEmbed} className="rounded-xl text-xs gap-1.5">
                    {copiedEmbed ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Code className="h-3.5 w-3.5" />}
                    Copy Embed
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Granular Permissions */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-foreground">Viewer Rights & Protections</div>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer p-3 rounded-xl border border-border bg-card">
                <input
                  type="checkbox"
                  checked={sec.allowDownload}
                  onChange={(e) => setSec({ ...sec, allowDownload: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                Allow DOCX/PDF Download
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer p-3 rounded-xl border border-border bg-card">
                <input
                  type="checkbox"
                  checked={sec.allowPrint}
                  onChange={(e) => setSec({ ...sec, allowPrint: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
                <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                Allow Printing
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer p-3 rounded-xl border border-border bg-card">
                <input
                  type="checkbox"
                  checked={sec.allowCopy}
                  onChange={(e) => setSec({ ...sec, allowCopy: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                Allow Text Selection / Copy
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer p-3 rounded-xl border border-border bg-card">
                <input
                  type="checkbox"
                  checked={sec.isLocked}
                  onChange={(e) => setSec({ ...sec, isLocked: e.target.checked })}
                  className="rounded text-primary focus:ring-primary"
                />
                <Lock className="h-3.5 w-3.5 text-destructive" />
                Lock Document (Read-Only)
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border/80 bg-muted/40">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
            Cancel
          </Button>
          <Button variant="gradient" size="sm" onClick={handleSave} className="rounded-xl text-xs font-bold gap-1.5">
            <Check className="h-3.5 w-3.5" />
            Save Security Policy
          </Button>
        </div>
      </div>
    </div>
  );
}
