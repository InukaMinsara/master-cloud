import React, { useState } from 'react';
import {
  Check,
  Copy,
  Code2,
  Terminal,
  Eye,
  RefreshCw,
  Download,
  Maximize2,
  Sparkles,
  Film,
  Image as ImageIcon,
  CloudDownload,
  HardDrive,
  Wand2,
} from 'lucide-react';
import { api } from '@/services/api';
import { useFileStore } from '@/stores/fileStore';
import { toast } from 'sonner';

export interface InlineMediaAttachmentProps {
  type: 'image' | 'video' | 'audio';
  url: string;
  prompt?: string;
  modelUsed?: string;
}

interface ChatMarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
  mediaAttachment?: InlineMediaAttachmentProps;
}

/**
 * Lightweight syntax colorizer for keywords, strings, comments, and numbers.
 */
function highlightCodeLine(line: string): React.ReactNode[] {
  // Regex token matching for common programming languages
  const tokenRegex = /(\/\/.*$|#.*$|\/\*.*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:const|let|var|function|return|import|export|from|default|class|extends|def|async|await|if|else|elif|for|while|try|catch|finally|throw|new|typeof|instanceof|interface|type|public|private|protected|static|readonly|true|false|null|undefined|None|True|False)\b|\b\d+(?:\.\d+)?\b|[{}()[\].,;+\-*/%=<>!&|^~?:])/g;

  const parts = line.split(tokenRegex);
  return parts.map((part, idx) => {
    if (!part) return null;
    const key = `t_${idx}`;

    // Comments
    if (part.startsWith('//') || part.startsWith('#') || part.startsWith('/*')) {
      return (
        <span key={key} className="text-zinc-500 italic">
          {part}
        </span>
      );
    }
    // Strings
    if (
      (part.startsWith('"') && part.endsWith('"')) ||
      (part.startsWith("'") && part.endsWith("'")) ||
      (part.startsWith('`') && part.endsWith('`'))
    ) {
      return (
        <span key={key} className="text-emerald-400">
          {part}
        </span>
      );
    }
    // Keywords
    if (
      /^(?:const|let|var|function|return|import|export|from|default|class|extends|def|async|await|if|else|elif|for|while|try|catch|finally|throw|new|typeof|instanceof|interface|type|public|private|protected|static|readonly|true|false|null|undefined|None|True|False)$/.test(
        part,
      )
    ) {
      return (
        <span key={key} className="text-purple-400 font-semibold">
          {part}
        </span>
      );
    }
    // Numbers
    if (/^\d+(?:\.\d+)?$/.test(part)) {
      return (
        <span key={key} className="text-amber-400">
          {part}
        </span>
      );
    }
    // Operators & Brackets
    if (/^[{}()[\].,;+\-*/%=<>!&|^~?:]$/.test(part)) {
      return (
        <span key={key} className="text-cyan-300/80">
          {part}
        </span>
      );
    }

    return <span key={key}>{part}</span>;
  });
}

/**
 * Dedicated ChatGPT-style Code Block with header, language badge, copy button,
 * and Live Interactive Artifacts / Preview Canvas.
 */
export function ChatGPTCodeBlock({
  code,
  language,
  isStreaming = false,
}: {
  code: string;
  language?: string;
  isStreaming?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');

  const cleanLang = (language || '').toLowerCase().trim();
  const displayLang = cleanLang || 'code';
  const isPreviewable =
    ['html', 'htm', 'svg', 'xml', 'chart', 'charts', 'graph'].includes(cleanLang) ||
    cleanLang.includes('react') ||
    cleanLang === 'jsx' ||
    cleanLang === 'tsx' ||
    code.includes('<!DOCTYPE html>') ||
    code.includes('<svg') ||
    code.includes('<canvas');

  const getPreviewDoc = () => {
    if (code.includes('<!DOCTYPE') || code.includes('<html')) return code;
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><script src="https://cdn.jsdelivr.net/npm/chart.js"><\/script><script src="https://cdn.tailwindcss.com"><\/script><style>body{margin:0;padding:16px;background:#0d0d11;color:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;}canvas{max-width:100%!important;max-height:280px!important;}</style></head><body>${code}</body></html>`;
  };

  const handleCopy = () => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const lines = code.split('\n');

  return (
    <div className="my-3.5 rounded-xl overflow-hidden border border-zinc-800 bg-[#0d0d11] shadow-lg group">
      {/* Code Header Bar (ChatGPT / Claude Artifacts Style) */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e24] border-b border-zinc-800 text-xs font-mono select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
            {displayLang === 'bash' || displayLang === 'sh' || displayLang === 'shell' ? (
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
            )}
            <span className="capitalize">{displayLang}</span>
          </div>

          {isPreviewable && !isStreaming && (
            <div className="flex items-center gap-1 bg-zinc-900/80 p-0.5 rounded-lg border border-zinc-700/60 ml-2">
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  activeTab === 'code'
                    ? 'bg-zinc-700 text-white'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Code2 className="w-3 h-3" />
                <span>Code</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  activeTab === 'preview'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'text-zinc-400 hover:text-cyan-300'
                }`}
              >
                <Eye className="w-3 h-3 text-cyan-400" />
                <span>Live Preview ⚡</span>
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-zinc-300 hover:text-white bg-zinc-800/60 hover:bg-zinc-700/80 transition-all cursor-pointer"
          title="Copy full code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body or Live Preview Canvas */}
      {activeTab === 'preview' && isPreviewable && !isStreaming ? (
        <div className="w-full bg-[#18181b] border-t border-zinc-800 overflow-hidden">
          {cleanLang === 'svg' ? (
            <div
              className="p-6 bg-zinc-950 flex items-center justify-center min-h-[220px]"
              dangerouslySetInnerHTML={{ __html: code }}
            />
          ) : (
            <iframe
              title="Interactive Live Canvas"
              sandbox="allow-scripts allow-same-origin"
              className="w-full h-80 bg-white dark:bg-zinc-950 border-0 rounded-b-xl"
              srcDoc={getPreviewDoc()}
            />
          )}
        </div>
      ) : (
        <pre className="p-4 overflow-x-auto text-xs sm:text-[13px] font-mono leading-relaxed text-zinc-100 scrollbar-thin scrollbar-thumb-zinc-700">
          <code>
            {lines.map((l, idx) => (
              <div key={`cl_${idx}`} className="table-row">
                <span className="table-cell select-none text-right pr-4 text-zinc-600 text-[11px] font-mono w-8">
                  {idx + 1}
                </span>
                <span className="table-cell whitespace-pre">
                  {highlightCodeLine(l)}
                  {isStreaming && idx === lines.length - 1 && (
                    <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-0.5 align-middle" />
                  )}
                </span>
              </div>
            ))}
          </code>
        </pre>
      )}
    </div>
  );
}

/**
 * Inline Media Renderer for in-chat image & video generation.
 */
export function InlineMediaRenderer({
  media,
}: {
  media: InlineMediaAttachmentProps;
}) {
  const [downloading, setDownloading] = useState(false);
  const [savingToDrive, setSavingToDrive] = useState(false);
  const [removingBg, setRemovingBg] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(media.url);

  const handleDownload = () => {
    setDownloading(true);
    const a = document.createElement('a');
    a.href = currentUrl;
    a.download = `master-ai-${media.type}-${Date.now()}.${
      media.type === 'video' ? 'mp4' : media.type === 'audio' ? 'mp3' : 'png'
    }`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setDownloading(false), 1500);
  };

  const handleRemoveBg = () => {
    if (removingBg) return;
    setRemovingBg(true);
    toast.info('🪄 AI Magic Eraser: Removing background...');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentUrl;
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Canvas context not available');

        ctx.drawImage(img, 0, 0);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;

        // Sample corner pixel for dominant background color
        const bgR = data[0];
        const bgG = data[1];
        const bgB = data[2];
        const threshold = 38;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const diff = Math.sqrt(
            Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2),
          );
          if (diff < threshold) {
            data[i + 3] = 0; // Alpha transparent
          }
        }

        ctx.putImageData(imgData, 0, 0);
        const transparentDataUrl = canvas.toDataURL('image/png');
        setCurrentUrl(transparentDataUrl);
        toast.success('🪄 Background removed! Transparent PNG ready.');
      } catch {
        toast.error('Could not remove background from this image.');
      } finally {
        setRemovingBg(false);
      }
    };
    img.onerror = () => {
      toast.error('Failed to load image for processing.');
      setRemovingBg(false);
    };
  };

  const handleSaveToDrive = async () => {
    if (savingToDrive) return;
    setSavingToDrive(true);
    try {
      toast.info('Saving to Master Cloud Drive...');
      const response = await fetch(currentUrl);
      const blob = await response.blob();
      const ext = media.type === 'video' ? 'mp4' : media.type === 'audio' ? 'mp3' : 'png';
      const filename = `AI_${media.type.toUpperCase()}_${Date.now()}.${ext}`;
      const file = new File([blob], filename, {
        type: blob.type || (media.type === 'video' ? 'video/mp4' : media.type === 'audio' ? 'audio/mpeg' : 'image/png'),
      });

      await api.uploadFile(file);
      await useFileStore.getState().fetchItems();
      toast.success(`Saved to Master Cloud Drive: ${filename}`);
    } catch (err: any) {
      toast.error(`Failed to save to Drive: ${err?.message || err}`);
    } finally {
      setSavingToDrive(false);
    }
  };

  return (
    <div className="my-3 rounded-2xl overflow-hidden border border-border/70 bg-card shadow-md">
      {/* Header Bar */}
      <div className="px-3.5 py-2 bg-muted/40 border-b border-border/50 flex items-center justify-between text-xs font-medium">
        <div className="flex items-center gap-1.5 text-foreground font-semibold">
          {media.type === 'image' && <Sparkles className="w-4 h-4 text-purple-400" />}
          {media.type === 'video' && <Film className="w-4 h-4 text-cyan-400" />}
          {media.type === 'audio' && <Sparkles className="w-4 h-4 text-emerald-400" />}
          <span className="capitalize">{media.type} Generation</span>
          {media.modelUsed && (
            <span className="ml-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {media.modelUsed}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {media.type === 'image' && (
            <button
              type="button"
              disabled={removingBg}
              onClick={handleRemoveBg}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/20 transition-all cursor-pointer disabled:opacity-50"
              title="Remove background with AI Magic Eraser"
            >
              <Wand2 className={`w-3.5 h-3.5 text-purple-400 ${removingBg ? 'animate-spin' : ''}`} />
              <span>{removingBg ? 'Erasing...' : '🪄 Remove BG'}</span>
            </button>
          )}

          <button
            type="button"
            disabled={savingToDrive}
            onClick={handleSaveToDrive}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all cursor-pointer disabled:opacity-50"
            title="Save directly to Master Cloud Drive storage"
          >
            <CloudDownload className={`w-3.5 h-3.5 ${savingToDrive ? 'animate-bounce' : ''}`} />
            <span>{savingToDrive ? 'Saving...' : 'Save to Drive'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-secondary hover:bg-secondary/80 text-foreground transition-all cursor-pointer"
            title="Download file to computer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{downloading ? 'Downloading...' : 'Download'}</span>
          </button>
        </div>
      </div>

      {/* Media Content Box */}
      <div className="p-2 sm:p-3 bg-black/40 flex flex-col items-center justify-center">
        {media.type === 'image' && (
          <div className="relative group max-w-full">
            <img
              src={currentUrl}
              alt={media.prompt || 'Generated AI Image'}
              className="rounded-xl max-h-[500px] w-auto object-contain border border-white/10 shadow-lg"
              loading="lazy"
            />
          </div>
        )}

        {media.type === 'video' && (
          <video
            controls
            playsInline
            loop
            preload="metadata"
            className="rounded-xl max-h-[500px] w-full object-contain border border-white/10 shadow-lg bg-black"
            src={media.url}
          />
        )}

        {media.type === 'audio' && (
          <audio controls className="w-full mt-2" src={media.url} />
        )}

        {media.prompt && (
          <p className="mt-2 text-[11px] text-muted-foreground text-center italic line-clamp-2 px-2">
            "{media.prompt}"
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Parses inline formatting: **bold**, `code`, *italic*, [link](url)
 */
function renderInlineFormatting(text: string, keyPrefix: string): React.ReactNode[] {
  const inlineRegex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(inlineRegex);

  return parts.map((part, idx) => {
    const key = `${keyPrefix}_in_${idx}`;
    if (!part) return null;

    // Bold
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={key} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Inline Code
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={key}
          className="px-1.5 py-0.5 rounded-md bg-zinc-800/90 text-amber-300 dark:text-amber-200 border border-zinc-700/60 font-mono text-[11px] sm:text-xs mx-0.5"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    // Italic
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={key} className="italic text-foreground/80">
          {part.slice(1, -1)}
        </em>
      );
    }

    // Markdown Links [label](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={key}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-400 underline underline-offset-2 hover:text-cyan-300 font-medium"
        >
          {linkMatch[1]}
        </a>
      );
    }

    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

/**
 * Main Markdown and Code Renderer for Chat Messages (ChatGPT Style).
 */
export function ChatMarkdownRenderer({
  content,
  isStreaming = false,
  mediaAttachment,
}: ChatMarkdownRendererProps) {
  if (!content && isStreaming && !mediaAttachment) {
    return (
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-mono py-1">
        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
        <span>Generating response...</span>
      </div>
    );
  }

  const rawLines = (content || '').split('\n');
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeLanguage = '';
  let codeBuffer: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    const trimLine = rawLine.trim();

    // Check for code fence start/end (```lang)
    if (trimLine.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLanguage = trimLine.slice(3).trim();
        codeBuffer = [];
      } else {
        // Code fence closed
        elements.push(
          <ChatGPTCodeBlock
            key={`code_${i}`}
            code={codeBuffer.join('\n')}
            language={codeLanguage}
          />,
        );
        inCodeBlock = false;
        codeLanguage = '';
        codeBuffer = [];
      }
      continue;
    }

    // Accumulating inside code block
    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    // Empty blank line
    if (!trimLine) {
      elements.push(<div key={`blank_${i}`} className="h-2" />);
      continue;
    }

    // Headings
    if (trimLine.startsWith('# ')) {
      elements.push(
        <h1 key={`h1_${i}`} className="text-base sm:text-lg font-bold text-foreground mt-3 mb-1.5">
          {renderInlineFormatting(trimLine.slice(2), `h1_${i}`)}
        </h1>,
      );
      continue;
    }
    if (trimLine.startsWith('## ')) {
      elements.push(
        <h2 key={`h2_${i}`} className="text-sm sm:text-base font-bold text-foreground mt-2.5 mb-1">
          {renderInlineFormatting(trimLine.slice(3), `h2_${i}`)}
        </h2>,
      );
      continue;
    }
    if (trimLine.startsWith('### ')) {
      elements.push(
        <h3 key={`h3_${i}`} className="text-xs sm:text-sm font-bold text-cyan-300 mt-2 mb-0.5">
          {renderInlineFormatting(trimLine.slice(4), `h3_${i}`)}
        </h3>,
      );
      continue;
    }

    // Blockquote
    if (trimLine.startsWith('> ')) {
      elements.push(
        <blockquote
          key={`bq_${i}`}
          className="border-l-2 border-primary/50 pl-3 py-1 my-1.5 text-muted-foreground italic text-xs sm:text-sm bg-muted/20 rounded-r-lg"
        >
          {renderInlineFormatting(trimLine.slice(2), `bq_${i}`)}
        </blockquote>,
      );
      continue;
    }

    // Bulleted List Items
    if (/^[-*•]\s+/.test(trimLine)) {
      elements.push(
        <div key={`bullet_${i}`} className="flex items-start gap-2 my-1 pl-1">
          <span className="text-primary font-bold text-sm leading-tight">•</span>
          <div className="flex-1 text-xs sm:text-sm leading-relaxed">
            {renderInlineFormatting(trimLine.replace(/^[-*•]\s+/, ''), `bullet_${i}`)}
          </div>
        </div>,
      );
      continue;
    }

    // Numbered List Items
    const numMatch = trimLine.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      elements.push(
        <div key={`num_${i}`} className="flex items-start gap-2 my-1 pl-1">
          <span className="text-cyan-400 font-mono text-xs font-semibold shrink-0">
            {numMatch[1]}.
          </span>
          <div className="flex-1 text-xs sm:text-sm leading-relaxed">
            {renderInlineFormatting(numMatch[2], `num_${i}`)}
          </div>
        </div>,
      );
      continue;
    }

    // Standard paragraph line
    elements.push(
      <p key={`p_${i}`} className="text-xs sm:text-sm leading-relaxed my-0.5">
        {renderInlineFormatting(rawLine, `p_${i}`)}
      </p>,
    );
  }

  // If streaming and code block is still open (waiting for closing ```)
  if (inCodeBlock && codeBuffer.length > 0) {
    elements.push(
      <ChatGPTCodeBlock
        key="code_streaming_open"
        code={codeBuffer.join('\n')}
        language={codeLanguage}
        isStreaming={isStreaming}
      />,
    );
  }

  return (
    <div className="space-y-1.5 leading-relaxed break-words">
      {mediaAttachment && <InlineMediaRenderer media={mediaAttachment} />}
      {elements}
    </div>
  );
}
