package com.arrestaurant.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.widget.Toast;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivityAR";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeARPlugin.class);
        super.onCreate(savedInstanceState);

        // Register direct JavaScript interface on WebView for instant zero-latency AR launch
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().addJavascriptInterface(new ARJavaScriptBridge(), "AndroidAR");
        }
    }

    public class ARJavaScriptBridge {
        @JavascriptInterface
        public boolean launchAR(String glbUrl, String title) {
            return launchSceneViewer(glbUrl, title);
        }

        @JavascriptInterface
        public boolean isAvailable() {
            return true;
        }
    }

    public boolean launchSceneViewer(String glbUrl, String title) {
        if (glbUrl == null || glbUrl.isEmpty()) {
            return false;
        }

        try {
            String safeTitle = (title != null && !title.isEmpty()) ? title : "Royal Spice AR Dish";
            Log.d(TAG, "Launching SceneViewer for: " + glbUrl + " (" + safeTitle + ")");

            // 1. Google App SceneViewer Intent (Primary method for Google ARCore / SceneViewer)
            String sceneViewerUri = "intent://arvr.google.com/scene-viewer/1.2?file=" +
                    Uri.encode(glbUrl) +
                    "&mode=ar_only&resizable=true&title=" +
                    Uri.encode(safeTitle) +
                    "#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;end;";

            Intent quickSearchIntent = Intent.parseUri(sceneViewerUri, Intent.URI_INTENT_SCHEME);
            quickSearchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            if (quickSearchIntent.resolveActivity(getPackageManager()) != null) {
                Log.d(TAG, "Launching SceneViewer via Google QuickSearchBox App");
                startActivity(quickSearchIntent);
                return true;
            }

            // 2. Generic SceneViewer Intent (Resolves through Google Play Services for AR / ARCore)
            String genericUri = "intent://arvr.google.com/scene-viewer/1.2?file=" +
                    Uri.encode(glbUrl) +
                    "&mode=ar_only&resizable=true&title=" +
                    Uri.encode(safeTitle) +
                    "#Intent;scheme=https;action=android.intent.action.VIEW;end;";

            Intent genericIntent = Intent.parseUri(genericUri, Intent.URI_INTENT_SCHEME);
            genericIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            if (genericIntent.resolveActivity(getPackageManager()) != null) {
                Log.d(TAG, "Launching SceneViewer via Generic Intent");
                startActivity(genericIntent);
                return true;
            }

            // 3. Fallback: Direct Intent to Google Chrome (Chrome launches SceneViewer directly)
            String httpsUri = "https://arvr.google.com/scene-viewer/1.2?file=" +
                    Uri.encode(glbUrl) +
                    "&mode=ar_only&resizable=true&title=" +
                    Uri.encode(safeTitle);

            Intent chromeIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(httpsUri));
            chromeIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            chromeIntent.setPackage("com.android.chrome");

            if (chromeIntent.resolveActivity(getPackageManager()) != null) {
                Log.d(TAG, "Launching SceneViewer via Chrome");
                startActivity(chromeIntent);
                return true;
            }

            // 4. Fallback: Any default browser
            Intent defaultBrowserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(httpsUri));
            defaultBrowserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
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
