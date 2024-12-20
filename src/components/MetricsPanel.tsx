import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { BitrateGraph } from './BitrateGraph';

interface MetricsPanelProps {
  metrics: {
    videoBitrate: number[];
    audioBitrate: number[];
    frameRate: number[];
    resolution: string;
    videoCodec: string;
    audioCodec: string;
    duration: number;
    timestamp: number[];
    isActive?: boolean;
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
  };
  onDownloadLogs: () => void;
}

const formatBitrate = (bitrate: number) => {
  return `${(bitrate / 1000000).toFixed(2)} Mbps`;
};

const formatDuration = (seconds: number, frameRate: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds * (frameRate || 30)) % (frameRate || 30));

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
};

function InfoItem({ label, value, className = '' }: { label: string; value: string | number; className?: string }) {
  return (
    <div className="bg-gray-700 p-2 md:p-3 rounded-lg">
      <span className="text-xs md:text-sm text-gray-400">{label}</span>
      <div className={`text-sm md:text-base font-medium mt-1 ${className}`}>{value || 'N/A'}</div>
    </div>
  );
}

export function MetricsPanel({ metrics, onDownloadLogs }: MetricsPanelProps) {
  const [currentTime, setCurrentTime] = useState(0);

  const currentMetrics = metrics.fullHistory?.length 
    ? metrics.fullHistory[metrics.fullHistory.length - 1]
    : {
        videoBitrate: metrics.videoBitrate[metrics.videoBitrate.length - 1] || 0,
        audioBitrate: metrics.audioBitrate[metrics.audioBitrate.length - 1] || 0,
        frameRate: metrics.frameRate[metrics.frameRate.length - 1] || 0
      };

  const currentFrameRate = metrics.isActive ? Number(currentMetrics.frameRate) || 0 : 0;
  const currentVideoBitrate = metrics.isActive ? Number(currentMetrics.videoBitrate) || 0 : 0;
  const currentAudioBitrate = metrics.isActive ? Number(currentMetrics.audioBitrate) || 0 : 0;

  useEffect(() => {
    if (!metrics.isActive) {
      setCurrentTime(0);
      return;
    }

    setCurrentTime(metrics.duration);
  }, [metrics.duration, metrics.isActive]);

  useEffect(() => {
    if (!metrics.isActive) return;

    const frameInterval = currentFrameRate > 0 ? 1000 / currentFrameRate : 1000 / 30;
    const timer = setInterval(() => {
      setCurrentTime(prev => prev + frameInterval / 1000);
    }, frameInterval);

    return () => clearInterval(timer);
  }, [currentFrameRate, metrics.isActive]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {/* Video Bitrate Display */}
        <div className="bg-gray-800 rounded-lg p-2 md:p-3">
          <div className="flex flex-col items-center justify-center h-12 md:h-16">
            <h3 className="text-xs md:text-sm text-gray-400 font-medium mb-1">Video Bitrate</h3>
            <p className="text-lg md:text-2xl font-bold text-sky-400">{formatBitrate(currentVideoBitrate)}</p>
          </div>
        </div>

        {/* Audio Bitrate Display */}
        <div className="bg-gray-800 rounded-lg p-2 md:p-3">
          <div className="flex flex-col items-center justify-center h-12 md:h-16">
            <h3 className="text-xs md:text-sm text-gray-400 font-medium mb-1">Audio Bitrate</h3>
            <p className="text-lg md:text-2xl font-bold text-pink-400">{formatBitrate(currentAudioBitrate)}</p>
          </div>
        </div>

        {/* Frame Rate Display */}
        <div className="bg-gray-800 rounded-lg p-2 md:p-3">
          <div className="flex flex-col items-center justify-center h-12 md:h-16">
            <h3 className="text-xs md:text-sm text-gray-400 font-medium mb-1">Frame Rate</h3>
            <div className="flex items-baseline gap-2">
              <p className="text-lg md:text-2xl font-bold text-purple-400">{currentFrameRate.toFixed(1)}</p>
              <span className="text-xs md:text-sm text-gray-400">FPS</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bitrate History Graph */}
      <BitrateGraph 
        data={{
          timestamp: metrics.fullHistory?.map(m => m.timestamp) || metrics.timestamp,
          videoBitrate: metrics.fullHistory?.map(m => m.videoBitrate) || metrics.videoBitrate
        }}
      />

      {/* Stream Information */}
      <div className="bg-gray-800 rounded-lg p-3 md:p-4">
        <h2 className="text-base md:text-lg font-bold mb-3">Stream Information</h2>
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          <InfoItem label="Video Codec" value={metrics.isActive ? metrics.videoCodec : ''} />
          <InfoItem label="Audio Codec" value={metrics.isActive ? metrics.audioCodec : ''} />
          <InfoItem label="Resolution" value={metrics.isActive ? metrics.resolution : ''} />
          <InfoItem 
            label="Duration" 
            value={formatDuration(currentTime, currentFrameRate)}
            className="font-mono"
          />
        </div>
      </div>
    </div>
  );
}