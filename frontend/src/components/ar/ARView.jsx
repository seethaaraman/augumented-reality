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
  const [isLaunching, setIsLaunching] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [instruction, setInstruction] = useState('✨ Drag to rotate • Pinch to zoom • Tap camera for table AR');

  // Surface detection mode ('floor' = table/ground, 'wall' = vertical wall/board)
  const [placementMode, setPlacementMode] = useState('floor');

  // Interactive Layer Explode Mode
  const [isLayerMode, setIsLayerMode] = useState(false);
  const [activeLayerIndex, setActiveLayerIndex] = useState(null);

  const layers = getDishLayers(dish);
  const activeModelUrl = getPublicModelUrl(dish);

  const handleLaunchAR = async () => {
    setIsLaunching(true);
    setInstruction('🚀 Opening Google AR camera (detects tables, ground & walls)...');

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
        setInstruction(isLayerMode ? '✨ Tap 3D layer hotspots to deconstruct ingredients' : '✨ Drag to rotate • Pinch to zoom • Tap camera for table AR');
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
      modelViewerRef.current.cameraOrbit = '0deg 70deg 105%';
      modelViewerRef.current.cameraTarget = 'auto auto auto';
    }
    setActiveLayerIndex(null);
  };

  const handleTogglePlacement = () => {
    const nextMode = placementMode === 'floor' ? 'wall' : 'floor';
    setPlacementMode(nextMode);
    setInstruction(nextMode === 'wall' ? '🧱 Wall Mode: Aim camera at vertical walls or menus' : '🪑 Surface Mode: Aim camera at dining tables or floor');
  };

  const handleToggleLayerMode = () => {
    const nextState = !isLayerMode;
    setIsLayerMode(nextState);
    if (nextState) {
      setActiveLayerIndex(1); // default to mid layer
      setInstruction('✨ 3D Layer Mode: Tap glowing hotspots to inspect ingredients');
      if (modelViewerRef.current) {
        modelViewerRef.current.cameraOrbit = '30deg 65deg 90%';
      }
    } else {
      setActiveLayerIndex(null);
      handleResetCamera();
      setInstruction('✨ Drag to rotate • Pinch to zoom • Tap camera for table AR');
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

  return (
    <div className={`ar-screen-container ${isLayerMode ? 'layer-mode-active' : ''}`}>
      {/* Top Navigation HUD */}
      <div className="ar-top-hud">
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="hud-btn" onClick={onBack}>
            <ArrowLeft size={18} />
            Menu
          </button>

          <button className="hud-btn" onClick={handleResetCamera} title="Reset 3D Camera">
            <RotateCcw size={16} />
            Reset
          </button>
        </div>

        {/* Right HUD Controls: Surface Mode & Deconstruct Layers */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {/* Surface Mode Toggle (Table/Floor vs. Vertical Wall) */}
          <button
            className={`hud-btn ${placementMode === 'wall' ? 'active-surface-btn' : ''}`}
            onClick={handleTogglePlacement}
            title="Toggle surface: Table/Floor vs Vertical Wall"
          >
            {placementMode === 'wall' ? (
              <>
                <Square size={15} style={{ color: 'var(--accent-gold)' }} />
                🧱 Wall Mode
              </>
            ) : (
              <>
                <Grid size={15} />
                🪑 Surface Mode
              </>
            )}
          </button>

          {/* Interactive Deconstruct Layers Button */}
          <button
            className={`hud-btn ${isLayerMode ? 'active-layer-btn' : ''}`}
            onClick={handleToggleLayerMode}
            title="Deconstruct into 3D ingredient layers"
          >
            <Layers size={16} style={{ color: isLayerMode ? 'var(--accent-gold)' : '#fff' }} />
            {isLayerMode ? 'Collapse Dish' : '✨ Explode Layers'}
          </button>
        </div>
      </div>

      {/* 3D / AR Model Viewer */}
      <model-viewer
        ref={modelViewerRef}
        src={activeModelUrl}
        alt={`3D Model of ${dish.name}`}
        ar
        ar-modes="scene-viewer webxr quick-look"
        ar-scale="auto"
        ar-placement={placementMode}
        camera-controls
        touch-action="pan-y"
        loading="eager"
        reveal="auto"
        camera-orbit="0deg 70deg 105%"
        min-camera-orbit="auto auto 40%"
        max-camera-orbit="auto auto 300%"
        shadow-intensity="1.3"
        shadow-softness="0.6"
        exposure="1.05"
        environment-image="neutral"
        bounds="tight"
        auto-rotate={!isLayerMode}
        auto-rotate-delay="3000"
        rotation-per-second="14deg"
        className={`model-viewer-viewport ${isLayerMode ? 'exploded-visual' : ''}`}
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

        {/* Hidden Model-Viewer AR Trigger */}
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
          <button
            id="btn-launch-camera"
            className="btn-launch-camera"
            onClick={handleLaunchAR}
            disabled={isLaunching}
            style={{
              opacity: isLaunching ? 0.85 : 1,
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
      )}
    </div>
  );
}
