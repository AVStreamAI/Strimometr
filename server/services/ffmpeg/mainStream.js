import ffmpeg from 'fluent-ffmpeg';

export function createMainStream(inputPath) {
  return ffmpeg(inputPath)
    .inputOptions([
      '-re',
      '-fflags +genpts'
    ])
    .outputOptions([
      '-c copy',
      '-f flv',
      '-flvflags no_duration_filesize'
    ]);
}