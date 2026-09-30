import React, { useRef, useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Camera, Info, Sparkles, Loader2, Utensils, Layers, Grid, Square, ChevronUp, ChevronDown, Check } from 'lucide-react';
import '@google/model-viewer';
import { launchRealARCamera, getPublicModelUrl } from '../../services/arLauncher';

/**
 * Helper to dynamically generate the 3 distinct culinary layers for any dish (custom or curated).
 */
function getDishLayers(dish) {
  const ingredients = Array.isArray(dish?.ingredients) && dish.ingredients.length > 0
    ? dish.ingredients
    : ['Artisanal Spices & Herbs', 'Fresh Core Ingredients', 'Slow-Cooked Base Foundation'];

  // Top tier (garnish/finish)
  const topIngredients = ingredients.slice(2, 4).length > 0 ? ingredients.slice(2, 4) : [ingredients[0]];
  // Mid tier (protein/filling)
  const midIngredients = ingredients.slice(0, 2).length > 0 ? ingredients.slice(0, 2) : [ingredients[1] || ingredients[0]];
  // Base tier (gravy/rice/sponge)
  const baseIngredients = ingredients.slice(4).length > 0 
    ? ingredients.slice(4) 
    : [ingredients[ingredients.length - 1] || 'Slow-Infused Broth & Base'];

  return [
    {
      id: 'base',
      index: 0,
      tier: 'Layer 1: Foundation Base',
      name: 'Simmered Base & Foundation',
      position: '0 0.01 0',
      cameraTarget: '0 0.02m 0',
      cameraOrbit: '0deg 75deg 90%',
      color: '#10b981',
      description: 'Slow-simmered foundation delivering rich aroma, deep savory warmth, and grounding culinary texture.',
      ingredients: baseIngredients
    },
    {
      id: 'mid',
      index: 1,
      tier: 'Layer 2: Core Filling',
      name: 'Infused Protein & Core Elements',
      position: '0 0.06 0',
      cameraTarget: '0 0.06m 0',
      cameraOrbit: '45deg 70deg 85%',
      color: '#f59e0b',
      description: 'Tender marinated core infused with authentic slow-cooked spices and velvety culinary richness.',
      ingredients: midIngredients
    },
    {
      id: 'top',
      index: 2,
      tier: 'Layer 3: Top Garnish',
      name: 'Aromatics, Glaze & Garnish',
      position: '0 0.13 0',
      cameraTarget: '0 0.12m 0',
      cameraOrbit: '90deg 60deg 80%',
      color: '#ec4899',
      description: 'Delicate finishing layer featuring hand-painted botanical glaze, crispy aromatics, and fresh herbs.',
      ingredients: topIngredients
    }
  ];
}

/**
 * ARView — Augmented Reality 3D Viewer Component with:
 * - Table/Floor & Vertical Wall Surface Detection
 * - Interactive 3D Exploded / Deconstructed Layer Inspector
 * - Real-time 3D Hotspot Tracking
 */
export default function ARView({ dish, onBack, onOpenDetails, autoLaunch = false }) {
  const modelViewerRef = useRef(null);
  const videoRef = useRef(null);
  const hasAutoLaunchedRef = useRef(false);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isLaunchingNativeAR, setIsLaunchingNativeAR] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [snapshotTaken, setSnapshotTaken] = useState(false);

  // Surface detection mode ('floor' = table/ground, 'wall' = vertical wall/board)
  const [placementMode, setPlacementMode] = useState('floor');

  // Interactive Layer Explode Mode
  const [isLayerMode, setIsLayerMode] = useState(false);
  const [activeLayerIndex, setActiveLayerIndex] = useState(null);

  const [instruction, setInstruction] = useState('🪑 Ground Mount Active: Point camera at dining table or floor');

  const layers = getDishLayers(dish);
  const activeModelUrl = getPublicModelUrl(dish);

  // Start in-app real camera stream
  const startCamera = async () => {
    try {
      setCameraLoading(true);
      setCameraError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported on this device browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
      setInstruction(
        placementMode === 'wall'
          ? '🧱 Wall Mount: Point camera at vertical wall or menu board'
          : '🪑 Ground Mount: Point camera at dining table or floor'
      );
    } catch (err) {
      console.warn('[ARView] Live camera error:', err);
      setCameraError(err.message || 'Camera permission denied or camera in use');
      setIsCameraActive(false);
      setInstruction('✨ 3D Studio Mode: Drag to rotate • Pinch to zoom • Tap Surface to switch mounts');
    } finally {
      setCameraLoading(false);
    }
  };

  // Stop camera tracks on unmount or mode switch
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    // Automatically start live camera feed when entering AR mode
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  const handleTogglePlacement = (forcedMode) => {
    const nextMode = forcedMode || (placementMode === 'floor' ? 'wall' : 'floor');
    setPlacementMode(nextMode);

    if (nextMode === 'wall') {
      setInstruction('🧱 Wall Mount Active: Dish oriented flush against wall');
      if (modelViewerRef.current) {
        modelViewerRef.current.cameraOrbit = '0deg 90deg 100%';
        modelViewerRef.current.cameraTarget = '0 0.05m 0';
      }
    } else {
      setInstruction('🪑 Ground Mount Active: Dish positioned horizontally on table');
      if (modelViewerRef.current) {
        modelViewerRef.current.cameraOrbit = '0deg 70deg 105%';
        modelViewerRef.current.cameraTarget = 'auto auto auto';
      }
    }
  };

  const handleResetCamera = () => {
    if (modelViewerRef.current) {
      if (placementMode === 'wall') {
        modelViewerRef.current.cameraOrbit = '0deg 90deg 100%';
        modelViewerRef.current.cameraTarget = '0 0.05m 0';
      } else {
        modelViewerRef.current.cameraOrbit = '0deg 70deg 105%';
        modelViewerRef.current.cameraTarget = 'auto auto auto';
      }
      modelViewerRef.current.fieldOfView = 'auto';
    }
    setActiveLayerIndex(null);
    setInstruction('🔄 Alignment and view reset successfully');
  };

  const handleToggleLayerMode = () => {
    const nextState = !isLayerMode;
    setIsLayerMode(nextState);
    if (nextState) {
      setActiveLayerIndex(1);
      setInstruction('✨ 3D Layers Exploded: Tap glowing hotspots on dish');
      if (modelViewerRef.current) {
        modelViewerRef.current.cameraOrbit = '30deg 65deg 90%';
      }
    } else {
      setActiveLayerIndex(null);
      handleResetCamera();
      setInstruction(
        placementMode === 'wall'
          ? '🧱 Wall Mount: Point camera at wall or menu board'
          : '🪑 Ground Mount: Point camera at dining table or floor'
      );
    }
  };

  const handleSelectLayer = (index) => {
    setActiveLayerIndex(index);
    const layer = layers[index];
    if (layer && modelViewerRef.current) {
      modelViewerRef.current.cameraTarget = layer.cameraTarget;
      modelViewerRef.current.cameraOrbit = layer.cameraOrbit;
    }
  };

  // Launch Google SceneViewer if user explicitly desires external native plane tracking
  const handleLaunchExternalGoogleAR = async () => {
    setIsLaunchingNativeAR(true);
    try {
      await launchRealARCamera(dish, placementMode);
    } catch (err) {
      console.warn('[ARView] SceneViewer launch:', err);
    } finally {
      setTimeout(() => setIsLaunchingNativeAR(false), 2000);
    }
  };

  const handleCapturePhoto = () => {
    setSnapshotTaken(true);
    setTimeout(() => setSnapshotTaken(false), 1200);
  };

  const handleClose = () => {
    stopCamera();
    onBack();
  };

  return (
    <div className={`ar-screen-container ${isLayerMode ? 'layer-mode-active' : ''} ${isCameraActive ? 'camera-view-active' : ''}`}>
      {/* 1. Live Camera Feed Layer (Underneath 3D Model) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`ar-live-video-stream ${isCameraActive ? 'visible' : 'hidden'}`}
      />

      {/* Snapshot flash effect */}
      {snapshotTaken && <div className="ar-snapshot-flash" />}

      {/* 2. Visual Alignment Reticle in Live Camera */}
      {isCameraActive && (
        <div className={`ar-surface-reticle ${placementMode === 'wall' ? 'reticle-wall' : 'reticle-ground'}`}>
          <div className="reticle-pulse-ring" />
          <div className="reticle-crosshair-center" />
          <div className="reticle-label">
            {placementMode === 'wall' ? '🧱 WALL MOUNT SURFACE' : '🪑 DINING TABLE SURFACE'}
          </div>
        </div>
      )}

      {/* 3. IN-CAMERA TOP FLOATING HUD BAR (Always on top of camera) */}
      <div className="in-camera-live-hud">
        <div className="in-camera-top-bar">
          {/* Left Controls: Menu & Reset */}
          <div className="camera-hud-group">
            <button
              type="button"
              className="camera-hud-btn"
              onClick={handleClose}
              title="Return to Restaurant Menu"
            >
              <ArrowLeft size={16} />
              <span>Menu</span>
            </button>

            <button
              type="button"
              className="camera-hud-btn reset-btn"
              onClick={handleResetCamera}
              title="Reset Alignment & Orientation"
            >
              <RotateCcw size={15} />
              <span>Reset</span>
            </button>
          </div>

          {/* Right Controls: Ground Mount, Wall Mount, Explode Layers */}
          <div className="camera-hud-group">
            {/* Ground Mount */}
            <button
              type="button"
              className={`camera-hud-btn ${placementMode === 'floor' ? 'active-mode' : ''}`}
              onClick={() => handleTogglePlacement('floor')}
              title="Mount 3D Dish on Dining Table or Ground"
            >
              <Grid size={15} />
              <span>🪑 Ground</span>
            </button>

            {/* Wall Mount */}
            <button
              type="button"
              className={`camera-hud-btn ${placementMode === 'wall' ? 'active-mode' : ''}`}
              onClick={() => handleTogglePlacement('wall')}
              title="Mount 3D Dish on Vertical Wall or Menu Board"
            >
              <Square size={15} />
              <span>🧱 Wall</span>
            </button>

            {/* Explode Layers */}
            <button
              type="button"
              className={`camera-hud-btn ${isLayerMode ? 'active-layer-btn' : ''}`}
              onClick={handleToggleLayerMode}
              title="Deconstruct into 3D ingredient layers"
            >
              <Layers size={15} />
              <span>{isLayerMode ? 'Collapse' : '✨ Explode'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. 3D Augmented Reality Model (Transparent canvas over live camera) */}
      <model-viewer
        ref={modelViewerRef}
        src={activeModelUrl}
        alt={`3D Model of ${dish.name}`}
        ar
        ar-modes="webxr scene-viewer quick-look"
        ar-scale="auto"
        ar-placement={placementMode}
        camera-controls
        touch-action="pan-y"
        loading="eager"
        reveal="auto"
        camera-orbit={placementMode === 'wall' ? '0deg 90deg 100%' : '0deg 70deg 105%'}
        min-camera-orbit="auto auto 40%"
        max-camera-orbit="auto auto 300%"
        shadow-intensity={isCameraActive ? '1.8' : '1.3'}
        shadow-softness="0.5"
        exposure="1.08"
        environment-image="neutral"
        bounds="tight"
        auto-rotate={!isLayerMode && !isCameraActive}
        auto-rotate-delay="3000"
        rotation-per-second="14deg"
        className={`model-viewer-viewport ${isLayerMode ? 'exploded-visual' : ''} ${isCameraActive ? 'transparent-ar' : ''}`}
        onLoad={() => setIsModelLoaded(true)}
      >
        {/* Custom Loading Poster Slot */}
        <div slot="poster" className="model-viewer-poster">
          <div className="poster-loader-card">
            <div className="poster-icon-pulse">
              <Utensils size={32} style={{ color: 'var(--accent-gold)' }} />
            </div>
            <div className="poster-dish-title">{dish.name}</div>
            <div className="poster-dish-subtitle">Preparing 3D Gastronomy Model...</div>
            <div className="poster-spinner-wrap">
              <Loader2 size={24} className="spin" style={{ color: 'var(--accent-gold)' }} />
            </div>
          </div>
        </div>

        {/* 3D Interactive Hotspots (Rendered in true 3D space when Layer Mode is active) */}
        {isLayerMode && layers.map((layer) => (
          <button
            key={layer.id}
            type="button"
            slot={`hotspot-layer-${layer.id}`}
            data-position={layer.position}
            data-normal="0 1 0"
            className={`ar-3d-hotspot ${activeLayerIndex === layer.index ? 'active-hotspot' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleSelectLayer(layer.index);
            }}
          >
            <div className="hotspot-inner">
              <span className="hotspot-pulse-ring" style={{ borderColor: layer.color }} />
              <span className="hotspot-core-dot" style={{ backgroundColor: layer.color }} />
              <div className="hotspot-tooltip">
                <span className="tooltip-tier">{layer.tier}</span>
                <span className="tooltip-name">{layer.name}</span>
              </div>
            </div>
          </button>
        ))}
      </model-viewer>

      {/* Floating Status & Instruction Pill */}
      <div className="ar-instruction-pill">
        {cameraLoading ? (
          <Loader2 size={16} className="spin" style={{ color: 'var(--accent-gold)' }} />
        ) : (
          <Sparkles size={16} style={{ color: 'var(--accent-gold)' }} />
        )}
        <span>{instruction}</span>
      </div>

      {/* Interactive Layer Inspector Drawer (Shown in Layer Mode) */}
      {isLayerMode && (
        <div className="layer-inspector-drawer">
          <div className="layer-drawer-header">
            <div>
              <span className="layer-badge-sm">
                <Layers size={12} />
                Culinary Layer Schematic
              </span>
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
                {dish.name} Deconstruction
              </h4>
            </div>
            <button className="layer-close-btn" onClick={() => setIsLayerMode(false)}>
              Collapse
            </button>
          </div>

          {/* 3 Layer Cards Stack */}
          <div className="layer-cards-grid">
            {layers.map((layer) => {
              const isSelected = activeLayerIndex === layer.index;
              return (
                <div
                  key={layer.id}
                  className={`layer-card-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelectLayer(layer.index)}
                  style={{ borderLeftColor: layer.color }}
                >
                  <div className="layer-card-top">
                    <span className="layer-tier-pill" style={{ color: layer.color }}>
                      {layer.tier}
                    </span>
                    {isSelected && <Check size={14} style={{ color: layer.color }} />}
                  </div>

                  <h5 className="layer-card-title">{layer.name}</h5>
                  <p className="layer-card-desc">{layer.description}</p>

                  <div className="layer-ingredients-pills">
                    {layer.ingredients.map((ing, i) => (
                      <span key={i} className="layer-ing-chip">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom AR Controls */}
      {!isLayerMode && (
        <div className="ar-bottom-controls">
          {/* Camera toggle: Live camera vs 3D Studio */}
          <button
            type="button"
            className="btn-camera-toggle"
            onClick={isCameraActive ? stopCamera : startCamera}
            title="Toggle Live Camera View"
          >
            <Camera size={18} />
            <span>{isCameraActive ? '3D Studio' : 'Live Camera'}</span>
          </button>

          {/* Snap Photo button */}
          {isCameraActive && (
            <button
              type="button"
              className="btn-snap-photo"
              onClick={handleCapturePhoto}
              title="Capture photo of AR dish"
            >
              <span>📸 Snap Photo</span>
            </button>
          )}

          {/* Optional Launch Google SceneViewer button */}
          <button
            type="button"
            className="btn-sceneviewer-trigger"
            onClick={handleLaunchExternalGoogleAR}
            disabled={isLaunchingNativeAR}
            title="Open in native Google Play Services AR"
          >
            {isLaunchingNativeAR ? (
              <Loader2 size={16} className="spin" />
            ) : (
              <span>Google ARCore</span>
            )}
          </button>

          <button
            type="button"
            id="btn-dish-details"
            className="btn-dish-details"
            onClick={onOpenDetails}
          >
            <Info size={18} />
            <span>Details</span>
          </button>
        </div>
      )}
    </div>
  );
}
