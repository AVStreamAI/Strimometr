import React from 'react';
import { Download, Trash2, RefreshCw } from 'lucide-react';
import { Recording } from '../../types/recordings';
import { formatBytes, formatDate } from '../../utils/format';

interface RecordingsListProps {
  recordings: Recording[];
  loading: boolean;
  error: string | null;
  onDelete: (filename: string) => void;
  onDownload: (url: string, filename: string) => void;
  onRefresh: () => void;
}

export function RecordingsList({
  recordings,
  loading,
  error,
  onDelete,
  onDownload,
  onRefresh
}: RecordingsListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 text-center">
        <p>{error}</p>
        <button
          onClick={onRefresh}
          className="mt-2 p-2 hover:bg-gray-700 rounded-full transition-colors inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </button>
      </div>
    );
  }

  if (recordings.length === 0) {
    return <div className="text-gray-400 text-center">No recordings found</div>;
  }

  return (
    <div className="grid gap-3">
      {recordings.map((recording) => (
        <div
          key={recording.name}
          className="bg-gray-700 rounded-lg p-3 flex items-center justify-between"
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{recording.name}</p>
            <p className="text-xs text-gray-400">
              {formatBytes(recording.size)} • {formatDate(recording.created)}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => onDownload(recording.url, recording.name)}
              className="p-2 hover:bg-gray-600 rounded-full transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDelete(recording.name)}
              className="p-2 hover:bg-gray-600 rounded-full transition-colors text-red-400"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}