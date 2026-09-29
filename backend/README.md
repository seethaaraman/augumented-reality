# 🖥️ AR Restaurant — Backend API

A lightweight, high-performance Node.js / Express backend servicing the AR Restaurant application.

---

## 📡 API Endpoints

### 1. Health Check
* **`GET /api/health`**
* Returns server status and timestamp.

### 2. Menu Endpoints
* **`GET /api/menu`**
  * Returns list of all dishes, prices, spice levels, ingredients, and AR model paths.
* **`GET /api/menu/:id`**
  * Returns details for a specific dish (e.g. `chicken-biryani`).

### 3. Order Endpoints
* **`POST /api/orders`**
  * Request Body: `{ "dishId": "chicken-biryani", "quantity": 1 }`
  * Returns confirmed demo receipt with timestamp and order ID.

### 4. 3D Model Static Assets
* **`GET /models/:modelName`**
  * Serves 3D GLB/GLTF models stored in `ar/models/`.

---

## 🚀 How to Run

```bash
cd backend
npm install
npm run dev
```
Server runs on: `http://localhost:5000`
