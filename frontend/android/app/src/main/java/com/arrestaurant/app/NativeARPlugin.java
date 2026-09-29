package com.arrestaurant.app;

import android.content.Intent;
import android.net.Uri;
import android.util.Log;
import android.widget.Toast;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeAR")
public class NativeARPlugin extends Plugin {
    private static final String TAG = "NativeARPlugin";

    @PluginMethod
    public void launchAR(PluginCall call) {
        String glbUrl = call.getString("glbUrl");
        String title = call.getString("title", "Royal Spice Dish");

        if (glbUrl == null || glbUrl.isEmpty()) {
            call.reject("Model GLB URL is required");
            return;
        }

        Log.d(TAG, "Capacitor Plugin launchAR called for: " + glbUrl);
        boolean launched = openSceneViewer(glbUrl, title);
        if (launched) {
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } else {
            call.reject("Could not open Google AR camera");
        }
    }

    public boolean openSceneViewer(String glbUrl, String title) {
        if (getContext() == null) {
            Log.e(TAG, "Context is null, cannot launch AR");
            return false;
        }

        try {
            String safeTitle = (title != null && !title.isEmpty()) ? title : "Royal Spice Dish";

            // 1. Google App SceneViewer Intent (Primary method for Google ARCore / SceneViewer)
            String sceneViewerUri = "intent://arvr.google.com/scene-viewer/1.2?file=" +
                    Uri.encode(glbUrl) +
                    "&mode=ar_only&resizable=true&title=" +
                    Uri.encode(safeTitle) +
                    "#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;end;";

            Intent quickSearchIntent = Intent.parseUri(sceneViewerUri, Intent.URI_INTENT_SCHEME);
            quickSearchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            if (quickSearchIntent.resolveActivity(getContext().getPackageManager()) != null) {
                Log.d(TAG, "Launching SceneViewer via Google App");
                getContext().startActivity(quickSearchIntent);
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

            if (genericIntent.resolveActivity(getContext().getPackageManager()) != null) {
                Log.d(TAG, "Launching SceneViewer via Generic Intent resolution");
                getContext().startActivity(genericIntent);
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

            if (chromeIntent.resolveActivity(getContext().getPackageManager()) != null) {
                Log.d(TAG, "Launching SceneViewer via Chrome");
                getContext().startActivity(chromeIntent);
                return true;
            }

            // 4. Fallback: Any default browser
            Intent defaultBrowserIntent = new Intent(Intent.ACTION_VIEW, Uri.parse(httpsUri));
            defaultBrowserIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(defaultBrowserIntent);
            return true;

        } catch (Exception e) {
            Log.e(TAG, "Error launching SceneViewer: " + e.getMessage(), e);
            if (getActivity() != null) {
                getActivity().runOnUiThread(() ->
                    Toast.makeText(getContext(), "AR launch notice: " + e.getMessage(), Toast.LENGTH_SHORT).show()
                );
            }
            return false;
        }
    }

    @Override
    public Boolean shouldOverrideLoad(Uri url) {
        if (url == null) return null;
        String urlStr = url.toString();

        // Intercept any scene-viewer intent or web link triggered by model-viewer
        if (urlStr.startsWith("intent://arvr.google.com") || urlStr.contains("arvr.google.com/scene-viewer")) {
            try {
                Intent intent = Intent.parseUri(urlStr, Intent.URI_INTENT_SCHEME);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
                return true;
            } catch (Exception e) {
                Log.w(TAG, "shouldOverrideLoad parseUri fallback: " + e.getMessage());
                try {
                    Intent fallback = new Intent(Intent.ACTION_VIEW, url);
                    fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(fallback);
                    return true;
                } catch (Exception ex) {
                    return false;
                }
            }
        }
        return null;
    }
}
