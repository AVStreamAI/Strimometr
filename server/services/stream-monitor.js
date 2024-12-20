import { WebSocketServer } from 'ws';
import ffmpeg from 'fluent-ffmpeg';
import ffprobeStatic from 'ffprobe-static';
import telegramBot from '../telegram.js';
import { getStreamPath } from '../utils/stream-utils.js';

ffmpeg.setFfprobePath(ffprobeStatic.path);

const wss = new WebSocketServer({ port: 8080 });
const activeStreams = new Map();
const streamMetrics = new Map();
const forcedMetrics = new Map();

async function probeStream(streamPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(streamPath, { probeSize: 5000000 }, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(metadata);
    });
  });
}

function calculateBitrates(metadata, streamKey) {
  let videoBitrate = 0;
  let audioBitrate = 0;
  let videoCodec = '';
  let audioCodec = '';
  let resolution = '';
  let frameRate = 0;

  const forced = forcedMetrics.get(streamKey);

  if (forced) {
    videoBitrate = forced.videoBitrate || 0;
    audioBitrate = forced.audioBitrate || 0;
    frameRate = forced.fps || 0;
  }

  if (metadata && metadata.streams) {
    for (const stream of metadata.streams) {
      if (stream.codec_type === 'video') {
        if (!forced?.videoBitrate) {
          videoBitrate = parseInt(stream.bit_rate) || parseInt(stream.tags?.BPS) || 0;
        }
        videoCodec = stream.codec_name || '';
        resolution = `${stream.width}x${stream.height}`;
        if (!forced?.fps) {
          frameRate = eval(stream.r_frame_rate) || 0;
        }
      } else if (stream.codec_type === 'audio') {
        if (!forced?.audioBitrate) {
          audioBitrate = parseInt(stream.bit_rate) || parseInt(stream.tags?.BPS) || 0;
        }
        audioCodec = stream.codec_name || '';
      }
    }

    if (videoBitrate === 0 && !forced?.videoBitrate && metadata.format && metadata.format.bit_rate) {
      const totalBitrate = parseInt(metadata.format.bit_rate);
      const estimatedAudioBitrate = audioBitrate || 128000;
      videoBitrate = totalBitrate - estimatedAudioBitrate;
    }
  }

  return {
    videoBitrate: Math.max(0, videoBitrate),
    audioBitrate: Math.max(0, audioBitrate),
    videoCodec,
    audioCodec,
    resolution,
    frameRate: Math.max(0, frameRate)
  };
}

async function monitorStream(streamKey) {
  if (!activeStreams.has(streamKey)) return;

  try {
    const streamPath = getStreamPath(streamKey);
    const metadata = await probeStream(streamPath);
    const metrics = calculateBitrates(metadata, streamKey);
    const timestamp = Date.now();

    const streamData = streamMetrics.get(streamKey) || {
      videoBitrate: [],
      audioBitrate: [],
      frameRate: [],
      resolution: metrics.resolution,
      videoCodec: metrics.videoCodec,
      audioCodec: metrics.audioCodec,
      duration: 0,
      timestamp: [],
      isActive: true,
      fullHistory: []
    };

    streamData.videoBitrate.push(metrics.videoBitrate);
    streamData.audioBitrate.push(metrics.audioBitrate);
    streamData.frameRate.push(metrics.frameRate);
    streamData.timestamp.push(timestamp);
    streamData.duration += 1;

    streamData.fullHistory.push({
      timestamp,
      videoBitrate: metrics.videoBitrate,
      audioBitrate: metrics.audioBitrate,
      frameRate: metrics.frameRate,
      resolution: metrics.resolution,
      videoCodec: metrics.videoCodec,
      audioCodec: metrics.audioCodec,
      duration: streamData.duration
    });

    streamMetrics.set(streamKey, streamData);

    const payload = JSON.stringify({
      ...streamData,
      streamKey
    });

    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(payload);
      }
    });

    setTimeout(() => monitorStream(streamKey), 1000);
  } catch (error) {
    console.error('FFprobe error:', error);
    setTimeout(() => monitorStream(streamKey), 1000);
  }
}

export function startStreamMonitoring(streamKey, options = {}) {
  if (options.forceBitrate || options.forceAudioBitrate || options.forceFps) {
    forcedMetrics.set(streamKey, {
      videoBitrate: options.forceBitrate,
      audioBitrate: options.forceAudioBitrate,
      fps: options.forceFps
    });
  }
  
  if (!activeStreams.has(streamKey)) {
    activeStreams.set(streamKey, true);
    monitorStream(streamKey);
  }
}

export function stopStreamMonitoring(streamKey) {
  const finalMetrics = streamMetrics.get(streamKey);
  if (finalMetrics) {
    telegramBot.streamEnded(streamKey, finalMetrics.duration, {
      resolution: finalMetrics.resolution,
      videoCodec: finalMetrics.videoCodec,
      audioCodec: finalMetrics.audioCodec,
      videoBitrate: finalMetrics.videoBitrate[finalMetrics.videoBitrate.length - 1],
      audioBitrate: finalMetrics.audioBitrate[finalMetrics.audioBitrate.length - 1],
      totalBitrate: (finalMetrics.videoBitrate[finalMetrics.videoBitrate.length - 1] || 0) +
                   (finalMetrics.audioBitrate[finalMetrics.audioBitrate.length - 1] || 0)
    });
  }

  activeStreams.delete(streamKey);
  streamMetrics.delete(streamKey);
  forcedMetrics.delete(streamKey);

  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({
        streamKey,
        isActive: false
      }));
    }
  });
}

export { streamMetrics };