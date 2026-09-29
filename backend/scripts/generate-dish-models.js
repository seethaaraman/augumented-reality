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

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as THREE from '../../frontend/node_modules/three/build/three.module.js';
import { GLTFExporter } from '../../frontend/node_modules/three/examples/jsm/exporters/GLTFExporter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const modelsDir = path.resolve(__dirname, '../models');
const frontendPublicDir = path.resolve(__dirname, '../../frontend/public/models');
const mobilePublicDir = path.resolve(__dirname, '../../mobile/public');

function saveGLB(buffer, filename) {
  const targets = [
    path.join(modelsDir, filename),
    path.join(frontendPublicDir, filename),
    path.join(mobilePublicDir, filename)
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
// 1. FRESH LIME SODA MODEL (lime-soda.glb)
// -------------------------------------------------------------
async function createLimeSoda() {
  const scene = new THREE.Scene();
  scene.name = 'FreshLimeSoda';

  // Base Coaster
  const coasterGeo = new THREE.CylinderGeometry(0.38, 0.40, 0.04, 32);
  const coasterMat = new THREE.MeshStandardMaterial({ color: 0x262626, roughness: 0.6, metalness: 0.2 });
  const coaster = new THREE.Mesh(coasterGeo, coasterMat);
  coaster.position.y = 0.02;
  scene.add(coaster);

  // Outer Glass Tumbler
  const glassGeo = new THREE.CylinderGeometry(0.28, 0.22, 0.90, 32, 1, true);
  const glassMat = new THREE.MeshStandardMaterial({
    color: 0xecfeff,
    transparent: true,
    opacity: 0.38,
    roughness: 0.08,
    metalness: 0.15,
    side: THREE.DoubleSide
  });
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.position.y = 0.49;
  scene.add(glass);

  // Glass Base bottom
  const glassBaseGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.08, 32);
  const glassBaseMat = new THREE.MeshStandardMaterial({
    color: 0xcffafe,
    transparent: true,
    opacity: 0.5,
    roughness: 0.08
  });
  const glassBase = new THREE.Mesh(glassBaseGeo, glassBaseMat);
  glassBase.position.y = 0.08;
  scene.add(glassBase);

  // Sparkling Lime Soda Liquid
  const liquidGeo = new THREE.CylinderGeometry(0.265, 0.215, 0.72, 32);
  const liquidMat = new THREE.MeshStandardMaterial({
    color: 0xbbf7d0,
    transparent: true,
    opacity: 0.78,
    roughness: 0.12,
    metalness: 0.05
  });
  const liquid = new THREE.Mesh(liquidGeo, liquidMat);
  liquid.position.y = 0.45;
  scene.add(liquid);

  // Liquid Surface Meniscus
  const surfaceGeo = new THREE.CylinderGeometry(0.266, 0.266, 0.01, 32);
  const surfaceMat = new THREE.MeshStandardMaterial({
    color: 0xdcfce7,
    transparent: true,
    opacity: 0.85,
    roughness: 0.05
  });
  const surface = new THREE.Mesh(surfaceGeo, surfaceMat);
  surface.position.y = 0.81;
  scene.add(surface);

  // Ice Cubes inside the drink
  const iceMat = new THREE.MeshStandardMaterial({
    color: 0xf0fdf4,
    transparent: true,
    opacity: 0.65,
    roughness: 0.15
  });

  const icePositions = [
    { x: -0.06, y: 0.35, z: 0.05, rx: 0.2, ry: 0.5, size: 0.12 },
    { x: 0.07, y: 0.48, z: -0.04, rx: -0.3, ry: 0.8, size: 0.13 },
    { x: -0.04, y: 0.62, z: -0.06, rx: 0.4, ry: 0.2, size: 0.14 },
    { x: 0.05, y: 0.72, z: 0.04, rx: 0.1, ry: -0.4, size: 0.13 }
  ];

  icePositions.forEach(cfg => {
    const iceGeo = new THREE.BoxGeometry(cfg.size, cfg.size, cfg.size);
    const iceMesh = new THREE.Mesh(iceGeo, iceMat);
    iceMesh.position.set(cfg.x, cfg.y, cfg.z);
    iceMesh.rotation.set(cfg.rx, cfg.ry, 0.3);
    scene.add(iceMesh);
  });

  // Lime Slice on Rim
  const sliceGroup = new THREE.Group();
  const rindGeo = new THREE.TorusGeometry(0.14, 0.015, 16, 32);
  const rindMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.5 });
  const rind = new THREE.Mesh(rindGeo, rindMat);
  sliceGroup.add(rind);

  const pulpGeo = new THREE.CircleGeometry(0.135, 32);
  const pulpMat = new THREE.MeshStandardMaterial({ color: 0xd9f99d, roughness: 0.4, side: THREE.DoubleSide });
  const pulp = new THREE.Mesh(pulpGeo, pulpMat);
  sliceGroup.add(pulp);

  sliceGroup.position.set(0.24, 0.92, 0.05);
  sliceGroup.rotation.set(0.4, 0.3, 0.8);
  scene.add(sliceGroup);

  // Floating Submerged Lime Wedge
  const submergedSlice = sliceGroup.clone();
  submergedSlice.scale.set(0.8, 0.8, 0.8);
  submergedSlice.position.set(-0.08, 0.55, 0.08);
  submergedSlice.rotation.set(1.2, 0.4, 0.1);
  scene.add(submergedSlice);

  // Mint Leaves on Top
  const mintMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6, side: THREE.DoubleSide });
  for (let i = 0; i < 3; i++) {
    const leafGeo = new THREE.ConeGeometry(0.06, 0.15, 8);
    leafGeo.scale(1, 1, 0.2);
    const leaf = new THREE.Mesh(leafGeo, mintMat);
    leaf.position.set(0.02 + i * 0.04, 0.84, -0.06 + i * 0.03);
    leaf.rotation.set(0.5, i * 1.8, 0.4);
    scene.add(leaf);
  }

  // Artisan Drinking Straw
  const strawGeo = new THREE.CylinderGeometry(0.018, 0.018, 1.15, 16);
  const strawMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.3 });
  const straw = new THREE.Mesh(strawGeo, strawMat);
  straw.position.set(-0.06, 0.65, -0.02);
  straw.rotation.set(0.25, 0.1, -0.22);
  scene.add(straw);

  // Straw Gold Ring Accent
  const strawRingGeo = new THREE.CylinderGeometry(0.019, 0.019, 0.08, 16);
  const strawRingMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.8 });
  const strawRing = new THREE.Mesh(strawRingGeo, strawRingMat);
  strawRing.position.set(-0.16, 1.08, 0.07);
  strawRing.rotation.set(0.25, 0.1, -0.22);
  scene.add(strawRing);

  await exportScene(scene, 'lime-soda.glb');
}

// -------------------------------------------------------------
// 2. SMOKY CLAY OVEN PANEER TIKKA (paneer-tikka.glb)
// -------------------------------------------------------------
async function createPaneerTikka() {
  const scene = new THREE.Scene();
  scene.name = 'PaneerTikka';

  // Artisan Slate Ceramic Serving Platter
  const plateGeo = new THREE.BoxGeometry(1.20, 0.04, 0.65);
  const plateMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, metalness: 0.15 });
  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.position.y = 0.02;
  scene.add(plate);

  // Plate Rim Trim
  const rimGeo = new THREE.BoxGeometry(1.24, 0.025, 0.69);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
  const rim = new THREE.Mesh(rimGeo, rimMat);
  rim.position.y = 0.035;
  scene.add(rim);

  // Stainless Steel Skewer passing through
  const skewerGeo = new THREE.CylinderGeometry(0.012, 0.012, 1.10, 16);
  const skewerMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.2, metalness: 0.9 });
  const skewer = new THREE.Mesh(skewerGeo, skewerMat);
  skewer.position.set(0, 0.15, 0);
  skewer.rotation.z = Math.PI / 2;
  scene.add(skewer);

  // Materials
  const paneerMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.65 });
  const charMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
  const redPepperMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.45 });
  const greenPepperMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.45 });
  const onionMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.5 });

  // 4 Chargrilled Paneer Cubes with Char Marks
  const paneerPositions = [-0.34, -0.11, 0.12, 0.35];

  paneerPositions.forEach((posX, idx) => {
    // Paneer Block
    const cubeGeo = new THREE.BoxGeometry(0.15, 0.15, 0.15);
    const cube = new THREE.Mesh(cubeGeo, paneerMat);
    cube.position.set(posX, 0.15, 0);
    cube.rotation.y = (idx % 2 === 0 ? 0.15 : -0.12);
    cube.rotation.x = 0.05;
    scene.add(cube);

    // Char mark stripes on top of each cube
    for (let c = -0.04; c <= 0.04; c += 0.04) {
      const charGeo = new THREE.BoxGeometry(0.02, 0.005, 0.13);
      const charMesh = new THREE.Mesh(charGeo, charMat);
      charMesh.position.set(posX + c, 0.228, 0);
      charMesh.rotation.y = cube.rotation.y;
      scene.add(charMesh);
    }
  });

  // Interspersed Bell Peppers & Onion Petals
  const vegPositions = [
    { x: -0.44, mat: redPepperMat, rotY: 0.2 },
    { x: -0.225, mat: greenPepperMat, rotY: -0.3 },
    { x: 0.005, mat: onionMat, rotY: 0.4 },
    { x: 0.235, mat: redPepperMat, rotY: -0.2 },
    { x: 0.455, mat: greenPepperMat, rotY: 0.1 }
  ];

  vegPositions.forEach(v => {
    const vegGeo = new THREE.BoxGeometry(0.04, 0.14, 0.14);
    const vegMesh = new THREE.Mesh(vegGeo, v.mat);
    vegMesh.position.set(v.x, 0.15, 0);
    vegMesh.rotation.y = v.rotY;
    scene.add(vegMesh);
  });

  // Fresh Lemon Wedge on side
  const lemonGroup = new THREE.Group();
  const lemonPeelGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.03, 16, 1, false, 0, Math.PI);
  const lemonPeelMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4 });
  const lemonPeel = new THREE.Mesh(lemonPeelGeo, lemonPeelMat);
  lemonGroup.add(lemonPeel);
  lemonGroup.position.set(-0.46, 0.05, 0.20);
  lemonGroup.rotation.set(0, 0.6, 0.3);
  scene.add(lemonGroup);

  // Mint Chutney terracotta bowl
  const bowlGeo = new THREE.CylinderGeometry(0.12, 0.08, 0.07, 24);
  const bowlMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, roughness: 0.7 });
  const bowl = new THREE.Mesh(bowlGeo, bowlMat);
  bowl.position.set(0.42, 0.075, 0.18);
  scene.add(bowl);

  const chutneyGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.01, 24);
  const chutneyMat = new THREE.MeshStandardMaterial({ color: 0x4ade80, roughness: 0.5 });
  const chutney = new THREE.Mesh(chutneyGeo, chutneyMat);
  chutney.position.set(0.42, 0.105, 0.18);
  scene.add(chutney);

  // Mint garnish leaves
  const herbMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6, side: THREE.DoubleSide });
  for (let i = 0; i < 4; i++) {
    const herbGeo = new THREE.ConeGeometry(0.03, 0.08, 6);
    herbGeo.scale(1, 1, 0.2);
    const herb = new THREE.Mesh(herbGeo, herbMat);
    herb.position.set(-0.15 + i * 0.12, 0.24, 0.02 + (i % 2) * 0.04);
    herb.rotation.set(0.4, i * 1.5, 0.2);
    scene.add(herb);
  }

  await exportScene(scene, 'paneer-tikka.glb');
}

// -------------------------------------------------------------
// 3. ROYAL BUTTER CHICKEN HANDI (butter-chicken.glb)
// -------------------------------------------------------------
async function createButterChicken() {
  const scene = new THREE.Scene();
  scene.name = 'RoyalButterChicken';

  // Ornate Handi Trivet / Base Plate
  const trivetGeo = new THREE.CylinderGeometry(0.42, 0.44, 0.03, 32);
  const trivetMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.6, metalness: 0.4 });
  const trivet = new THREE.Mesh(trivetGeo, trivetMat);
  trivet.position.y = 0.015;
  scene.add(trivet);

  // Hammered Brass / Copper Handi Pot Body
  const potGeo = new THREE.SphereGeometry(0.36, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.68);
  const potMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    metalness: 0.85,
    roughness: 0.25,
    side: THREE.DoubleSide
  });
  const pot = new THREE.Mesh(potGeo, potMat);
  pot.position.y = 0.32;
  pot.rotation.x = Math.PI;
  scene.add(pot);

  // Handi Flared Lip / Rim
  const lipGeo = new THREE.TorusGeometry(0.32, 0.028, 16, 32);
  const lipMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
  const lip = new THREE.Mesh(lipGeo, lipMat);
  lip.position.y = 0.32;
  lip.rotation.x = Math.PI / 2;
  scene.add(lip);

  // Twin Side Ring Handles
  const handleGeo = new THREE.TorusGeometry(0.08, 0.016, 16, 24);
  const handleMat = new THREE.MeshStandardMaterial({ color: 0xb45309, metalness: 0.9, roughness: 0.25 });

  const handleL = new THREE.Mesh(handleGeo, handleMat);
  handleL.position.set(-0.35, 0.25, 0);
  handleL.rotation.y = Math.PI / 2;
  scene.add(handleL);

  const handleR = new THREE.Mesh(handleGeo, handleMat);
  handleR.position.set(0.35, 0.25, 0);
  handleR.rotation.y = Math.PI / 2;
  scene.add(handleR);

  // Rich Creamy Orange-Red Butter Chicken Gravy
  const gravyGeo = new THREE.CylinderGeometry(0.30, 0.30, 0.02, 32);
  const gravyMat = new THREE.MeshStandardMaterial({
    color: 0xea580c,
    roughness: 0.25,
    metalness: 0.08
  });
  const gravy = new THREE.Mesh(gravyGeo, gravyMat);
  gravy.position.y = 0.29;
  scene.add(gravy);

  // Tandoori Chicken Chunks floating in Gravy
  const chickenMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.7 });
  const chickenPieces = [
    { x: -0.12, z: -0.06, scale: 0.09, rot: 0.4 },
    { x: 0.10, z: -0.10, scale: 0.08, rot: 1.1 },
    { x: -0.05, z: 0.12, scale: 0.085, rot: 2.2 },
    { x: 0.12, z: 0.08, scale: 0.075, rot: 0.8 }
  ];

  chickenPieces.forEach(p => {
    const chunkGeo = new THREE.DodecahedronGeometry(p.scale);
    const chunk = new THREE.Mesh(chunkGeo, chickenMat);
    chunk.position.set(p.x, 0.305, p.z);
    chunk.rotation.set(p.rot, p.rot * 0.7, 0);
    scene.add(chunk);
  });

  // Swirls of Fresh Cream on Gravy
  const creamMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
  for (let a = 0; a < Math.PI * 2; a += 0.4) {
    const r = 0.16 + Math.sin(a * 2) * 0.06;
    const creamDropGeo = new THREE.SphereGeometry(0.016, 8, 8);
    creamDropGeo.scale(1.4, 0.4, 1);
    const creamDrop = new THREE.Mesh(creamDropGeo, creamMat);
    creamDrop.position.set(Math.cos(a) * r, 0.304, Math.sin(a) * r);
    creamDrop.rotation.y = a;
    scene.add(creamDrop);
  }

  // Golden Melting Butter Pat in Center
  const butterGeo = new THREE.BoxGeometry(0.08, 0.025, 0.08);
  const butterMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.15, metalness: 0.1 });
  const butter = new THREE.Mesh(butterGeo, butterMat);
  butter.position.set(0.01, 0.312, 0.01);
  butter.rotation.y = 0.4;
  scene.add(butter);

  // Fresh Coriander Herb Garnish
  const herbMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6, side: THREE.DoubleSide });
  for (let i = 0; i < 3; i++) {
    const herbGeo = new THREE.ConeGeometry(0.035, 0.10, 6);
    herbGeo.scale(1, 1, 0.2);
    const herb = new THREE.Mesh(herbGeo, herbMat);
    herb.position.set(0.02 + (i - 1) * 0.04, 0.325, -0.04 + (i % 2) * 0.05);
    herb.rotation.set(0.3, i * 1.8, 0.2);
    scene.add(herb);
  }

  await exportScene(scene, 'butter-chicken.glb');
}

// -------------------------------------------------------------
// EXECUTE GENERATION
// -------------------------------------------------------------
async function run() {
  console.log('🍳 Generating 3D Food Models for AR Restaurant Menu...');
  await createLimeSoda();
  await createPaneerTikka();
  await createButterChicken();
  console.log('🎉 All 3D Models generated and deployed successfully!');
}

run().catch(err => {
  console.error('Generation failed:', err);
  process.exit(1);
});
