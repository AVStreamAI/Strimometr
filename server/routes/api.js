import express from 'express';
import { startForwarding, stopForwarding, reloadStream } from '../services/forwarder.js';
import { streamMetrics } from '../services/stream-monitor.js';
import { srtService } from '../services/srt-service.js';
import fs from 'fs';
import path from 'path';
import { dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import multer from 'multer';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RECORDINGS_DIR = path.join(__dirname, '../recordings');

// Ensure recordings directory exists
if (!fs.existsSync(RECORDINGS_DIR)) {
  fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
}

// Configure multer to store files directly
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const assetsDir = path.join(__dirname, '../assets');
    // Create directory if it doesn't exist
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    cb(null, assetsDir);
  },
  filename: function (req, file, cb) {
    cb(null, 'fallback.png');
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'image/png') {
      cb(new Error('Only PNG files are allowed'));
      return;
    }
    cb(null, true);
  }
});

// Configure recordings endpoints
router.get('/recordings', (req, res) => {
  try {
    const files = fs.readdirSync(RECORDINGS_DIR);
    const recordings = files.filter(file => {
      // Only include .ts and .json files
      return file.endsWith('.ts') || file.endsWith('.json');
    }).map(file => {
      const filePath = path.join(RECORDINGS_DIR, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        created: stats.birthtime,
        url: `/recordings/${file}`
      };
    });
    res.json({ success: true, recordings });
  } catch (error) {
    console.error('Error getting recordings:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/recordings/:filename', (req, res) => {
  try {
    const filePath = path.join(RECORDINGS_DIR, req.params.filename);
    // Ensure the file is within the recordings directory
    if (!filePath.startsWith(RECORDINGS_DIR)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    fs.unlinkSync(filePath);
    res.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting recording:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Settings endpoints
router.post('/settings/telegram-token', (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is required' });
  }

  try {
    const envPath = path.resolve(__dirname, '../../.env');
    const envContent = `TELEGRAM_BOT_TOKEN=${token}\n`;
    
    fs.writeFileSync(envPath, envContent, 'utf8');
    
    res.json({ success: true, message: 'Token updated successfully' });
  } catch (error) {
    console.error('Error updating token:', error);
    res.status(500).json({ success: false, message: 'Failed to update token' });
  }
});

router.post('/settings/fallback-image', upload.single('fallback'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }
  res.json({ success: true, message: 'Fallback image updated successfully' });
});

router.post('/forward', (req, res) => {
  const { action, sourceKey, destinationUrl, destinationKey, destinationId } = req.body;

  try {
    if (action === 'start') {
      startForwarding(sourceKey, destinationUrl, destinationKey, destinationId);
      res.json({ success: true, message: 'Forwarding started' });
    } else if (action === 'stop') {
      stopForwarding(sourceKey, destinationId);
      res.json({ success: true, message: 'Forwarding stopped' });
    } else if (action === 'reload') {
      reloadStream(sourceKey, destinationUrl, destinationKey, destinationId);
      res.json({ success: true, message: 'Stream reloaded' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid action' });
    }
  } catch (error) {
    console.error('Error handling forward request:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/metrics', (req, res) => {
  const allMetrics = {};
  streamMetrics.forEach((metrics, streamKey) => {
    allMetrics[streamKey] = metrics;
  });
  res.json(allMetrics);
});

// SRT endpoints
router.post('/srt/config', (req, res) => {
  const { enabled, port } = req.body;
  
  try {
    if (typeof enabled !== 'undefined') {
      srtService.setEnabled(enabled);
    }
    
    if (typeof port !== 'undefined') {
      const portNum = parseInt(port, 10);
      if (isNaN(portNum) || portNum < 1024 || portNum > 65535) {
        return res.status(400).json({ 
          success: false, 
          message: 'Port must be between 1024 and 65535' 
        });
      }
      srtService.setPort(portNum);
    }
    
    res.json({ 
      success: true, 
      status: srtService.getStatus() 
    });
  } catch (error) {
    console.error('Error configuring SRT:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

router.get('/srt/status', (req, res) => {
  try {
    res.json({ 
      success: true, 
      status: srtService.getStatus() 
    });
  } catch (error) {
    console.error('Error getting SRT status:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

export default router;