# 🍛 AR Restaurant Menu — Complete Unified Full-Stack Architecture

An interactive **3D & Augmented Reality Dining Menu** built with a **Single Unified Codebase** for Web and Native Android (powered by Capacitor).

---

## 🏗️ 2-Tier Unified Modular Structure

```text
d:/Ar stuff/
│
├── 🎨 frontend/                     # Unified Web & Native Mobile App (React 19 + Capacitor)
│   ├── src/
│   │   ├── components/
│   │   │   ├── ar/                 # ARView.jsx (Google Model-Viewer + WebXR ARCore/QuickLook)
│   │   │   │                       # ARControls.js (Touch gesture normalizer: pinch, rotate)
│   │   │   ├── Header.jsx          # Luxury header branding
│   │   │   ├── RestaurantMenu.jsx  # Menu grid with direct "✨ View 3D / AR" buttons
│   │   │   └── DishInfoModal.jsx   # Details bottom-sheet with ingredients & Order button
│   │   ├── services/
│   │   │   └── api.js              # Connects to /api/menu & /api/orders (with offline fallback)
│   │   ├── styles/
│   │   │   └── index.css           # Luxury dark gold responsive design system
│   │   ├── App.jsx                 # State coordinator (Menu ↔ AR ↔ Dish Details)
│   │   └── main.jsx
│   ├── public/
│   │   └── models/                 # 3D GLB food models (Biryani, Cake, Butter Chicken, Paneer, Lime Soda)
│   ├── android/                    # Native Android Capacitor Project (Generates APK)
│   ├── capacitor.config.json       # Capacitor app identity ("Royal Spice AR Dining")
│   ├── vite.config.js              # Configured with proxy to backend & LAN exposure
│   └── package.json
│
├── 🖥️ backend/                      # Node.js & Express REST API Server
│   ├── src/
│   │   ├── controllers/            # menuController.js, orderController.js
│   │   ├── routes/                 # menuRoutes.js, orderRoutes.js
│   │   ├── data/                   # dishesData.js (Single source of truth for menu items)
│   │   └── server.js               # Express app on port 5000 (CORS, static /models host)
│   ├── models/                     # Static 3D GLB assets repository
│   ├── scripts/                    # generate-dish-models.js (Three.js 3D procedural generator)
│   └── package.json
│
├── package.json                    # Root workspace orchestrator
├── .gitignore                      # Clean repository ignore list
└── README.md                       # Master documentation
```

---

## ⚡ How to Run Everything

### 1. Run Development Server (Web + Backend):
In the project root (`d:\Ar stuff`):
```bash
npm run dev
```

Both servers launch concurrently:
* **Frontend Web UI**: [http://localhost:5173/](http://localhost:5173/)
* **Backend API**: [http://localhost:5000/api/menu](http://localhost:5000/api/menu)
* **Mobile / Real Phone (Same Wi-Fi)**: `http://10.90.120.213:5173/`

---

## 📱 How to Build the Native Android Mobile App (Capacitor)

Because we use Capacitor, you write your UI **once** in `frontend/`. To package and build the native Android app:

```bash
# 1. Build the web app and sync into the Android project (1-click):
npm run cap:sync

# 2. Open the native Android project in Android Studio (to run on device or build APK):
npm run cap:open
```

In Android Studio: Click **Build → Build Bundle(s) / APK(s) → Build APK(s)** to generate your release or debug `.apk`.

---

## 🍛 How to Demo AR on a Real Smartphone

1. Open Chrome (Android) or Safari (iOS) on your phone.
2. Navigate to:
   ```
   http://10.90.120.213:5173/
   ```
   *(or open the installed Android APK)*
3. Tap **`✨ View 3D / AR`** on any dish (*Chicken Biryani, Artisan Strawberry Cake, Butter Chicken Handi, Paneer Tikka Platter, Fresh Lime Soda Cooler*).
4. Tap **`📷 Launch Real AR Camera`**:
   * Google ARCore activates your phone's camera.
   * Point at any table or flat surface.
   * The 3D dish appears anchored on your physical table with realistic lighting!
   * Drag to move, pinch to scale, and twist to rotate.
5. Tap the food or **`Details`** to inspect ingredients and click **`ORDER NOW`**.
