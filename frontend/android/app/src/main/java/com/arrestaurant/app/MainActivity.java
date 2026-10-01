package com.arrestaurant.app;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.PermissionRequest;
import android.widget.Toast;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebChromeClient;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivityAR";
    private static final int CAMERA_PERMISSION_CODE = 101;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeARPlugin.class);
        super.onCreate(savedInstanceState);

        // Pre-request camera permission so ARCore and HTML5 camera start instantly
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION_CODE);
        }

        // Register direct JavaScript interface and enable live camera WebRTC in WebView
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addJavascriptInterface(new ARJavaScriptBridge(), "AndroidAR");
            getBridge().getWebView().setWebChromeClient(new BridgeWebChromeClient(getBridge()) {
                @Override
                public void onPermissionRequest(final PermissionRequest request) {
                    runOnUiThread(() -> {
                        request.grant(request.getResources());
                    });
                }
            });
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        // Pause WebView to cleanly release camera hardware locks when opening SceneViewer or backgrounding
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().onPause();
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().onResume();
        }
    }

    public class ARJavaScriptBridge {
        @JavascriptInterface
        public boolean launchAR(String glbUrl, String title, boolean verticalPlacement) {
            return launchSceneViewer(glbUrl, title, verticalPlacement);
        }

        @JavascriptInterface
        public boolean launchAR(String glbUrl, String title) {
            return launchSceneViewer(glbUrl, title, false);
        }

        @JavascriptInterface
        public boolean isAvailable() {
            return true;
        }
    }

    public boolean launchSceneViewer(String glbUrl, String title) {
        return launchSceneViewer(glbUrl, title, false);
    }

    public boolean launchSceneViewer(String glbUrl, String title, boolean verticalPlacement) {
        if (glbUrl == null || glbUrl.isEmpty()) {
            return false;
        }

        // Ensure camera permission is granted
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION_CODE);
        }

        try {
            String safeTitle = (title != null && !title.isEmpty()) ? title : "Royal Spice AR Dish";
            String verticalParam = verticalPlacement ? "enable_vertical_placement=true" : "enable_vertical_placement=false";
            Log.d(TAG, "Launching SceneViewer for: " + glbUrl + " (" + safeTitle + "), vertical=" + verticalPlacement);

            // Cleanly pause WebView camera stream before launching external AR viewer to avoid camera2 hardware lock
            if (getBridge() != null && getBridge().getWebView() != null) {
                runOnUiThread(() -> {
                    try {
                        getBridge().getWebView().onPause();
                    } catch (Exception ignored) {}
                });
            }

            String httpsUri = "https://arvr.google.com/scene-viewer/1.0?file=" +
                    Uri.encode(glbUrl) +
                    "&mode=ar_preferred&resizable=true&disable_occlusion=true&" + verticalParam + "&title=" +
                    Uri.encode(safeTitle);

            // Delay intent launch slightly (250ms) to guarantee WebView Camera2 HAL lock is fully released by Android OS
            new android.os.Handler(android.os.Looper.getMainLooper()).postDelayed(() -> {
                try {
                    // 1. Primary: Google App (com.google.android.googlequicksearchbox) which hosts Google SceneViewer UI
                    Intent quickSearchIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(httpsUri));
                    quickSearchIntent.setPackage("com.google.android.googlequicksearchbox");
                    quickSearchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

                    if (quickSearchIntent.resolveActivity(getPackageManager()) != null) {
                        Log.d(TAG, "Launching SceneViewer via Google App");
                        startActivity(quickSearchIntent);
                        return;
                    }

                    // 2. Google Chrome
                    Intent chromeIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(httpsUri));
                    chromeIntent.setPackage("com.android.chrome");
                    chromeIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

                    if (chromeIntent.resolveActivity(getPackageManager()) != null) {
                        Log.d(TAG, "Launching SceneViewer via Chrome");
                        startActivity(chromeIntent);
                        return;
                    }

                    // 3. System Default AR Handler
                    Intent defaultBrowserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(httpsUri));
                    defaultBrowserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    startActivity(defaultBrowserIntent);
                } catch (Exception ex) {
                    Log.e(TAG, "Delayed SceneViewer launch error: " + ex.getMessage(), ex);
                }
            }, 250);

            return true;

        } catch (Exception e) {
            Log.e(TAG, "Error launching SceneViewer: " + e.getMessage(), e);
            runOnUiThread(() ->
                Toast.makeText(MainActivity.this, "AR camera launch notice: " + e.getMessage(), Toast.LENGTH_SHORT).show()
            );
            return false;
        }
    }
}
