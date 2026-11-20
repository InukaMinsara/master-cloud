/**
 * src/lib/errorHandler.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MASTER CLOUD — CENTRALIZED ERROR MANAGEMENT & RECOVERY
 * Unified classification, sanitization, user notifications, and retry strategies.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { toast } from 'sonner';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'fatal';

export type ErrorCategory =
  | 'network'
  | 'rate_limit'
  | 'auth'
  | 'storage'
  | 'ai_provider'
  | 'validation'
  | 'unknown';

export interface AppErrorDetails {
  category: ErrorCategory;
  severity: ErrorSeverity;
  userMessage: string;
  technicalMessage?: string;
  statusCode?: number;
  retryable: boolean;
  retryAfterSec?: number;
}

export class AppErrorHandler {
  /**
   * Redacts sensitive credentials (e.g. gsk_..., Bearer ..., passwords) from any string.
   */
  public static redactSecrets(str: string): string {
    if (!str || typeof str !== 'string') return '';
    return str
      .replace(/gsk_[a-zA-Z0-9_-]+/g, 'gsk_***')
      .replace(/Bearer\s+[a-zA-Z0-9_.-]+/gi, 'Bearer ***')
      .replace(/sk-[a-zA-Z0-9_-]+/g, 'sk-***')
      .replace(/key=[a-zA-Z0-9_-]+/gi, 'key=***')
      .replace(/password=[^\s&]+/gi, 'password=***');
  }

  /**
   * Classifies an arbitrary thrown error into structured AppErrorDetails.
   */
  public static classify(err: any): AppErrorDetails {
    return this.classifyError(err);
  }

  public static classifyError(err: any): AppErrorDetails {
    const rawMsg = err?.message || (typeof err === 'string' ? err : 'An unexpected error occurred.');
    const safeMsg = this.redactSecrets(rawMsg);
    const status = err?.status || err?.statusCode;

    // Rate Limiting (429)
    if (status === 429 || /rate limit|too many requests|quota exceeded/i.test(safeMsg)) {
      return {
        category: 'rate_limit',
        severity: 'warning',
        userMessage: 'Rate limit reached. Please wait a moment before trying again.',
        technicalMessage: safeMsg,
        statusCode: 429,
        retryable: true,
        retryAfterSec: 5,
      };
    }

    // Network & Timeout
    if (/network|fetch failed|timeout|econnrefused|aborted/i.test(safeMsg)) {
      return {
        category: 'network',
        severity: 'warning',
        userMessage: 'Connection interrupted. Please verify your internet or server proxy.',
        technicalMessage: safeMsg,
        statusCode: status,
        retryable: true,
        retryAfterSec: 2,
      };
    }

    // AI Provider Model Not Found / Missing Credentials
    if (/model_not_found|does not exist|GROQ_API_KEY missing/i.test(safeMsg)) {
      return {
        category: 'ai_provider',
        severity: 'error',
        userMessage: 'The selected AI model is unavailable. Switching to a compatible active model.',
        technicalMessage: safeMsg,
        statusCode: status || 404,
        retryable: false,
      };
    }

    // Storage / Quota Limits
    if (/storage|quota|disk full|not enough storage/i.test(safeMsg)) {
      return {
        category: 'storage',
        severity: 'error',
        userMessage: 'Storage limit reached. Please free up space or check quota settings.',
        technicalMessage: safeMsg,
        statusCode: status || 507,
        retryable: false,
      };
    }

    // Authentication / Unauthorized
    if (status === 401 || status === 403 || /unauthorized|forbidden|token expired/i.test(safeMsg)) {
      return {
        category: 'auth',
        severity: 'error',
        userMessage: 'Authentication required. Please verify your login credentials.',
        technicalMessage: safeMsg,
        statusCode: status || 401,
        retryable: false,
      };
    }

    // Default Unknown Error
    return {
      category: 'unknown',
      severity: 'error',
      userMessage: safeMsg.length < 120 ? safeMsg : 'An unexpected error occurred.',
      technicalMessage: safeMsg,
      statusCode: status,
      retryable: true,
    };
  }

  /**
   * Central error reporter: classifies, shows user notification, and returns details.
   */
  public static handle(err: any, fallbackMessage?: string): AppErrorDetails {
    const details = this.classify(err);

    if (details.severity === 'warning') {
      toast.warning(fallbackMessage || details.userMessage);
    } else {
      toast.error(fallbackMessage || details.userMessage);
    }

    // Log sanitized error in development without leaking secrets
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[AppErrorHandler] [${details.category}]`, details.technicalMessage);
    }

    return details;
  }
}
