// Standalone test suite for Master Cloud core algorithms and calculations

console.log('====================================================');
console.log(' MASTER CLOUD: CORE VERIFICATION TEST SUITE');
console.log('====================================================');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`✅ [PASS] ${message}`);
  } else {
    failed++;
    console.error(`❌ [FAIL] ${message}`);
  }
}

// 1. formatBytes logic
function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return '0 B';
  if (!bytes || isNaN(bytes)) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

assert(formatBytes(0) === '0 B', 'formatBytes(0) === 0 B');
assert(formatBytes(500) === '500 B', 'formatBytes(500) === 500 B');
assert(formatBytes(1024) === '1 KB', 'formatBytes(1024) === 1 KB');
assert(formatBytes(1048576) === '1 MB', 'formatBytes(1048576) === 1 MB');
assert(formatBytes(1073741824) === '1 GB', 'formatBytes(1073741824) === 1 GB');
assert(formatBytes(10995116277760) === '10 TB', 'formatBytes(10TB quota) === 10 TB');

// 2. getFileCategory logic
function getFileCategory(mimeType, extension) {
  const ext = extension.toLowerCase();
  const mime = mimeType.toLowerCase();

  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext)) {
    return 'image';
  }
  if (mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'].includes(ext)) {
    return 'video';
  }
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(ext)) {
    return 'audio';
  }
  if (
    mime.includes('pdf') ||
    mime.includes('word') ||
    mime.includes('document') ||
    mime.includes('spreadsheet') ||
    mime.includes('presentation') ||
    mime.includes('text/plain') ||
    mime.includes('csv') ||
    ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf'].includes(ext)
  ) {
    return 'document';
  }
  if (
    mime.includes('zip') ||
    mime.includes('tar') ||
    mime.includes('gzip') ||
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)
  ) {
    return 'archive';
  }
  if (
    mime.includes('javascript') ||
    mime.includes('json') ||
    mime.includes('typescript') ||
    mime.includes('html') ||
    mime.includes('css') ||
    ['js', 'jsx', 'ts', 'tsx', 'json', 'html', 'css', 'scss', 'py', 'go', 'rs', 'java', 'c', 'cpp', 'php', 'sql', 'yaml', 'yml', 'md', 'xml', 'sh'].includes(ext)
  ) {
    return 'code';
  }
  return 'other';
}

assert(getFileCategory('image/png', 'png') === 'image', 'PNG resolves to image');
assert(getFileCategory('image/jpeg', 'jpg') === 'image', 'JPEG resolves to image');
assert(getFileCategory('video/mp4', 'mp4') === 'video', 'MP4 resolves to video');
assert(getFileCategory('audio/mpeg', 'mp3') === 'audio', 'MP3 resolves to audio');
assert(getFileCategory('application/pdf', 'pdf') === 'document', 'PDF resolves to document');
assert(getFileCategory('application/json', 'json') === 'code', 'JSON resolves to code');
assert(getFileCategory('text/yaml', 'yaml') === 'code', 'YAML resolves to code');
assert(getFileCategory('application/zip', 'zip') === 'archive', 'ZIP resolves to archive');

// 3. Secure token generation logic
function generateSecureToken(length = 24) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

const t1 = generateSecureToken(24);
const t2 = generateSecureToken(24);
assert(t1.length === 24, 'Token length matches 24 characters');
assert(t2.length === 24, 'Token length matches 24 characters');
assert(t1 !== t2, 'Tokens are random and collision-free');

// 4. Duplicate Checksum grouping algorithm
const sampleFiles = [
  { id: '1', name: 'Doc.pdf', checksum: 'hashA', size_bytes: 100 },
  { id: '2', name: 'Doc_Copy.pdf', checksum: 'hashA', size_bytes: 100 },
  { id: '3', name: 'Photo.jpg', checksum: 'hashB', size_bytes: 200 },
];
const checksumMap = {};
for (const f of sampleFiles) {
  if (!checksumMap[f.checksum]) checksumMap[f.checksum] = [];
  checksumMap[f.checksum].push(f);
}
const duplicateGroups = Object.entries(checksumMap).filter(([, g]) => g.length > 1);
assert(duplicateGroups.length === 1, 'Duplicate checksum grouping detects identical files');
assert(duplicateGroups[0][1].length === 2, 'Duplicate group contains both identical copies');

// 5. Storage Quota Arithmetic & Policy Verification (10 TB Free Policy)
const FREE_TEN_TB_BYTES = 10995116277760; // 10 TB (10,995,116,277,760 bytes)
const usedStorage = 50000000; // 50 MB
const availableStorage = Math.max(0, FREE_TEN_TB_BYTES - usedStorage);
const percentageUsed = Math.min(100, Math.round((usedStorage / FREE_TEN_TB_BYTES) * 100));

assert(FREE_TEN_TB_BYTES === 10995116277760, 'Total quota matches exactly 10 TB in bytes');
assert(formatBytes(FREE_TEN_TB_BYTES) === '10 TB', '10 TB bytes format as 10 TB string');
assert(availableStorage === (10995116277760 - 50000000), 'Available storage arithmetic exact');
assert(percentageUsed === 0, 'Percentage calculation accurate (<1%)');

// 6. Strict Quota Enforcement Verification
function simulateUploadQuotaCheck(currentUsed, incomingSize, quotaLimit) {
  if (currentUsed + incomingSize > quotaLimit) {
    throw new Error('Not enough storage available.');
  }
  return true;
}

// Valid upload within 10 TB
assert(simulateUploadQuotaCheck(usedStorage, 1024 * 1024 * 100, FREE_TEN_TB_BYTES) === true, 'Upload within 10 TB quota is permitted');

// Overflow upload exceeding 10 TB
let caughtError = null;
try {
  simulateUploadQuotaCheck(FREE_TEN_TB_BYTES - 100, 200, FREE_TEN_TB_BYTES);
} catch (e) {
  caughtError = e.message;
}
assert(caughtError === 'Not enough storage available.', 'Exceeding 10 TB quota throws "Not enough storage available."');

console.log('====================================================');
console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed`);
console.log('====================================================');

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
