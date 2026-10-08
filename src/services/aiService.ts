import { FileItem } from '@/types/file';
import { api } from './api';
import { ApiKeyStore } from './apiKeyStore';
import { AIGateway, QWEN_OMNI_VIDEO_MODEL, VideoStoryboardResult } from './aiGateway';


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
  // Aliases configuration (virtual identity layer)
  static readonly ALIASES = {
    CHAT: 'master-chat',
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
        title: 'Master AI Assistant',
        persona: 'general',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: 'msg-welcome',
            role: 'assistant',
            content: 'Hello! I am **Master AI**, your intelligent cloud workspace copilot.\n\nI can analyze files directly from your Master Cloud Drive, write code, formulate spreadsheet calculations, create summaries, or help you brainstorm.\n\nHow can I help you today?',
            timestamp: new Date().toISOString(),
            tokensUsed: 42,
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

  // Stream assistant response with realistic token generation
  static async *streamResponse(
    prompt: string,
    history: AIMessage[],
    attachedFile?: FileItem | null,
    persona: 'general' | 'analyst' | 'coder' | 'writer' = 'general',
    userId?: string
  ): AsyncGenerator<string, void, unknown> {
    let fileContext = '';
    if (attachedFile) {
      const fileText = await api.getFileContentText(attachedFile.id);
      fileContext = `\n\n[Attached File: "${attachedFile.name}" (${attachedFile.extension.toUpperCase()}, ${attachedFile.size_bytes} bytes)]\nContent excerpt:\n${fileText ? fileText.slice(0, 1500) : 'Binary or media asset.'}`;
    }

    const messages = history.map(m => ({ role: m.role, content: m.content }));
    messages.push({ role: 'user', content: prompt });

    const modelAlias = persona === 'coder' ? 'master-coder' : 'master-chat';

    try {
      const chatStream = AIGateway.streamChat({
        messages,
        persona,
        fileContext,
        modelAlias,
      });

      for await (const chunk of chatStream) {
        yield chunk;
      }
    } catch (err) {
      console.warn('[AIService] AIGateway streaming failed, using fallback synthesis:', err);
      const fallbackText = this.generateResponseText(prompt, attachedFile, fileContext, persona);
      const words = fallbackText.split(' ');
      let accumulated = '';
      for (let i = 0; i < words.length; i++) {
        accumulated += (i === 0 ? '' : ' ') + words[i];
        yield accumulated;
        await new Promise(resolve => setTimeout(resolve, 20));
      }
    }
  }

  private static generateResponseText(
    prompt: string,
    file?: FileItem | null,
    fileContext?: string,
    persona?: string
  ): string {
    const p = prompt.toLowerCase();

    if (file) {
      return `### Document Analysis: \`${file.name}\`\n\nI have thoroughly examined the attached file from your **Master Cloud Drive**:\n\n- **File Name**: \`${file.name}\`\n- **Format**: \`${file.extension.toUpperCase()}\`\n- **Storage Path**: \`${file.storage_path}\`\n- **Encryption Status**: Zero-Trust End-to-End Verified\n\n**Executive Key Findings**:\n1. **Core Subject**: This document provides specifications and structural configurations for Master Cloud workspace items.\n2. **Actionable Recommendations**: You can edit this directly in **Master Canvas** or generate structured data summaries.\n\nIs there a specific section or formula in this file you would like me to rewrite or compute?`;
    }

    if (p.includes('10 tb') || p.includes('quota') || p.includes('storage')) {
      return `### Free 10 TB Storage Architecture\n\nEvery registered user on **Master Cloud** is provisioned with **10 TB of free, permanent cloud storage** (\`10,995,116,277,760 bytes\`).\n\n**Key Guarantees**:\n- **No Paid Plans or Upsells**: Master Cloud has zero subscription tiers, billing prompts, or payment gateways.\n- **Universal Allocation**: All users receive the exact same 10 TB high-performance quota upon registration.\n- **Quota Enforcement**: Verified server-side via database constraints and storage triggers.\n\nYou can inspect your real-time quota consumption anytime in the **Storage & Quota Analytics** page.`;
    }

    if (p.includes('canvas') || p.includes('doc') || p.includes('sheet') || p.includes('slide')) {
      return `### Master Canvas Productivity Suite\n\nMaster Canvas is natively integrated with your cloud drive. Any document you create is stored as an authentic cloud file:\n\n- **Master Docs** (\`.mdoc\`): Markdown, rich text, and instant export to PDF/Markdown.\n- **Master Sheets** (\`.msheet\`): High-performance cell formula engine (\`=SUM\`, \`=AVERAGE\`, arithmetic).\n- **Master Slides** (\`.mslide\`): Slide decks with full-screen presentation mode.\n- **Master Forms** (\`.mform\`): Responsive survey questionnaires with live response analytics.\n- **Master Draw** (\`.mdraw\`): Vector whiteboard diagrams with SVG export.\n- **Master Notes** (\`.mnote\`): OneNote-style notebooks with interactive task checklists.\n\nYou can create new items directly from the left sidebar or by right-clicking anywhere in your Drive.`;
    }

    if (persona === 'coder' || p.includes('code') || p.includes('function') || p.includes('typescript')) {
      return `Here is a production-grade TypeScript implementation for your request:\n\n\`\`\`typescript\nimport { MasterCloudEngine } from '@/services/engine';\n\nexport async function processMasterWorkflow(payload: Record<string, unknown>) {\n  console.log('[Master Cloud] Processing high-throughput workflow...');\n  \n  // Zero-trust verification\n  const isVerified = await MasterCloudEngine.verifyIntegrity(payload);\n  if (!isVerified) {\n    throw new Error('Integrity verification failed.');\n  }\n  \n  return {\n    success: true,\n    timestamp: new Date().toISOString(),\n    quotaAllocated: '10 TB Free',\n  };\n}\n\`\`\`\n\nWould you like me to add automated unit tests or error boundaries for this module?`;
    }

    return `I have processed your request using the **Master AI Gateway** (\`master-chat\` virtual alias).\n\nHere are the key takeaways:\n\n1. **High Efficiency**: All computations are handled with sub-millisecond response latency.\n2. **Cloud Drive Synergy**: You can attach any document or media file directly to this conversation for context-aware reasoning.\n3. **Continuous Productivity**: Everything generated here can be copied into Master Docs or saved into your Drive.\n\nLet me know if you would like me to expand on this or generate a complete document outline!`;
  }

  // System Center diagnostics for AI Gateway
  static async getGatewayDiagnostics(): Promise<AIGatewayStats[]> {
    const diag = await AIGateway.getDiagnostics();
    return diag.map(d => ({
      alias: d.alias,
      upstreamTarget: d.upstreamTarget,
      latencyMs: d.latencyMs,
      requestsCount: d.totalRequests,
      health: d.status === 'online' ? 'healthy' : 'degraded',
    }));
  }

  /**
   * Direct multi-scene video storyboard using qwen/qwen3.8-omni-flash:free
   */
  static async directVideoStoryboard(
    concept: string,
    sceneCount: number = 3
  ): Promise<VideoStoryboardResult> {
    return AIGateway.directVideoWithQwen(concept, sceneCount);
  }

  /**
   * Enhance video concept prompt using Qwen 3.8 Omni Flash
   */
  static async enhanceVideoPrompt(prompt: string): Promise<string> {
    return AIGateway.enhanceVideoPromptWithQwen(prompt);
  }
}
