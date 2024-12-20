export function getStreamPath(streamKey) {
  return `rtmp://127.0.0.1:1935/live/${streamKey}`;
}