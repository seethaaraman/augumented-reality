import React, { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
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
      cameraOrbit: '0deg 75deg 95%',
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
      cameraOrbit: '45deg 70deg 90%',
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
      cameraOrbit: '90deg 60deg 85%',
      color: '#ec4899',
      description: 'Delicate finishing layer featuring hand-painted glaze, crispy aromatics, and fresh toppings.',
      ingredients: topIngredients
    }
  ];
}

/**
 * ARView — Augmented Reality 3D Viewer Component with:
 * - Table/Floor & Vertical Wall Surface Detection
 * - Interactive 3D Exploded / Deconstructed Layer Inspector
 * - Real-time 3D Hotspot Tracking
 * - Responsive Mobile Bottom Sheet & Single-Row Top HUD
 */
const ARView = forwardRef(function ARView({ dish, onBack, onOpenDetails, autoLaunch = false, onLayerModeChange }, ref) {
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
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);

  const [instruction, setInstruction] = useState('🪑 Ground Mount Active: Point camera at dining table or floor');

  const layers = getDishLayers(dish);
  const activeModelUrl = dish?.modelUrl || getPublicModelUrl(dish);

  // Expose collapseLayerMode imperative handle for phone back gesture
  useImperativeHandle(ref, () => ({
    collapseLayerMode: () => {
      if (isLayerMode) {
        setIsLayerMode(false);
        if (onLayerModeChange) onLayerModeChange(false);
        handleResetCamera();
        return true;
      }
      return false;
    }
  }));

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

  // Stop camera cleanly
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setInstruction('✨ 3D Studio Mode: Drag to rotate • Pinch to zoom • Tap Surface to switch mounts');
  };

  // Auto-launch camera when navigated directly from menu
  useEffect(() => {
    if (autoLaunch && !hasAutoLaunchedRef.current) {
      hasAutoLaunchedRef.current = true;
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [autoLaunch]);

  const handleTogglePlacement = (forcedMode) => {
    const nextMode = forcedMode || (placementMode === 'floor' ? 'wall' : 'floor');
    setPlacementMode(nextMode);

    if (nextMode === 'wall') {
      setInstruction('🧱 Wall Mount Active: Dish oriented flush against wall');
      if (modelViewerRef.current) {
        modelViewerRef.current.cameraOrbit = '0deg 90deg 110%';
        modelViewerRef.current.cameraTarget = '0 0.05m 0';
      }
    } else {
      setInstruction('🪑 Ground Mount Active: Dish positioned horizontally on table');
      if (modelViewerRef.current) {
        modelViewerRef.current.cameraOrbit = '0deg 75deg 120%';
        modelViewerRef.current.cameraTarget = 'auto auto auto';
      }
    }
  };

  const handleResetCamera = () => {
    if (modelViewerRef.current) {
      if (placementMode === 'wall') {
        modelViewerRef.current.cameraOrbit = '0deg 90deg 110%';
        modelViewerRef.current.cameraTarget = '0 0.05m 0';
      } else {
        modelViewerRef.current.cameraOrbit = '0deg 75deg 120%';
        modelViewerRef.current.cameraTarget = 'auto auto auto';
      }
      modelViewerRef.current.fieldOfView = 'auto';
    }
    setActiveLayerIndex(0);
    setInstruction('🔄 Alignment and view reset successfully');
  };

  const handleToggleLayerMode = () => {
    const nextState = !isLayerMode;
    setIsLayerMode(nextState);
    if (onLayerModeChange) onLayerModeChange(nextState);

    if (nextState) {
      setActiveLayerIndex(0);
      setInstruction('✨ 3D Layers Exploded: Tap glowing hotspots on dish or select tabs below');
      if (modelViewerRef.current) {
        modelViewerRef.current.cameraOrbit = '25deg 65deg 105%';
        modelViewerRef.current.cameraTarget = '0 0.08m 0';
      }
    } else {
      setActiveLayerIndex(0);
      handleResetCamera();
      setInstruction(
        placementMode === 'wall'
          ? '🧱 Wall Mount: Point camera at wall or menu board'
          : '🪑 Ground Mount: Point camera at dining table or floor'
      );
    }
  };

  const handleCollapseLayers = () => {
    setIsLayerMode(false);
    if (onLayerModeChange) onLayerModeChange(false);
    handleResetCamera();
  };

  const handleSelectLayer = (index) => {
    setActiveLayerIndex(index);
    const layer = layers[index];
    if (layer && modelViewerRef.current) {
      modelViewerRef.current.cameraTarget = layer.cameraTarget;
      modelViewerRef.current.cameraOrbit = layer.cameraOrbit;
    }
  };

  // Auto-scale model on load to fit realistic dining table proportions (25cm)
  const handleModelLoad = () => {
    setIsModelLoaded(true);
    if (!modelViewerRef.current) return;

    try {
      const dims = modelViewerRef.current.getDimensions();
      if (dims && dims.x > 0 && dims.y > 0 && dims.z > 0) {
        const maxDim = Math.max(dims.x, dims.y, dims.z);
        const TARGET_SIZE = placementMode === 'wall' ? 0.35 : 0.25;

        // Auto-scale if model is excessively large or small
        if (maxDim > 0.38 || maxDim < 0.08) {
          const factor = (TARGET_SIZE / maxDim);
          const s = Number(factor.toFixed(5));
          modelViewerRef.current.scale = `${s} ${s} ${s}`;
          console.log(`🎯 [ARView] Auto-scaled dish model from ${maxDim.toFixed(2)}m to ${(maxDim * s).toFixed(2)}m (scale: ${s})`);
        }
      }
    } catch (scaleErr) {
      console.warn('[ARView] Auto-scale calculation warning:', scaleErr);
    }
  };

  // Launch Google SceneViewer if user explicitly desires external native plane tracking
  const handleLaunchExternalGoogleAR = async () => {
    setIsLaunchingNativeAR(true);
    setInstruction('🚀 Launching Tabletop AR Camera...');
    
    // 1. Immediately terminate in-app WebRTC video stream
    stopCamera();

    // 2. Allow Android Camera2 HAL 700ms to cleanly release camera hardware session
    await new Promise((resolve) => setTimeout(resolve, 700));

    try {
      if (modelViewerRef.current && typeof modelViewerRef.current.activateAR === 'function') {
        try {
          await modelViewerRef.current.activateAR();
          return;
        } catch (_) {}
      }
      await launchRealARCamera(dish, placementMode);
    } catch (err) {
      console.warn('[ARView] SceneViewer launch:', err);
      await launchRealARCamera(dish, placementMode);
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

  const activeLayer = layers[activeLayerIndex] || layers[0];

  return (
    <div className={`ar-screen-container ${isLayerMode ? 'layer-mode-active' : ''} ${isCameraActive ? 'camera-view-active' : ''}`}>
      {/* 1. Live Camera Feed Layer (Underneath 3D Model) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ display: isCameraActive ? 'block' : 'none' }}
        className={`ar-live-video-stream ${isCameraActive ? 'visible' : 'hidden'}`}
      />

      {/* Snapshot Flash Overlay */}
      {snapshotTaken && <div className="snapshot-flash-overlay" />}

      {/* 2. Top HUD Bar (Single Row, Mobile Responsive) */}
      <div className="camera-top-hud">
        <div className="in-camera-top-bar">
          {/* Back to Menu */}
          <button
            type="button"
            className="camera-hud-btn hud-back-btn"
            onClick={handleClose}
            title="Return to Menu"
          >
            <ArrowLeft size={16} />
            <span className="btn-label-text">Menu</span>
          </button>

          {/* Mount Surface Selection (Ground vs Wall) Segmented Switch */}
          <div className="hud-surface-segmented" role="group" aria-label="Surface Mount Mode">
            <button
              type="button"
              className={`hud-segment-btn ${placementMode === 'floor' ? 'active' : ''}`}
              onClick={() => handleTogglePlacement('floor')}
              title="Table / Ground Mount"
            >
              <Grid size={13} />
              <span>Ground</span>
            </button>
            <button
              type="button"
              className={`hud-segment-btn ${placementMode === 'wall' ? 'active' : ''}`}
              onClick={() => handleTogglePlacement('wall')}
              title="Vertical Wall Mount"
            >
              <Square size={13} />
              <span>Wall</span>
            </button>
          </div>

          {/* Right Action Buttons: Reset & Explode/Collapse */}
          <div className="hud-actions-group">
            <button
              type="button"
              className="camera-hud-btn hud-icon-btn reset-btn"
              onClick={handleResetCamera}
              title="Reset Alignment & Orientation"
            >
              <RotateCcw size={15} />
            </button>

            <button
              type="button"
              className={`camera-hud-btn hud-explode-btn ${isLayerMode ? 'active-layer-btn' : ''}`}
              onClick={handleToggleLayerMode}
              title={isLayerMode ? "Collapse 3D Layers" : "Deconstruct into 3D ingredient layers"}
            >
              <Layers size={14} />
              <span>{isLayerMode ? 'Collapse' : 'Explode'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. 3D Augmented Reality Model (Transparent canvas over live camera) */}
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
        camera-orbit={placementMode === 'wall' ? '0deg 90deg 110%' : '0deg 75deg 120%'}
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
        onLoad={handleModelLoad}
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

        {/* Slotted AR button */}
        <button
          slot="ar-button"
          id="custom-model-viewer-ar-btn"
          type="button"
          style={{ display: 'none' }}
          aria-hidden="true"
        />

        {/* 3D Interactive Hotspots */}
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

      {/* Floating Status & Instruction Pill (Hidden when Layer Mode is open on mobile to avoid overlap) */}
      {!isLayerMode && (
        <div className="ar-instruction-pill">
          {cameraLoading ? (
            <Loader2 size={16} className="spin" style={{ color: 'var(--accent-gold)' }} />
          ) : (
            <Sparkles size={16} style={{ color: 'var(--accent-gold)' }} />
          )}
          <span>{instruction}</span>
        </div>
      )}

      {/* 4. Responsive Culinary Layer Inspector Bottom Drawer */}
      {isLayerMode && (
        <div className="layer-inspector-drawer">
          {/* Mobile Drag Handle Bar */}
          <div
            className="layer-drawer-handle"
            onClick={handleCollapseLayers}
            title="Tap to collapse layers"
          >
            <div className="layer-drawer-pill" />
          </div>

          {/* Drawer Header */}
          <div className="layer-drawer-header">
            <div className="layer-header-title-box">
              <span className="layer-badge-sm">
                <Layers size={12} />
                Culinary Deconstruction
              </span>
              <h4 className="layer-dish-heading">{dish.name}</h4>
            </div>
            <button
              type="button"
              className="layer-collapse-btn"
              onClick={handleCollapseLayers}
              title="Collapse into single dish"
            >
              <ChevronDown size={14} />
              <span>Collapse</span>
            </button>
          </div>

          {/* Segmented Layer Selector Tabs */}
          <div className="layer-selector-tabs" role="tablist">
            {layers.map((layer) => {
              const isSelected = activeLayerIndex === layer.index;
              return (
                <button
                  key={layer.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`layer-tab-chip ${isSelected ? 'active' : ''}`}
                  style={{
                    '--tab-color': layer.color,
                    borderColor: isSelected ? layer.color : 'rgba(255, 255, 255, 0.12)'
                  }}
                  onClick={() => handleSelectLayer(layer.index)}
                >
                  <span className="tab-tier-dot" style={{ backgroundColor: layer.color }} />
                  <span className="tab-tier-label">{layer.tier.split(':')[0]}</span>
                </button>
              );
            })}
          </div>

          {/* Focused Active Layer Card (Concise, zero unnecessary height) */}
          <div
            className="active-layer-focused-card"
            style={{ borderLeftColor: activeLayer.color }}
          >
            <div className="focused-card-top">
              <span className="focused-tier-badge" style={{ color: activeLayer.color }}>
                {activeLayer.tier}
              </span>
              <div className="layer-stepper">
                <button
                  type="button"
                  className="stepper-arrow-btn"
                  disabled={activeLayer.index === 0}
                  onClick={() => handleSelectLayer(Math.max(0, activeLayer.index - 1))}
                  title="Previous Tier"
                >
                  <ChevronUp size={13} style={{ transform: 'rotate(-90deg)' }} />
                </button>
                <span className="stepper-count">
                  {activeLayer.index + 1} of {layers.length}
                </span>
                <button
                  type="button"
                  className="stepper-arrow-btn"
                  disabled={activeLayer.index === layers.length - 1}
                  onClick={() => handleSelectLayer(Math.min(layers.length - 1, activeLayer.index + 1))}
                  title="Next Tier"
                >
                  <ChevronDown size={13} style={{ transform: 'rotate(-90deg)' }} />
                </button>
              </div>
            </div>

            <h5 className="focused-layer-title">{activeLayer.name}</h5>
            <p className="focused-layer-desc">{activeLayer.description}</p>

            <div className="focused-ingredients-wrap">
              {activeLayer.ingredients.map((ing, i) => (
                <span key={i} className="focused-ing-pill">
                  • {ing}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. Bottom AR Controls (Visible in Normal View) */}
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

          {/* Native Room AR Camera button */}
          <button
            type="button"
            className="btn-sceneviewer-trigger"
            onClick={handleLaunchExternalGoogleAR}
            disabled={isLaunchingNativeAR}
            title="View in Immersive Tabletop AR"
          >
            {isLaunchingNativeAR ? (
              <Loader2 size={16} className="spin" />
            ) : (
              <>
                <Sparkles size={15} />
                <span>Tabletop AR</span>
              </>
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
});

export default ARView;
