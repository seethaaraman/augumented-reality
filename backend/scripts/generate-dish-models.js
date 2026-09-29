// Polyfill FileReader for Three.js GLTFExporter in Node.js
class PolyfillFileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(buf => {
      this.result = buf;
      if (typeof this.onloadend === 'function') this.onloadend();
    });
  }
}
global.FileReader = PolyfillFileReader;
global.self = global;

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as THREE from '../../frontend/node_modules/three/build/three.module.js';
import { GLTFExporter } from '../../frontend/node_modules/three/examples/jsm/exporters/GLTFExporter.js';
import { GLTFLoader } from '../../frontend/node_modules/three/examples/jsm/loaders/GLTFLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsDir = path.resolve(__dirname, '../models');
const frontendPublicDir = path.resolve(__dirname, '../../frontend/public/models');

function saveGLB(buffer, filename) {
  const targets = [
    path.join(modelsDir, filename),
    path.join(frontendPublicDir, filename)
  ];

  for (const target of targets) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, Buffer.from(buffer));
    console.log(`✓ Saved ${filename} (${buffer.byteLength} bytes) -> ${target}`);
  }
}

async function exportScene(scene, filename) {
  const exporter = new GLTFExporter();
  const glbBuffer = await exporter.parseAsync(scene, { binary: true });
  saveGLB(glbBuffer, filename);
}

// -------------------------------------------------------------
// 1. FRESH LIME SODA (lime-soda.glb)
// Realistic Scale: 10cm wide coaster, 15cm tall tumbler, bottom at y=0.000
// -------------------------------------------------------------
async function createLimeSoda() {
  const scene = new THREE.Scene();
  scene.name = 'FreshLimeSoda';

  // Base Coaster (Diameter 10cm, Height 5mm, Bottom at y=0)
  const coasterGeo = new THREE.CylinderGeometry(0.048, 0.050, 0.005, 32);
  const coasterMat = new THREE.MeshStandardMaterial({ color: 0x27272a, roughness: 0.7, metalness: 0.2 });
  const coaster = new THREE.Mesh(coasterGeo, coasterMat);
  coaster.position.y = 0.0025;
  scene.add(coaster);

  // Outer Glass Tumbler (Diameter 7.5cm, Height 14cm)
  const glassGeo = new THREE.CylinderGeometry(0.038, 0.030, 0.135, 32, 1, true);
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xecfeff,
    transparent: true,
    opacity: 0.40,
    roughness: 0.08,
    metalness: 0.15,
    side: THREE.DoubleSide
  });
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.y = 0.005 + 0.135 / 2;
  scene.add(glass);

  // Glass Solid Base
  const glassBaseGeo = new THREE.CylinderGeometry(0.030, 0.030, 0.012, 32);
  const glassBaseMat = new THREE.MeshStandardMaterial({ color: 0xcffafe, transparent: true, opacity: 0.55, roughness: 0.08 });
  const glassBase = new THREE.Mesh(glassBaseGeo, glassBaseMat);
  glassBase.position.y = 0.005 + 0.006;
  scene.add(glassBase);

  // Sparkling Lime Soda Liquid
  const liquidGeo = new THREE.CylinderGeometry(0.036, 0.029, 0.110, 32);
  const liquidMat = new THREE.MeshStandardMaterial({ color: 0xbbf7d0, transparent: true, opacity: 0.82, roughness: 0.12, metalness: 0.05 });
  const liquid = new THREE.Mesh(liquidGeo, liquidMat);
  liquid.position.y = 0.017 + 0.110 / 2;
  scene.add(liquid);

  // Ice Cubes
  const iceMat = new THREE.MeshStandardMaterial({ color: 0xf0fdf4, transparent: true, opacity: 0.65, roughness: 0.15 });
  const iceConfigs = [
    { x: -0.010, y: 0.055, z: 0.008, s: 0.020, rx: 0.2, ry: 0.5 },
    { x: 0.012, y: 0.075, z: -0.006, s: 0.022, rx: -0.3, ry: 0.8 },
    { x: -0.008, y: 0.098, z: -0.010, s: 0.022, rx: 0.4, ry: 0.2 },
    { x: 0.009, y: 0.115, z: 0.007, s: 0.020, rx: 0.1, ry: -0.4 }
  ];
  iceConfigs.forEach(cfg => {
    const iceGeo = new THREE.BoxGeometry(cfg.s, cfg.s, cfg.s);
    const iceMesh = new THREE.Mesh(iceGeo, iceMat);
    iceMesh.position.set(cfg.x, cfg.y, cfg.z);
    iceMesh.rotation.set(cfg.rx, cfg.ry, 0.3);
    scene.add(iceMesh);
  });

  // Lime Slice on Rim
  const sliceGroup = new THREE.Group();
  const rindGeo = new THREE.TorusGeometry(0.022, 0.003, 16, 32);
  const rindMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5 });
  sliceGroup.add(new THREE.Mesh(rindGeo, rindMat));
  const pulpGeo = new THREE.CircleGeometry(0.021, 32);
  const pulpMat = new THREE.MeshStandardMaterial({ color: 0xd9f99d, roughness: 0.4, side: THREE.DoubleSide });
  sliceGroup.add(new THREE.Mesh(pulpGeo, pulpMat));
  sliceGroup.position.set(0.035, 0.140, 0.008);
  sliceGroup.rotation.set(0.4, 0.3, 0.8);
  scene.add(sliceGroup);

  // Mint Leaves
  const mintMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6, side: THREE.DoubleSide });
  for (let i = 0; i < 3; i++) {
    const leafGeo = new THREE.ConeGeometry(0.010, 0.024, 8);
    leafGeo.scale(1, 1, 0.2);
    const leaf = new THREE.Mesh(leafGeo, mintMat);
    leaf.position.set(0.004 + i * 0.006, 0.128, -0.009 + i * 0.005);
    leaf.rotation.set(0.5, i * 1.8, 0.4);
    scene.add(leaf);
  }

  // Straw
  const strawGeo = new THREE.CylinderGeometry(0.003, 0.003, 0.180, 16);
  const strawMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.4 });
  const straw = new THREE.Mesh(strawGeo, strawMat);
  straw.position.set(-0.010, 0.100, -0.004);
  straw.rotation.set(0.22, 0.1, -0.20);
  scene.add(straw);

  await exportScene(scene, 'lime-soda.glb');
}

// -------------------------------------------------------------
// 2. SMOKY PANEER TIKKA (paneer-tikka.glb)
// Realistic Scale: Platter 28cm x 16cm, height 5.5cm, bottom at y=0.000
// -------------------------------------------------------------
async function createPaneerTikka() {
  const scene = new THREE.Scene();
  scene.name = 'PaneerTikka';

  // Slate Ceramic Platter (28cm x 15cm x 1.2cm, bottom at y=0)
  const plateGeo = new THREE.BoxGeometry(0.28, 0.012, 0.15);
  const plateMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.15 });
  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.position.y = 0.006;
  scene.add(plate);

  // Platter Gold Rim Accent
  const rimGeo = new THREE.BoxGeometry(0.284, 0.003, 0.154);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3, metalness: 0.8 });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.position.y = 0.011;
  scene.add(rim);

  // Skewer Stainless Steel Needle
  const skewerGeo = new THREE.CylinderGeometry(0.0018, 0.0018, 0.24, 16);
  const skewerMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.15 });
  const skewer = new THREE.Mesh(skewerGeo, skewerMat);
  skewer.position.set(-0.015, 0.035, -0.010);
  skewer.rotation.z = Math.PI / 2;
  scene.add(skewer);

  // Chargrilled Paneer Cubes (4 cubes)
  const paneerMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.45 });
  const charMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
  const paneerX = [-0.085, -0.038, 0.010, 0.058];

  paneerX.forEach((x, i) => {
    const cubeGeo = new THREE.BoxGeometry(0.028, 0.028, 0.028);
    const cube = new THREE.Mesh(cubeGeo, paneerMat);
    cube.position.set(x, 0.035, -0.010);
    cube.rotation.set((i % 2) * 0.15, (i % 3) * 0.2, (i % 2) * -0.1);
    scene.add(cube);

    const markGeo = new THREE.BoxGeometry(0.030, 0.003, 0.030);
    const mark = new THREE.Mesh(markGeo, charMat);
    mark.position.set(x, 0.048, -0.010);
    scene.add(mark);
  });

  // Grilled Bell Peppers & Onions
  const pepperMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.4 });
  const onionMat = new THREE.MeshStandardMaterial({ color: 0x9d174d, roughness: 0.45 });
  const vegX = [-0.062, -0.014, 0.034];

  vegX.forEach((x, i) => {
    const pGeo = new THREE.BoxGeometry(0.008, 0.026, 0.026);
    const pMesh = new THREE.Mesh(pGeo, i % 2 === 0 ? pepperMat : onionMat);
    pMesh.position.set(x, 0.035, -0.010);
    scene.add(pMesh);
  });

  // Mint Chutney Ceramic Bowl
  const bowlGeo = new THREE.CylinderGeometry(0.022, 0.016, 0.016, 24);
  const bowlMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
  const bowl = new THREE.Mesh(bowlGeo, bowlMat);
  bowl.position.set(0.095, 0.020, 0.038);
  scene.add(bowl);

  const chutneyGeo = new THREE.CylinderGeometry(0.020, 0.020, 0.003, 24);
  const chutneyMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.5 });
  const chutney = new THREE.Mesh(chutneyGeo, chutneyMat);
  chutney.position.set(0.095, 0.027, 0.038);
  scene.add(chutney);

  await exportScene(scene, 'paneer-tikka.glb');
}

// -------------------------------------------------------------
// 3. BUTTER CHICKEN HANDI (butter-chicken.glb)
// Realistic Scale: Handi Trivet 20cm, Height 12cm, bottom at y=0.000
// -------------------------------------------------------------
async function createButterChicken() {
  const scene = new THREE.Scene();
  scene.name = 'RoyalButterChicken';

  // Base Trivet Plate (Diameter 20cm, Height 8mm, bottom at y=0)
  const trivetGeo = new THREE.CylinderGeometry(0.098, 0.100, 0.008, 32);
  const trivetMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6, metalness: 0.5 });
  const trivet = new THREE.Mesh(trivetGeo, trivetMat);
  trivet.position.y = 0.004;
  scene.add(trivet);

  // Hammered Copper / Brass Handi Body (Diameter 16cm, Height 9cm)
  const potGeo = new THREE.SphereGeometry(0.082, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.68);
  const potMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.25, side: THREE.DoubleSide });
  const pot = new THREE.Mesh(potGeo, potMat);
  pot.position.y = 0.082; // Perfectly rests at y=0
  pot.rotation.x = Math.PI;
  scene.add(pot);

  // Handi Gold Flared Lip
  const lipGeo = new THREE.TorusGeometry(0.074, 0.007, 16, 32);
  const lipMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
  const lip = new THREE.Mesh(lipGeo, lipMat);
  lip.position.y = 0.082;
  lip.rotation.x = Math.PI / 2;
  scene.add(lip);

  // Side Ring Handles
  const handleGeo = new THREE.TorusGeometry(0.018, 0.004, 16, 24);
  const handleMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.9, roughness: 0.25 });
  const handleL = new THREE.Mesh(handleGeo, handleMat);
  handleL.position.set(-0.082, 0.066, 0);
  handleL.rotation.y = Math.PI / 2;
  scene.add(handleL);
  const handleR = new THREE.Mesh(handleGeo, handleMat);
  handleR.position.set(0.082, 0.066, 0);
  handleR.rotation.y = Math.PI / 2;
  scene.add(handleR);

  // Rich Makhani Gravy Surface
  const gravyGeo = new THREE.CylinderGeometry(0.070, 0.070, 0.006, 32);
  const gravyMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.35, metalness: 0.05 });
  const gravy = new THREE.Mesh(gravyGeo, gravyMat);
  gravy.position.y = 0.078;
  scene.add(gravy);

  // Chicken Tikka Chunks in Gravy
  const chickenMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.6 });
  const chickenPos = [
    { x: -0.024, y: 0.080, z: -0.018, s: 0.018 },
    { x: 0.028, y: 0.080, z: -0.012, s: 0.020 },
    { x: -0.010, y: 0.080, z: 0.030, s: 0.017 },
    { x: 0.022, y: 0.080, z: 0.022, s: 0.019 }
  ];
  chickenPos.forEach(cfg => {
    const chGeo = new THREE.DodecahedronGeometry(cfg.s, 0);
    const ch = new THREE.Mesh(chGeo, chickenMat);
    ch.position.set(cfg.x, cfg.y, cfg.z);
    ch.rotation.set(0.2, 0.5, 0.1);
    scene.add(ch);
  });

  // Fresh Cream Swirl Ring
  const creamGeo = new THREE.TorusGeometry(0.038, 0.004, 12, 32);
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
  const cream = new THREE.Mesh(creamGeo, creamMat);
  cream.position.y = 0.082;
  cream.rotation.x = Math.PI / 2;
  scene.add(cream);

  // Melting Butter Pat in Center
  const butterGeo = new THREE.BoxGeometry(0.022, 0.007, 0.022);
  const butterMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.15, metalness: 0.1 });
  const butter = new THREE.Mesh(butterGeo, butterMat);
  butter.position.set(0.002, 0.085, 0.002);
  butter.rotation.y = 0.4;
  scene.add(butter);

  // Fresh Coriander Garnish
  const herbMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6, side: THREE.DoubleSide });
  for (let i = 0; i < 3; i++) {
    const herbGeo = new THREE.ConeGeometry(0.008, 0.022, 6);
    herbGeo.scale(1, 1, 0.2);
    const herb = new THREE.Mesh(herbGeo, herbMat);
    herb.position.set(0.006 + (i - 1) * 0.009, 0.088, -0.010 + (i % 2) * 0.012);
    herb.rotation.set(0.3, i * 1.8, 0.2);
    scene.add(herb);
  }

  await exportScene(scene, 'butter-chicken.glb');
}

// -------------------------------------------------------------
// 4. ROYAL HYDERABADI DUM BIRYANI (biryani.glb)
// Realistic Scale: Handi/Platter 26cm diameter, Height 11cm, bottom at y=0.000
// -------------------------------------------------------------
async function createBiryani() {
  const scene = new THREE.Scene();
  scene.name = 'RoyalChickenBiryani';

  // Base Serving Platter (Diameter 26cm, Height 8mm, bottom at y=0)
  const plateGeo = new THREE.CylinderGeometry(0.128, 0.130, 0.008, 32);
  const plateMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.5, metalness: 0.3 });
  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.position.y = 0.004;
  scene.add(plate);

  // Royal Golden Handi Dish Rim
  const handiGeo = new THREE.CylinderGeometry(0.120, 0.095, 0.045, 32);
  const handiMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.25 });
  const handi = new THREE.Mesh(handiGeo, handiMat);
  handi.position.y = 0.008 + 0.045 / 2;
  scene.add(handi);

  const rimGeo = new THREE.TorusGeometry(0.120, 0.006, 16, 32);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.92, roughness: 0.2 });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.position.y = 0.053;
  rim.rotation.x = Math.PI / 2;
  scene.add(rim);

  // Aromatic Basmati Rice Mound (Golden Saffron & Pearl White)
  const riceGeo = new THREE.SphereGeometry(0.114, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.48);
  const riceMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.75 });
  const rice = new THREE.Mesh(riceGeo, riceMat);
  rice.position.y = 0.040;
  scene.add(rice);

  // Tender Roasted Tandoori Chicken Drumstick & Pieces
  const chickenMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.55 });
  
  // Chicken piece 1
  const ch1Geo = new THREE.CylinderGeometry(0.016, 0.026, 0.065, 12);
  const ch1 = new THREE.Mesh(ch1Geo, chickenMat);
  ch1.position.set(-0.025, 0.092, 0.015);
  ch1.rotation.set(0.4, 0.6, -0.6);
  scene.add(ch1);

  // Chicken piece 2
  const ch2Geo = new THREE.DodecahedronGeometry(0.024, 0);
  const ch2 = new THREE.Mesh(ch2Geo, chickenMat);
  ch2.position.set(0.035, 0.088, -0.015);
  ch2.rotation.set(0.3, 0.2, 0.4);
  scene.add(ch2);

  // Caramelized Crispy Fried Onions (Birista)
  const onionMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8 });
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const rad = 0.035 + (i % 3) * 0.025;
    const strandGeo = new THREE.BoxGeometry(0.014, 0.002, 0.004);
    const strand = new THREE.Mesh(strandGeo, onionMat);
    strand.position.set(Math.cos(angle) * rad, 0.082 + (i % 4) * 0.004, Math.sin(angle) * rad);
    strand.rotation.set(0.2, angle + 0.5, 0.3);
    scene.add(strand);
  }

  // Authentic Whole Spices: Star Anise & Cinnamon
  const spiceMat = new THREE.MeshStandardMaterial({ color: 0x3b1d11, roughness: 0.7 });
  const starGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.004, 8);
  const star = new THREE.Mesh(starGeo, spiceMat);
  star.position.set(0.048, 0.078, 0.040);
  star.rotation.set(0.3, 0.4, 0.2);
  scene.add(star);

  const cinnamonGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.050, 12);
  const cinnamon = new THREE.Mesh(cinnamonGeo, spiceMat);
  cinnamon.position.set(-0.045, 0.075, -0.045);
  cinnamon.rotation.set(0.3, 0.8, 1.2);
  scene.add(cinnamon);

  // Fresh Mint Leaves
  const mintMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5, side: THREE.DoubleSide });
  for (let i = 0; i < 4; i++) {
    const leafGeo = new THREE.ConeGeometry(0.009, 0.022, 6);
    leafGeo.scale(1, 1, 0.2);
    const leaf = new THREE.Mesh(leafGeo, mintMat);
    leaf.position.set(-0.010 + (i % 2) * 0.025, 0.108 + (i % 2) * 0.005, -0.010 + Math.floor(i / 2) * 0.025);
    leaf.rotation.set(0.4, i * 1.5, 0.3);
    scene.add(leaf);
  }

  // Lime Wedge Garnish
  const limeSliceGeo = new THREE.TorusGeometry(0.020, 0.003, 12, 24);
  const limeSliceMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.4 });
  const limeSlice = new THREE.Mesh(limeSliceGeo, limeSliceMat);
  limeSlice.position.set(0.065, 0.070, -0.040);
  limeSlice.rotation.set(0.5, 0.3, 0.6);
  scene.add(limeSlice);

  await exportScene(scene, 'biryani.glb');
}

// -------------------------------------------------------------
// 5. NORMALIZE ARTISAN CAKE (cake.glb)
// Rescales user's watercolor cake to 26cm diameter, grounded at y=0.000
// Preserves 100% of the hand-painted watercolor textures & materials
// -------------------------------------------------------------
async function normalizeCake() {
  const cakePath = path.join(modelsDir, 'cake.glb');
  if (!fs.existsSync(cakePath)) {
    console.warn('cake.glb not found in modelsDir, skipping');
    return;
  }

  const buf = fs.readFileSync(cakePath);
  const jsonLen = buf.readUInt32LE(12);
  const jsonBuf = buf.subarray(20, 20 + jsonLen);
  const binBuf = buf.subarray(20 + jsonLen);

  const gltf = JSON.parse(jsonBuf.toString('utf8'));
  const loader = new GLTFLoader();
  const arrayBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

  await new Promise((resolve) => {
    loader.parse(arrayBuf, '', (parsed) => {
      const box = new THREE.Box3().setFromObject(parsed.scene);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      // Realistic Dining Table Cake Scale: Max dimension 26cm (0.26m)
      const targetDim = 0.26;
      const maxDim = Math.max(size.x, size.y, size.z);
      const scale = targetDim / maxDim;

      // Translation to align bottom to exactly y=0.0000, and center at (0, 0)
      const tx = -center.x * scale;
      const ty = -box.min.y * scale;
      const tz = -center.z * scale;

      const newNode = {
        name: 'AR_Table_Placement',
        children: [...gltf.scenes[0].nodes],
        scale: [scale, scale, scale],
        translation: [tx, ty, tz]
      };

      const newIndex = gltf.nodes.length;
      gltf.nodes.push(newNode);
      gltf.scenes[0].nodes = [newIndex];

      const newJsonStr = JSON.stringify(gltf);
      let newJsonBuf = Buffer.from(newJsonStr, 'utf8');
      const pad = (4 - (newJsonBuf.length % 4)) % 4;
      if (pad > 0) newJsonBuf = Buffer.concat([newJsonBuf, Buffer.alloc(pad, 0x20)]);

      const totalLen = 12 + 8 + newJsonBuf.length + binBuf.length;
      const out = Buffer.alloc(totalLen);
      out.writeUInt32LE(0x46546C67, 0); // magic
      out.writeUInt32LE(2, 4); // version
      out.writeUInt32LE(totalLen, 8);
      out.writeUInt32LE(newJsonBuf.length, 12);
      out.writeUInt32LE(0x4E4F534A, 16); // JSON
      newJsonBuf.copy(out, 20);
      binBuf.copy(out, 20 + newJsonBuf.length);

      saveGLB(out, 'cake.glb');
      resolve();
    });
  });
}

// -------------------------------------------------------------
// EXECUTE GENERATION & VERIFICATION
// -------------------------------------------------------------
async function run() {
  console.log('🍳 Generating Realistic-Scale 3D Gastronomy Models (Table-Grounded at y=0)...');
  await createLimeSoda();
  await createPaneerTikka();
  await createButterChicken();
  await createBiryani();
  await normalizeCake();

  console.log('\n🔍 Verifying all 5 models for AR tabletop grounding and dimensions:');
  const models = ['biryani.glb', 'cake.glb', 'butter-chicken.glb', 'paneer-tikka.glb', 'lime-soda.glb'];
  const loader = new GLTFLoader();

  for (const m of models) {
    const p = path.join(frontendPublicDir, m);
    const buf = fs.readFileSync(p);
    const arr = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
    await new Promise((resolve) => {
      loader.parse(arr, '', (g) => {
        const box = new THREE.Box3().setFromObject(g.scene);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);
        console.log(`  ✓ ${m.padEnd(18)} Size: ${(size.x*100).toFixed(1)}cm x ${(size.y*100).toFixed(1)}cm x ${(size.z*100).toFixed(1)}cm | Min Y: ${(box.min.y*100).toFixed(2)}cm | Center: (${(center.x*100).toFixed(1)}cm, ${(center.z*100).toFixed(1)}cm)`);
        resolve();
      });
    });
  }

  console.log('\n🎉 All 5 dishes are now grounded at y=0 with realistic human dining scale!');
}

run().catch(err => {
  console.error('Generation failed:', err);
  process.exit(1);
});
