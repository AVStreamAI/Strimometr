import { spawn } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';

export class SrtService {
  private process: ReturnType<typeof spawn> | null = null;
  private port: number = 5000;
  private enabled: boolean = false;

  setPort(port: number) {
    this.port = port;
    if (this.enabled) {
      this.restart();
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (enabled) {
      this.start();
    } else {
      this.stop();
    }
  }

  private start() {
    if (this.process) {
      this.stop();
    }

    this.process = spawn(ffmpegStatic as string, [
      '-i', `srt://0.0.0.0:${this.port}?mode=listener`,
      '-c', 'copy',
      '-f', 'flv',
      'rtmp://127.0.0.1:1935/live/srt_key'
    ]);

    this.process.stdout?.on('data', (data) => {
      console.log(`SRT FFmpeg stdout: ${data}`);
    });

    this.process.stderr?.on('data', (data) => {
      console.error(`SRT FFmpeg stderr: ${data}`);
    });

    this.process.on('close', (code) => {
      console.log(`SRT FFmpeg process exited with code ${code}`);
      this.process = null;
    });
  }

  private stop() {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.process = null;
    }
  }

  private restart() {
    this.stop();
    this.start();
  }
}

export const srtService = new SrtService();