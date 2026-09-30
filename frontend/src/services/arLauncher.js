import { registerPlugin, Capacitor } from '@capacitor/core';

const NativeAR = registerPlugin('NativeAR');

const JSDELIVR_CDN_BASE = 'https://cdn.jsdelivr.net/gh/seethaaraman/augumented-reality@main/frontend/public/models';

const MODEL_FILE_MAP = {
  'chicken-biryani': 'biryani.glb',
  'biryani': 'biryani.glb',
  'artisan-cake': 'cake.glb',
  'cake': 'cake.glb',
  'butter-chicken': 'butter-chicken.glb',
  'paneer-tikka': 'paneer-tikka.glb',
  'fresh-lime-soda': 'lime-soda.glb',
  'lime-soda': 'lime-soda.glb'
};

/**
 * Returns a guaranteed absolute public HTTPS URL for the 3D model.
 * Google SceneViewer and ARCore require public HTTPS URLs to download and render models.
 * Uses jsDelivr CDN for correct 'model/gltf-binary' MIME type and global edge caching.
 */
export function getPublicModelUrl(dish) {
  if (!dish) return `${JSDELIVR_CDN_BASE}/biryani.glb`;

  // Custom user-scanned dish uploaded to Cloudinary
  if (dish.remoteModelUrl && dish.remoteModelUrl.startsWith('https://')) {
    if (dish.remoteModelUrl.includes('raw.githubusercontent.com')) {
      const parts = dish.remoteModelUrl.split('/');
      const last = parts[parts.length - 1].replace('.glb', '');
      const mapped = MODEL_FILE_MAP[last] || `${last}.glb`;
      return `${JSDELIVR_CDN_BASE}/${mapped}`;
    }
    return dish.remoteModelUrl;
  }

  if (dish.modelUrl && dish.modelUrl.startsWith('https://')) {
    return dish.modelUrl;
  }

  const filename = MODEL_FILE_MAP[dish.id] || (dish.id ? `${dish.id}.glb` : 'biryani.glb');
  return `${JSDELIVR_CDN_BASE}/${filename}`;
}

let isLaunchingARLock = false;

/**
 * Launches the real Augmented Reality camera (Google ARCore / SceneViewer on Android, QuickLook on iOS).
 * Configured with mode=ar_preferred & disable_occlusion=true to eliminate black screens and occlusion clipping.
 * Supports placementMode ('floor' or 'wall').
 */
export async function launchRealARCamera(dish, placementMode = 'floor') {
  if (!dish) return false;

  // Prevent double intent collisions which freeze ARCore camera hardware on cold start
  if (isLaunchingARLock) {
    console.warn('[ARLauncher] AR launch already in progress. Ignoring duplicate trigger.');
    return true;
  }
  isLaunchingARLock = true;
  setTimeout(() => {
    isLaunchingARLock = false;
  }, 2000);

  const publicGlbUrl = getPublicModelUrl(dish);
  const dishTitle = dish.name || 'Royal Spice Dining';
  const isWall = placementMode === 'wall';

  // Haptic feedback for responsive touch
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 30, 40]);
    }
  } catch (_) {}

  console.log('[ARLauncher] Requesting real AR camera for:', dishTitle, publicGlbUrl, `(mode: ${placementMode})`);

  // 1. Direct native Android WebView JavascriptInterface (Zero-latency native launch)
  if (typeof window !== 'undefined' && window.AndroidAR && typeof window.AndroidAR.launchAR === 'function') {
    try {
      console.log('[ARLauncher] Invoking window.AndroidAR.launchAR');
      const launched = window.AndroidAR.launchAR(publicGlbUrl, dishTitle, isWall);
      if (launched) return true;
    } catch (err) {
      console.warn('[ARLauncher] AndroidAR JS interface error:', err);
    }
  }

  // 2. Capacitor Plugin NativeAR
  if (Capacitor.isNativePlatform()) {
    try {
      console.log('[ARLauncher] Invoking Capacitor NativeAR plugin');
      await NativeAR.launchAR({ glbUrl: publicGlbUrl, title: dishTitle, verticalPlacement: isWall });
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
    const verticalParam = isWall ? 'enable_vertical_placement=true' : 'enable_vertical_placement=false';
    const httpsFallback = `https://arvr.google.com/scene-viewer/1.0?file=${encodedGlb}&mode=ar_preferred&resizable=true&disable_occlusion=true&${verticalParam}&title=${encodedTitle}`;
    
    // Explicit Intent to Google Play Services for AR (ARCore) with browser fallback
    const sceneViewerIntent = `intent://arvr.google.com/scene-viewer/1.0?file=${encodedGlb}&mode=ar_preferred&resizable=true&disable_occlusion=true&${verticalParam}&title=${encodedTitle}#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(httpsFallback)};end;`;
    
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
    try {
      window.location.href = httpsFallback;
      return true;
    } catch (err) {
      console.error('[ARLauncher] Fallback navigation error:', err);
      return false;
    }
  }

  // 4. Desktop PC / Mac fallback:
  console.log('[ARLauncher] Desktop browser detected. Using in-app 3D canvas viewer.');
  return false;
}


