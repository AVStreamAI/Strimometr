import { useState } from 'react';
import { useWebSocket } from './useWebSocket';
import { SYSTEM_WS_URL } from '../config/constants';

interface SystemMetricsData {
  timestamp: number[];
  download: number[];
  upload: number[];
  cpu: number[];
  memory: {
    used: number[];
    total: number;
  };
  disk: {
    used: number[];
    total: number;
    path: string;
  };
}

export function useSystemMetrics() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetricsData>({
    timestamp: [],
    download: [],
    upload: [],
    cpu: [],
    memory: {
      used: [],
      total: 0
    },
    disk: {
      used: [],
      total: 0,
      path: ''
    }
  });

  useWebSocket({
    url: SYSTEM_WS_URL,
    onMessage: (event) => {
      try {
        const data = typeof event === 'string' ? JSON.parse(event) : event;
        setSystemMetrics(prev => ({
          timestamp: [...prev.timestamp.slice(-30), data.timestamp],
          download: [...prev.download.slice(-30), data.download],
          upload: [...prev.upload.slice(-30), data.upload],
          cpu: [...prev.cpu.slice(-30), data.cpu],
          memory: {
            used: [...prev.memory.used.slice(-30), data.memory.used],
            total: data.memory.total
          },
          disk: {
            used: [...prev.disk.used.slice(-30), data.disk.used],
            total: data.disk.total,
            path: data.disk.path
          }
        }));
      } catch (error) {
        console.error('Error parsing system metrics:', error);
      }
    }
  });

  return systemMetrics;
}