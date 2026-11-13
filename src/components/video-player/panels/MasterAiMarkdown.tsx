/**
 * Safe lightweight Markdown & interactive [mm:ss] timestamp renderer for MASTER AI v1.0.
 * Avoids raw HTML injection while supporting headings, bold/italic, lists, blockquotes,
 * copyable fenced code blocks, and clickable timeline seek links.
 */

import React, { useState } from 'react';
import { Check, Copy, Play } from 'lucide-react';

interface MasterAiMarkdownProps {
  text: string;
  onSeek?: (seconds: number) => void;
}

function parseTimestampToSeconds(mmss: string): number | null {
  const match = mmss.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  if (match[3] !== undefined) {
    return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

function renderInlineSegments(
  line: string,
  onSeek?: (seconds: number) => void,
  keyPrefix = 'in',
): React.ReactNode[] {
  // Match **bold**, `code`, *italic*, <kbd>key</kbd>, and [mm:ss] timestamps cleanly
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\[\d{1,2}:\d{2}(?::\d{2})?\]|<kbd>[^<]+<\/kbd>|\*[^*]+\*)/g;
  const parts = line.split(pattern);
  return parts.map((part, idx) => {
    const key = `${keyPrefix}_${idx}`;
    if (!part) return null;

    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={key} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={key}
          className="px-1.5 py-0.5 rounded bg-black/50 border border-white/10 text-cyan-300 font-mono text-[11px]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('<kbd>') && part.endsWith('</kbd>')) {
      return (
        <kbd
          key={key}
          className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20 text-white font-mono text-[10px]"
        >
          {part.slice(5, -6)}
        </kbd>
      );
    }
    if (part.startsWith('[') && part.endsWith(']')) {
      const secs = parseTimestampToSeconds(part.slice(1, -1));
      if (secs !== null && onSeek) {
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSeek(secs)}
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-300 border border-cyan-500/30 font-mono text-[10px] font-bold transition-colors"
            title={`Seek to ${part.slice(1, -1)}`}
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            {part.slice(1, -1)}
          </button>
        );
      }
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={key} className="italic text-white/80">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

function CopyableCodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="my-2 rounded-xl overflow-hidden border border-white/10 bg-black/60">
      <div className="flex items-center justify-between px-3 py-1 bg-white/5 border-b border-white/10 text-[10px] text-white/50 font-mono">
        <span>{lang || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1 text-white/70 hover:text-cyan-300 transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="p-2.5 overflow-x-auto text-[11px] font-mono text-cyan-100 leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function MasterAiMarkdown({ text, onSeek }: MasterAiMarkdownProps) {
  const lines = (text || '').split('\n');
  const blocks: React.ReactNode[] = [];
  let inCode = false;
  let codeLang = '';
  let codeLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimLine = rawLine.trim();

    if (trimLine.startsWith('```')) {
      if (!inCode) {
        inCode = true;
        codeLang = trimLine.slice(3).trim();
        codeLines = [];
      } else {
        blocks.push(
          <CopyableCodeBlock key={`cb_${i}`} lang={codeLang} code={codeLines.join('\n')} />,
        );
        inCode = false;
        codeLang = '';
        codeLines = [];
      }
      continue;
    }

    if (inCode) {
      codeLines.push(rawLine);
      continue;
    }

    if (!trimLine) {
      blocks.push(<div key={`sp_${i}`} className="h-1.5" />);
      continue;
    }

    if (trimLine.startsWith('### ')) {
      blocks.push(
        <h4 key={`h3_${i}`} className="text-[13px] font-bold text-cyan-200 mt-1 mb-0.5">
          {renderInlineSegments(trimLine.slice(4), onSeek, `h3_${i}`)}
        </h4>,
      );
      continue;
    }

    if (trimLine.startsWith('#### ')) {
      blocks.push(
        <h5 key={`h4_${i}`} className="text-xs font-bold text-white/90 mt-1 mb-0.5">
          {renderInlineSegments(trimLine.slice(5), onSeek, `h4_${i}`)}
        </h5>,
      );
      continue;
    }

    if (trimLine.startsWith('> ')) {
      blocks.push(
        <blockquote
          key={`bq_${i}`}
          className="border-l-2 border-cyan-500/40 pl-2.5 py-0.5 text-[11px] text-white/60 italic my-1"
        >
          {renderInlineSegments(trimLine.slice(2), onSeek, `bq_${i}`)}
        </blockquote>,
      );
      continue;
    }

    if (/^[-•]\s+/.test(trimLine)) {
      blocks.push(
        <div key={`li_${i}`} className="flex items-start gap-1.5 pl-1 my-0.5">
          <span className="text-cyan-400 mt-0.5">•</span>
          <span className="flex-1">{renderInlineSegments(trimLine.replace(/^[-•]\s+/, ''), onSeek, `li_${i}`)}</span>
        </div>,
      );
      continue;
    }

    const numMatch = trimLine.match(/^(\d+\.)\s+(.*)$/);
    if (numMatch) {
      blocks.push(
        <div key={`ol_${i}`} className="flex items-start gap-1.5 pl-1 my-0.5">
          <span className="text-cyan-300 font-mono text-[11px] font-semibold shrink-0">{numMatch[1]}</span>
          <span className="flex-1">{renderInlineSegments(numMatch[2], onSeek, `ol_${i}`)}</span>
        </div>,
      );
      continue;
    }

    blocks.push(
      <p key={`p_${i}`} className="leading-relaxed">
        {renderInlineSegments(rawLine, onSeek, `p_${i}`)}
      </p>,
    );
  }

  if (inCode && codeLines.length > 0) {
    blocks.push(
      <CopyableCodeBlock key="cb_eof" lang={codeLang} code={codeLines.join('\n')} />,
    );
  }

  return <div className="space-y-0.5 break-words">{blocks}</div>;
}
