import { useState, useCallback } from 'react';
import type { StreamMetrics } from '../types/metrics';

export function useStreamMetrics(
  activeStreamKey: string | null,
  setActiveStreamKey: (key: string | null) => void
) {
  const [metrics, setMetrics] = useState<StreamMetrics>({
    videoBitrate: [],
    audioBitrate: [],
    frameRate: [],
    resolution: '',
    videoCodec: '',
    audioCodec: '',
    duration: 0,
    timestamp: [],
    isActive: false
  });
  const [metricsHistory, setMetricsHistory] = useState<StreamMetrics['fullHistory']>([]);
  const [wsConnected, setWsConnected] = useState(false);

  const handleStreamMessage = useCallback((data: any) => {
    if (data.streamKey && !activeStreamKey) {
      setActiveStreamKey(data.streamKey);
    }

    if (data.fullHistory) {
      setMetricsHistory(data.fullHistory);
    }

    setMetrics(prev => ({
      ...prev,
      videoBitrate: data.isActive ? [...prev.videoBitrate, data.videoBitrate].slice(-30) : [],
      audioBitrate: data.isActive ? [...prev.audioBitrate, data.audioBitrate].slice(-30) : [],
      frameRate: data.isActive ? [...prev.frameRate, data.frameRate].slice(-30) : [],
      timestamp: data.isActive ? [...prev.timestamp, data.timestamp].slice(-30) : [],
      resolution: data.resolution || '',
      videoCodec: data.videoCodec || '',
      audioCodec: data.audioCodec || '',
      duration: data.duration || 0,
      isActive: data.isActive
    }));

    if (!data.isActive) {
      setActiveStreamKey(null);
      setMetricsHistory([]);
    }
  }, [activeStreamKey, setActiveStreamKey]);

  return {
    metrics,
    metricsHistory,
    wsConnected,
    handleStreamMessage,
    setWsConnected
  };
}