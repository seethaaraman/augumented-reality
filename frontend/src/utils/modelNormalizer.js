/**
 * 3D Model Normalizer for Augmented Reality Dining
 * 
 * Analyzes the bounding box of any .glb model and rescales it so that it fits
 * real-world dining table proportions (24cm - 28cm diameter).
 * 
 * Works purely in memory with zero external dependencies. Preserves binary geometry buffers.
 */

const TARGET_DINING_SIZE_METERS = 0.25; // 25 cm (standard dining plate / bowl size)

/**
 * Normalizes a GLB file ArrayBuffer to standard dining table scale.
 * @param {ArrayBuffer} glbBuffer - Raw GLB ArrayBuffer
 * @param {number} targetSize - Target size in meters (default 0.25m = 25cm)
 * @returns {ArrayBuffer} Normalized GLB ArrayBuffer
 */
export function normalizeGlbScale(glbBuffer, targetSize = TARGET_DINING_SIZE_METERS) {
  try {
    const view = new DataView(glbBuffer);
    const magic = view.getUint32(0, true);
    if (magic !== 0x46546C67) {
      // Not a valid GLB container, return unmodified
      return glbBuffer;
    }

    const version = view.getUint32(4, true);
    const totalLength = view.getUint32(8, true);
    const jsonLen = view.getUint32(12, true);
    const jsonChunkType = view.getUint32(16, true);

    if (jsonChunkType !== 0x4E4F534A) {
      return glbBuffer;
    }

    const jsonBytes = new Uint8Array(glbBuffer, 20, jsonLen);
    const jsonStr = new TextDecoder('utf-8').decode(jsonBytes);
    const gltf = JSON.parse(jsonStr);

    // Compute bounding box from position accessors
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    let foundPositions = false;

    if (Array.isArray(gltf.accessors)) {
      gltf.accessors.forEach((acc) => {
        if (acc.type === 'VEC3' && Array.isArray(acc.min) && Array.isArray(acc.max)) {
          minX = Math.min(minX, acc.min[0]);
          minY = Math.min(minY, acc.min[1]);
          minZ = Math.min(minZ, acc.min[2]);
          maxX = Math.max(maxX, acc.max[0]);
          maxY = Math.max(maxY, acc.max[1]);
          maxZ = Math.max(maxZ, acc.max[2]);
          foundPositions = true;
        }
      });
    }

    if (!foundPositions) {
      return glbBuffer;
    }

    const sizeX = maxX - minX;
    const sizeY = maxY - minY;
    const sizeZ = maxZ - minZ;
    const maxDimension = Math.max(sizeX, sizeY, sizeZ);

    console.log(`[ModelNormalizer] Model bounding box: ${sizeX.toFixed(2)}m x ${sizeY.toFixed(2)}m x ${sizeZ.toFixed(2)}m (Max: ${maxDimension.toFixed(2)}m)`);

    // If already reasonably sized for a table (between 12cm and 35cm), no need to alter
    if (maxDimension >= 0.12 && maxDimension <= 0.38) {
      console.log('[ModelNormalizer] Model is already within realistic dining proportions. Preserving original scale.');
      return glbBuffer;
    }

    const scaleFactor = Number((targetSize / maxDimension).toFixed(6));
    console.log(`[ModelNormalizer] Normalizing model with scale factor: ${scaleFactor} (Target: ${targetSize}m)`);

    // Inject scale wrapper root node
    const sceneIndex = gltf.scene !== undefined ? gltf.scene : 0;
    if (!gltf.scenes) gltf.scenes = [{ nodes: [] }];
    if (!gltf.scenes[sceneIndex]) gltf.scenes[sceneIndex] = { nodes: [] };

    const currentRoots = gltf.scenes[sceneIndex].nodes && gltf.scenes[sceneIndex].nodes.length > 0
      ? gltf.scenes[sceneIndex].nodes
      : [0];

    if (!gltf.nodes) gltf.nodes = [];
    const newRootNodeIndex = gltf.nodes.length;
    gltf.nodes.push({
      name: 'AR_Dining_Scale_Root',
      children: currentRoots,
      scale: [scaleFactor, scaleFactor, scaleFactor]
    });

    gltf.scenes[sceneIndex].nodes = [newRootNodeIndex];

    // Re-serialize JSON and pad to 4-byte alignment
    let newJsonStr = JSON.stringify(gltf);
    while (newJsonStr.length % 4 !== 0) {
      newJsonStr += ' ';
    }
    const newJsonBytes = new TextEncoder().encode(newJsonStr);

    // Read BIN chunk
    const binChunkOffset = 20 + jsonLen;
    const binChunkLen = view.getUint32(binChunkOffset, true);
    const binChunkType = view.getUint32(binChunkOffset + 4, true);
    const binChunkBytes = new Uint8Array(glbBuffer, binChunkOffset + 8, binChunkLen);

    // Assemble normalized GLB container
    const newTotalLen = 12 + 8 + newJsonBytes.length + 8 + binChunkBytes.length;
    const newGlb = new ArrayBuffer(newTotalLen);
    const newView = new DataView(newGlb);
    const newBytes = new Uint8Array(newGlb);

    // Header
    newView.setUint32(0, 0x46546C67, true); // glTF
    newView.setUint32(4, 2, true);          // version 2
    newView.setUint32(8, newTotalLen, true);

    // Chunk 0 (JSON)
    newView.setUint32(12, newJsonBytes.length, true);
    newView.setUint32(16, 0x4E4F534A, true); // JSON
    newBytes.set(newJsonBytes, 20);

    // Chunk 1 (BIN)
    const newBinOffset = 20 + newJsonBytes.length;
    newView.setUint32(newBinOffset, binChunkBytes.length, true);
    newView.setUint32(newBinOffset + 4, binChunkType, true);
    newBytes.set(binChunkBytes, newBinOffset + 8);

    console.log(`[ModelNormalizer] Successfully normalized GLB: ${newTotalLen} bytes`);
    return newGlb;
  } catch (err) {
    console.warn('[ModelNormalizer] Normalization skipped due to error:', err);
    return glbBuffer;
  }
}
