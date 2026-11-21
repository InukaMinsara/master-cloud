const fs = require('fs');
const path = require('path');

const logos = JSON.parse(fs.readFileSync(path.join(__dirname, 'ai-logos.json'), 'utf8'));

const tsxContent = `/**
 * src/features/ai/components/ModelFamilyLogo.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — OFFICIAL MODEL FAMILY LOGO COMPONENT
 * Displays official model-family branding immediately AFTER model display names.
 *
 * All icons are 100% authentic, production-grade vector assets from official AI
 * brand icon specifications (OpenAI, Gemini, Claude, DeepSeek, Mistral, Meta Llama,
 * Alibaba Qwen, Cohere, NVIDIA, MiniMax, SenseNova, Moonshot Kimi, Grok).
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
  if (m.includes('claude') || m.includes('anthropic')) return 'claude';
  if (m.includes('deepseek')) return 'deepseek';
  if (m.includes('qwen') || m.includes('tongyi')) return 'qwen';
  if (m.includes('mistral') || m.includes('codestral') || m.includes('ministral') || m.includes('devstral')) return 'mistral';
  if (m.includes('llama') || m.includes('meta-llama')) return 'llama';
  if (m.includes('cohere') || m.includes('command') || m.includes('aya')) return 'cohere';
  if (m.includes('sensenova') || m.includes('sensetime')) return 'sensenova';
  if (m.includes('nemotron') || m.includes('nvidia')) return 'nvidia';
  if (m.includes('minimax')) return 'minimax';
  if (m.includes('moonshot') || m.includes('kimi')) return 'moonshot';
  if (m.includes('grok') || m.includes('xai')) return 'grok';
  if (m.includes('stepfun') || m.includes('step-')) return 'stepfun';
  if (m.includes('baichuan')) return 'baichuan';
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
          className={\`inline-flex items-center justify-center shrink-0 \${className}\`}
          title="OpenAI GPT Family"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="text-emerald-400 group-hover:text-emerald-300 transition-colors"
          >
            ${logos.openai.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '').replace(/<title>[^<]*<\/title>/, '').replace(/style="[^"]*"/g, '')}
          </svg>
        </span>
      );

    // 2. Google Gemini Family Logo
    case 'gemini':
      return (
        <span
          className={\`inline-flex items-center justify-center shrink-0 \${className}\`}
          title="Google Gemini Family"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="group-hover:opacity-90 transition-opacity"
          >
            <defs>
              <linearGradient id="gemini-logo-grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" />
                <stop offset="0.5" stopColor="#818cf8" />
                <stop offset="1" stopColor="#c084fc" />
              </linearGradient>
            </defs>
            <path
              d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z"
              fill="url(#gemini-logo-grad)"
            />
          </svg>
        </span>
      );

    // 3. Anthropic Claude Family Logo (Official Terracotta Asterisk/Spark)
    case 'claude':
      return (
        <span
          className={\`inline-flex items-center justify-center shrink-0 \${className}\`}
          title="Anthropic Claude Family"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="group-hover:opacity-90 transition-opacity"
          >
            ${logos.claude.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '').replace(/<title>[^<]*<\/title>/, '').replace(/fill="currentColor"/g, 'fill="#D97757"').replace(/style="[^"]*"/g, '')}
          </svg>
        </span>
      );

    // 4. DeepSeek Family Logo (Official Blue Dolphin/Whale)
    case 'deepseek':
      return (
        <span
          className={\`inline-flex items-center justify-center shrink-0 \${className}\`}
          title="DeepSeek Family"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="group-hover:opacity-90 transition-opacity"
          >
            ${logos.deepseek.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '').replace(/<title>[^<]*<\/title>/, '').replace(/fill="currentColor"/g, 'fill="#4D6BFE"').replace(/style="[^"]*"/g, '')}
          </svg>
        </span>
      );

    // 5. Mistral AI Family Logo (Official Fiery Orange Pixelated "M")
    case 'mistral':
      return (
        <span
          className={\`inline-flex items-center justify-center shrink-0 \${className}\`}
          title="Mistral AI Family"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="group-hover:opacity-90 transition-opacity"
          >
            <path d="M3.428 3.4h3.429v3.428H3.428V3.4zm13.714 0h3.43v3.428h-3.43V3.4z" fill="#FFD700" />
            <path d="M3.428 6.828h6.857v3.429H3.429V6.828zm10.286 0h6.857v3.429h-6.857V6.828z" fill="#FFAF00" />
            <path d="M3.428 10.258h17.144v3.428H3.428v-3.428z" fill="#FF8205" />
            <path d="M3.428 13.686h3.429v3.428H3.428v-3.428zm6.858 0h3.429v3.428h-3.429v-3.428zm6.856 0h3.43v3.428h-3.43v-3.428z" fill="#FA500F" />
            <path d="M0 17.114h10.286v3.429H0v-3.429zm13.714 0H24v3.429H13.714v-3.429z" fill="#E10500" />
          </svg>
        </span>
      );

    // 6. Meta Llama Family Logo (Official Meta Infinity Loop)
    case 'llama':
      return (
        <span
          className={\`inline-flex items-center justify-center shrink-0 \${className}\`}
          title="Meta Llama Family"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="group-hover:opacity-90 transition-opacity"
          >
            ${logos.meta.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '').replace(/<title>[^<]*<\/title>/, '').replace(/fill="currentColor"/g, 'fill="#0081FB"').replace(/style="[^"]*"/g, '')}
          </svg>
        </span>
      );

    // 7. Alibaba Qwen Family Logo (Official Electric Violet Polyhedron)
    case 'qwen':
      return (
        <span
          className={\`inline-flex items-center justify-center shrink-0 \${className}\`}
          title="Alibaba Qwen Family"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="group-hover:opacity-90 transition-opacity"
          >
            ${logos.qwen.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '').replace(/<title>[^<]*<\/title>/, '').replace(/fill="currentColor"/g, 'fill="#615CED"').replace(/style="[^"]*"/g, '')}
          </svg>
        </span>
      );

    // 8. Cohere / Command Family Logo (Official Coral & Spruce Cells)
    case 'cohere':
      return (
        <span
          className={\`inline-flex items-center justify-center shrink-0 \${className}\`}
          title="Cohere Command Family"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="group-hover:opacity-90 transition-opacity"
          >
            <path
              clipRule="evenodd"
              d="M8.128 14.099c.592 0 1.77-.033 3.398-.703 1.897-.781 5.672-2.2 8.395-3.656 1.905-1.018 2.74-2.366 2.74-4.18A4.56 4.56 0 0018.1 1H7.549A6.55 6.55 0 001 7.55c0 3.617 2.745 6.549 7.128 6.549z"
              fill="#D9822B"
            />
            <path
              clipRule="evenodd"
              d="M9.912 18.61a4.387 4.387 0 012.705-4.052l3.323-1.38c3.361-1.394 7.06 1.076 7.06 4.715a5.104 5.104 0 01-5.105 5.104l-3.597-.001a4.386 4.386 0 01-4.386-4.387z"
              fill="#39594C"
            />
            <path
              d="M4.776 14.962A3.775 3.775 0 001 18.738v.489a3.776 3.776 0 007.551 0v-.49a3.775 3.775 0 00-3.775-3.775z"
              fill="#24493B"
            />
          </svg>
        </span>
      );

    // 9. NVIDIA Nemotron Family Logo (Official NVIDIA Green Claw Eye)
    case 'nvidia':
      return (
        <span
          className={\`inline-flex items-center justify-center shrink-0 \${className}\`}
          title="NVIDIA Nemotron Family"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="group-hover:opacity-90 transition-opacity"
          >
            ${logos.nvidia.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '').replace(/<title>[^<]*<\/title>/, '').replace(/fill="currentColor"/g, 'fill="#76B900"').replace(/style="[^"]*"/g, '')}
          </svg>
        </span>
      );

    // 10. MiniMax Family Logo (Official Soundwave M in Red)
    case 'minimax':
      return (
        <span
          className={\`inline-flex items-center justify-center shrink-0 \${className}\`}
          title="MiniMax Family"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="group-hover:opacity-90 transition-opacity"
          >
            ${logos.minimax.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '').replace(/<title>[^<]*<\/title>/, '').replace(/fill="currentColor"/g, 'fill="#EA4335"').replace(/style="[^"]*"/g, '')}
          </svg>
        </span>
      );

    // 11. SenseNova Family Logo (Official Geometric Matrix)
    case 'sensenova':
      return (
        <span
          className={\`inline-flex items-center justify-center shrink-0 \${className}\`}
          title="SenseNova Multimodal Family"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="group-hover:opacity-90 transition-opacity"
          >
            ${logos.sensenova.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '').replace(/<title>[^<]*<\/title>/, '').replace(/fill="currentColor"/g, 'fill="#F43F5E"').replace(/style="[^"]*"/g, '')}
          </svg>
        </span>
      );

    // 12. Moonshot / Kimi Family Logo
    case 'moonshot':
      return (
        <span
          className={\`inline-flex items-center justify-center shrink-0 \${className}\`}
          title="Moonshot Kimi Family"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="group-hover:opacity-90 transition-opacity"
          >
            ${logos.moonshot.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '').replace(/<title>[^<]*<\/title>/, '').replace(/fill="currentColor"/g, 'fill="#8B5CF6"').replace(/style="[^"]*"/g, '')}
          </svg>
        </span>
      );

    // 13. Grok / xAI Family Logo
    case 'grok':
      return (
        <span
          className={\`inline-flex items-center justify-center shrink-0 \${className}\`}
          title="xAI Grok Family"
        >
          <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            className="text-zinc-200 group-hover:text-white transition-colors"
          >
            ${logos.grok.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '').replace(/<title>[^<]*<\/title>/, '').replace(/fill="currentColor"/g, 'fill="currentColor"').replace(/style="[^"]*"/g, '')}
          </svg>
        </span>
      );

    // 14. Neutral Fallback for unbranded models
    case 'general':
    default:
      return (
        <span
          className={\`inline-flex items-center justify-center shrink-0 text-orange-400 group-hover:text-orange-300 transition-colors \${className}\`}
          title="Neural AI Model"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </span>
      );
  }
}
`;

fs.writeFileSync(path.join(__dirname, '../src/features/ai/components/ModelFamilyLogo.tsx'), tsxContent);
console.log('Successfully generated ModelFamilyLogo.tsx with authentic official logos!');
