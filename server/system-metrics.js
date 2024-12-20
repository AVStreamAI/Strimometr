import netstat from 'node-netstat';
import si from 'systeminformation';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const recordingPath = path.resolve(__dirname, 'recordings');

// Update every 1.5 seconds - balanced between responsiveness and performance
const UPDATE_INTERVAL = 1500;

let wss;
let metricsInterval;
let cleanupInterval;

export function setWebSocketServer(server) {
  wss = server;
  
  // Clear existing intervals if they exist
  if (metricsInterval) clearInterval(metricsInterval);
  if (cleanupInterval) clearInterval(cleanupInterval);
  
  // Start new intervals only if we have a valid WebSocket server
  if (wss) {
    // Broadcast system metrics
    metricsInterval = setInterval(async () => {
      if (!wss || wss.clients.size === 0) return;

      const metrics = await getSystemMetrics();
      if (metrics) {
        const payload = JSON.stringify(metrics);
        wss.clients.forEach(client => {
          if (client.readyState === 1) {
            client.send(payload);
          }
        });
      }
    }, UPDATE_INTERVAL);

    // Clean up inactive connections
    cleanupInterval = setInterval(() => {
      if (!wss) return;
      wss.clients.forEach(client => {
        if (client.readyState === 3) {
          client.terminate();
        }
      });
    }, 30000);
  }
}

let lastRxBytes = 0;
let lastTxBytes = 0;
let lastTimestamp = Date.now();

async function getSystemMetrics() {
  try {
    const [networkStats, currentLoad, mem, fsSize] = await Promise.all([
      si.networkStats(),
      si.currentLoad(),
      si.mem(),
      si.fsSize()
    ]);

    const mainInterface = networkStats[0];
    const currentTime = Date.now();
    const timeDiff = (currentTime - lastTimestamp) / 1000;

    // Calculate network speeds
    const rxSpeed = lastRxBytes ? (mainInterface.rx_bytes - lastRxBytes) / timeDiff : 0;
    const txSpeed = lastTxBytes ? (mainInterface.tx_bytes - lastTxBytes) / timeDiff : 0;

    lastRxBytes = mainInterface.rx_bytes;
    lastTxBytes = mainInterface.tx_bytes;
    lastTimestamp = currentTime;

    // Find the disk containing the recordings directory
    const recordingsDisk = fsSize.find(fs => recordingPath.startsWith(fs.mount));

    return {
      timestamp: currentTime,
      download: Math.max(0, rxSpeed),
      upload: Math.max(0, txSpeed),
      cpu: currentLoad.currentLoad,
      memory: {
        used: mem.active,
        total: mem.total
      },
      disk: {
        used: recordingsDisk ? recordingsDisk.used : 0,
        total: recordingsDisk ? recordingsDisk.size : 0,
        path: recordingPath
      }
    };
  } catch (error) {
    console.error('Error getting system metrics:', error);
    return null;
  }
}
