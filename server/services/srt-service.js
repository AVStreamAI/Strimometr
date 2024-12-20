import ffmpegStatic from 'ffmpeg-static';
import { spawn } from 'child_process';
import telegramBot from '../telegram.js';
import { startStreamMonitoring, stopStreamMonitoring } from './stream-monitor.js';

class SrtService {
  constructor() {
    this.process = null;
    this.port = 5000;
    this.enabled = false;
    this.bitrateRegex = /bitrate=\s*(\d+(\.\d+)?)\s*kbits\/s/;
    this.fpsRegex = /fps=\s*(\d+(\.\d+)?)/;
    this.currentMetrics = {
      videoBitrate: 0,
      audioBitrate: 128000,
      fps: 0
    };
    this.lastFrameCount = 0;
    this.lastFrameTime = Date.now();
  }

  setPort(port) {
    this.port = port;
    if (this.enabled) {
      this.restart();
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    if (enabled) {
      this.start();
    } else {
      this.stop();
    }
  }

  getStatus() {
    return {
      enabled: this.enabled,
      port: this.port,
      isRunning: this.process !== null
    };
  }

  calculateFPS(frameCount) {
    const now = Date.now();
    const timeDiff = (now - this.lastFrameTime) / 1000; // Convert to seconds
    
    if (timeDiff > 0) {
      const frameDiff = frameCount - this.lastFrameCount;
      const currentFPS = frameDiff / timeDiff;
      
      // Update last values
      this.lastFrameCount = frameCount;
      this.lastFrameTime = now;
      
      return currentFPS;
    }
    
    return 0;
  }

  start() {
    if (this.process) {
      this.stop();
    }

    try {
      this.process = spawn(ffmpegStatic, [
        '-i', `srt://0.0.0.0:${this.port}?mode=listener`,
        '-c', 'copy',
        '-bufsize', '5000k',
        '-f', 'flv',
        'rtmp://127.0.0.1:1935/live/srt_key'
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let streamStarted = false;
      let lastMetricsUpdate = 0;

      const updateMetrics = () => {
        const now = Date.now();
        if (now - lastMetricsUpdate >= 1000) {
          lastMetricsUpdate = now;
          if (streamStarted) {
            startStreamMonitoring('srt_key', {
              forceBitrate: this.currentMetrics.videoBitrate,
              forceAudioBitrate: this.currentMetrics.audioBitrate,
              forceFps: this.currentMetrics.fps
            });
          }
        }
      };

      this.process.stderr.on('data', (data) => {
        const output = data.toString();

        // Only log critical errors
        if (output.includes('Error') || output.includes('Failed')) {
          console.error('SRT FFmpeg error:', output.trim());
        }

        // Parse frame count for FPS calculation
        const frameMatch = output.match(/frame=\s*(\d+)/);
        if (frameMatch && frameMatch[1]) {
          const frameCount = parseInt(frameMatch[1], 10);
          const calculatedFPS = this.calculateFPS(frameCount);
          if (calculatedFPS > 0) {
            this.currentMetrics.fps = calculatedFPS;
          }
        }

        // Parse bitrate from stderr
        const bitrateMatch = this.bitrateRegex.exec(output);
        if (bitrateMatch && bitrateMatch[1]) {
          this.currentMetrics.videoBitrate = parseFloat(bitrateMatch[1]) * 1000;
        }

        // Look for audio bitrate information
        if (output.includes('Audio:')) {
          const audioBitrateMatch = output.match(/(\d+) kb\/s/);
          if (audioBitrateMatch && audioBitrateMatch[1]) {
            this.currentMetrics.audioBitrate = parseInt(audioBitrateMatch[1]) * 1000;
          }
        }

        // Check for stream start
        if (!streamStarted && output.includes('Input #0')) {
          streamStarted = true;
          // Reset FPS calculation values on new stream
          this.lastFrameCount = 0;
          this.lastFrameTime = Date.now();
          startStreamMonitoring('srt_key');
          telegramBot.sendNotification('🔄 SRT to RTMP conversion active and being monitored');
        }

        updateMetrics();
      });

      this.process.on('close', (code) => {
        console.log(`SRT FFmpeg process exited with code ${code}`);
        this.process = null;
        if (this.enabled) {
          telegramBot.sendNotification(`⚠️ SRT to RTMP conversion stopped unexpectedly (code: ${code})`);
          stopStreamMonitoring('srt_key');
        }
      });

      telegramBot.sendNotification('🔄 SRT to RTMP conversion started');
    } catch (error) {
      console.error('Failed to start SRT service:', error);
      telegramBot.sendNotification(`❌ Failed to start SRT to RTMP conversion: ${error.message}`);
      this.process = null;
    }
  }

  stop() {
    if (this.process) {
      stopStreamMonitoring('srt_key');
      this.process.kill('SIGTERM');
      this.process = null;
      telegramBot.sendNotification('⏹️ SRT to RTMP conversion stopped');
    }
  }

  restart() {
    this.stop();
    this.start();
  }
}

export const srtService = new SrtService();