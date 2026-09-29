import React, { useState } from 'react';
import { X, Flame, Check, ShoppingBag, Clock, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { placeOrder } from '../services/api';

export default function DishInfoModal({ dish, onClose, onSelectAR }) {
  const [isOrdered, setIsOrdered] = useState(false);
  const [orderReceipt, setOrderReceipt] = useState(null);

  if (!dish) return null;

  const handleOrder = async () => {
    setIsOrdered(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 }
    });

    const receipt = await placeOrder(dish.id, 1);
    setOrderReceipt(receipt?.data);

    setTimeout(() => {
      setIsOrdered(false);
      setOrderReceipt(null);
    }, 3000);
  };

  return (
    <div className="dish-modal-backdrop" onClick={onClose}>
      <div
        className="dish-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-drag-indicator" />

        <div className="modal-header">
          <div>
            <h3 className="modal-title">{dish.name}</h3>
            <p style={{ color: 'var(--accent-gold)', fontSize: '0.88rem', fontWeight: 600 }}>
              {dish.tagline || 'Curated Signature Dish'}
            </p>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-price-row">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="meta-pill spice">
              <Flame size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
              {dish.spiceLevel}
            </span>
            {dish.prepTime && (
              <span className="meta-pill">
                <Clock size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                {dish.prepTime}
              </span>
            )}
          </div>
          <div className="modal-price">
            {dish.price}
          </div>
        </div>

        <p className="modal-desc">
          {dish.description}
        </p>

        <h4 className="modal-section-title">Ingredients & Recipe Profile</h4>
        <ul className="ingredients-list">
          {dish.ingredients && dish.ingredients.map((ing, i) => (
            <li key={i}>{ing}</li>
          ))}
        </ul>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          {dish.isARAvailable && onSelectAR && (
            <button
              className="btn-view-ar"
              style={{ fontSize: '0.95rem', padding: '14px 20px' }}
              onClick={() => {
                onClose();
                onSelectAR(dish);
              }}
            >
              <Sparkles size={18} />
              ✨ VIEW IN AR ON YOUR TABLE
            </button>
          )}

          {/* ORDER NOW DEMO BUTTON */}
          <button
            className={`btn-order-now ${isOrdered ? 'ordered' : ''}`}
            onClick={handleOrder}
            disabled={isOrdered}
          >
            {isOrdered ? (
              <>
                <Check size={20} />
                {orderReceipt ? `✓ ORDERED! (${orderReceipt.orderId})` : '✓ ADDED TO ORDER! (DEMO)'}
              </>
            ) : (
              <>
                <ShoppingBag size={20} />
                ORDER NOW • {dish.price}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
