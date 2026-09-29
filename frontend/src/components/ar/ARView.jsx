import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Camera, Info, Sparkles } from 'lucide-react';
import '@google/model-viewer';

/**
 * ARView — Augmented Reality 3D Viewer Component
 * 
 * Supports:
 * - Google ARCore WebXR / SceneViewer (Android)
 * - Apple QuickLook (iOS)
 * - Interactive 3D manipulation (Single finger rotate, pinch to zoom)
 */
export default function ARView({ dish, onBack, onOpenDetails }) {
  const modelViewerRef = useRef(null);
  const [arSupported, setArSupported] = useState(false);
  const [instruction] = useState('✨ Drag to rotate • Pinch to zoom • Tap dish for details');

  useEffect(() => {
    const checkAR = () => {
      if (modelViewerRef.current) {
        setArSupported(modelViewerRef.current.canActivateAR);
      }
    };

    const timer = setTimeout(checkAR, 600);
    return () => clearTimeout(timer);
  }, []);

  const handleLaunchAR = () => {
    if (modelViewerRef.current) {
      if (modelViewerRef.current.canActivateAR) {
        modelViewerRef.current.activateAR();
      } else {
        alert(
          "To view in your real room with ARCore camera:\n\n" +
          "1. Open this website on your Android or iPhone browser (Chrome / Safari).\n" +
          "2. Tap 'Launch Real AR Camera' to place the Biryani on your real table!"
        );
      }
    }
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
        src={dish.modelUrl || '/models/biryani.glb'}
        alt={`3D Model of ${dish.name}`}
        ar
        ar-modes="webxr scene-viewer quick-look"
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
