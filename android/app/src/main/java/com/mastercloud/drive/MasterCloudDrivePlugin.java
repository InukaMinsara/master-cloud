package com.mastercloud.drive;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
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
        ret.put("driveTitle", "MASTER CLOUD (10 TB)");
        ret.put("authority", MasterCloudDocumentsProvider.AUTHORITY);
        ret.put("totalQuotaBytes", MasterCloudDocumentsProvider.TEN_TB_BYTES);
        ret.put("availableBytes", MasterCloudDocumentsProvider.TEN_TB_BYTES - (1024L * 1024L * 50L));
        ret.put("storageMode", "Stream Mode (0-Byte Phone Storage Footprint)");
        ret.put("protocol", "Android Storage Access Framework (SAF) Virtual Volume");

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

            // Launch native Android Documents UI
            Uri rootUri = DocumentsContract.buildRootUri(
                    MasterCloudDocumentsProvider.AUTHORITY,
                    MasterCloudDocumentsProvider.ROOT_ID
            );

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setDataAndType(rootUri, DocumentsContract.Document.MIME_TYPE_DIR);
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_GRANT_READ_URI_PERMISSION);

            // If ACTION_VIEW fails on specific OEM launchers, fallback to general file manager
            if (intent.resolveActivity(context.getPackageManager()) != null) {
                context.startActivity(intent);
            } else {
                Intent fallback = new Intent(Intent.ACTION_GET_CONTENT);
                fallback.setType("*/*");
                fallback.addCategory(Intent.CATEGORY_OPENABLE);
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(Intent.createChooser(fallback, "Open Master Cloud Drive"));
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
}
