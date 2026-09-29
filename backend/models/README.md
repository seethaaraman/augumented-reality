# 🍛 3D Model Placement Guide (Web / React AR)

This is the designated folder for your 3D food model files (e.g. **Chicken Biryani**).

---

## Supported Format: `.glb` / `.gltf` / `.usdz`
* **`.glb` (glTF 2.0 Binary)**: Recommended format for WebAR. Works across Android ARCore and WebGL.
* **`.usdz`**: Optional companion for iOS QuickLook AR.

---

## How to Add Your 3D Food Model:
1. Place your 3D food model directly in this directory:
   ```
   public/models/biryani.glb
   ```
2. The React AR application will automatically load your custom 3D model, place it on real tables in AR, and enable touch move, rotate, and scale!
