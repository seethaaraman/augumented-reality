import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Camera, Info, Sparkles, Loader2 } from 'lucide-react';
import '@google/model-viewer';
import { launchRealARCamera, getPublicModelUrl } from '../../services/arLauncher';

/**
 * ARView — Augmented Reality 3D Viewer Component
 * 
 * Supports:
 * - Direct Google ARCore / SceneViewer Camera Launch (Android Capacitor APK & Chrome)
 * - Apple QuickLook (iOS)
 * - Interactive 3D manipulation (Single finger rotate, pinch to zoom)
 */
export default function ARView({ dish, onBack, onOpenDetails, autoLaunch = false }) {
  const modelViewerRef = useRef(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [instruction, setInstruction] = useState('✨ Drag to rotate • Pinch to zoom • Tap camera for table AR');

  // Guaranteed public HTTPS model URL for Google SceneViewer
  const activeModelUrl = getPublicModelUrl(dish);

  const handleLaunchAR = async () => {
    setIsLaunching(true);
    setInstruction('🚀 Opening Google AR camera on your table...');

    try {
      const launched = await launchRealARCamera(dish);
      if (!launched && modelViewerRef.current && modelViewerRef.current.canActivateAR) {
        modelViewerRef.current.activateAR();
      }
    } catch (err) {
      console.warn('[ARView] AR launch issue:', err);
    } finally {
      setTimeout(() => {
        setIsLaunching(false);
        setInstruction('✨ Drag to rotate • Pinch to zoom • Tap camera for table AR');
      }, 3000);
    }
  };

  useEffect(() => {
    if (autoLaunch) {
      const timer = setTimeout(() => {
        handleLaunchAR();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoLaunch]);

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
      >
        <button
          slot="ar-button"
          style={{ display: 'none' }}
          onClick={(e) => {
            e.preventDefault();
            handleLaunchAR();
          }}
        >
          Activate AR
        </button>
      </model-viewer>

      {/* Floating Instruction Pill */}
      <div className="ar-instruction-pill">
        {isLaunching ? (
          <Loader2 size={16} className="spin" style={{ color: 'var(--accent-gold)' }} />
        ) : (
          <Sparkles size={16} style={{ color: 'var(--accent-gold)' }} />
        )}
        <span>{instruction}</span>
      </div>

      {/* Bottom AR Controls */}
      <div className="ar-bottom-controls">
        <button
          id="btn-launch-camera"
          className="btn-launch-camera"
          onClick={handleLaunchAR}
          disabled={isLaunching}
          style={{
            opacity: isLaunching ? 0.8 : 1,
            cursor: isLaunching ? 'wait' : 'pointer'
          }}
        >
          {isLaunching ? (
            <>
              <Loader2 size={20} className="spin" />
              Opening AR Camera...
            </>
          ) : (
            <>
              <Camera size={20} />
              Launch Real AR Camera
            </>
          )}
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
