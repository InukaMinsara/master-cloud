package com.mastercloud.drive;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.DocumentsContract;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;

@CapacitorPlugin(name = "MasterCloudDrive")
public class MasterCloudDrivePlugin extends Plugin {
    private static final String TAG = "MasterCloudDrivePlugin";

    @PluginMethod
    public void getDriveStatus(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("isMounted", true);
        ret.put("driveTitle", "MASTER CLOUD (Z:)");
        ret.put("authority", MasterCloudDocumentsProvider.AUTHORITY);
        ret.put("totalQuotaBytes", MasterCloudDocumentsProvider.TEN_TB_BYTES);
        ret.put("availableBytes", MasterCloudDocumentsProvider.TEN_TB_BYTES - (1024L * 1024L * 50L));
        ret.put("storageMode", "Stream Mode (0-Byte Phone Storage Footprint)");
        ret.put("protocol", "Android Storage Access Framework (SAF) Virtual Volume");
        ret.put("webdavUrl", "http://192.168.1.164:8766");

        Context context = getContext();
        if (context != null) {
            File vfs = new File(context.getFilesDir(), "master_cloud_vfs");
            ret.put("localPath", vfs.getAbsolutePath());
        }

        call.resolve(ret);
    }

    @PluginMethod
    public void openSystemFiles(PluginCall call) {
        try {
            Context context = getContext();
            if (context == null) {
                call.reject("Context is null");
                return;
            }

            Uri rootUri = DocumentsContract.buildRootUri(
                    MasterCloudDocumentsProvider.AUTHORITY,
                    MasterCloudDocumentsProvider.ROOT_ID
            );

            boolean launched = false;

            // 1. Try BROWSE_DOCUMENT_ROOT
            try {
                Intent intent = new Intent("android.provider.action.BROWSE_DOCUMENT_ROOT");
                intent.setData(rootUri);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                if (intent.resolveActivity(context.getPackageManager()) != null) {
                    context.startActivity(intent);
                    launched = true;
                }
            } catch (Exception ignored) {}

            // 2. Try ACTION_OPEN_DOCUMENT_TREE with INITIAL_URI
            if (!launched) {
                try {
                    Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        intent.putExtra(DocumentsContract.EXTRA_INITIAL_URI, rootUri);
                    }
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    if (intent.resolveActivity(context.getPackageManager()) != null) {
                        context.startActivity(intent);
                        launched = true;
                    }
                } catch (Exception ignored) {}
            }

            // 3. Try standard ACTION_VIEW
            if (!launched) {
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW);
                    intent.setDataAndType(rootUri, DocumentsContract.Document.MIME_TYPE_DIR);
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    if (intent.resolveActivity(context.getPackageManager()) != null) {
                        context.startActivity(intent);
                        launched = true;
                    }
                } catch (Exception ignored) {}
            }

            // 4. Fallback to ACTION_GET_CONTENT
            if (!launched) {
                Intent fallback = new Intent(Intent.ACTION_GET_CONTENT);
                fallback.setType("*/*");
                fallback.addCategory(Intent.CATEGORY_OPENABLE);
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(Intent.createChooser(fallback, "Open Master Cloud (10 TB)"));
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("opened", true);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Error opening system files", e);
            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("error", e.getMessage());
            call.resolve(ret);
        }
    }

    @PluginMethod
    public void openPhoneFileManager(PluginCall call) {
        try {
            Context context = getContext();
            if (context == null) {
                call.reject("Context is null");
                return;
            }

            // Try Xiaomi File Manager first, then Samsung, then generic
            String[] knownFileManagers = new String[]{
                    "com.mi.android.globalFileexplorer",
                    "com.android.fileexplorer",
                    "com.sec.android.app.myfiles",
                    "com.google.android.apps.nbu.files",
                    "com.google.android.documentsui"
            };

            boolean launched = false;
            for (String pkg : knownFileManagers) {
                Intent launchIntent = context.getPackageManager().getLaunchIntentForPackage(pkg);
                if (launchIntent != null) {
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(launchIntent);
                    launched = true;
                    break;
                }
            }

            if (!launched) {
                Intent intent = new Intent(Intent.ACTION_MAIN);
                intent.addCategory(Intent.CATEGORY_APP_FILES);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                if (intent.resolveActivity(context.getPackageManager()) != null) {
                    context.startActivity(intent);
                    launched = true;
                }
            }

            JSObject ret = new JSObject();
            ret.put("success", launched);
            call.resolve(ret);
        } catch (Exception e) {
            Log.e(TAG, "Error opening phone file manager", e);
            JSObject ret = new JSObject();
            ret.put("success", false);
            ret.put("error", e.getMessage());
            call.resolve(ret);
        }
    }
}
