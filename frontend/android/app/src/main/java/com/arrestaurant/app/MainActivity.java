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
    protected void onPause() {
        super.onPause();
        // Pause WebView to cleanly release camera hardware locks when opening SceneViewer or backgrounding
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().onPause();
        }
    }

    @Override
    protected void onResume() {
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

            String httpsUri = "https://arvr.google.com/scene-viewer/1.0?file=" +
                    Uri.encode(glbUrl) +
                    "&mode=ar_preferred&resizable=true&disable_occlusion=true&" + verticalParam + "&title=" +
                    Uri.encode(safeTitle);

            // 1. Primary: Explicit Intent targeting Google Play Services for AR (com.google.ar.core)
            Intent arcoreIntent = new Intent(Intent.ACTION_VIEW);
            Uri arcoreUri = Uri.parse("https://arvr.google.com/scene-viewer/1.0").buildUpon()
                    .appendQueryParameter("file", glbUrl)
                    .appendQueryParameter("mode", "ar_preferred")
                    .appendQueryParameter("title", safeTitle)
                    .appendQueryParameter("resizable", "true")
                    .appendQueryParameter("disable_occlusion", "true")
                    .appendQueryParameter("enable_vertical_placement", verticalPlacement ? "true" : "false")
                    .appendQueryParameter("browser_fallback_url", httpsUri)
                    .build();

            arcoreIntent.setData(arcoreUri);
            arcoreIntent.setPackage("com.google.ar.core");
            arcoreIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

            if (arcoreIntent.resolveActivity(getPackageManager()) != null) {
                Log.d(TAG, "Launching SceneViewer via com.google.ar.core");
                startActivity(arcoreIntent);
                return true;
            }

            // 2. Google QuickSearchBox App fallback (Google App)
            String sceneViewerUri = "intent://arvr.google.com/scene-viewer/1.0?file=" +
                    Uri.encode(glbUrl) +
                    "&mode=ar_preferred&resizable=true&disable_occlusion=true&" + verticalParam + "&title=" +
                    Uri.encode(safeTitle) +
                    "#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=" +
                    Uri.encode(httpsUri) +
                    ";end;";

            Intent quickSearchIntent = Intent.parseUri(sceneViewerUri, Intent.URI_INTENT_SCHEME);
            quickSearchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);

            if (quickSearchIntent.resolveActivity(getPackageManager()) != null) {
                Log.d(TAG, "Launching SceneViewer via Google QuickSearchBox App");
                startActivity(quickSearchIntent);
                return true;
            }

            // 3. Fallback: Direct Intent to Google Chrome
            Intent chromeIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(httpsUri));
            chromeIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            chromeIntent.setPackage("com.android.chrome");

            if (chromeIntent.resolveActivity(getPackageManager()) != null) {
                Log.d(TAG, "Launching SceneViewer via Chrome");
                startActivity(chromeIntent);
                return true;
            }

            // 4. Fallback: Default Browser
            Intent defaultBrowserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(httpsUri));
            defaultBrowserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(defaultBrowserIntent);
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
