import React, { useState } from 'react';
import { X, Flame, Check, ShoppingBag, Clock, Sparkles, Camera } from 'lucide-react';
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
    }, 4000);
  };

  const handleLaunchAR = () => {
    onClose();
    if (onSelectAR) {
      onSelectAR(dish, true);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <span style={{
              fontSize: '0.72rem',
              color: 'var(--accent-gold)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em'
            }}>
              Authentic Recipe Details
            </span>
            <h3 className="modal-title">{dish.name}</h3>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close details">
            <X size={20} />
          </button>
        </div>

        {/* Spice, Rating & Prep Time */}
        <div className="dish-meta-pills" style={{ marginBottom: '16px' }}>
          <span className="meta-pill spice">
            <Flame size={13} style={{ display: 'inline', marginRight: '4px' }} />
            {dish.spiceLevel}
          </span>
          {dish.prepTime && (
            <span className="meta-pill">
              <Clock size={13} style={{ display: 'inline', marginRight: '4px' }} />
              {dish.prepTime}
            </span>
          )}
          <span className="meta-pill">
            ⭐ {dish.rating}
          </span>
        </div>

        {/* Culinary Description */}
        <p className="modal-desc">{dish.description}</p>

        {/* Ingredients Checklist */}
        <h4 className="ingredients-title">Key Ingredients & Heritage Spices</h4>
        <ul className="ingredients-list">
          {dish.ingredients?.map((item, index) => (
            <li key={index} className="ingredient-item">
              <span className="ingredient-bullet" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
          {dish.isARAvailable && onSelectAR && (
            <button
              className="btn-view-ar"
              style={{ fontSize: '0.95rem', padding: '14px 20px' }}
              onClick={handleLaunchAR}
            >
              <Camera size={18} />
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
