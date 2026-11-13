import React, { useState } from 'react';
import { X, Code2, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MasterDocsCodeBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertCodeHtml: (codeHtml: string) => void;
}

export function MasterDocsCodeBlockModal({
  isOpen,
  onClose,
  onInsertCodeHtml,
}: MasterDocsCodeBlockModalProps) {
  const [language, setLanguage] = useState('typescript');
  const [code, setCode] = useState(`// Master Cloud High-Performance Document Engine
export async function initializeEcosystem(config: AppConfig): Promise<SessionState> {
  const telemetry = await TelemetryService.startSession();
  return { status: "ACTIVE", quotaBytes: 10 * 1024 * 1024 * 1024 * 1024 };
}`);
  const [showLineNumbers, setShowLineNumbers] = useState(true);

  if (!isOpen) return null;

  const handleInsert = () => {
    const lines = code.split('\n');
    let formattedLines = '';
    lines.forEach((line, idx) => {
      const lineNum = showLineNumbers
        ? `<span style="user-select: none; color: #64748b; display: inline-block; width: 28px; text-align: right; margin-right: 12px; font-size: 11px;">${
            idx + 1
          }</span>`
        : '';
      formattedLines += `<div>${lineNum}<span>${escapeHtml(line) || '&nbsp;'}</span></div>`;
    });

    const blockHtml = `
      <div class="master-docs-code-block" style="background-color: #090d16; color: #38bdf8; border-radius: 10px; padding: 14px 16px; margin: 16px 0; font-family: 'JetBrains Mono', monospace; font-size: 12px; line-height: 1.6; border: 1px solid #1e293b; position: relative;">
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1e293b; padding-bottom: 6px; margin-bottom: 10px; color: #94a3b8; font-size: 11px; text-transform: uppercase; font-weight: bold; letter-spacing: 0.5px;">
          <span>${language}</span>
          <span style="color: #64748b; font-size: 10px;">Master Code Snippet</span>
        </div>
        <div style="overflow-x: auto;">
          ${formattedLines}
        </div>
      </div>
      <p></p>
    `;

    onInsertCodeHtml(blockHtml);
    toast.success(`Inserted ${language} code block`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/80 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Code2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Code Documentation Block</h2>
              <p className="text-xs text-muted-foreground">Embed syntax formatted code with line numbers and language tag</p>
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
          <div className="flex items-center justify-between">
            <div className="w-48">
              <label className="text-xs font-semibold text-foreground block mb-1">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full text-xs rounded-xl bg-background border border-border px-3 py-2 focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="rust">Rust</option>
                <option value="go">Go</option>
                <option value="sql">SQL</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="java">Java</option>
                <option value="csharp">C#</option>
                <option value="cpp">C++</option>
                <option value="bash">Bash / Shell</option>
                <option value="powershell">PowerShell</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer pt-4">
              <input
                type="checkbox"
                checked={showLineNumbers}
                onChange={(e) => setShowLineNumbers(e.target.checked)}
                className="rounded text-primary focus:ring-primary"
              />
              Show Line Numbers
            </label>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground block mb-1">Source Code</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={8}
              className="w-full font-mono text-xs rounded-xl bg-slate-950 text-sky-400 p-4 border border-border focus:outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-border/80 bg-muted/40">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl text-xs">
            Cancel
          </Button>
          <Button variant="gradient" size="sm" onClick={handleInsert} className="rounded-xl text-xs font-bold gap-1.5">
            <Check className="h-3.5 w-3.5" />
            Insert Code Block
          </Button>
        </div>
      </div>
    </div>
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
