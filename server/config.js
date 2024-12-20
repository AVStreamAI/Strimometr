import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const mediaRoot = path.resolve(__dirname, 'media');
const recordingsDir = path.resolve(__dirname, 'recordings');
const cpuCount = os.cpus().length;

export const config = {
  rtmp: {
    port: 1935,
    chunk_size: 60000,
    gop_cache: true,
    ping: 30,
    ping_timeout: 60
  },
  http: {
    port: 8000,
    mediaroot: mediaRoot,
    allow_origin: '*',
    host: '0.0.0.0'  // Listen on all network interfaces
  },
  auth: {
    play: false,
    publish: false,
    secret: 'nodemedia2017privatekey'
  },
  trans: {
    ffmpeg: ffmpegStatic,
    tasks: [
      {
        app: 'live',
        mp4: false,
        flv: true,
        ts: true,
        tsFlags: '[mpegts]',
        flvFlags: '[flvflags=no_duration_filesize]',
        hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
        dash: false,
        dashFlags: '[f=dash:window_size=3:extra_window_size=5]',
        outPath: recordingsDir,
        threads: Math.max(2, Math.floor(cpuCount / 2))
      }
    ]
  },
  relay: {
    ffmpeg: ffmpegStatic,
    tasks: []
  },
  logType: 3
};