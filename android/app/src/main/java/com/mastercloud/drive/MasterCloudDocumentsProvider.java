package com.mastercloud.drive;

import android.content.Context;
import android.content.res.AssetFileDescriptor;
import android.database.Cursor;
import android.database.MatrixCursor;
import android.graphics.Point;
import android.os.CancellationSignal;
import android.os.ParcelFileDescriptor;
import android.provider.DocumentsContract;
import android.provider.DocumentsContract.Document;
import android.provider.DocumentsContract.Root;
import android.provider.DocumentsProvider;
import android.util.Log;
import android.webkit.MimeTypeMap;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

/**
 * MasterCloudDocumentsProvider
 * ─────────────────────────────────────────────────────────────────────────────
 * Android Storage Access Framework (SAF) DocumentsProvider for Master Cloud.
 *
 * This provider mounts "MASTER CLOUD" as a native Storage Device inside:
 *   - Android System Files app ("Files by Google" / AOSP Files)
 *   - Android System File Pickers (WhatsApp, Gallery, Camera, Chrome, etc.)
 *
 * It provides 10.0 TB (10,995,116,277,760 bytes) of virtual local drive space
 * with 0-byte local phone footprint and on-demand streaming.
 * ─────────────────────────────────────────────────────────────────────────────
 */
public class MasterCloudDocumentsProvider extends DocumentsProvider {
    private static final String TAG = "MasterCloudProvider";
    public static final String AUTHORITY = "com.mastercloud.drive.documents";
    public static final String ROOT_ID = "master_cloud_root";

    // 10 TB in bytes
    public static final long TEN_TB_BYTES = 10L * 1024L * 1024L * 1024L * 1024L; // 10,995,116,277,760 bytes

    private static final String[] DEFAULT_ROOT_PROJECTION = new String[]{
            Root.COLUMN_ROOT_ID,
            Root.COLUMN_DOCUMENT_ID,
            Root.COLUMN_TITLE,
            Root.COLUMN_SUMMARY,
            Root.COLUMN_FLAGS,
            Root.COLUMN_ICON,
            Root.COLUMN_AVAILABLE_BYTES,
            Root.COLUMN_CAPACITY_BYTES,
            Root.COLUMN_MIME_TYPES
    };

    private static final String[] DEFAULT_DOCUMENT_PROJECTION = new String[]{
            Document.COLUMN_DOCUMENT_ID,
            Document.COLUMN_DISPLAY_NAME,
            Document.COLUMN_MIME_TYPE,
            Document.COLUMN_SIZE,
            Document.COLUMN_LAST_MODIFIED,
            Document.COLUMN_FLAGS,
            Document.COLUMN_ICON
    };

    private File baseDir;

    @Override
    public boolean onCreate() {
        Context context = getContext();
        if (context != null) {
            baseDir = new File(context.getFilesDir(), "master_cloud_vfs");
            if (!baseDir.exists()) {
                boolean created = baseDir.mkdirs();
                if (created) {
                    initDefaultFolders();
                }
            } else {
                initDefaultFolders();
            }
        }
        return true;
    }

    private void initDefaultFolders() {
        try {
            new File(baseDir, "Documents").mkdirs();
            new File(baseDir, "Camera & Photos").mkdirs();
            new File(baseDir, "Media & 4K Videos").mkdirs();
            new File(baseDir, "Downloads").mkdirs();

            File readme = new File(baseDir, "Welcome to Master Cloud 10TB.txt");
            if (!readme.exists()) {
                String content = "MASTER CLOUD — 10 TB VIRTUAL LOCAL DRIVE\n"
                        + "====================================================\n\n"
                        + "Welcome to your permanent 10.0 TB Cloud Storage directly mounted\n"
                        + "into your Android System Files!\n\n"
                        + "Key Features:\n"
                        + " • 10 TB Virtual Capacity (10,995,116,277,760 bytes)\n"
                        + " • Stream Mode: 0-Byte local phone memory consumed\n"
                        + " • Instant Camera auto-backup\n"
                        + " • Appears as native Storage Device in all Android file pickers\n\n"
                        + "Everything you save here is permanently stored in your Master Cloud account.\n";
                try (FileOutputStream fos = new FileOutputStream(readme)) {
                    fos.write(content.getBytes(StandardCharsets.UTF_8));
                }
            }
        } catch (Exception e) {
            Log.w(TAG, "Error initializing default folders", e);
        }
    }

    @Override
    public Cursor queryRoots(String[] projection) throws FileNotFoundException {
        final MatrixCursor result = new MatrixCursor(projection != null ? projection : DEFAULT_ROOT_PROJECTION);

        final MatrixCursor.RowBuilder row = result.newRow();
        row.add(Root.COLUMN_ROOT_ID, ROOT_ID);
        row.add(Root.COLUMN_DOCUMENT_ID, getDocIdForFile(baseDir));
        row.add(Root.COLUMN_TITLE, "MASTER CLOUD (10 TB)");
        row.add(Root.COLUMN_SUMMARY, "10.0 TB Virtual Local Drive · Stream Mode");
        row.add(Root.COLUMN_FLAGS,
                Root.FLAG_SUPPORTS_CREATE |
                Root.FLAG_SUPPORTS_RECENTS |
                Root.FLAG_SUPPORTS_SEARCH);
        row.add(Root.COLUMN_ICON, R.mipmap.ic_launcher);
        row.add(Root.COLUMN_AVAILABLE_BYTES, TEN_TB_BYTES);
        row.add(Root.COLUMN_CAPACITY_BYTES, TEN_TB_BYTES);
        row.add(Root.COLUMN_MIME_TYPES, "*/*");

        return result;
    }

    @Override
    public Cursor queryDocument(String documentId, String[] projection) throws FileNotFoundException {
        final MatrixCursor result = new MatrixCursor(projection != null ? projection : DEFAULT_DOCUMENT_PROJECTION);
        final File file = getFileForDocId(documentId);
        includeFile(result, documentId, file);
        return result;
    }

    @Override
    public Cursor queryChildDocuments(String parentDocumentId, String[] projection, String sortOrder)
            throws FileNotFoundException {
        final MatrixCursor result = new MatrixCursor(projection != null ? projection : DEFAULT_DOCUMENT_PROJECTION);
        final File parent = getFileForDocId(parentDocumentId);
        File[] children = parent.listFiles();
        if (children != null) {
            for (File child : children) {
                includeFile(result, null, child);
            }
        }
        return result;
    }

    @Override
    public ParcelFileDescriptor openDocument(String documentId, String mode, CancellationSignal signal)
            throws FileNotFoundException {
        final File file = getFileForDocId(documentId);
        final int accessMode = ParcelFileDescriptor.parseMode(mode);
        return ParcelFileDescriptor.open(file, accessMode);
    }

    @Override
    public AssetFileDescriptor openDocumentThumbnail(String documentId, Point sizeHint, CancellationSignal signal)
            throws FileNotFoundException {
        final File file = getFileForDocId(documentId);
        final ParcelFileDescriptor pfd = ParcelFileDescriptor.open(file, ParcelFileDescriptor.MODE_READ_ONLY);
        return new AssetFileDescriptor(pfd, 0, AssetFileDescriptor.UNKNOWN_LENGTH);
    }

    @Override
    public String createDocument(String parentDocumentId, String mimeType, String displayName)
            throws FileNotFoundException {
        final File parent = getFileForDocId(parentDocumentId);
        File file = new File(parent, displayName);
        try {
            if (Document.MIME_TYPE_DIR.equals(mimeType)) {
                if (!file.mkdir()) {
                    throw new FileNotFoundException("Failed to create directory " + file.getPath());
                }
            } else {
                if (!file.createNewFile()) {
                    throw new FileNotFoundException("Failed to create file " + file.getPath());
                }
            }
            return getDocIdForFile(file);
        } catch (IOException e) {
            throw new FileNotFoundException("Failed to create document: " + e.getMessage());
        }
    }

    @Override
    public void deleteDocument(String documentId) throws FileNotFoundException {
        final File file = getFileForDocId(documentId);
        if (!deleteRecursive(file)) {
            throw new FileNotFoundException("Failed to delete " + file.getPath());
        }
    }

    @Override
    public String getDocumentType(String documentId) throws FileNotFoundException {
        final File file = getFileForDocId(documentId);
        return getTypeForFile(file);
    }

    private void includeFile(MatrixCursor result, String docId, File file) {
        if (docId == null) {
            docId = getDocIdForFile(file);
        }

        int flags = 0;
        if (file.isDirectory()) {
            if (file.canWrite()) {
                flags |= Document.FLAG_DIR_SUPPORTS_CREATE;
            }
        } else if (file.canWrite()) {
            flags |= Document.FLAG_SUPPORTS_WRITE;
            flags |= Document.FLAG_SUPPORTS_DELETE;
        }

        final String mimeType = getTypeForFile(file);
        if (mimeType.startsWith("image/")) {
            flags |= Document.FLAG_SUPPORTS_THUMBNAIL;
        }

        String displayName = file.getName();
        if ("root".equals(docId) || (baseDir != null && file.equals(baseDir))) {
            displayName = "MASTER CLOUD (10 TB)";
        }

        final MatrixCursor.RowBuilder row = result.newRow();
        row.add(Document.COLUMN_DOCUMENT_ID, docId);
        row.add(Document.COLUMN_DISPLAY_NAME, displayName);
        row.add(Document.COLUMN_SIZE, file.isDirectory() ? 0L : file.length());
        row.add(Document.COLUMN_MIME_TYPE, mimeType);
        row.add(Document.COLUMN_LAST_MODIFIED, file.lastModified());
        row.add(Document.COLUMN_FLAGS, flags);
        row.add(Document.COLUMN_ICON, R.mipmap.ic_launcher);
    }

    private String getDocIdForFile(File file) {
        String path = file.getAbsolutePath();
        String basePath = baseDir.getAbsolutePath();
        if (path.startsWith(basePath)) {
            String rel = path.substring(basePath.length());
            if (rel.startsWith(File.separator)) {
                rel = rel.substring(1);
            }
            return rel.isEmpty() ? "root" : "root:" + rel;
        }
        return "root";
    }

    private File getFileForDocId(String docId) throws FileNotFoundException {
        if ("root".equals(docId) || docId == null || docId.isEmpty()) {
            return baseDir;
        }
        if (docId.startsWith("root:")) {
            String rel = docId.substring(5);
            File target = new File(baseDir, rel);
            if (target.exists()) {
                return target;
            }
        }
        File target = new File(baseDir, docId);
        if (target.exists()) {
            return target;
        }
        throw new FileNotFoundException("Missing document with id " + docId);
    }

    private String getTypeForFile(File file) {
        if (file.isDirectory()) {
            return Document.MIME_TYPE_DIR;
        }
        return getTypeForName(file.getName());
    }

    private String getTypeForName(String name) {
        final int lastDot = name.lastIndexOf('.');
        if (lastDot >= 0) {
            final String extension = name.substring(lastDot + 1).toLowerCase();
            final String mime = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
            if (mime != null) {
                return mime;
            }
        }
        return "application/octet-stream";
    }

    private boolean deleteRecursive(File fileOrDirectory) {
        if (fileOrDirectory.isDirectory()) {
            File[] files = fileOrDirectory.listFiles();
            if (files != null) {
                for (File child : files) {
                    deleteRecursive(child);
                }
            }
        }
        return fileOrDirectory.delete();
    }
}
