import { useState, useEffect, useCallback } from 'react';
import { Recording } from '../types/recordings';
import { API_URL } from '../config/constants';

export function useRecordings() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRecordings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_URL}/api/recordings`);
      if (!response.ok) throw new Error('Failed to load recordings');
      const data = await response.json();
      setRecordings(data.recordings.sort((a: Recording, b: Recording) => 
        new Date(b.created).getTime() - new Date(a.created).getTime()
      ));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load recordings');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDelete = useCallback(async (filename: string) => {
    if (!confirm('Are you sure you want to delete this recording?')) return;

    try {
      const response = await fetch(`${API_URL}/api/recordings/${filename}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete recording');
      await loadRecordings();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete recording');
    }
  }, [loadRecordings]);

  const handleDownload = useCallback((url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = `${API_URL}${url}`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  useEffect(() => {
    loadRecordings();
  }, [loadRecordings]);

  return {
    recordings,
    loading,
    error,
    handleDelete,
    handleDownload,
    refresh: loadRecordings
  };
}