/**
 * ARControls — Touch gesture utilities for WebAR interactions.
 * Provides touch normalization for mobile multi-touch gestures (drag, pinch, twist).
 */

export class ARTouchController {
  constructor(element, callbacks = {}) {
    this.element = element;
    this.callbacks = callbacks;
    this.touchStartDistance = 0;
    this.touchStartAngle = 0;
    this.init();
  }

  init() {
    if (!this.element) return;
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
  }

  handleTouchStart(e) {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      this.touchStartDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      this.touchStartAngle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);
    }
  }

  handleTouchMove(e) {
    if (e.touches.length === 2) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDistance = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const currentAngle = Math.atan2(t2.clientY - t1.clientY, t2.clientX - t1.clientX);

      const scaleDelta = currentDistance / (this.touchStartDistance || 1);
      const angleDelta = currentAngle - this.touchStartAngle;

      if (this.callbacks.onPinch) this.callbacks.onPinch(scaleDelta);
      if (this.callbacks.onTwist) this.callbacks.onTwist(angleDelta);
    }
  }

  destroy() {
    if (!this.element) return;
    this.element.removeEventListener('touchstart', this.handleTouchStart);
    this.element.removeEventListener('touchmove', this.handleTouchMove);
  }
}
