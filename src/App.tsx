import React, { useState } from 'react';
import { VideoPlayer } from './components/VideoPlayer';
import { MetricsPanel } from './components/MetricsPanel';
import { SystemMetrics } from './components/SystemMetrics';
import { ForwardingPanel } from './components/StreamForwarding/ForwardingPanel';
import { StreamHeader } from './components/StreamInfo/StreamHeader';
import { SettingsMenu } from './components/SettingsMenu';
import { RecordingsViewer } from './components/RecordingsViewer/RecordingsViewer';
import { useStreamMetrics } from './hooks/useStreamMetrics';
import { useStreamForwarding } from './hooks/useStreamForwarding';
import { useSystemMetrics } from './hooks/useSystemMetrics';
import { useWebSocketConnection } from './hooks/useWebSocketConnection';
import { API_URL, FLV_URL } from './config/constants';

function App() {
  const [activeStreamKey, setActiveStreamKey] = useState<string | null>(null);
  const [showRecordings, setShowRecordings] = useState(false);
  
  const {
    metrics,
    metricsHistory,
    wsConnected,
    handleStreamMessage
  } = useStreamMetrics(activeStreamKey, setActiveStreamKey);

  const {
    destinations,
    handleForwardingToggle,
    handleReload,
    addDestination,
    removeDestination,
    updateDestination
  } = useStreamForwarding(API_URL, activeStreamKey);

  const systemMetrics = useSystemMetrics();

  useWebSocketConnection({
    onMessage: handleStreamMessage,
    activeStreamKey
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white p-2 md:p-4">
      <div className="absolute top-4 right-4">
        <SettingsMenu />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 space-y-4">
          <StreamHeader 
            hostname={window.location.hostname}
            activeStreamKey={activeStreamKey} 
          />
          
          <div className="bg-gray-800 rounded-lg p-3 md:p-4">
            <VideoPlayer 
              streamKey={activeStreamKey || ''} 
              flvUrl={FLV_URL} 
            />
          </div>

          <ForwardingPanel
            destinations={destinations}
            activeStreamKey={activeStreamKey}
            wsConnected={wsConnected}
            onAddDestination={addDestination}
            onRemoveDestination={removeDestination}
            onUpdateDestination={updateDestination}
            onForwardingToggle={handleForwardingToggle}
            onReload={handleReload}
          />
        </div>

        {/* Right Column - Metrics */}
        <div className="lg:col-span-7 space-y-4">
          <MetricsPanel 
            metrics={{
              ...metrics,
              fullHistory: metricsHistory
            }}
            onDownloadLogs={async () => {
              try {
                const response = await fetch(`${API_URL}/api/metrics`);
                const data = await response.json();
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'stream-metrics.json';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
              } catch (error) {
                console.error('Failed to download logs:', error);
              }
            }}
          />

          <SystemMetrics systemData={systemMetrics} />

          {/* Information Block */}
          <div className="bg-gray-800 rounded-lg p-3 md:p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base md:text-lg font-bold">Information</h2>
              <button
                onClick={() => setShowRecordings(true)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-md text-sm transition-colors"
              >
                View Recordings
              </button>
            </div>
            <p className="text-xs md:text-sm text-gray-400">
              Logs and recordings are stored in /server/recordings/
            </p>
            <p className="mt-2 text-xs md:text-sm text-blue-400">
              Developed by Sergey Korneyev for AVStream. Have a nice stream! :-)
            </p>
          </div>
        </div>
      </div>
      <RecordingsViewer isOpen={showRecordings} onClose={() => setShowRecordings(false)} />
    </div>
  );
}

export default App;