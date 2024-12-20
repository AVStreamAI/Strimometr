import { useEffect } from 'react';
import { useWebSocket } from './useWebSocket';
import { WS_URL } from '../config/constants';

interface UseWebSocketConnectionProps {
  onMessage: (data: any) => void;
  activeStreamKey: string | null;
}

export function useWebSocketConnection({ onMessage, activeStreamKey }: UseWebSocketConnectionProps) {
  const { isConnected } = useWebSocket({
    url: WS_URL,
    onMessage
  });

  useEffect(() => {
    if (!isConnected && activeStreamKey) {
      console.log('Reconnecting WebSocket due to active stream...');
    }
  }, [isConnected, activeStreamKey]);

  return isConnected;
}