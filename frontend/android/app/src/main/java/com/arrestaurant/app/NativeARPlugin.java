package com.arrestaurant.app;

import android.content.Intent;
import android.net.Uri;
import android.util.Log;

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
        boolean verticalPlacement = call.getBoolean("verticalPlacement", false);

        if (glbUrl == null || glbUrl.isEmpty()) {
            call.reject("Model GLB URL is required");
            return;
        }

        MainActivity activity = (MainActivity) getActivity();
        if (activity != null) {
            boolean success = activity.launchSceneViewer(glbUrl, title, verticalPlacement);
            if (success) {
                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
                return;
            }
        }
        call.reject("Could not open Google AR camera");
    }

    @Override
    public Boolean shouldOverrideLoad(Uri url) {
        if (url == null) return null;
        String urlStr = url.toString();

        // Intercept any scene-viewer intent or web link triggered by model-viewer
        if (urlStr.startsWith("intent://arvr.google.com") || urlStr.contains("arvr.google.com/scene-viewer")) {
            try {
                Intent intent = Intent.parseUri(urlStr, Intent.URI_INTENT_SCHEME);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                getContext().startActivity(intent);
                return true;
            } catch (Exception e) {
                Log.w(TAG, "shouldOverrideLoad parseUri fallback: " + e.getMessage());
                try {
                    Intent fallback = new Intent(Intent.ACTION_VIEW, url);
                    fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
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
