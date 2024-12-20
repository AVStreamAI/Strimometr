import ffmpeg from 'fluent-ffmpeg';

export async function probeStream(inputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        reject(err);
        return;
      }
      
      // Check if stream has valid video and audio streams
      const hasVideo = metadata.streams.some(stream => stream.codec_type === 'video');
      const hasAudio = metadata.streams.some(stream => stream.codec_type === 'audio');
      
      if (!hasVideo && !hasAudio) {
        reject(new Error('No valid streams found'));
        return;
      }
      
      resolve(metadata);
    });
  });
}