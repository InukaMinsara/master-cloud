package com.mastercloud.drive;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MasterCloudDrivePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
