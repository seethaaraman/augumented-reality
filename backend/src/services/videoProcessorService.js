import { execFile } from 'child_process';
import ffmpegPath from 'ffmpeg-static';
import path from 'path';
import os from 'os';
import fs from 'fs';

/**
 * Extracts a high-quality keyframe from an uploaded video file.
 * @param {string} videoPath - Local filesystem path to the uploaded video.
 * @returns {Promise<string>} Path to the extracted keyframe image (PNG).
 */
export async function extractFrameFromVideo(videoPath) {
  return new Promise((resolve, reject) => {
    const outputFilename = `frame_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.png`;
    const outputPath = path.join(os.tmpdir(), outputFilename);

    console.log(`[VideoProcessor] Extracting keyframe using ffmpeg: ${videoPath} -> ${outputPath}`);

    // Extract frame at 1.5 seconds (or beginning if video is shorter)
    const args = [
      '-ss', '00:00:01.500',
      '-i', videoPath,
      '-vframes', '1',
      '-q:v', '2',
      outputPath
    ];

    execFile(ffmpegPath, args, (error, stdout, stderr) => {
      if (error) {
        // Fallback: If 1.5s failed (e.g. video < 1.5s), try 0.1s
        console.warn('[VideoProcessor] Extraction at 1.5s failed, falling back to 0.1s:', error.message);
        const fallbackArgs = [
          '-ss', '00:00:00.100',
          '-i', videoPath,
          '-vframes', '1',
          '-q:v', '2',
          outputPath
        ];

        execFile(ffmpegPath, fallbackArgs, (fbError) => {
          if (fbError || !fs.existsSync(outputPath)) {
            console.error('[VideoProcessor] Fallback extraction failed:', fbError || 'File not found');
            return reject(new Error('Could not extract frame from video. Please ensure the video is not corrupted.'));
          }
          console.log('[VideoProcessor] Fallback keyframe extracted successfully:', outputPath);
          resolve(outputPath);
        });
        return;
      }

      if (!fs.existsSync(outputPath)) {
        return reject(new Error('Extracted frame file was not created.'));
      }

      console.log('[VideoProcessor] Keyframe extracted successfully:', outputPath);
      resolve(outputPath);
    });
  });
}
