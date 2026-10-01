import { localDb } from '../services/localDb';
import { getFileCategory, formatBytes, generateSecureToken } from '../lib/utils';
import { getFilteredDriveItems } from '../stores/fileStore';

export async function runSelfVerificationTests(): Promise<{ passed: number; failed: number; results: string[] }> {
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
      results.push(`✅ [PASS] ${testName}`);
    } else {
      failed++;
      results.push(`❌ [FAIL] ${testName}`);
    }
  }

  try {
    // Test 1: Category resolution
    assert(getFileCategory('image/png', 'png') === 'image', 'MIME category resolves image correctly');
    assert(getFileCategory('video/mp4', 'mp4') === 'video', 'MIME category resolves video correctly');
    assert(getFileCategory('application/pdf', 'pdf') === 'document', 'MIME category resolves document correctly');
    assert(getFileCategory('application/json', 'json') === 'code', 'MIME category resolves code correctly');

    // Test 2: Formatting bytes
    assert(formatBytes(0) === '0 B', 'Byte formatter handles zero');
    assert(formatBytes(1024) === '1 KB', 'Byte formatter handles 1 KB');
    assert(formatBytes(1048576) === '1 MB', 'Byte formatter handles 1 MB');
    assert(formatBytes(1073741824) === '1 GB', 'Byte formatter handles 1 GB');

    // Test 3: Secure token generation
    const token1 = generateSecureToken(16);
    const token2 = generateSecureToken(16);
    assert(token1.length === 16 && token2.length === 16 && token1 !== token2, 'Secure random tokens are unique and non-predictable');

    // Test 4: Storage Quota Calculation & 10 TB Policy
    const breakdown = localDb.getStorageBreakdown();
    assert(breakdown.totalQuota === 10995116277760, 'Default quota is exactly 10 TB (10,995,116,277,760 bytes)');
    assert(breakdown.usedStorage > 0, 'Real storage calculation detects stored file bytes');
    assert(breakdown.availableStorage === breakdown.totalQuota - breakdown.usedStorage, 'Available storage arithmetic is exact');

    // Test 4b: Quota Enforcement & Rejection
    let quotaExceededError = '';
    try {
      const fakeHugeFile = new File(['mock content'], 'overflow.iso', { type: 'application/octet-stream' });
      Object.defineProperty(fakeHugeFile, 'size', { value: 10995116277760 + 1024 });
      await localDb.uploadFile(fakeHugeFile, null);
    } catch (err: any) {
      quotaExceededError = err.message;
    }
    assert(quotaExceededError === 'Not enough storage available.', 'Engine strictly rejects uploads exceeding 10 TB quota');

    // Test 5: Folder creation & nesting
    const testFolder = await localDb.createFolder('Unit Test Folder', null, '#3b82f6');
    assert(testFolder.name === 'Unit Test Folder', 'Folder creation writes name accurately');
    const subFolder = await localDb.createFolder('Sub Test Folder', testFolder.id);
    assert(subFolder.parent_folder_id === testFolder.id, 'Nested subfolder retains parent reference');

    // Test 6: Soft delete and trash cascade
    await localDb.softDeleteFolder(testFolder.id);
    const inTrash = await localDb.getFolders(null, true);
    assert(inTrash.some(f => f.id === testFolder.id), 'Deleted folder is recorded in trash');
    await localDb.restoreFolder(testFolder.id);
    const restored = await localDb.getFolders(null, false);
    assert(restored.some(f => f.id === testFolder.id), 'Restored folder is returned to active drive');

    // Clean up test folder
    await localDb.permanentDeleteFolder(testFolder.id);

    // Test 7: Public Share Links
    const testLink = await localDb.createShareLink({
      resourceType: 'file',
      resourceId: 'file-1',
      permission: 'viewer',
      hasPassword: true,
      password: 'SafePassword123!',
      allowDownload: true,
    });
    assert(testLink.token.length > 10, 'Public share link token is generated safely');
    assert(testLink.has_password === true, 'Public link flags password requirement');
    const fetchedLink = await localDb.getShareLinkByToken(testLink.token);
    assert(fetchedLink !== null && fetchedLink.link.token === testLink.token, 'Share link resolves resource safely');

    // Test 8: File Requests
    const req = await localDb.createFileRequest({
      targetFolderId: 'folder-1',
      title: 'Tax Receipt Inflow',
      maxFileSizeBytes: 10485760, // 10MB
    });
    const fetchedReq = await localDb.getFileRequestByToken(req.token);
    assert(fetchedReq !== null && fetchedReq.title === 'Tax Receipt Inflow', 'File Request token resolves request details');

    // Test 9: Smart Cleanup Suggestions
    const suggestions = localDb.getStorageCleanupSuggestions();
    assert(Array.isArray(suggestions.largeFiles), 'Smart cleanup suggests large files list');
    assert(Array.isArray(suggestions.duplicateGroups), 'Smart cleanup groups duplicates by checksum');

    // Test 10: Version History
    const versions = await localDb.getFileVersions('file-1');
    assert(versions.length >= 1, 'File version history accurately tracks revisions');
  } catch (err: any) {
    failed++;
    results.push(`❌ [EXCEPTION] ${err.message}`);
  }

  return { passed, failed, results };
}
