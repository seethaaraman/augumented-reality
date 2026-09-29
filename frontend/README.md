# 🎨 AR Restaurant — Frontend Web Application

Modern, mobile-responsive restaurant menu UI built with **React 19**, **Vite**, and **Google Model-Viewer WebAR**.

---

## 📁 Architecture

```text
frontend/
├── src/
│   ├── components/      # UI Views (Header, RestaurantMenu, DishInfoModal)
│   ├── services/        # Backend API integration (fetchMenu, placeOrder)
│   ├── styles/          # Dark luxury design system & glassmorphism (index.css)
│   ├── App.jsx          # View state manager (Menu ↔ AR ↔ Dish Details)
│   └── main.jsx         # App mounting
├── public/
│   └── models/          # 3D Model files (.glb)
├── index.html           # Viewport configuration & fonts
├── vite.config.js       # Vite dev server with /api proxy to backend
└── package.json
```

---

## 🚀 How to Run

```bash
cd frontend
npm install
npm run dev
```

* **Local**: `http://localhost:5173/`
* **Mobile (same Wi-Fi)**: `http://<your-ip>:5173/`
