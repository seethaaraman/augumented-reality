import { Client, handle_file } from '@gradio/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Reconstructs a 3D .glb model from a single 2D food photo using HuggingFace Spaces.
 * @param {string} imagePath - Local filesystem path to the uploaded image.
 * @returns {Promise<string>} Path to the resulting local .glb file.
 */
export async function generate3DFromImage(imagePath) {
  const hfToken = process.env.HF_TOKEN;

  console.log(`[AI Scanner] Connecting to InstantMesh space on Hugging Face...`);
  const client = await Client.connect('TencentARC/InstantMesh', {
    token: hfToken
  });

  console.log(`[AI Scanner] Uploading and preprocessing image: ${imagePath}`);
  const imageFile = handle_file(imagePath);

  // Step 1: Preprocess image & remove background
  const preprocessResult = await client.predict('/preprocess', {
    input_image: imageFile,
    do_remove_background: true
  });
  console.log('[AI Scanner] Preprocessing complete.');

  // Step 2: Generate multi-view diffusion
  console.log('[AI Scanner] Generating multi-view perspectives...');
  const mvsResult = await client.predict('/generate_mvs', {
    input_image: preprocessResult.data[0],
    sample_steps: 35,
    sample_seed: 42
  });
  console.log('[AI Scanner] Multi-views generated.');

  // Step 3: Reconstruct 3D Mesh (OBJ + GLB)
  console.log('[AI Scanner] Synthesizing 3D GLB mesh...');
  const make3dResult = await client.predict('/make3d', {});

  // The second return item is the GLB file
  const glbOutput = make3dResult.data[1];
  console.log('[AI Scanner] GLB generated successfully:', glbOutput);

  // Return the path or url of the generated GLB
  if (glbOutput && glbOutput.url) {
    return glbOutput.url;
  }
  if (glbOutput && glbOutput.path) {
    return glbOutput.path;
  }
  if (typeof glbOutput === 'string') {
    return glbOutput;
  }

  throw new Error('No GLB output was produced by the 3D generator');
}
