/**
 * src/features/ai/components/ModelFamilyLogo.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — MODEL FAMILY LOGO COMPONENT
 * Displays official model-family branding immediately AFTER model display names.
 *
 * Rules:
 * - Displays Model Family logos (OpenAI/GPT, Gemini, Claude, DeepSeek, Qwen,
 *   Mistral, Llama, Cohere, SenseNova, NVIDIA), NEVER backend provider logos.
 * - Crisp, theme-adaptive SVG vectors working in light and dark modes.
 * - Standardized 14x14px size, inline alignment, and accessible title tooltips.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { ModelFamily } from '../types/aiTypes';
import { Sparkles } from 'lucide-react';

interface ModelFamilyLogoProps {
  family?: ModelFamily | string;
  modelId?: string;
  className?: string;
  size?: number;
}

/**
 * Resolves the model family category from model ID or explicit family tag.
 */
export function resolveModelFamily(modelId?: string, family?: ModelFamily | string): ModelFamily {
  if (family && family !== 'general') {
    return family as ModelFamily;
  }
  if (!modelId) return 'general';

  const m = modelId.toLowerCase();

  if (m.includes('gemini')) return 'gemini';
  if (m.includes('claude')) return 'claude';
  if (m.includes('deepseek')) return 'deepseek';
  if (m.includes('qwen')) return 'qwen';
  if (m.includes('mistral') || m.includes('codestral') || m.includes('ministral') || m.includes('devstral')) return 'mistral';
  if (m.includes('llama')) return 'llama';
  if (m.includes('cohere') || m.includes('command-') || m.includes('aya')) return 'cohere';
  if (m.includes('sensenova')) return 'sensenova';
  if (m.includes('nemotron') || m.includes('nvidia')) return 'nvidia';
  if (m.includes('gpt') || m.includes('openai') || m.includes('o1') || m.includes('o3') || m.includes('chatgpt')) return 'gpt';

  return 'general';
}

export function ModelFamilyLogo({
  family,
  modelId,
  className = '',
  size = 14,
}: ModelFamilyLogoProps) {
  const resolvedFamily = resolveModelFamily(modelId, family);

  switch (resolvedFamily) {
    // 1. OpenAI / GPT Family Logo
    case 'gpt':
      return (
        <span
          className={`inline-flex items-center justify-center shrink-0 ${className}`}
          title="OpenAI GPT Family"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="text-emerald-400 group-hover:text-emerald-300 transition-colors"
          >
            <path
              d="M20.5 10.3a5.5 5.5 0 0 0-.5-4.1 5.6 5.6 0 0 0-5.5-2.8 5.4 5.4 0 0 0-4.3-2 5.5 5.5 0 0 0-5.2 3.8 5.6 5.6 0 0 0-3.6 2.6 5.5 5.5 0 0 0 .7 6.1 5.5 5.5 0 0 0 .5 4.1 5.6 5.6 0 0 0 5.5 2.8 5.4 5.4 0 0 0 4.3 2 5.5 5.5 0 0 0 5.2-3.8 5.6 5.6 0 0 0 3.6-2.6 5.5 5.5 0 0 0-.7-6.1zm-8.5 11.2a4 4 0 0 1-2.7-1.1l.1-.1 4.5-2.6a.8.8 0 0 0 .4-.7V11l2.1 1.2v4.8a4 4 0 0 1-4.4 4.5zm-7.7-4.4a4 4 0 0 1-.5-2.9l.1.1 4.5 2.6a.8.8 0 0 0 .8 0l5.2-3v2.4l-4.2 2.4a4 4 0 0 1-5.9-4.6zm-1.4-8.3a4 4 0 0 1 2.2-1.8v5.3a.8.8 0 0 0 .4.7l5.2 3-2.1 1.2-4.2-2.4a4 4 0 0 1-1.5-6zm12.3 3.6l-5.2-3 2.1-1.2 4.2 2.4a4 4 0 0 1 1.5 6 4 4 0 0 1-2.2 1.8V13a.8.8 0 0 0-.4-.6zm2.7 6.5a4 4 0 0 1-2.7 1.1l-.1-.1-4.5-2.6a.8.8 0 0 0-.8 0l-5.2 3v-2.4l4.2-2.4a4 4 0 0 1 9.1 3.4zm-7.4-2.5l-2.4-1.4 2.4-1.4 2.4 1.4-2.4 1.4z"
              fill="currentColor"
            />
          </svg>
        </span>
      );

    // 2. Google Gemini Family Logo
    case 'gemini':
      return (
        <span
          className={`inline-flex items-center justify-center shrink-0 ${className}`}
          title="Google Gemini Family"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="text-blue-400 group-hover:text-blue-300 transition-colors"
          >
            <path
              d="M12 2C12 7.523 7.523 12 2 12C7.523 12 12 16.477 12 22C12 16.477 16.477 12 22 12C16.477 12 12 7.523 12 2Z"
              fill="url(#gemini-gradient)"
            />
            <defs>
              <linearGradient id="gemini-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" />
                <stop offset="0.5" stopColor="#818cf8" />
                <stop offset="1" stopColor="#c084fc" />
              </linearGradient>
            </defs>
          </svg>
        </span>
      );

    // 3. Anthropic Claude Family Logo
    case 'claude':
      return (
        <span
          className={`inline-flex items-center justify-center shrink-0 ${className}`}
          title="Anthropic Claude Family"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="text-amber-500 group-hover:text-amber-400 transition-colors"
          >
            <path
              d="M4.5 19.5L12 4.5L19.5 19.5H15.5L12 12.5L8.5 19.5H4.5Z"
              fill="currentColor"
            />
            <circle cx="12" cy="16.5" r="1.5" fill="currentColor" />
          </svg>
        </span>
      );

    // 4. DeepSeek Family Logo
    case 'deepseek':
      return (
        <span
          className={`inline-flex items-center justify-center shrink-0 ${className}`}
          title="DeepSeek Family"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="text-sky-400 group-hover:text-sky-300 transition-colors"
          >
            <path
              d="M12 3C7.03 3 3 7.03 3 12C3 16.97 7.03 21 12 21C16.97 21 21 16.97 21 12C21 7.03 16.97 3 12 3ZM12 6.5C14.21 6.5 16 8.29 16 10.5C16 12.71 14.21 14.5 12 14.5C9.79 14.5 8 12.71 8 10.5C8 8.29 9.79 6.5 12 6.5ZM7.5 17.5C8.6 16.2 10.2 15.4 12 15.4C13.8 15.4 15.4 16.2 16.5 17.5C15.3 18.4 13.7 19 12 19C10.3 19 8.7 18.4 7.5 17.5Z"
              fill="currentColor"
            />
          </svg>
        </span>
      );

    // 5. Alibaba Qwen Family Logo
    case 'qwen':
      return (
        <span
          className={`inline-flex items-center justify-center shrink-0 ${className}`}
          title="Alibaba Qwen Family"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="text-indigo-400 group-hover:text-indigo-300 transition-colors"
          >
            <path
              d="M12 2L3 7V17L12 22L21 17V7L12 2ZM12 5.2L18.4 8.7L12 12.3L5.6 8.7L12 5.2ZM5 10.2L11 13.6V19.8L5 16.4V10.2ZM13 19.8V13.6L19 10.2V16.4L13 19.8Z"
              fill="currentColor"
            />
          </svg>
        </span>
      );

    // 6. Mistral AI Family Logo
    case 'mistral':
      return (
        <span
          className={`inline-flex items-center justify-center shrink-0 ${className}`}
          title="Mistral AI Family"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="text-orange-500 group-hover:text-orange-400 transition-colors"
          >
            {/* Mistral Iconic 4-Step Staircase */}
            <rect x="3" y="16" width="4" height="4" rx="0.5" fill="#f97316" />
            <rect x="8" y="12" width="4" height="8" rx="0.5" fill="#ea580c" />
            <rect x="13" y="8" width="4" height="12" rx="0.5" fill="#c2410c" />
            <rect x="18" y="4" width="4" height="16" rx="0.5" fill="#9a3412" />
          </svg>
        </span>
      );

    // 7. Meta Llama Family Logo
    case 'llama':
      return (
        <span
          className={`inline-flex items-center justify-center shrink-0 ${className}`}
          title="Meta Llama Family"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="text-blue-500 group-hover:text-blue-400 transition-colors"
          >
            {/* Meta Infinity Loop */}
            <path
              d="M16.5 6C14.7 6 13.2 6.9 12 8.3C10.8 6.9 9.3 6 7.5 6C4.5 6 2 8.5 2 12C2 15.5 4.5 18 7.5 18C9.3 18 10.8 17.1 12 15.7C13.2 17.1 14.7 18 16.5 18C19.5 18 22 15.5 22 12C22 8.5 19.5 6 16.5 6ZM7.5 15.5C5.8 15.5 4.5 14 4.5 12C4.5 10 5.8 8.5 7.5 8.5C8.8 8.5 10 9.3 10.8 10.5L8.5 13.7C8.2 14.8 7.8 15.5 7.5 15.5ZM16.5 15.5C15.2 15.5 14 14.7 13.2 13.5L15.5 10.3C15.8 9.2 16.2 8.5 16.5 8.5C18.2 8.5 19.5 10 19.5 12C19.5 14 18.2 15.5 16.5 15.5Z"
              fill="currentColor"
            />
          </svg>
        </span>
      );

    // 8. Cohere / Command Family Logo
    case 'cohere':
      return (
        <span
          className={`inline-flex items-center justify-center shrink-0 ${className}`}
          title="Cohere Command Family"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="text-teal-400 group-hover:text-teal-300 transition-colors"
          >
            <circle cx="8" cy="8" r="4" fill="#2dd4bf" />
            <circle cx="16" cy="16" r="4" fill="#0d9488" />
            <path d="M12 4L16 8L8 16L4 12L12 4Z" fill="#14b8a6" fillOpacity="0.7" />
          </svg>
        </span>
      );

    // 9. SenseNova Family Logo
    case 'sensenova':
      return (
        <span
          className={`inline-flex items-center justify-center shrink-0 ${className}`}
          title="SenseNova Multimodal Family"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="text-rose-400 group-hover:text-rose-300 transition-colors"
          >
            <path
              d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
              fill="currentColor"
            />
          </svg>
        </span>
      );

    // 10. NVIDIA Nemotron Family Logo
    case 'nvidia':
      return (
        <span
          className={`inline-flex items-center justify-center shrink-0 ${className}`}
          title="NVIDIA Nemotron Family"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="text-green-500 group-hover:text-green-400 transition-colors"
          >
            <path
              d="M12 4C7.58 4 4 7.58 4 12C4 16.42 7.58 20 12 20C15.86 20 19.06 17.27 19.8 13.68H16.7C16.05 15.61 14.2 17 12 17C9.24 17 7 14.76 7 12C7 9.24 9.24 7 12 7C13.4 7 14.65 7.58 15.54 8.5L17.66 6.38C16.24 4.9 14.23 4 12 4ZM12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15C13.24 15 14.29 14.25 14.73 13.18H12V11H17.89C17.96 11.33 18 11.66 18 12C18 15.31 15.31 18 12 18C8.69 18 6 15.31 6 12C6 8.69 8.69 6 12 6C13.66 6 15.16 6.68 16.24 7.76L17.66 6.34C16.22 4.9 14.22 4 12 4Z"
              fill="currentColor"
            />
          </svg>
        </span>
      );

    // 11. Neutral Fallback for other models
    case 'general':
    default:
      return (
        <span
          className={`inline-flex items-center justify-center shrink-0 text-orange-400 group-hover:text-orange-300 transition-colors ${className}`}
          title="Neural AI Model"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </span>
      );
  }
}
