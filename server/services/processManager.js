export class StreamProcessManager {
  constructor() {
    this.mainProcesses = new Map();
    this.fallbackProcesses = new Map();
    this.monitorIntervals = new Map();
  }

  getProcessMap(streamKey, processes) {
    if (!processes.has(streamKey)) {
      processes.set(streamKey, new Map());
    }
    return processes.get(streamKey);
  }

  setMainProcess(streamKey, destinationId, process) {
    const streamProcesses = this.getProcessMap(streamKey, this.mainProcesses);
    streamProcesses.set(destinationId, process);
  }

  setFallbackProcess(streamKey, destinationId, process) {
    const streamProcesses = this.getProcessMap(streamKey, this.fallbackProcesses);
    streamProcesses.set(destinationId, process);
  }

  getMainProcess(streamKey, destinationId) {
    return this.mainProcesses.get(streamKey)?.get(destinationId);
  }

  getFallbackProcess(streamKey, destinationId) {
    return this.fallbackProcesses.get(streamKey)?.get(destinationId);
  }

  killProcess(process) {
    if (process && typeof process.kill === 'function') {
      try {
        process.kill('SIGKILL');
      } catch (error) {
        console.error('Error killing process:', error);
      }
    }
  }

  killMainProcess(streamKey, destinationId) {
    const process = this.getMainProcess(streamKey, destinationId);
    this.killProcess(process);
    this.mainProcesses.get(streamKey)?.delete(destinationId);
    if (this.mainProcesses.get(streamKey)?.size === 0) {
      this.mainProcesses.delete(streamKey);
    }
  }

  killFallbackProcess(streamKey, destinationId) {
    const process = this.getFallbackProcess(streamKey, destinationId);
    this.killProcess(process);
    this.fallbackProcesses.get(streamKey)?.delete(destinationId);
    if (this.fallbackProcesses.get(streamKey)?.size === 0) {
      this.fallbackProcesses.delete(streamKey);
    }
  }

  setMonitorInterval(streamKey, destinationId, interval) {
    if (!this.monitorIntervals.has(streamKey)) {
      this.monitorIntervals.set(streamKey, new Map());
    }
    this.monitorIntervals.get(streamKey).set(destinationId, interval);
  }

  clearMonitorInterval(streamKey, destinationId) {
    const interval = this.monitorIntervals.get(streamKey)?.get(destinationId);
    if (interval) {
      clearInterval(interval);
      this.monitorIntervals.get(streamKey).delete(destinationId);
      if (this.monitorIntervals.get(streamKey).size === 0) {
        this.monitorIntervals.delete(streamKey);
      }
    }
  }

  stopAllProcesses(streamKey, destinationId) {
    this.killMainProcess(streamKey, destinationId);
    this.killFallbackProcess(streamKey, destinationId);
    this.clearMonitorInterval(streamKey, destinationId);
  }

  stopAllStreamProcesses(streamKey) {
    const mainProcesses = this.mainProcesses.get(streamKey);
    const fallbackProcesses = this.fallbackProcesses.get(streamKey);
    const intervals = this.monitorIntervals.get(streamKey);

    if (mainProcesses) {
      for (const [destinationId] of mainProcesses) {
        this.stopAllProcesses(streamKey, destinationId);
      }
    }

    if (fallbackProcesses) {
      for (const [destinationId] of fallbackProcesses) {
        this.stopAllProcesses(streamKey, destinationId);
      }
    }

    if (intervals) {
      for (const [destinationId] of intervals) {
        this.clearMonitorInterval(streamKey, destinationId);
      }
    }

    this.mainProcesses.delete(streamKey);
    this.fallbackProcesses.delete(streamKey);
    this.monitorIntervals.delete(streamKey);
  }
}