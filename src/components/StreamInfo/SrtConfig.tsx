import React, { useState } from 'react';
import { Radio, AlertCircle } from 'lucide-react';

interface SrtConfigProps {
  onPortChange: (port: number) => void;
  isEnabled: boolean;
  onToggle: (enabled: boolean) => void;
  status: {
    enabled: boolean;
    port: number;
    isRunning: boolean;
  } | null;
  error: string | null;
}

export function SrtConfig({ onPortChange, isEnabled, onToggle, status, error }: SrtConfigProps) {
  const [port, setPort] = useState<string>(status?.port.toString() || '5000');
  const [validationError, setValidationError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const portNumber = parseInt(port, 10);
    
    if (isNaN(portNumber) || portNumber < 1024 || portNumber > 65535) {
      setValidationError('Port must be between 1024 and 65535');
      return;
    }

    setValidationError('');
    onPortChange(portNumber);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-3 md:p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold">SRT Mode</h3>
        <label className="flex items-center cursor-pointer">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={isEnabled}
              onChange={(e) => onToggle(e.target.checked)}
            />
            <div className={`w-10 h-6 rounded-full transition-colors ${
              isEnabled ? 'bg-blue-600' : 'bg-gray-600'
            }`}>
              <div className={`absolute w-4 h-4 rounded-full transition-transform bg-white top-1 left-1 ${
                isEnabled ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </div>
          </div>
          <span className="ml-2 text-sm text-gray-300">
            {isEnabled ? 'On' : 'Off'}
          </span>
        </label>
      </div>

      {error && (
        <div className="mb-3 p-2 bg-red-900/50 border border-red-700 rounded-md flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {isEnabled && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Port Number</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                className="flex-1 bg-gray-700 rounded-md px-3 py-2 text-sm"
                placeholder="Enter port number (1024-65535)"
                min="1024"
                max="65535"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md text-sm transition-colors"
              >
                Apply
              </button>
            </div>
            {validationError && <p className="text-red-500 text-xs mt-1">{validationError}</p>}
          </div>

          <div className="text-sm text-gray-400">
            <div className="flex items-center gap-2 mb-1">
              <Radio className="w-4 h-4" />
              <span>SRT URL: srt://localhost:{port}</span>
            </div>
          </div>

          {status?.isRunning && (
            <div className="text-xs text-emerald-400 mt-2">
              ✓ SRT server running
            </div>
          )}
        </form>
      )}
    </div>
  );
}