import React, { useState, useRef } from 'react';
import { X, Upload, Camera, Video, Sparkles, Check, AlertCircle, Loader2, Box, Eye, Flame } from 'lucide-react';
import { getApiBase } from '../services/api';

export default function DishScanModal({ isOpen, onClose, onDishAdded }) {
  const [mode, setMode] = useState('photo'); // 'photo' | 'video' | 'glb'
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [price, setPrice] = useState('₹280');
  const [dietary, setDietary] = useState('Vegetarian');
  const [spiceLevel, setSpiceLevel] = useState('🌶️ Medium Spice');
  const [calories, setCalories] = useState('420 kcal');
  const [prepTime, setPrepTime] = useState('20 mins');
  const [description, setDescription] = useState('');

  // Scanning / Uploading State
  const [status, setStatus] = useState('idle'); // 'idle' | 'uploading' | 'processing' | 'success' | 'error'
  const [progressMsg, setProgressMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [scannedResult, setScannedResult] = useState(null);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setErrorMsg('');

    if (selected.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result);
      reader.readAsDataURL(selected);
    } else if (selected.type.startsWith('video/')) {
      const url = URL.createObjectURL(selected);
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg(`Please select a ${mode === 'video' ? 'video' : mode === 'photo' ? 'photo' : '.glb model'} file first.`);
      return;
    }
    if (!name.trim()) {
      setErrorMsg('Please enter a dish name.');
      return;
    }

    try {
      setStatus('uploading');
      if (mode === 'video') {
        setProgressMsg('Uploading 360° video to backend...');
      } else if (mode === 'photo') {
        setProgressMsg('Uploading photo to 3D AI generator...');
      } else {
        setProgressMsg('Uploading 3D model to Cloudinary CDN...');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name);
      formData.append('tagline', tagline || `${name} Special`);
      formData.append('price', price);
      formData.append('dietary', dietary);
      formData.append('spiceLevel', spiceLevel);
      formData.append('calories', calories);
      formData.append('prepTime', prepTime);
      formData.append('description', description || `Freshly scanned 3D delicacy served in immersive Augmented Reality.`);

      if (mode === 'video') {
        setTimeout(() => {
          setProgressMsg('FFmpeg extracting 360° keyframe angles from video...');
        }, 2000);
        setTimeout(() => {
          setProgressMsg('AI synthesizing 3D geometry & PBR textures (may take ~30s)...');
        }, 5000);
      } else if (mode === 'photo') {
        setTimeout(() => {
          setProgressMsg('AI synthesizing 3D geometry & PBR textures (may take ~30s)...');
        }, 3000);
      }

      const res = await fetch(`${getApiBase()}/scan/dish`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to process dish scan.');
      }

      setStatus('success');
      setProgressMsg('3D Dish successfully created and hosted!');
      setScannedResult(data.data);

      if (onDishAdded) {
        onDishAdded(data.data);
      }
    } catch (err) {
      console.error('[DishScanModal] Error:', err);
      setStatus('error');
      setErrorMsg(err.message || 'Something went wrong while processing the scan.');
    }
  };

  const handleReset = () => {
    setFile(null);
    setFilePreview(null);
    setStatus('idle');
    setProgressMsg('');
    setErrorMsg('');
    setScannedResult(null);
  };

  const getAcceptedFileTypes = () => {
    if (mode === 'photo') return 'image/png,image/jpeg,image/webp,image/jpg';
    if (mode === 'video') return 'video/mp4,video/quicktime,video/webm,video/m4v';
    return '.glb,model/gltf-binary';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="scan-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="scan-modal-header">
          <div>
            <div className="brand-badge" style={{ marginBottom: '6px' }}>
              <Sparkles size={12} />
              AI 3D Scan & Cloudinary
            </div>
            <h2 className="scan-modal-title">Scan & Add 3D Dish</h2>
            <p className="scan-modal-subtitle">
              Convert food photos or 360° videos into interactive 3D models stored on Cloudinary for AR dining.
            </p>
          </div>
          <button className="scan-modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Success Preview View */}
        {status === 'success' && scannedResult ? (
          <div className="scan-success-view">
            <div className="success-icon-badge">
              <Check size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '12px' }}>
              {scannedResult.name} is Ready!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '4px' }}>
              3D Model uploaded to Cloudinary & added to your live menu.
            </p>

            {/* Model Preview */}
            <div className="model-preview-box">
              <model-viewer
                src={scannedResult.remoteModelUrl}
                alt={scannedResult.name}
                auto-rotate
                camera-controls
                shadow-intensity="1"
                style={{ width: '100%', height: '220px', borderRadius: '12px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button className="btn-secondary" onClick={handleReset} style={{ flex: 1 }}>
                Scan Another Dish
              </button>
              <button className="btn-primary" onClick={onClose} style={{ flex: 1 }}>
                View in Menu
              </button>
            </div>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="scan-modal-form">
            {/* Mode Switcher */}
            <div className="scan-mode-tabs">
              <button
                type="button"
                className={`scan-tab-btn ${mode === 'photo' ? 'active' : ''}`}
                onClick={() => { setMode('photo'); handleReset(); }}
              >
                <Camera size={15} />
                📸 Photo Scan
              </button>
              <button
                type="button"
                className={`scan-tab-btn ${mode === 'video' ? 'active' : ''}`}
                onClick={() => { setMode('video'); handleReset(); }}
              >
                <Video size={15} />
                📹 360° Video Scan
              </button>
              <button
                type="button"
                className={`scan-tab-btn ${mode === 'glb' ? 'active' : ''}`}
                onClick={() => { setMode('glb'); handleReset(); }}
              >
                <Box size={15} />
                📦 Upload .glb
              </button>
            </div>

            {/* Upload Zone */}
            <div
              className={`scan-dropzone ${file ? 'has-file' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={getAcceptedFileTypes()}
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {filePreview && mode === 'photo' ? (
                <div className="preview-container">
                  <img src={filePreview} alt="Dish Preview" className="uploaded-photo-preview" />
                  <p className="file-info-text">✓ Photo selected: {file?.name}</p>
                </div>
              ) : filePreview && mode === 'video' ? (
                <div className="preview-container">
                  <video
                    src={filePreview}
                    controls
                    muted
                    loop
                    className="uploaded-photo-preview"
                    style={{ maxHeight: '150px', background: '#000' }}
                  />
                  <p className="file-info-text">✓ 360° Video selected: {file?.name}</p>
                </div>
              ) : file ? (
                <div className="file-selected-box">
                  <Box size={36} color="var(--accent-gold)" />
                  <p style={{ fontWeight: 600, marginTop: '8px' }}>{file.name}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div className="dropzone-empty">
                  <div className="upload-icon-circle">
                    {mode === 'video' ? (
                      <Video size={22} color="var(--accent-gold)" />
                    ) : mode === 'photo' ? (
                      <Camera size={22} color="var(--accent-gold)" />
                    ) : (
                      <Upload size={22} color="var(--accent-gold)" />
                    )}
                  </div>
                  <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                    {mode === 'video'
                      ? 'Tap to record or upload 360° food video'
                      : mode === 'photo'
                      ? 'Tap to snap or upload food photo'
                      : 'Tap to select .glb 3D model'}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {mode === 'video'
                      ? 'Circle slowly around plate (5–15 sec video)'
                      : mode === 'photo'
                      ? 'Single clear photo (good lighting, matte table)'
                      : 'GLB 3D model from Meshy / Sketchfab'}
                  </p>
                </div>
              )}
            </div>

            {/* Dish Fields */}
            <div className="form-grid">
              <div className="form-group">
                <label>Dish Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Mutton Seekh Kebab"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Price *</label>
                <input
                  type="text"
                  placeholder="e.g. ₹320"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Tagline</label>
                <input
                  type="text"
                  placeholder="e.g. Charred Clay Oven Delight"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Dietary</label>
                <select value={dietary} onChange={(e) => setDietary(e.target.value)}>
                  <option value="Vegetarian">🟢 Vegetarian</option>
                  <option value="Non-Vegetarian">🔴 Non-Vegetarian</option>
                </select>
              </div>

              <div className="form-group">
                <label>Spice Level</label>
                <select value={spiceLevel} onChange={(e) => setSpiceLevel(e.target.value)}>
                  <option value="🌶️ Mild Spice">🌶️ Mild</option>
                  <option value="🌶️ Medium Spice">🌶️🌶️ Medium</option>
                  <option value="🌶️🌶️🌶️ Extra Spicy">🌶️🌶️🌶️ Extra Spicy</option>
                </select>
              </div>

              <div className="form-group">
                <label>Calories</label>
                <input
                  type="text"
                  placeholder="e.g. 480 kcal"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '12px' }}>
              <label>Description</label>
              <textarea
                rows={2}
                placeholder="Brief dish description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="scan-error-banner">
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Progress indicator */}
            {(status === 'uploading' || status === 'processing') && (
              <div className="scan-progress-banner">
                <Loader2 size={18} className="spinner" />
                <span>{progressMsg}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="scan-modal-actions">
              <button type="button" className="btn-secondary" onClick={onClose} disabled={status === 'uploading'}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={status === 'uploading' || !file || !name.trim()}
              >
                {status === 'uploading' ? (
                  <>
                    <Loader2 size={16} className="spinner" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    {mode === 'video'
                      ? 'Process 360° Video'
                      : mode === 'photo'
                      ? 'Scan & Generate 3D Dish'
                      : 'Upload to Cloudinary'}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
