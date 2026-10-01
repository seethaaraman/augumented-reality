import React, { useState, useRef } from 'react';
import { X, Upload, Camera, Video, Sparkles, Check, AlertCircle, Loader2, Box, Eye, Flame } from 'lucide-react';
import { getApiBase } from '../services/api';
import { normalizeGlbScale } from '../utils/modelNormalizer';

async function compressImageIfNeeded(file) {
  if (!file || !file.type.startsWith('image/')) return file;
  if (file.size < 1024 * 1024) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const maxDim = 1200;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        0.85
      );
    };
    img.onerror = () => resolve(file);
    img.src = url;
  });
}

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
      let uploadFile = file;

      if (mode === 'photo') {
        setProgressMsg('Optimizing image for 3D AI generator...');
        uploadFile = await compressImageIfNeeded(file);
      }

      if (mode === 'video') {
        setProgressMsg('Uploading 360° video to backend...');
      } else if (mode === 'photo') {
        setProgressMsg('Uploading photo to 3D AI generator...');
      } else {
        setProgressMsg('Preparing secure 3D asset upload...');
      }

      let createdDish = null;

      // 1. Direct Cloudinary upload for .glb models (bypasses Vercel 4.5MB serverless payload limit)
      if (mode === 'glb') {
        setProgressMsg('Optimizing & scaling 3D model for dining table proportions...');
        try {
          const arrayBuffer = await file.arrayBuffer();
          const normalizedBuffer = normalizeGlbScale(arrayBuffer, 0.25);
          uploadFile = new File([normalizedBuffer], file.name, { type: 'model/gltf-binary' });
        } catch (normErr) {
          console.warn('[DishScanModal] GLB pre-scale warning:', normErr);
        }

        setProgressMsg('Getting upload signature from backend...');
        const sigRes = await fetch(`${getApiBase()}/scan/signature`);
        const sigJson = await sigRes.json().catch(() => ({}));

        if (!sigRes.ok || !sigJson.success || !sigJson.data) {
          throw new Error(sigJson.error || 'Could not initialize secure upload. Please check connection and try again.');
        }

        const sig = sigJson.data;
        const cloudForm = new FormData();
        cloudForm.append('file', uploadFile);
        cloudForm.append('api_key', sig.apiKey);
        cloudForm.append('timestamp', sig.timestamp);
        cloudForm.append('signature', sig.signature);
        cloudForm.append('folder', sig.folder);

        setProgressMsg('Uploading 3D model to High-Speed Cloud CDN...');
        const cloudUploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/raw/upload`, {
          method: 'POST',
          body: cloudForm
        });

        if (!cloudUploadRes.ok) {
          const cloudErr = await cloudUploadRes.json().catch(() => ({}));
          throw new Error(cloudErr.error?.message || '3D model cloud upload failed.');
        }

        const cloudData = await cloudUploadRes.json();
        if (!cloudData.secure_url) {
          throw new Error('Server did not return a valid 3D asset URL.');
        }

        setProgressMsg('Adding 3D dish to restaurant menu...');
        const saveRes = await fetch(`${getApiBase()}/scan/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            tagline: tagline || `${name} Special`,
            price,
            dietary,
            spiceLevel,
            calories,
            prepTime,
            description: description || 'Freshly scanned 3D delicacy served in immersive Augmented Reality.',
            modelUrl: cloudData.secure_url
          })
        });

        const saveJson = await saveRes.json().catch(() => ({}));
        if (!saveRes.ok || !saveJson.success) {
          throw new Error(saveJson.error || saveJson.message || 'Failed to save dish to restaurant menu.');
        }
        createdDish = saveJson.data;
      } else {
        // Standard server-side AI reconstruction for photo and video
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('name', name);
        formData.append('tagline', tagline || `${name} Special`);
        formData.append('price', price);
        formData.append('dietary', dietary);
        formData.append('spiceLevel', spiceLevel);
        formData.append('calories', calories);
        formData.append('prepTime', prepTime);
        formData.append('description', description || 'Freshly scanned 3D delicacy served in immersive Augmented Reality.');

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

        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) {
          throw new Error(data.message || data.error || 'Failed to process dish scan.');
        }
        createdDish = data.data;
      }

      setStatus('success');
      setProgressMsg('3D Dish successfully created and hosted!');
      setScannedResult(createdDish);

      if (onDishAdded) {
        onDishAdded(createdDish);
      }
    } catch (err) {
      console.error('[DishScanModal] Error:', err);
      setStatus('error');
      const friendlyMsg = err.message === 'Failed to fetch'
        ? 'Network request timed out. Please check your internet connection and try again.'
        : err.message || 'Something went wrong while processing the scan.';
      setErrorMsg(friendlyMsg);
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
              3D Dish Studio
            </div>
            <h2 className="scan-modal-title">Scan & Add 3D Dish</h2>
            <p className="scan-modal-subtitle">
              Convert food photos, 360° videos, or 3D models into interactive dining presentations for AR.
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
              3D Model is ready and active on your live dining menu.
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
                      : 'Standard 3D model (.glb) file'}
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
                      : 'Add 3D Dish to Menu'}
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
