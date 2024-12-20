import React from 'react';
import { SrtConfig } from './SrtConfig';
import { useSrtConfig } from '../../hooks/useSrtConfig';

interface StreamHeaderProps {
  hostname: string;
  activeStreamKey: string | null;
}

export function StreamHeader({ hostname, activeStreamKey }: StreamHeaderProps) {
  const { isEnabled, status, error, updateConfig } = useSrtConfig();

  const handleSrtPortChange = (port: number) => {
    updateConfig({ port });
  };

  const handleSrtToggle = (enabled: boolean) => {
    updateConfig({ enabled });
  };

  const displayStreamKey = status?.isRunning ? 'srt_key' : activeStreamKey;

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-3 md:p-4">
        <h2 className="text-lg md:text-xl font-bold mb-4">AVStream Strimometr Dashboard</h2>
        <div className="mt-2 text-xs md:text-sm text-gray-400 break-all">
          {status?.isRunning ? (
            <>
              
              <div className="mt-1">RTMP: rtmp://{hostname}:1935/live/{activeStreamKey || '[ANY_KEY]'}</div>
            </>
          ) : (
            <div>RTMP: rtmp://{hostname}:1935/live/{activeStreamKey || '[ANY_KEY]'}</div>
          )}
        </div>
      </div>
      
      <SrtConfig
        onPortChange={handleSrtPortChange}
        isEnabled={isEnabled}
        onToggle={handleSrtToggle}
        status={status}
        error={error}
      />
    </div>
  );
}