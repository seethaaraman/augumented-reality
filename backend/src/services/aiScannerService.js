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

  let targetUrlOrPath = glbOutput?.url || glbOutput?.path || (typeof glbOutput === 'string' ? glbOutput : null);

  if (!targetUrlOrPath) {
    throw new Error('No GLB output was produced by the 3D generator');
  }

  // If it's a remote URL from Hugging Face, download it locally with HF_TOKEN authentication
  if (targetUrlOrPath.startsWith('http://') || targetUrlOrPath.startsWith('https://')) {
    console.log(`[AI Scanner] Downloading GLB locally with authentication...`);
    const response = await fetch(targetUrlOrPath, {
      headers: hfToken ? { Authorization: `Bearer ${hfToken}` } : {}
    });

    if (!response.ok) {
      throw new Error(`Failed to download generated GLB from Hugging Face: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const localGlbPath = path.join(path.resolve(__dirname, '../../'), `temp_generated_${Date.now()}.glb`);
    fs.writeFileSync(localGlbPath, Buffer.from(arrayBuffer));
    console.log(`[AI Scanner] Downloaded GLB to local path: ${localGlbPath}`);
    return localGlbPath;
  }

  return targetUrlOrPath;
}
