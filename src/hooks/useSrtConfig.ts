import { useState, useEffect } from 'react';
import { API_URL } from '../config/constants';

interface SrtStatus {
  enabled: boolean;
  port: number;
  isRunning: boolean;
}

export function useSrtConfig() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [status, setStatus] = useState<SrtStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial status
    fetch(`${API_URL}/api/srt/status`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus(data.status);
          setIsEnabled(data.status.enabled);
        }
      })
      .catch(err => {
        console.error('Failed to get SRT status:', err);
        setError('Failed to get SRT status');
      });
  }, []);

  const updateConfig = async (config: { enabled?: boolean; port?: number }) => {
    try {
      const response = await fetch(`${API_URL}/api/srt/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      const data = await response.json();
      if (data.success) {
        setStatus(data.status);
        if (typeof config.enabled !== 'undefined') {
          setIsEnabled(config.enabled);
        }
        setError(null);
      } else {
        setError(data.message);
      }
    } catch (err) {
      console.error('Failed to update SRT config:', err);
      setError('Failed to update SRT configuration');
    }
  };

  return {
    isEnabled,
    status,
    error,
    updateConfig,
  };
}