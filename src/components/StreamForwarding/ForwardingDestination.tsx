import React, { useEffect } from 'react';
import { Play, Pause, Minus, RotateCw } from 'lucide-react';

interface Destination {
  url: string;
  key: string;
  isActive: boolean;
  isForwarding: boolean;
}

interface ForwardingDestinationProps {
  destination: Destination;
  index: number;
  activeStreamKey: string | null;
  onForwardingToggle: (index: number) => void;
  onReload: (index: number) => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: 'url' | 'key', value: string) => void;
}

export function ForwardingDestination({
  destination,
  index,
  activeStreamKey,
  onForwardingToggle,
  onReload,
  onRemove,
  onUpdate
}: ForwardingDestinationProps) {
  // Load saved values on component mount
  useEffect(() => {
    const savedUrl = localStorage.getItem(`destination_${index}_url`);
    const savedKey = localStorage.getItem(`destination_${index}_key`);
    
    if (savedUrl && destination.url === '') {
      onUpdate(index, 'url', savedUrl);
    }
    if (savedKey && destination.key === '') {
      onUpdate(index, 'key', savedKey);
    }
  }, [index]);

  // Save values when they change
  const handleUrlChange = (value: string) => {
    localStorage.setItem(`destination_${index}_url`, value);
    onUpdate(index, 'url', value);
  };

  const handleKeyChange = (value: string) => {
    localStorage.setItem(`destination_${index}_key`, value);
    onUpdate(index, 'key', value);
  };

  // Clean up localStorage when removing destination
  const handleRemove = () => {
    localStorage.removeItem(`destination_${index}_url`);
    localStorage.removeItem(`destination_${index}_key`);
    onRemove(index);
  };

  return (
    <div className="bg-gray-700 rounded-lg p-3 md:p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm md:text-base font-semibold">Destination {index + 1}</h3>
        <button
          onClick={handleRemove}
          className="text-red-500 hover:text-red-400 p-1"
          title="Remove destination"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-3">
        <div>
          <label className="block text-xs md:text-sm font-medium mb-1">RTMP URL</label>
          <input
            type="url"
            value={destination.url}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="w-full bg-gray-600 rounded-md px-3 py-2 text-sm"
            placeholder="e.g., rtmp://a.rtmp.youtube.com/live2"
            autoComplete="on"
            name={`destination_${index}_url`}
            list={`urls_${index}`}
          />
          <datalist id={`urls_${index}`}>
            <option value="rtmp://a.rtmp.youtube.com/live2" />
            <option value="rtmp://live-cdg.twitch.tv/app" />
            <option value="rtmp://live.kick.com/live" />
          </datalist>
        </div>
        <div>
          <label className="block text-xs md:text-sm font-medium mb-1">Stream Key</label>
          <input
            type="text"
            value={destination.key}
            onChange={(e) => handleKeyChange(e.target.value)}
            className="w-full bg-gray-600 rounded-md px-3 py-2 text-sm"
            placeholder="Your stream key"
            autoComplete="on"
            name={`destination_${index}_key`}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onForwardingToggle(index)}
            disabled={!activeStreamKey || !destination.url || !destination.key}
            className={`flex-1 rounded-md px-3 py-2 flex items-center justify-center gap-2 transition-colors text-sm ${
              activeStreamKey && destination.url && destination.key
                ? destination.isForwarding
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-600 cursor-not-allowed'
            }`}
          >
            {destination.isForwarding ? (
              <>
                <Pause className="w-4 h-4" /> Stop Forwarding
              </>
            ) : (
              <>
                <Play className="w-4 h-4" /> Start Forwarding
              </>
            )}
          </button>
          {destination.isForwarding && (
            <button
              onClick={() => onReload(index)}
              className="rounded-md px-3 py-2 bg-green-600 hover:bg-green-700 transition-colors"
              title="Reload stream"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}