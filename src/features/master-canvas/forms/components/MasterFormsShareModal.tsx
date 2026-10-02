import React, { useState } from 'react';
import {
  Share2,
  X,
  Copy,
  Check,
  QrCode,
  Code,
  Mail,
  ExternalLink,
  ShieldCheck,
  Globe,
} from 'lucide-react';
import { MasterFormData } from '../types';
import { toast } from 'sonner';

interface MasterFormsShareModalProps {
  formData: MasterFormData;
  isOpen: boolean;
  onClose: () => void;
}

export function MasterFormsShareModal({
  formData,
  isOpen,
  onClose,
}: MasterFormsShareModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [activeShareTab, setActiveShareTab] = useState<'link' | 'embed' | 'qr'>('link');

  if (!isOpen) return null;

  const publicUrl = `${window.location.origin}/canvas/forms/${formData.id}?mode=public`;
  const embedCode = `<iframe src="${publicUrl}" width="100%" height="700" frameborder="0" marginheight="0" marginwidth="0">Loading Master Form...</iframe>`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    toast.success('Public form link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    toast.success('Embed HTML snippet copied to clipboard!');
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-card border border-border/80 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Share Form & Collect Responses</h2>
              <p className="text-xs text-muted-foreground">Distribute to responders or embed on websites</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-border/60 pb-3">
          <button
            onClick={() => setActiveShareTab('link')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeShareTab === 'link'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Public Link</span>
          </button>

          <button
            onClick={() => setActiveShareTab('embed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeShareTab === 'embed'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Code className="h-3.5 w-3.5" />
            <span>Embed HTML</span>
          </button>

          <button
            onClick={() => setActiveShareTab('qr')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
              activeShareTab === 'qr'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>QR Code</span>
          </button>
        </div>

        {/* Tab 1: Public Link */}
        {activeShareTab === 'link' && (
          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Direct Public URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicUrl}
                  className="w-full bg-muted/40 border border-border/60 rounded-xl px-3 py-2 text-xs font-mono text-muted-foreground focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shrink-0 transition-all active:scale-95"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Anyone with this link can fill out this form in any web browser on desktop, tablet, or mobile.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Embed Code */}
        {activeShareTab === 'embed' && (
          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Embed HTML iFrame</label>
              <textarea
                readOnly
                rows={4}
                value={embedCode}
                className="w-full bg-muted/40 border border-border/60 rounded-xl p-3 text-xs font-mono text-muted-foreground focus:outline-none resize-none"
              />
            </div>
            <button
              onClick={handleCopyEmbed}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            >
              {copiedEmbed ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span>{copiedEmbed ? 'Snippet Copied' : 'Copy HTML Snippet'}</span>
            </button>
          </div>
        )}

        {/* Tab 3: QR Code */}
        {activeShareTab === 'qr' && (
          <div className="space-y-4 text-xs text-center">
            <div className="bg-white p-6 rounded-2xl inline-block border border-border/80 shadow-inner">
              <QrCode className="h-40 w-40 text-slate-900 mx-auto" />
            </div>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Scan this QR code with any mobile camera or tablet to open the form directly.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-border/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-card border border-border/80 hover:bg-muted text-xs font-semibold text-foreground"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
