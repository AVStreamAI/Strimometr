import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const defaultFallbackImage = path.join(__dirname, '../../assets/fallback.png');

export function createFallbackStream(fallbackImagePath = defaultFallbackImage) {
  return ffmpeg()
    .input(fallbackImagePath)
    .inputFormat('image2')
    .inputOptions([
      '-re',
      '-stream_loop -1',
      '-loop 1'
    ])
    .input('anullsrc=r=44100:cl=stereo')
    .inputFormat('lavfi')
    .inputOptions([
      '-re'
    ])
    .outputOptions([
      '-c:v libx264',
      '-preset veryfast',
      '-tune zerolatency',
      '-pix_fmt yuv420p',
      '-r 30',
      '-g 60',
      '-b:v 2500k',
      '-maxrate 2500k',
      '-bufsize 5000k',
      '-c:a aac',
      '-b:a 128k',
      '-ar 44100',
      '-shortest',
      '-f flv'
    ]);
}