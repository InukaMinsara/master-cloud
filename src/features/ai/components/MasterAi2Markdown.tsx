/**
 * src/features/ai/components/MasterAi2Markdown.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI 2.0 — HIGH-SPEED MARKDOWN & CODE COMPONENT
 * Renders streaming Markdown, code blocks with copy/syntax coloring,
 * tables, lists, and formatted text with zero lag.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import { Check, Copy, Code2, Terminal } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  isStreaming?: boolean;
}

function highlightSyntax(line: string): React.ReactNode[] {
  const tokenRegex = /(\/\/.*$|#.*$|\/\*.*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:const|let|var|function|return|import|export|from|default|class|extends|def|async|await|if|else|elif|for|while|try|catch|finally|throw|new|typeof|interface|type|public|private|static|readonly|true|false|null|undefined|None|True|False)\b|\b\d+(?:\.\d+)?\b|[{}()[\].,;+\-*/%=<>!&|^~?:])/g;

  const parts = line.split(tokenRegex);
  return parts.map((part, idx) => {
    if (!part) return null;
    const key = `t_${idx}`;

    if (part.startsWith('//') || part.startsWith('#') || part.startsWith('/*')) {
      return (
        <span key={key} className="text-zinc-500 italic">
          {part}
        </span>
      );
    }
    if ((part.startsWith('"') && part.endsWith('"')) || (part.startsWith("'") && part.endsWith("'")) || (part.startsWith('`') && part.endsWith('`'))) {
      return (
        <span key={key} className="text-emerald-400">
          {part}
        </span>
      );
    }
    if (/^(?:const|let|var|function|return|import|export|from|default|class|extends|def|async|await|if|else|elif|for|while|try|catch|finally|throw|new|typeof|interface|type|public|private|static|readonly|true|false|null|undefined|None|True|False)$/.test(part)) {
      return (
        <span key={key} className="text-purple-400 font-semibold">
          {part}
        </span>
      );
    }
    if (/^\d+(?:\.\d+)?$/.test(part)) {
      return (
        <span key={key} className="text-amber-400">
          {part}
        </span>
      );
    }
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

export function MasterAi2CodeBlock({ code, language, isStreaming = false }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const displayLang = (language || 'code').toLowerCase().trim();

  const handleCopy = () => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const lines = code.split('\n');

  return (
    <div className="my-3.5 rounded-xl overflow-hidden border border-white/[0.08] bg-[#0c0c10] shadow-md group">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-white/[0.04] border-b border-white/[0.06] text-xs font-mono select-none">
        <div className="flex items-center gap-2 text-zinc-400 font-medium">
          {displayLang === 'bash' || displayLang === 'sh' || displayLang === 'shell' ? (
            <Terminal className="w-3.5 h-3.5 text-amber-400" />
          ) : (
            <Code2 className="w-3.5 h-3.5 text-cyan-400" />
          )}
          <span className="capitalize">{displayLang}</span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium text-zinc-300 hover:text-white bg-white/[0.06] hover:bg-white/[0.1] transition-all cursor-pointer"
          title="Copy full code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-zinc-400" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <pre className="p-3.5 overflow-x-auto text-xs sm:text-[13px] font-mono leading-relaxed text-zinc-100 scrollbar-thin scrollbar-thumb-zinc-700">
        <code>
          {lines.map((l, idx) => (
            <div key={`cl_${idx}`} className="table-row">
              <span className="table-cell select-none text-right pr-4 text-zinc-600 text-[11px] font-mono w-8">
                {idx + 1}
              </span>
              <span className="table-cell whitespace-pre">
                {highlightSyntax(l)}
                {isStreaming && idx === lines.length - 1 && (
                  <span className="inline-block w-2 h-3.5 bg-cyan-400 animate-pulse ml-0.5 align-middle" />
                )}
              </span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}

export function MasterAi2Markdown({ content, isStreaming }: { content: string; isStreaming?: boolean }) {
  if (!content) return null;

  // Split content by code blocks ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const elements: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.substring(lastIndex, match.index);
    if (textBefore) {
      elements.push(<MarkdownTextChunk key={`text_${lastIndex}`} text={textBefore} />);
    }

    const lang = match[1] || 'code';
    const code = match[2] || '';
    elements.push(
      <MasterAi2CodeBlock key={`code_${match.index}`} language={lang} code={code} isStreaming={false} />
    );

    lastIndex = match.index + match[0].length;
  }

  // Remainder
  if (lastIndex < content.length) {
    const trailing = content.substring(lastIndex);
    // Check if trailing is an unclosed code block currently streaming
    if (trailing.includes('```')) {
      const codeStart = trailing.indexOf('```');
      const textBefore = trailing.substring(0, codeStart);
      if (textBefore) {
        elements.push(<MarkdownTextChunk key={`text_trail_${lastIndex}`} text={textBefore} />);
      }
      const rawCode = trailing.substring(codeStart + 3);
      const firstNewline = rawCode.indexOf('\n');
      const lang = firstNewline !== -1 ? rawCode.substring(0, firstNewline).trim() : 'code';
      const code = firstNewline !== -1 ? rawCode.substring(firstNewline + 1) : rawCode;
      elements.push(
        <MasterAi2CodeBlock key={`code_stream_${lastIndex}`} language={lang} code={code} isStreaming={isStreaming} />
      );
    } else {
      elements.push(
        <MarkdownTextChunk key={`text_end_${lastIndex}`} text={trailing} isStreaming={isStreaming} />
      );
    }
  }

  return <div className="space-y-2 text-sm leading-relaxed text-zinc-100">{elements}</div>;
}

function MarkdownTextChunk({ text, isStreaming }: { text: string; isStreaming?: boolean }) {
  const paragraphs = text.split(/\n\n+/);

  return (
    <>
      {paragraphs.map((p, pIdx) => {
        const trimmed = p.trim();
        if (!trimmed) return null;

        // Headings
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={pIdx} className="text-base font-semibold text-white mt-4 mb-2">
              {trimmed.substring(4)}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={pIdx} className="text-lg font-bold text-white mt-5 mb-2.5">
              {trimmed.substring(3)}
            </h2>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={pIdx} className="text-xl font-extrabold text-white mt-6 mb-3">
              {trimmed.substring(2)}
            </h1>
          );
        }

        // Bullet lists
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          const items = trimmed.split(/\n[-*]\s+/).filter(Boolean);
          return (
            <ul key={pIdx} className="list-disc list-inside space-y-1 my-2 pl-2 text-zinc-200">
              {items.map((it, iIdx) => (
                <li key={iIdx}>
                  <FormattedInlineText text={it.replace(/^[-*]\s+/, '')} />
                </li>
              ))}
            </ul>
          );
        }

        // Numbered lists
        if (/^\d+\.\s+/.test(trimmed)) {
          const items = trimmed.split(/\n\d+\.\s+/).filter(Boolean);
          return (
            <ol key={pIdx} className="list-decimal list-inside space-y-1 my-2 pl-2 text-zinc-200">
              {items.map((it, iIdx) => (
                <li key={iIdx}>
                  <FormattedInlineText text={it.replace(/^\d+\.\s+/, '')} />
                </li>
              ))}
            </ol>
          );
        }

        // Blockquotes
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote
              key={pIdx}
              className="border-l-2 border-cyan-400/80 bg-cyan-500/5 px-3 py-1.5 my-2 rounded-r-lg text-zinc-300 italic"
            >
              <FormattedInlineText text={trimmed.replace(/^>\s*/gm, '')} />
            </blockquote>
          );
        }

        // Regular paragraph
        return (
          <p key={pIdx} className="leading-relaxed whitespace-pre-wrap">
            <FormattedInlineText text={trimmed} />
            {isStreaming && pIdx === paragraphs.length - 1 && (
              <span className="inline-block w-2 h-4 bg-cyan-400 animate-pulse ml-0.5 align-middle" />
            )}
          </p>
        );
      })}
    </>
  );
}

function FormattedInlineText({ text }: { text: string }) {
  // Bold **text**
  const boldRegex = /\*\*(.*?)\*\*/g;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(renderInlineCode(text.substring(lastIdx, match.index), `txt_${lastIdx}`));
    }
    parts.push(
      <strong key={`b_${match.index}`} className="font-semibold text-white">
        {match[1]}
      </strong>
    );
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < text.length) {
    parts.push(renderInlineCode(text.substring(lastIdx), `txt_end_${lastIdx}`));
  }

  return <>{parts}</>;
}

function renderInlineCode(text: string, baseKey: string): React.ReactNode {
  const codeRegex = /`([^`]+)`/g;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = codeRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(text.substring(lastIdx, match.index));
    }
    parts.push(
      <code
        key={`${baseKey}_c_${match.index}`}
        className="px-1.5 py-0.5 rounded bg-white/[0.08] text-cyan-300 font-mono text-xs border border-white/[0.06]"
      >
        {match[1]}
      </code>
    );
    lastIdx = match.index + match[0].length;
  }

  if (lastIdx < text.length) {
    parts.push(text.substring(lastIdx));
  }

  return <React.Fragment key={baseKey}>{parts}</React.Fragment>;
}
