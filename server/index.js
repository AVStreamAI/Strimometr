import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import mediaServer from './services/media-server.js';
import apiRoutes from './routes/api.js';
import { setWebSocketServer } from './system-metrics.js';
import './system-metrics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

// Increase payload size limit for file uploads
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Create WebSocket servers
const wss = new WebSocketServer({ noServer: true });
const systemWss = new WebSocketServer({ noServer: true });

// Set up system metrics WebSocket server
setWebSocketServer(systemWss);

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Serve recordings directory statically
app.use('/recordings', express.static(path.resolve(__dirname, 'recordings')));

// API routes
app.use('/api', apiRoutes);

// WebSocket upgrade handling
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;

  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else if (pathname === '/system-ws') {
    systemWss.handleUpgrade(request, socket, head, (ws) => {
      systemWss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

// Start media server
mediaServer.start();

// Start HTTP server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}`);
});