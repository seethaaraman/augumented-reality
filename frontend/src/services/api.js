import { DISHES_DATA } from '../../../backend/src/data/dishesData.js';

const API_BASE = '/api';

/**
 * Fetches the restaurant menu from the backend API.
 * Automatically falls back to static dish data if the backend server is unreachable.
 */
export async function fetchMenu() {
  try {
    const res = await fetch(`${API_BASE}/menu`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[Frontend API] Backend server unreachable, using offline fallback menu.', err.message);
  }
  return DISHES_DATA;
}

/**
 * Places a simulated order via the backend API.
 */
export async function placeOrder(dishId, quantity = 1) {
  try {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dishId, quantity }),
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('[Frontend API] Order fallback simulated locally.', err.message);
  }
  return {
    success: true,
    message: 'Order placed successfully (Demo mode)',
    data: { orderId: `ORD-${Date.now().toString().slice(-6)}` }
  };
}
