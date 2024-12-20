import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import telegramBot from '../telegram.js';
import { getStreamPath } from '../utils/stream-utils.js';
import { streamMetrics } from './stream-monitor.js';

ffmpeg.setFfmpegPath(ffmpegStatic);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const recordingPath = path.resolve(__dirname, '..', 'recordings');

// Ensure recordings directory exists
if (!fs.existsSync(recordingPath)) {
  fs.mkdirSync(recordingPath, { recursive: true });
}

const recordingProcesses = new Map();
const metricsRecorders = new Map();

export function startRecording(streamKey) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const baseFileName = `${streamKey}_${timestamp}`;
  const videoPath = path.join(recordingPath, `${baseFileName}.ts`);
  const metricsPath = path.join(recordingPath, `${baseFileName}_metrics.json`);

  const inputPath = getStreamPath(streamKey);
  const command = ffmpeg(inputPath)
    .inputOptions(['-re'])
    .outputOptions([
      '-c copy',
      '-f mpegts'
    ])
    .output(videoPath);

  command.on('start', () => {
    console.log(`Started recording stream ${streamKey} to ${videoPath}`);
    telegramBot.sendNotification(`🎥 Started recording stream ${streamKey}`);
  });

  command.on('error', (err) => {
    console.error(`Recording error for stream ${streamKey}:`, err);
    telegramBot.sendNotification(`❌ Recording error for stream ${streamKey}: ${err.message}`);
    recordingProcesses.delete(streamKey);
  });

  command.on('end', () => {
    console.log(`Recording ended for stream ${streamKey}`);
    telegramBot.sendNotification(`⏹️ Recording ended for stream ${streamKey}`);
    recordingProcesses.delete(streamKey);
  });

  command.run();
  recordingProcesses.set(streamKey, command);

  const metricsData = {
    streamKey,
    startTime: timestamp,
    metrics: []
  };

  const metricsRecorder = {
    path: metricsPath,
    data: metricsData,
    interval: setInterval(() => {
      const currentMetrics = streamMetrics.get(streamKey);
      if (currentMetrics) {
        metricsData.metrics.push({
          timestamp: Date.now(),
          ...currentMetrics
        });
        fs.writeFileSync(metricsPath, JSON.stringify(metricsData, null, 2));
      }
    }, 1000)
  };

  metricsRecorders.set(streamKey, metricsRecorder);
}

export function stopRecording(streamKey) {
  const command = recordingProcesses.get(streamKey);
  if (command) {
    command.kill('SIGKILL');
    recordingProcesses.delete(streamKey);
    console.log(`Stopped recording stream ${streamKey}`);
  }

  const metricsRecorder = metricsRecorders.get(streamKey);
  if (metricsRecorder) {
    clearInterval(metricsRecorder.interval);
    fs.writeFileSync(metricsRecorder.path, JSON.stringify(metricsRecorder.data, null, 2));
    metricsRecorders.delete(streamKey);
    console.log(`Saved metrics for stream ${streamKey}`);
  }
}