import { registerPlugin, Capacitor } from '@capacitor/core';

const NativeAR = registerPlugin('NativeAR');

const GITHUB_CDN_BASE = 'https://raw.githubusercontent.com/seethaaraman/augumented-reality/main/frontend/public/models';

/**
 * Returns a guaranteed absolute public HTTPS URL for the 3D model.
 * Google SceneViewer and ARCore require public HTTPS URLs to download and render models.
 */
export function getPublicModelUrl(dish) {
  if (!dish) return `${GITHUB_CDN_BASE}/biryani.glb`;

  if (dish.remoteModelUrl && dish.remoteModelUrl.startsWith('https://')) {
    return dish.remoteModelUrl;
  }

  if (dish.modelUrl && dish.modelUrl.startsWith('https://')) {
    return dish.modelUrl;
  }

  const modelFilename = dish.id === 'artisan-cake' ? 'cake.glb' : `${dish.id}.glb`;
  return `${GITHUB_CDN_BASE}/${modelFilename}`;
}

/**
 * Launches the real Augmented Reality camera (Google ARCore / SceneViewer on Android, QuickLook on iOS).
 * Configured with mode=ar_preferred & disable_occlusion=true to eliminate black screens and occlusion clipping.
 */
export async function launchRealARCamera(dish) {
  if (!dish) return false;

  const publicGlbUrl = getPublicModelUrl(dish);
  const dishTitle = dish.name || 'Royal Spice Dining';

  // Haptic feedback
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 30, 40]);
    }
  } catch (_) {}

  console.log('[ARLauncher] Requesting real AR camera for:', dishTitle, publicGlbUrl);

  // 1. Direct native Android WebView JavascriptInterface (Zero-latency native launch)
  if (typeof window !== 'undefined' && window.AndroidAR && typeof window.AndroidAR.launchAR === 'function') {
    try {
      console.log('[ARLauncher] Invoking window.AndroidAR.launchAR');
      const launched = window.AndroidAR.launchAR(publicGlbUrl, dishTitle);
      if (launched) return true;
    } catch (err) {
      console.warn('[ARLauncher] AndroidAR JS interface error:', err);
    }
  }

  // 2. Capacitor Plugin NativeAR
  if (Capacitor.isNativePlatform()) {
    try {
      console.log('[ARLauncher] Invoking Capacitor NativeAR plugin');
      await NativeAR.launchAR({ glbUrl: publicGlbUrl, title: dishTitle });
      return true;
    } catch (err) {
      console.warn('[ARLauncher] Capacitor NativeAR plugin error:', err);
    }
  }

  // 3. Android Intent scheme (Handled by NativeARPlugin.shouldOverrideLoad or Chrome)
  const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);
  const encodedGlb = encodeURIComponent(publicGlbUrl);
  const encodedTitle = encodeURIComponent(dishTitle);

  if (isAndroid) {
    // mode=ar_preferred & disable_occlusion=true prevents black camera feed and depth sensor occlusion
    const sceneViewerIntent = `intent://arvr.google.com/scene-viewer/1.2?file=${encodedGlb}&mode=ar_preferred&resizable=true&disable_occlusion=true&enable_vertical_placement=false&title=${encodedTitle}#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;end;`;
    
    try {
      const link = document.createElement('a');
      link.href = sceneViewerIntent;
      link.rel = 'noreferrer';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) document.body.removeChild(link);
      }, 500);
      return true;
    } catch (e) {
      console.warn('[ARLauncher] Intent click failed, falling back to HTTPS', e);
    }

    // Android Chrome fallback: Direct https SceneViewer link
    const httpsUrl = `https://arvr.google.com/scene-viewer/1.2?file=${encodedGlb}&mode=ar_preferred&resizable=true&disable_occlusion=true&enable_vertical_placement=false&title=${encodedTitle}`;
    try {
      window.location.href = httpsUrl;
      return true;
    } catch (err) {
      console.error('[ARLauncher] Fallback navigation error:', err);
      return false;
    }
  }

  // 4. Desktop PC / Mac fallback:
  // Google SceneViewer (arvr.google.com) is Android-only and returns "Error: Not Found" on desktop browsers.
  // On desktop, we stay in-app and launch the 3D Canvas viewer instead.
  console.log('[ARLauncher] Desktop browser detected. Using in-app 3D canvas viewer.');
  return false;
}
