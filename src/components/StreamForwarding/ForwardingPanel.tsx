import React from 'react';
import { Plus } from 'lucide-react';
import { ForwardingDestination } from './ForwardingDestination';

interface Destination {
  url: string;
  key: string;
  isActive: boolean;
  isForwarding: boolean;
}

interface ForwardingPanelProps {
  destinations: Destination[];
  activeStreamKey: string | null;
  wsConnected: boolean;
  onAddDestination: () => void;
  onRemoveDestination: (index: number) => void;
  onUpdateDestination: (index: number, field: 'url' | 'key', value: string) => void;
  onForwardingToggle: (index: number) => void;
  onReload: (index: number) => void;
}

export function ForwardingPanel({
  destinations,
  activeStreamKey,
  wsConnected,
  onAddDestination,
  onRemoveDestination,
  onUpdateDestination,
  onForwardingToggle,
  onReload
}: ForwardingPanelProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-3 md:p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg md:text-xl font-bold">Forward Stream</h2>
        {destinations.length < 4 && (
          <button
            onClick={onAddDestination}
            className="bg-green-600 hover:bg-green-700 rounded-full p-2 transition-colors"
            title="Add destination"
          >
            <Plus className="w-4 h-4 md:w-5 md:h-5" />
          </button>
        )}
      </div>
      <div className="space-y-4 max-h-[400px] overflow-y-auto">
        {destinations.map((destination, index) => (
          <ForwardingDestination
            key={index}
            destination={destination}
            index={index}
            activeStreamKey={activeStreamKey}
            onForwardingToggle={onForwardingToggle}
            onReload={onReload}
            onRemove={onRemoveDestination}
            onUpdate={onUpdateDestination}
          />
        ))}
      </div>
    </div>
  );
}