/**
 * MASTER CLOUD — MASTER AI CORE v1.0
 * Custom Bilingual Byte-Level BPE Tokenizer in TypeScript.
 *
 * Parity target: matches `training/v1/tokenizer_v1.py` 100% identically:
 * - Unicode NFC normalization
 * - 11 special conversation & tool-protocol tokens (0..10)
 * - 256 raw UTF-8 byte tokens (11..266)
 * - Word & Sinhala ZWJ conjunct cluster pre-tokenization
 * - Learned BPE merge ranks from `tokenizer_v1.json`
 * - Zero external tokenizer dependencies; runs offline in both Browser and Node.
 */

export const SPECIAL_TOKENS_V1 = [
  '<pad>',         // 0
  '<unk>',         // 1
  '<bos>',         // 2
  '<eos>',         // 3
  '<sep>',         // 4
  '<|system|>',    // 5
  '<|user|>',      // 6
  '<|assistant|>', // 7
  '<|tool|>',      // 8
  '<|tool_result|>', // 9
  '<|endturn|>',   // 10
] as const;

export const TOKEN_IDS_V1 = {
  PAD: 0,
  UNK: 1,
  BOS: 2,
  EOS: 3,
  SEP: 4,
  SYSTEM: 5,
  USER: 6,
  ASSISTANT: 7,
  TOOL: 8,
  TOOL_RESULT: 9,
  ENDTURN: 10,
  NUM_SPECIAL: SPECIAL_TOKENS_V1.length,
} as const;

export interface TokenizerV1Artifact {
  version: string;
  vocab_size: number;
  target_vocab_size?: number;
  special_tokens: string[];
  vocab_b64: string[];
  merges: Array<[number, number, number]>;
}

export interface ChatTurnInput {
  role: 'system' | 'user' | 'assistant' | 'tool' | 'tool_result';
  content: string;
}

const PRETOKENIZE_RE =
  / ?[\u0D80-\u0DFF][\u0D80-\u0DFF\u200C\u200D]*| ?[A-Za-z]+| ?[0-9]+|\r?\n+| +| ?[^\sA-Za-z0-9\u0D80-\u0DFF]/gu;

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const SPECIAL_SPLIT_RE = new RegExp(
  `(${SPECIAL_TOKENS_V1.map(escapeRegex).join('|')})`,
  'g',
);

const utf8Encoder = new TextEncoder();
const utf8Decoder = new TextDecoder('utf-8', { fatal: false });

function decodeBase64Bytes(b64: string): Uint8Array {
  if (!b64) return new Uint8Array(0);
  if (typeof globalThis.atob === 'function') {
    const bin = globalThis.atob(b64);
    const arr = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
      arr[i] = bin.charCodeAt(i);
    }
    return arr;
  }
  // Node.js fallback for offline unit tests
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Buf = (globalThis as any).Buffer;
  if (Buf) {
    return new Uint8Array(Buf.from(b64, 'base64'));
  }
  throw new Error('No base64 decoder available in current runtime');
}

export class MasterAiTokenizerV1 {
  private specialToId = new Map<string, number>();
  private idToSpecial = new Map<number, string>();
  private idToBytes = new Map<number, Uint8Array>();
  private mergeRanks = new Map<string, { rank: number; newId: number }>();
  private chunkCache = new Map<string, number[]>();
  private loadedVocabSize = 0;
  private isLoadedFlag = false;

  constructor() {
    SPECIAL_TOKENS_V1.forEach((tok, idx) => {
      this.specialToId.set(tok, idx);
      this.idToSpecial.set(idx, tok);
      this.idToBytes.set(idx, new Uint8Array(0));
    });
    for (let b = 0; b < 256; b++) {
      this.idToBytes.set(TOKEN_IDS_V1.NUM_SPECIAL + b, new Uint8Array([b]));
    }
    this.loadedVocabSize = TOKEN_IDS_V1.NUM_SPECIAL + 256;
  }

  public get loaded(): boolean {
    return this.isLoadedFlag;
  }

  public get vocabSize(): number {
    return this.loadedVocabSize;
  }

  public normalize(text: string): string {
    return (text || '').normalize('NFC');
  }

  public loadFromArtifact(artifact: TokenizerV1Artifact): void {
    this.idToBytes.clear();
    this.mergeRanks.clear();
    this.chunkCache.clear();
    this.specialToId.clear();
    this.idToSpecial.clear();

    const specials = artifact.special_tokens?.length
      ? artifact.special_tokens
      : [...SPECIAL_TOKENS_V1];
    specials.forEach((tok, idx) => {
      this.specialToId.set(tok, idx);
      this.idToSpecial.set(idx, tok);
    });

    const b64List = artifact.vocab_b64 || [];
    for (let i = 0; i < b64List.length; i++) {
      this.idToBytes.set(i, decodeBase64Bytes(b64List[i]));
    }

    const merges = artifact.merges || [];
    for (let rank = 0; rank < merges.length; rank++) {
      const [p0, p1, newId] = merges[rank];
      this.mergeRanks.set(`${p0}:${p1}`, { rank, newId });
    }

    this.loadedVocabSize = artifact.vocab_size || b64List.length;
    this.isLoadedFlag = true;
  }

  public async fetchAndLoad(url = '/models/master-ai-core-v1/tokenizer_v1.json'): Promise<void> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to load MASTER AI v1.0 tokenizer (${res.status} ${res.statusText})`);
    }
    const artifact = (await res.json()) as TokenizerV1Artifact;
    this.loadFromArtifact(artifact);
  }

  private encodeChunk(chunk: string): number[] {
    const cached = this.chunkCache.get(chunk);
    if (cached) return cached;

    const bytes = utf8Encoder.encode(chunk);
    let ids: number[] = new Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) {
      ids[i] = TOKEN_IDS_V1.NUM_SPECIAL + bytes[i];
    }

    if (ids.length >= 2 && this.mergeRanks.size > 0) {
      while (ids.length >= 2) {
        let bestRank = Number.MAX_SAFE_INTEGER;
        let bestPairA = -1;
        let bestPairB = -1;
        let bestNewId = -1;

        for (let i = 0; i < ids.length - 1; i++) {
          const entry = this.mergeRanks.get(`${ids[i]}:${ids[i + 1]}`);
          if (entry && entry.rank < bestRank) {
            bestRank = entry.rank;
            bestPairA = ids[i];
            bestPairB = ids[i + 1];
            bestNewId = entry.newId;
          }
        }

        if (bestNewId === -1) break;

        const merged: number[] = [];
        let i = 0;
        while (i < ids.length) {
          if (i < ids.length - 1 && ids[i] === bestPairA && ids[i + 1] === bestPairB) {
            merged.push(bestNewId);
            i += 2;
          } else {
            merged.push(ids[i]);
            i += 1;
          }
        }
        ids = merged;
      }
    }

    if (this.chunkCache.size < 25000) {
      this.chunkCache.set(chunk, ids);
    }
    return ids;
  }

  public encode(text: string, addBos = false, addEos = false): number[] {
    const out: number[] = [];
    if (addBos) out.push(TOKEN_IDS_V1.BOS);

    if (text) {
      const norm = this.normalize(text);
      const parts = norm.split(SPECIAL_SPLIT_RE);
      for (const seg of parts) {
        if (!seg) continue;
        const sp = this.specialToId.get(seg);
        if (sp !== undefined) {
          out.push(sp);
          continue;
        }
        const chunks = seg.match(PRETOKENIZE_RE);
        if (chunks) {
          for (const chunk of chunks) {
            const cIds = this.encodeChunk(chunk);
            for (const id of cIds) out.push(id);
          }
        }
      }
    }

    if (addEos) out.push(TOKEN_IDS_V1.EOS);
    return out;
  }

  public decode(tokenIds: number[], skipSpecialTokens = true): string {
    const segments: string[] = [];
    let byteBuf: number[] = [];

    const flush = () => {
      if (byteBuf.length > 0) {
        segments.push(utf8Decoder.decode(new Uint8Array(byteBuf)));
        byteBuf = [];
      }
    };

    for (const tid of tokenIds) {
      if (tid < TOKEN_IDS_V1.NUM_SPECIAL) {
        if (!skipSpecialTokens) {
          flush();
          segments.push(this.idToSpecial.get(tid) ?? '');
        }
        continue;
      }
      const bytes = this.idToBytes.get(tid);
      if (bytes) {
        for (let i = 0; i < bytes.length; i++) {
          byteBuf.push(bytes[i]);
        }
      }
    }

    flush();
    return segments.join('');
  }

  public countTokens(text: string): number {
    return this.encode(text, false, false).length;
  }

  public formatConversationPrompt(turns: ChatTurnInput[]): string {
    const roleTags: Record<ChatTurnInput['role'], string> = {
      system: '<|system|>',
      user: '<|user|>',
      assistant: '<|assistant|>',
      tool: '<|tool|>',
      tool_result: '<|tool_result|>',
    };
    const parts = ['<bos>'];
    for (const turn of turns) {
      const tag = roleTags[turn.role] ?? '<|user|>';
      parts.push(`${tag}\n${this.normalize(turn.content)}\n<|endturn|>`);
    }
    parts.push('<|assistant|>\n');
    return parts.join('\n');
  }
}

export const sharedTokenizerV1 = new MasterAiTokenizerV1();
