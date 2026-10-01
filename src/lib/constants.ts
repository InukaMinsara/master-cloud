/**
 * MASTER CLOUD: CORE CONFIGURATION CONSTANTS
 * 
 * ABSOLUTE STORAGE POLICY:
 * Every registered user automatically receives FREE 10 TB CLOUD STORAGE.
 * There is ONLY ONE plan (10 TB Free). No paid tiers, no upgrades, no billing.
 */

// Exactly 10 TB in standard binary bytes (10 * 1024^4 = 10,995,116,277,760 bytes)
export const FREE_TEN_TB_BYTES = 10995116277760;

export const APP_CONFIG = {
  name: 'MASTER CLOUD',
  tagline: 'Next-Gen Cloud Storage & Intelligent Workspace',
  defaultQuotaBytes: FREE_TEN_TB_BYTES, // 10 TB FREE for EVERY registered user
  maxGuestUploadSize: 524288000, // 500 MB max for unauthenticated guest drops
  version: '1.0.0',
};

export const COLOR_PALETTE = [
  { name: 'Default', value: '#3b82f6' },
  { name: 'Emerald', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Cyan', value: '#06b6d4' },
];
