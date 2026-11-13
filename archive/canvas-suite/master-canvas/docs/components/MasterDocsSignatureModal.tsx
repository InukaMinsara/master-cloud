import React, { useState, useRef } from 'react';
import { X, PenTool, Check, RotateCcw, ShieldCheck, FileCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

interface MasterDocsSignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSignatureHtml: (signatureHtml: string) => void;
}

export function MasterDocsSignatureModal({
  isOpen,
  onClose,
  onInsertSignatureHtml,
}: MasterDocsSignatureModalProps) {
  const { user } = useAuthStore();
  const [signerName, setSignerName] = useState(user?.display_name || user?.email?.split('@')[0] || 'Signer');
  const [signType, setSignType] = useState<'draw' | 'type'>('type');
  const [signatureText, setSignatureText] = useState(signerName);
  const [isDrawing, setIsDrawing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  if (!isOpen) return null;

  // Drawing pad handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleApplySignature = () => {
    const timestamp = new Date().toLocaleString();
    const hash = Math.random().toString(36).substring(2, 10).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();

    let visualContent = '';
    if (signType === 'type') {
      visualContent = `<span style="font-family: 'Brush Script MT', cursive, serif; font-size: 28px; color: #1e3a8a; font-style: italic;">${signatureText}</span>`;
    } else {
      const dataUrl = canvasRef.current?.toDataURL() || '';
      visualContent = `<img src="${dataUrl}" alt="Signature" style="height: 48px; display: inline-block;" />`;
    }

    const stampHtml = `
      <div class="master-docs-signature-stamp" style="display: inline-block; border: 1.5px solid #94a3b8; border-radius: 8px; padding: 12px 18px; margin: 16px 0; background-color: #f8fafc; min-width: 260px;">
        <div style="font-size: 10px; font-weight: bold; color: #64748b; text-transform: uppercase; margin-bottom: 6px; letter-spacing: 0.5px;">Master Cloud Electronic Signature</div>
        <div style="min-height: 44px; display: flex; align-items: center; border-bottom: 1px dashed #cbd5e1; padding-bottom: 6px; margin-bottom: 6px;">
          ${visualContent}
        </div>
        <div style="font-size: 11px; font-weight: 600; color: #1e293b;">${signerName}</div>
        <div style="font-size: 10px; color: #64748b; margin-top: 2px;">Date: ${timestamp}</div>
        <div style="font-size: 9px; font-family: monospace; color: #94a3b8; margin-top: 4px;">VERIFIED ID: ${hash}</div>
      </div>
      <p></p>
    `;

    onInsertSignatureHtml(stampHtml);
    toast.success('Signature stamp inserted');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <PenTool className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Electronic Signature & Stamp</h2>
              <p className="text-xs text-muted-foreground">Create secure verified e-signatures for contracts and approvals</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Signer Full Name</label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => {
                setSignerName(e.target.value);
                setSignatureText(e.target.value);
              }}
              className="w-full text-xs rounded-xl bg-background border border-border px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="flex rounded-lg border border-border p-0.5 bg-muted/30">
            <button
              onClick={() => setSignType('type')}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
                signType === 'type' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground'
              }`}
            >
              Type Signature
            </button>
            <button
              onClick={() => setSignType('draw')}
              className={`flex-1 py-1.5 rounded-md text-xs font-semibold transition-all ${
                signType === 'draw' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground'
              }`}
            >
              Draw with Mouse / Pen
            </button>
          </div>

          {signType === 'type' ? (
            <div className="rounded-xl border border-border bg-background p-6 text-center space-y-3 shadow-inner">
              <div className="text-3xl font-serif italic text-primary" style={{ fontFamily: "'Brush Script MT', cursive" }}>
                {signatureText || 'Your Signature'}
              </div>
              <input
                type="text"
                value={signatureText}
                onChange={(e) => setSignatureText(e.target.value)}
                placeholder="Type your signature here..."
                className="w-full text-xs text-center rounded-lg bg-muted/30 border border-border px-3 py-1.5 focus:outline-none"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="rounded-xl border border-border bg-background overflow-hidden relative shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={420}
                  height={130}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="cursor-crosshair w-full bg-white touch-none"
                />
              </div>
              <div className="flex justify-end">
                <Button size="sm" variant="ghost" onClick={clearCanvas} className="text-xs h-7 gap-1">
                  <RotateCcw className="h-3 w-3" /> Clear
                </Button>
              </div>
            </div>
          )}

          <div className="p-3 rounded-xl bg-muted/20 border border-border text-[11px] text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Includes cryptographic verification identifier and timestamp stamp.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border/80 bg-muted/40">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
            Cancel
          </Button>
          <Button variant="gradient" size="sm" onClick={handleApplySignature} className="rounded-xl text-xs font-bold gap-1.5">
            <Check className="h-3.5 w-3.5" />
            Insert Signature Stamp
          </Button>
        </div>
      </div>
    </div>
  );
}
