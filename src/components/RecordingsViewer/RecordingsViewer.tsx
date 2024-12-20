import React from 'react';
import { X } from 'lucide-react';
import { RecordingsList } from './RecordingsList';
import { useRecordings } from '../../hooks/useRecordings';

interface RecordingsViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RecordingsViewer({ isOpen, onClose }: RecordingsViewerProps) {
  const { recordings, loading, error, handleDelete, handleDownload, refresh } = useRecordings();

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      <div className="fixed inset-4 md:inset-10 bg-gray-800 rounded-lg shadow-lg z-50 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold">Recordings</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <RecordingsList
            recordings={recordings}
            loading={loading}
            error={error}
            onDelete={handleDelete}
            onDownload={handleDownload}
            onRefresh={refresh}
          />
        </div>
      </div>
    </>
  );
}