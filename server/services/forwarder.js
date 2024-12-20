import { spawn } from 'child_process';
import { getStreamPath } from '../utils/stream-utils.js';
import telegramBot from '../telegram.js';
import { StreamProcessManager } from './processManager.js';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const defaultFallbackImage = path.join(__dirname, '../assets/fallback.png');

const processManager = new StreamProcessManager();
const PROBE_RETRIES = 3;
const PROBE_RETRY_DELAY = 1000;

async function isStreamActive(streamPath) {
  for (let i = 0; i < PROBE_RETRIES; i++) {
    try {
      const process = spawn('ffprobe', [
        '-v', 'error',
        '-show_entries', 'stream=codec_type',
        '-of', 'json',
        streamPath
      ]);

      const output = await new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';

        process.stdout.on('data', data => { stdout += data; });
        process.stderr.on('data', data => { stderr += data; });

        process.on('close', code => {
          if (code === 0) {
            resolve(stdout);
          } else {
            reject(new Error(`ffprobe exited with code ${code}: ${stderr}`));
          }
        });
      });

      const data = JSON.parse(output);
      return data.streams && data.streams.length > 0;
    } catch (error) {
      if (i === PROBE_RETRIES - 1) {
        return false;
      }
      await new Promise(resolve => setTimeout(resolve, PROBE_RETRY_DELAY));
    }
  }
  return false;
}

async function switchToFallback(streamKey, destinationUrl, destinationKey, destinationId) {
  console.log(`Switching to fallback stream for ${streamKey} to destination ${destinationId}`);
  
  try {
    // Kill any existing main stream first
    processManager.killMainProcess(streamKey, destinationId);

    const args = [
      '-re',
      '-loop', '1',
      '-i', defaultFallbackImage,
      '-f', 'lavfi',
      '-i', 'anullsrc=r=44100:cl=stereo',
      '-c:v', 'libx264',
      '-preset', 'veryfast',
      '-tune', 'zerolatency',
      '-pix_fmt', 'yuv420p',
      '-r', '30',
      '-g', '60',
      '-b:v', '2500k',
      '-maxrate', '2500k',
      '-bufsize', '5000k',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-ar', '44100',
      '-shortest',
      '-f', 'flv',
      `${destinationUrl}/${destinationKey}`
    ];

    const process = spawn('ffmpeg', args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    process.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Error') || output.includes('Failed')) {
        console.error('Fallback FFmpeg error:', output);
      }
    });

    process.on('error', (error) => {
      console.error('Fallback process error:', error);
      if (processManager.getFallbackProcess(streamKey, destinationId)) {
        setTimeout(() => {
          switchToFallback(streamKey, destinationUrl, destinationKey, destinationId);
        }, 5000);
      }
    });

    process.on('exit', (code, signal) => {
      console.log(`Fallback FFmpeg process exited with code ${code} and signal ${signal}`);
      if (processManager.getFallbackProcess(streamKey, destinationId) && signal !== 'SIGKILL') {
        switchToFallback(streamKey, destinationUrl, destinationKey, destinationId);
      }
    });

    processManager.setFallbackProcess(streamKey, destinationId, process);
    telegramBot.sendNotification(`Switched to fallback stream for destination ${destinationId + 1}`);
  } catch (error) {
    console.error('Error creating fallback stream:', error);
    telegramBot.forwardingError(destinationId, destinationUrl, destinationKey, error.message);
  }
}

async function switchToMain(streamKey, destinationUrl, destinationKey, destinationId) {
  console.log(`Switching to main stream for ${streamKey} to destination ${destinationId}`);
  
  try {
    const inputPath = getStreamPath(streamKey);
    
    // Verify stream is actually active before switching
    const isActive = await isStreamActive(inputPath);
    if (!isActive) {
      throw new Error('Stream is not active');
    }

    // Kill any existing fallback stream first
    processManager.killFallbackProcess(streamKey, destinationId);

    const args = [
      '-re',
      '-i', inputPath,
      '-c', 'copy',
      '-bufsize', '5000k',
      '-f', 'flv',
      `${destinationUrl}/${destinationKey}`
    ];

    const process = spawn('ffmpeg', args, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    process.stderr.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Error') || output.includes('Failed')) {
        console.error('Main FFmpeg error:', output);
      }
    });

    process.on('error', async (error) => {
      console.error('Main process error:', error);
      if (processManager.getMainProcess(streamKey, destinationId)) {
        processManager.killMainProcess(streamKey, destinationId);
        await switchToFallback(streamKey, destinationUrl, destinationKey, destinationId);
      }
    });

    process.on('exit', async (code, signal) => {
      console.log(`Main FFmpeg process exited with code ${code} and signal ${signal}`);
      if (processManager.getMainProcess(streamKey, destinationId) && signal !== 'SIGKILL') {
        await switchToFallback(streamKey, destinationUrl, destinationKey, destinationId);
      }
    });

    processManager.setMainProcess(streamKey, destinationId, process);
    telegramBot.sendNotification(`Switched to main stream for destination ${destinationId + 1}`);
  } catch (error) {
    console.error('Error creating main stream:', error);
    telegramBot.forwardingError(destinationId, destinationUrl, destinationKey, error.message);
    await switchToFallback(streamKey, destinationUrl, destinationKey, destinationId);
  }
}

export async function startForwarding(streamKey, destinationUrl, destinationKey, destinationId) {
  // Stop any existing processes first
  await stopForwarding(streamKey, destinationId);

  const inputPath = getStreamPath(streamKey);
  const isActive = await isStreamActive(inputPath);

  try {
    if (isActive) {
      await switchToMain(streamKey, destinationUrl, destinationKey, destinationId);
    } else {
      await switchToFallback(streamKey, destinationUrl, destinationKey, destinationId);
    }

    // Start monitoring for stream status
    const monitorInterval = setInterval(async () => {
      try {
        const currentStatus = await isStreamActive(inputPath);
        const mainProcess = processManager.getMainProcess(streamKey, destinationId);

        if (!currentStatus && mainProcess) {
          // Only switch to fallback if main stream becomes inactive
          await switchToFallback(streamKey, destinationUrl, destinationKey, destinationId);
        }
      } catch (error) {
        console.error('Error in monitor interval:', error);
      }
    }, 5000);

    processManager.setMonitorInterval(streamKey, destinationId, monitorInterval);
    telegramBot.forwardingStarted(destinationId, destinationUrl, destinationKey);
  } catch (error) {
    console.error('Failed to start forwarding:', error);
    telegramBot.forwardingError(destinationId, destinationUrl, destinationKey, error.message);
  }
}

export async function reloadStream(streamKey, destinationUrl, destinationKey, destinationId) {
  console.log(`Attempting to reload stream ${streamKey} for destination ${destinationId}`);
  
  try {
    const inputPath = getStreamPath(streamKey);
    const isActive = await isStreamActive(inputPath);
    
    if (isActive) {
      // Kill both processes to ensure clean state
      processManager.killMainProcess(streamKey, destinationId);
      processManager.killFallbackProcess(streamKey, destinationId);
      
      // Start main stream
      await switchToMain(streamKey, destinationUrl, destinationKey, destinationId);
      console.log('Successfully reloaded main stream');
    } else {
      console.log('Stream not active, staying on fallback');
      await switchToFallback(streamKey, destinationUrl, destinationKey, destinationId);
    }
  } catch (error) {
    console.error('Failed to reload stream:', error);
    await switchToFallback(streamKey, destinationUrl, destinationKey, destinationId);
  }
}

export async function stopForwarding(streamKey, destinationId) {
  try {
    // Stop all processes and clear intervals
    processManager.stopAllProcesses(streamKey, destinationId);
    telegramBot.forwardingStopped(destinationId);
    console.log(`Stopped all forwarding processes for stream ${streamKey} to destination ${destinationId}`);
  } catch (error) {
    console.error('Error stopping forwarding:', error);
  }
}

export async function stopAllForwarding(streamKey) {
  try {
    processManager.stopAllStreamProcesses(streamKey);
    console.log(`Stopped all forwarding processes for stream ${streamKey}`);
  } catch (error) {
    console.error('Error stopping all forwarding:', error);
  }
}