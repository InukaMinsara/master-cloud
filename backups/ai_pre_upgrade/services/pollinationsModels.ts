/**
 * src/features/ai/services/pollinationsModels.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER AI — POLLINATIONS IMAGE AI MODEL CATALOGUE & PREFERENCES
 * Preferred image models, category classifications, and capability detection.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { PollinationsCategory, PollinationsModelInfo } from '../types/aiTypes';

export const POLLINATIONS_CATEGORIES: Array<{ id: PollinationsCategory; label: string; icon: string }> = [
  { id: 'primary_gen', label: 'Primary Generation', icon: 'Sparkles' },
  { id: 'primary_edit', label: 'Primary Editing', icon: 'Edit3' },
  { id: 'free_gen', label: 'Free Generation', icon: 'Gift' },
  { id: 'fast_gen', label: 'Fast Generation', icon: 'Zap' },
  { id: 'experimental', label: 'Experimental', icon: 'FlaskConical' },
  { id: 'all', label: 'All Available Models', icon: 'Layers' },
];

/**
 * Baseline preferred models registry with canonical IDs, aliases, and initial specs.
 * These are dynamically reconciled with live data from GET /image/models.
 */
export const PREFERRED_POLLINATIONS_MODELS: PollinationsModelInfo[] = [
  // 1. PRIMARY GENERATION
  {
    id: 'community/tomdacatto/gpt-image-2.5-sunburst',
    name: 'GPT Image 2.5 Sunburst',
    title: 'GPT Image 2.5 Sunburst (Community)',
    aliases: ['gpt-image-2.5-sunburst', 'openai/gpt-image-2.5-sunburst', 'tomdacatto/gpt-image-2.5-sunburst'],
    publisher: 'OpenAI / Community',
    category: 'primary_gen',
    paidOnly: true, // Reconciled dynamically; community or free key tier
    freeStatus: 'unverified',
    supportsGeneration: true,
    supportsEditing: true,
    isAvailable: true,
    estimatedSpeed: 'medium',
  },

  // 2. PRIMARY EDITING
  {
    id: 'black-forest-labs/flux.1-kontext-pro',
    name: 'FLUX.1 Kontext Pro',
    title: 'FLUX.1 Kontext Pro (Image Editing)',
    aliases: ['flux.1-kontext-pro', 'kontext', 'flux-kontext'],
    publisher: 'Black Forest Labs',
    category: 'primary_edit',
    paidOnly: false, // Confirmed FREE in live Pollinations catalogue!
    freeStatus: 'free',
    supportsGeneration: true,
    supportsEditing: true,
    maxReferenceImages: 2,
    isAvailable: true,
    estimatedSpeed: 'fast',
  },

  // 3. FREE GENERATION BACKUP
  {
    id: 'community/scriptsnsenses-sys/flux-2-dev-free',
    name: 'FLUX 2 Dev Free',
    title: 'FLUX 2 Dev Free (Zero-Cost Tier)',
    aliases: ['flux-2-dev-free', 'scriptsnsenses-sys/flux-2-dev-free'],
    publisher: 'Community / Scripts & Senses',
    category: 'free_gen',
    paidOnly: false, // Confirmed FREE in live Pollinations catalogue!
    freeStatus: 'free',
    supportsGeneration: true,
    supportsEditing: true,
    isAvailable: true,
    estimatedSpeed: 'medium',
  },

  // 4. FAST GENERATION
  {
    id: 'black-forest-labs/flux.1-schnell',
    name: 'FLUX.1 Schnell',
    title: 'FLUX.1 Schnell (High-Speed)',
    aliases: ['flux', 'flux-schnell', 'schnell'],
    publisher: 'Black Forest Labs',
    category: 'fast_gen',
    paidOnly: false, // Confirmed FREE in live Pollinations catalogue!
    freeStatus: 'free',
    supportsGeneration: true,
    supportsEditing: false,
    isAvailable: true,
    estimatedSpeed: 'fast',
  },

  // 5. EXPERIMENTAL
  {
    id: 'community/vendouple/nano-banana-pro',
    name: 'Nano Banana Pro',
    title: 'Nano Banana Pro (Experimental)',
    aliases: ['nano-banana-pro', 'vendouple/nano-banana-pro'],
    publisher: 'Community / Vendouple',
    category: 'experimental',
    paidOnly: false,
    freeStatus: 'unverified',
    supportsGeneration: true,
    supportsEditing: false,
    isAvailable: true,
    estimatedSpeed: 'fast',
  },
  {
    id: 'community/MarcosFRG/lucid-origin',
    name: 'Lucid Origin',
    title: 'Lucid Origin (Experimental Creative)',
    aliases: ['lucid-origin', 'MarcosFRG/lucid-origin'],
    publisher: 'Community / MarcosFRG',
    category: 'experimental',
    paidOnly: false, // Confirmed FREE in live Pollinations catalogue!
    freeStatus: 'free',
    supportsGeneration: true,
    supportsEditing: true,
    isAvailable: true,
    estimatedSpeed: 'medium',
  },

  // 6. CANDIDATES
  {
    id: 'community/tomdacatto/grok-imagine-2-quest',
    name: 'Grok Imagine 2 Quest',
    title: 'Grok Imagine 2 Quest (Candidate)',
    aliases: ['grok-imagine-2-quest', 'tomdacatto/grok-imagine-2-quest'],
    publisher: 'Community / xAI',
    category: 'all',
    paidOnly: false, // Confirmed FREE in live Pollinations catalogue!
    freeStatus: 'free',
    supportsGeneration: true,
    supportsEditing: false,
    isAvailable: true,
    estimatedSpeed: 'medium',
  },
  {
    id: 'community/tomdacatto/gpt-image-2.5-flare',
    name: 'GPT Image 2.5 Flare',
    title: 'GPT Image 2.5 Flare (Candidate)',
    aliases: ['gpt-image-2.5-flare', 'tomdacatto/gpt-image-2.5-flare', 'openai/gpt-image-2.5-flare'],
    publisher: 'OpenAI / Community',
    category: 'all',
    paidOnly: true,
    freeStatus: 'unverified',
    supportsGeneration: true,
    supportsEditing: true,
    isAvailable: true,
    estimatedSpeed: 'medium',
  },
];

export const DEFAULT_IMAGE_MODEL = 'black-forest-labs/flux.1-schnell';
export const DEFAULT_EDIT_MODEL = 'black-forest-labs/flux.1-kontext-pro';

/**
 * Ordered fallback sequence for image generation in strict free-only mode.
 */
export const FREE_IMAGE_FALLBACK_SEQUENCE = [
  'black-forest-labs/flux.1-schnell',
  'community/scriptsnsenses-sys/flux-2-dev-free',
  'community/MarcosFRG/lucid-origin',
  'black-forest-labs/flux.1-kontext-pro',
];

/**
 * Ordered fallback sequence for image editing in strict free-only mode.
 */
export const FREE_EDIT_FALLBACK_SEQUENCE = [
  'black-forest-labs/flux.1-kontext-pro',
  'community/scriptsnsenses-sys/flux-2-dev-free',
  'community/MarcosFRG/lucid-origin',
];
