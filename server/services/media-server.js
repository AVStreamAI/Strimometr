import NodeMediaServer from 'node-media-server';
import { config } from '../config.js';
import { startStreamMonitoring, stopStreamMonitoring } from './stream-monitor.js';
import { startRecording, stopRecording } from './recorder.js';
import telegramBot from '../telegram.js';

class MediaServerService {
  constructor() {
    this.nms = new NodeMediaServer(config);
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    this.nms.on('preConnect', (id, args) => {
      console.log('[NodeEvent on preConnect]', `id=${id} args=${JSON.stringify(args)}`);
      return true;
    });

    this.nms.on('postConnect', (id, args) => {
      console.log('[NodeEvent on postConnect]', `id=${id} args=${JSON.stringify(args)}`);
    });

    this.nms.on('doneConnect', (id, args) => {
      console.log('[NodeEvent on doneConnect]', `id=${id} args=${JSON.stringify(args)}`);
    });

    this.nms.on('prePublish', (id, StreamPath, args) => {
      console.log('[NodeEvent on prePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
      return true;
    });

    this.nms.on('postPublish', (id, StreamPath, args) => {
      console.log('[NodeEvent on postPublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
      const streamKey = StreamPath.split('/').pop();
      startStreamMonitoring(streamKey);
      startRecording(streamKey);
    });

    this.nms.on('donePublish', (id, StreamPath, args) => {
      console.log('[NodeEvent on donePublish]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
      const streamKey = StreamPath.split('/').pop();
      stopStreamMonitoring(streamKey);
      stopRecording(streamKey);
    });

    this.nms.on('prePlay', (id, StreamPath, args) => {
      console.log('[NodeEvent on prePlay]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
      return true;
    });

    this.nms.on('postPlay', (id, StreamPath, args) => {
      console.log('[NodeEvent on postPlay]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
    });

    this.nms.on('donePlay', (id, StreamPath, args) => {
      console.log('[NodeEvent on donePlay]', `id=${id} StreamPath=${StreamPath} args=${JSON.stringify(args)}`);
    });
  }

  start() {
    this.nms.run();
  }
}

export default new MediaServerService();