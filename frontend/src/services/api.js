import { Capacitor } from '@capacitor/core';

export function getApiBase() {
  if (Capacitor.isNativePlatform()) {
    // When running inside the Android APK on a device
    return import.meta.env.VITE_BACKEND_URL || 'http://10.90.120.213:5000/api';
  }
  return '/api';
}

export const API_BASE = getApiBase();

/**
 * Fetches the restaurant menu directly from the MongoDB backend database API.
 */
export async function fetchMenu() {
  try {
    const res = await fetch(`${getApiBase()}/menu`, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data;
      }
    }
    throw new Error(`Server returned HTTP ${res.status}`);
  } catch (err) {
    console.error('[Frontend API] Error fetching menu from MongoDB database:', err.message);
    throw err;
  }
}

/**
 * Places a real order stored directly in the MongoDB backend database.
 */
export async function placeOrder(dishId, quantity = 1, specialInstructions = '', tableNumber = 'Table 4') {
  try {
    const res = await fetch(`${getApiBase()}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dishId, quantity, specialInstructions, tableNumber }),
      signal: AbortSignal.timeout(6000)
    });
    if (res.ok) {
      return await res.json();
    }
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.message || `HTTP ${res.status}`);
  } catch (err) {
    console.error('[Frontend API] Error placing order in MongoDB:', err.message);
    throw err;
  }
}

/**
 * Fetches all orders from the MongoDB database.
 */
export async function fetchOrders() {
  try {
    const res = await fetch(`${getApiBase()}/orders`, { signal: AbortSignal.timeout(6000) });
    if (res.ok) {
      const json = await res.json();
      return json.data || [];
    }
  } catch (err) {
    console.error('[Frontend API] Error fetching orders from MongoDB:', err.message);
  }
  return [];
}
