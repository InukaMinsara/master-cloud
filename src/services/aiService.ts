/**
 * aiService.ts
 * Master Cloud Drive Workspace AI Bridge -> Powered by MASTER AI CORE v2.0.
 */

import { FileItem } from '@/types/file';
import { api } from './api';
import { AIGateway, QWEN_OMNI_VIDEO_MODEL, VideoStoryboardResult } from './aiGateway';
import { originalBrainController } from './ai/originalBrainController';

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
        title: 'MASTER AI v2.0 Copilot',
        persona: 'general',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: 'msg-welcome',
            role: 'assistant',
            content:
              'Hello! I am **MASTER AI CORE v2.0** (Three-Brain Hybrid Architecture: Original Brain Orchestrator + Local Open-Weight Engine + Optional Authorized Cloud).\n\nAttach a Drive file or ask questions in **Sinhala or English**.',
            timestamp: new Date().toISOString(),
            tokensUsed: 44,
            modelTag: 'master-ai-v2-orchestrator',
            brainUsed: 'original',
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
    let externalFileContext: { name: string; contentExcerpt: string } | null = null;
    if (attachedFile) {
      const fileText = await api.getFileContentText(attachedFile.id);
      externalFileContext = {
        name: attachedFile.name,
        contentExcerpt: fileText ? fileText.slice(0, 4000) : '',
      };
    }

    const storedHistory = history.map((m, idx) => ({
      id: m.id || `m_${idx}`,
      sender: (m.role === 'user' ? 'user' : 'ai') as 'user' | 'ai',
      text: m.content,
      timestamp: Date.parse(m.timestamp) || Date.now(),
    }));

    const buffered: string[] = [];
    let wakeup: (() => void) | null = null;
    let finished = false;
    let errCaptured: unknown = null;

    const personaHint =
      persona === 'coder'
        ? '[Persona: Code Architect]\n'
        : persona === 'analyst'
          ? '[Persona: Evidence Analyst]\n'
          : persona === 'writer'
            ? '[Persona: Technical Writer]\n'
            : '';

    const run = originalBrainController
      .processQuery({
        query: `${personaHint}${prompt}`.trim(),
        history: storedHistory,
        externalFileContext,
        manualModelId: options?.manualModelId,
        offlineOnly: options?.offlineOnly,
        onProgress: (partial) => {
          buffered.push(partial);
          wakeup?.();
          wakeup = null;
        },
      })
      .then((res) => {
        buffered.push(res.text);
        finished = true;
        wakeup?.();
        wakeup = null;
      })
      .catch((err) => {
        errCaptured = err;
        finished = true;
        wakeup?.();
        wakeup = null;
      });

    while (!finished || buffered.length > 0) {
      if (buffered.length > 0) {
        const latest = buffered[buffered.length - 1];
        buffered.length = 0;
        yield latest;
      } else if (!finished) {
        await new Promise<void>((resolve) => {
          wakeup = resolve;
        });
      }
    }

    await run;
    if (errCaptured) throw errCaptured;
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
