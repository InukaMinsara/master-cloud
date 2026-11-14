/**
 * aiService.ts
 * Master Cloud Drive Workspace AI Bridge -> Powered by MASTER AI CORE v2.0.
 */

import { FileItem } from '@/types/file';
import { api } from './api';
import { AIGateway, QWEN_OMNI_VIDEO_MODEL, VideoStoryboardResult } from './aiGateway';
import { puterAiService, VERIFIED_FREE_CHAT_MODELS } from './ai/puterAiService';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  attachedFile?: {
    id: string;
    name: string;
    sizeBytes: number;
  };
  tokensUsed?: number;
  modelTag?: string;
  brainUsed?: 'original' | 'local' | 'cloud';
  mediaAttachment?: {
    type: 'image' | 'video' | 'audio';
    url: string;
    prompt?: string;
    modelUsed?: string;
  };
  webSources?: Array<{ title: string; url: string; snippet?: string }>;
}

export interface AIChatSession {
  id: string;
  title: string;
  persona: 'general' | 'analyst' | 'coder' | 'writer';
  messages: AIMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface AIGatewayStats {
  alias: string;
  upstreamTarget: string;
  latencyMs: number;
  requestsCount: number;
  health: 'healthy' | 'degraded' | 'offline';
}

const STORAGE_KEY = 'master_cloud_ai_sessions';

export class AIService {
  static readonly ALIASES = {
    CHAT: 'master-ai-v2-orchestrator',
    IMAGE: 'master-image',
    VIDEO: QWEN_OMNI_VIDEO_MODEL,
  };

  static getSessions(): AIChatSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load AI sessions:', e);
    }
    return [
      {
        id: 'session-default',
        title: 'Master AI Puter.js Studio',
        persona: 'general',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: 'msg-welcome',
            role: 'assistant',
            content:
              '👋 Welcome to **Master AI Studio** powered directly by **Puter.js**!\n\nAll AI features (AI Chat, Image Studio, Video Studio, Voice & Speech) run on verified free models with zero developer cost ($0) and zero API keys.\n\nAttach a Drive file or ask questions in **English** or **සිංහල (Sinhala)**!',
            timestamp: new Date().toISOString(),
            tokensUsed: 32,
            modelTag: 'puter-verified-free',
            brainUsed: 'cloud',
          },
        ],
      },
    ];
  }

  static saveSessions(sessions: AIChatSession[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save AI sessions:', e);
    }
  }

  static async *streamResponse(
    prompt: string,
    history: AIMessage[],
    attachedFile?: FileItem | null,
    persona: 'general' | 'analyst' | 'coder' | 'writer' = 'general',
    _userId?: string,
    options?: { manualModelId?: string; offlineOnly?: boolean },
  ): AsyncGenerator<string, void, unknown> {
    let externalFileContext = '';
    if (attachedFile) {
      try {
        const fileText = await api.getFileContentText(attachedFile.id);
        if (fileText) {
          externalFileContext = `[Attached File: ${attachedFile.name}]\n${fileText.slice(0, 4000)}\n\n`;
        }
      } catch {
        // proceed without file text
      }
    }

    const personaHint =
      persona === 'coder'
        ? '[Role: Expert Code Architect]\n'
        : persona === 'analyst'
          ? '[Role: Evidence & Data Analyst]\n'
          : persona === 'writer'
            ? '[Role: Technical & Creative Writer]\n'
            : '';

    const fullPrompt = `${personaHint}${externalFileContext}${prompt}`.trim();

    const historyForPuter = history
      .filter((m) => m.content && m.content.trim().length > 0 && m.id !== 'msg-welcome')
      .map((m) => ({
        role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
        content: m.content.trim(),
      }));

    const modelToUse =
      options?.manualModelId && options.manualModelId !== 'auto'
        ? options.manualModelId
        : VERIFIED_FREE_CHAT_MODELS[0].id;

    const stream = puterAiService.streamChat(fullPrompt, {
      model: modelToUse,
      messages: historyForPuter,
    });

    for await (const chunk of stream) {
      yield chunk;
    }
  }

  static async getGatewayDiagnostics(): Promise<AIGatewayStats[]> {
    const diag = await AIGateway.getDiagnostics();
    return diag.map((d) => ({
      alias: d.alias,
      upstreamTarget: d.upstreamTarget,
      latencyMs: d.latencyMs,
      requestsCount: d.totalRequests,
      health: d.status === 'online' ? 'healthy' : d.status === 'degraded' ? 'degraded' : 'offline',
    }));
  }

  static async directVideoStoryboard(concept: string, sceneCount: number = 3): Promise<VideoStoryboardResult> {
    return AIGateway.directVideoWithQwen(concept, sceneCount);
  }

  static async enhanceVideoPrompt(prompt: string): Promise<string> {
    return AIGateway.enhanceVideoPromptWithQwen(prompt);
  }
}
