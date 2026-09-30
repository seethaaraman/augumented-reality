import React, { useState } from 'react';
import { Sparkles, Flame, Clock, Award, Eye, Camera, Loader2 } from 'lucide-react';

export default function RestaurantMenu({ dishes = [], onSelectAR, onSelectDish }) {
  const [isLaunchingFeatured, setIsLaunchingFeatured] = useState(false);
  const biryani = dishes.find((d) => d.id === 'chicken-biryani') || dishes[0];
  const otherDishes = dishes.filter((d) => d.id !== 'chicken-biryani');

  const handleLaunchFeaturedAR = () => {
    if (!biryani) return;
    setIsLaunchingFeatured(true);
    // Delegate cleanly to ARView via onSelectAR without colliding duplicate intent
    onSelectAR(biryani, true);
    setTimeout(() => setIsLaunchingFeatured(false), 1500);
  };

  return (
    <main className="menu-section">
      <div className="section-title-wrap">
        <div>
          <h2 className="section-title">Chef's Signature Selection</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Preview authentic dishes in Augmented Reality on your table before ordering.
          </p>
        </div>
      </div>

      {/* Featured Dish Card: Chicken Biryani */}
      {biryani && (
        <section className="featured-card">
          <div className="featured-badge-ribbon">
            <Award size={13} />
            {biryani.badge || 'SIGNATURE'}
          </div>

          <div className="featured-header">
            <div>
              <h3 className="dish-name-lg">
                🍛 {biryani.name}
              </h3>
              <p style={{ color: 'var(--accent-gold)', fontSize: '0.88rem', fontWeight: 600, marginTop: '2px' }}>
                {biryani.tagline}
              </p>
            </div>
            <div className="dish-price-lg">
              {biryani.price}
            </div>
          </div>

          <div className="dish-meta-pills">
            <span className="meta-pill spice">
              <Flame size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              {biryani.spiceLevel}
            </span>
            {biryani.prepTime && (
              <span className="meta-pill">
                <Clock size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                {biryani.prepTime}
              </span>
            )}
            <span className="meta-pill">
              ⭐ {biryani.rating}
            </span>
          </div>

          <p className="featured-description">
            {biryani.description}
          </p>

          {biryani.ingredients && (
            <div className="ingredients-preview">
              {biryani.ingredients.map((ing, i) => (
                <span key={i} className="ingredient-chip">
                  • {ing}
                </span>
              ))}
            </div>
          )}

          {/* VIEW IN AR BUTTONS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              id="btn-view-ar"
              className="btn-view-ar"
              onClick={handleLaunchFeaturedAR}
              disabled={isLaunchingFeatured}
            >
              {isLaunchingFeatured ? (
                <>
                  <Loader2 size={20} className="spin" />
                  LAUNCHING GOOGLE AR CAMERA...
                </>
              ) : (
                <>
                  <Camera size={20} />
                  ✨ VIEW IN AR ON YOUR TABLE
                </>
              )}
            </button>

            <button
              id="btn-view-3d"
              onClick={() => onSelectAR(biryani, false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 18px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: 'var(--radius-lg)',
                color: '#e2e8f0',
                fontSize: '0.88rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Eye size={16} />
              Interactive 3D Canvas Preview
            </button>
          </div>
        </section>
      )}

      {/* Additional Menu Items */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '36px 0 16px' }}>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
          Explore Full Culinary Collection
        </h3>
        <span style={{ fontSize: '0.82rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
          {dishes.filter(d => d.isARAvailable).length} 3D/AR Models Active
        </span>
      </div>

      <div className="menu-grid">
        {otherDishes.map((dish) => (
          <div
            key={dish.id}
            className="dish-card"
            onClick={() => onSelectDish(dish)}
            style={{ cursor: 'pointer' }}
          >
            <div>
              <div className="card-top">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 className="card-title">{dish.name}</h4>
                  {dish.badge && (
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(245, 158, 11, 0.15)',
                      color: 'var(--accent-gold)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      letterSpacing: '0.05em'
                    }}>
                      {dish.badge}
                    </span>
                  )}
                </div>
                <span className="card-price">{dish.price}</span>
              </div>
              <p className="card-tagline">{dish.tagline}</p>
              <p className="card-desc">{dish.description}</p>
            </div>

            <div className="card-bottom">
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{dish.spiceLevel}</span>
                <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>{dish.rating}</span>
              </div>

              {dish.isARAvailable && (
                <div style={{ display: 'flex', gap: '8px' }} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="btn-card-ar"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAR(dish, true);
                    }}
                    title="Launch AR camera on table"
                  >
                    <Camera size={15} />
                    Launch AR
                  </button>
                  <button
                    type="button"
                    className="btn-card-ar btn-card-3d"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectAR(dish, false);
                    }}
                    title="Inspect 3D Model"
                  >
                    <Eye size={15} />
                    3D
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
