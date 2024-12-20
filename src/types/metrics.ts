export interface StreamMetrics {
  videoBitrate: number[];
  audioBitrate: number[];
  frameRate: number[];
  resolution: string;
  videoCodec: string;
  audioCodec: string;
  duration: number;
  timestamp: number[];
  isActive: boolean;
  fullHistory?: Array<{
    timestamp: number;
    videoBitrate: number;
    audioBitrate: number;
    frameRate: number;
    resolution: string;
    videoCodec: string;
    audioCodec: string;
    duration: number;
  }>;
}