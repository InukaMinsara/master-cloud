import React, { useState } from 'react';
import { Check, Copy, Code2, Terminal } from 'lucide-react';

interface ChatMarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
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
 * Dedicated ChatGPT-style Code Block with header, language badge, and copy button.
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

  const cleanLang = (language || '').toLowerCase().trim();
  const displayLang = cleanLang || 'code';

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
      {/* Code Header Bar (ChatGPT Style) */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1e1e24] border-b border-zinc-800 text-xs font-mono select-none">
        <div className="flex items-center gap-1.5 text-zinc-400 font-medium">
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

      {/* Code Body */}
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
export function ChatMarkdownRenderer({ content, isStreaming = false }: ChatMarkdownRendererProps) {
  if (!content && isStreaming) {
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

  return <div className="space-y-0.5 leading-relaxed break-words">{elements}</div>;
}
