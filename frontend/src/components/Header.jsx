import React from 'react';
import { Sparkles } from 'lucide-react';

export default function Header() {
  return (
    <header className="restaurant-header">
      <div>
        <div className="brand-badge">
          <Sparkles size={12} />
          Royal Gastronomy
        </div>
        <h1 className="brand-title">ROYAL SPICE DINING</h1>
        <p className="brand-subtitle">Interactive 3D & Augmented Reality Dining Menu</p>
      </div>
    </header>
  );
}
