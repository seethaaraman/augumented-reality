import React from 'react';
import { Sparkles, Camera } from 'lucide-react';

export default function Header({ onOpenScanModal }) {
  return (
    <header className="restaurant-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
      <div>
        <div className="brand-badge">
          <Sparkles size={12} />
          Royal Gastronomy
        </div>
        <h1 className="brand-title">ROYAL SPICE DINING</h1>
        <p className="brand-subtitle">Interactive 3D & Augmented Reality Dining Menu</p>
      </div>

      {onOpenScanModal && (
        <button
          type="button"
          className="btn-scan-trigger"
          onClick={() => {
            console.log('[Header] Opening 3D Scan modal');
            onOpenScanModal();
          }}
        >
          <Camera size={16} />
          Scan & Add 3D Dish
        </button>
      )}
    </header>
  );
}
