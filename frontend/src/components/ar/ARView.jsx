import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Camera, Info, Sparkles } from 'lucide-react';
import '@google/model-viewer';

/**
 * ARView — Augmented Reality 3D Viewer Component
 * 
 * Supports:
 * - Google ARCore WebXR & Native SceneViewer (Android & Capacitor APK)
 * - Apple QuickLook (iOS)
 * - Interactive 3D manipulation (Single finger rotate, pinch to zoom)
 */
export default function ARView({ dish, onBack, onOpenDetails }) {
  const modelViewerRef = useRef(null);
  const [arSupported, setArSupported] = useState(false);
  const [instruction] = useState('✨ Drag to rotate • Pinch to zoom • Tap camera for table AR');

  // Resolves the best URL: prefers public HTTPS CDN so Google SceneViewer can download it
  const activeModelUrl = dish.remoteModelUrl || (
    dish.modelUrl?.startsWith('http')
      ? dish.modelUrl
      : `https://raw.githubusercontent.com/seethaaraman/augumented-reality/main/frontend/public/models/${dish.id === 'artisan-cake' ? 'cake' : dish.id}.glb`
  );

  useEffect(() => {
    const checkAR = () => {
      if (modelViewerRef.current) {
        setArSupported(Boolean(modelViewerRef.current.canActivateAR));
      }
    };

    const timer = setTimeout(checkAR, 600);
    return () => clearTimeout(timer);
  }, [dish]);

  const handleLaunchAR = () => {
    const dishTitle = encodeURIComponent(dish.name || 'Royal Dish');
    const glbUrl = encodeURIComponent(activeModelUrl);

    // 1. Try model-viewer's native WebXR activation first
    if (modelViewerRef.current && modelViewerRef.current.canActivateAR) {
      try {
        modelViewerRef.current.activateAR();
        return;
      } catch (err) {
        console.warn('activateAR failed, using intent fallback', err);
      }
    }

    // 2. Direct Android SceneViewer Intent (Works inside Android WebView / Capacitor / Chrome)
    const isAndroid = /android/i.test(navigator.userAgent);
    if (isAndroid) {
      const sceneViewerIntent = `intent://arvr.google.com/scene-viewer/1.0?file=${glbUrl}&mode=ar_only&resizable=true&title=${dishTitle}#Intent;scheme=https;action=android.intent.action.VIEW;end;`;
      const sceneViewerHttps = `https://arvr.google.com/scene-viewer/1.0?file=${glbUrl}&mode=ar_only&resizable=true&title=${dishTitle}`;

      try {
        window.location.href = sceneViewerIntent;
      } catch (e) {
        window.location.href = sceneViewerHttps;
      }
      return;
    }

    // 3. iOS QuickLook / Direct Fallback
    window.location.href = `https://arvr.google.com/scene-viewer/1.0?file=${glbUrl}&mode=ar_only&title=${dishTitle}`;
  };

  const handleResetCamera = () => {
    if (modelViewerRef.current) {
      modelViewerRef.current.cameraOrbit = 'auto auto auto';
      modelViewerRef.current.cameraTarget = 'auto auto auto';
    }
  };

  return (
    <div className="ar-screen-container">
      {/* Top Navigation HUD */}
      <div className="ar-top-hud">
        <button className="hud-btn" onClick={onBack}>
          <ArrowLeft size={18} />
          Menu
        </button>

        <button className="hud-btn" onClick={handleResetCamera} title="Reset 3D View">
          <RotateCcw size={16} />
          Reset
        </button>
      </div>

      {/* 3D / AR Model Viewer */}
      <model-viewer
        ref={modelViewerRef}
        src={activeModelUrl}
        alt={`3D Model of ${dish.name}`}
        ar
        ar-modes="scene-viewer webxr quick-look"
        ar-scale="auto"
        camera-controls
        touch-action="pan-y"
        shadow-intensity="1.5"
        shadow-softness="0.8"
        exposure="1.0"
        bounds="tight"
        auto-rotate
        auto-rotate-delay="2500"
        rotation-per-second="20deg"
        className="model-viewer-viewport"
        onClick={onOpenDetails}
      >
        <button slot="ar-button" style={{ display: 'none' }}>
          Activate AR
        </button>
      </model-viewer>

      {/* Floating Instruction Pill */}
      <div className="ar-instruction-pill">
        <Sparkles size={16} style={{ color: 'var(--accent-gold)' }} />
        <span>{instruction}</span>
      </div>

      {/* Bottom AR Controls */}
      <div className="ar-bottom-controls">
        <button
          id="btn-launch-camera"
          className="btn-launch-camera"
          onClick={handleLaunchAR}
        >
          <Camera size={20} />
          Launch Real AR Camera
        </button>

        <button
          id="btn-dish-details"
          className="btn-dish-details"
          onClick={onOpenDetails}
        >
          <Info size={18} />
          Details
        </button>
      </div>
    </div>
  );
}
