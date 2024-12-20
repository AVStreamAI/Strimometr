import { useState, useCallback } from 'react';
import type { Destination } from '../types/forwarding';

export function useStreamForwarding(apiUrl: string, activeStreamKey: string | null) {
  const [destinations, setDestinations] = useState<Destination[]>([
    { url: '', key: '', isActive: false, isForwarding: false }
  ]);

  const handleForwardingToggle = async (index: number) => {
    if (!activeStreamKey) return;
  
    try {
      const destination = destinations[index];
      const action = destination.isForwarding ? 'stop' : 'start';
  
      setDestinations(prev => prev.map((dest, i) => 
        i === index ? { ...dest, isForwarding: !dest.isForwarding } : dest
      ));
  
      const response = await fetch(`${apiUrl}/api/forward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          sourceKey: activeStreamKey,
          destinationUrl: destination.url,
          destinationKey: destination.key,
          destinationId: index
        }),
      });
  
      if (!response.ok) {
        setDestinations(prev => prev.map((dest, i) => 
          i === index ? { ...dest, isForwarding: !dest.isForwarding } : dest
        ));
        const error = await response.json();
        console.error('Failed to toggle forwarding:', error);
      }
    } catch (error) {
      setDestinations(prev => prev.map((dest, i) => 
        i === index ? { ...dest, isForwarding: !dest.isForwarding } : dest
      ));
      console.error('Error toggling forwarding:', error);
    }
  };

  const handleReload = async (index: number) => {
    if (!activeStreamKey) return;
  
    try {
      const destination = destinations[index];
      const response = await fetch(`${apiUrl}/api/forward`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reload',
          sourceKey: activeStreamKey,
          destinationUrl: destination.url,
          destinationKey: destination.key,
          destinationId: index
        }),
      });
  
      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to reload stream:', error);
      }
    } catch (error) {
      console.error('Error reloading stream:', error);
    }
  };

  const addDestination = useCallback(() => {
    if (destinations.length < 4) {
      setDestinations(prev => [...prev, { url: '', key: '', isActive: false, isForwarding: false }]);
    }
  }, [destinations.length]);

  const removeDestination = useCallback((index: number) => {
    if (destinations[index].isForwarding) {
      handleForwardingToggle(index);
    }
    setDestinations(prev => prev.filter((_, i) => i !== index));
  }, [destinations, handleForwardingToggle]);

  const updateDestination = useCallback((index: number, field: 'url' | 'key', value: string) => {
    setDestinations(prev => prev.map((dest, i) => 
      i === index ? { ...dest, [field]: value } : dest
    ));
  }, []);

  return {
    destinations,
    handleForwardingToggle,
    handleReload,
    addDestination,
    removeDestination,
    updateDestination
  };
}