import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { buildConnection } from '@/services/signalr.service';
import type { GameProgressDto } from '@/types/api';

interface UseGameHubOptions {
  accessToken: string | null;
  onProgress: (progress: GameProgressDto) => void;
}

export function useGameHub({ accessToken, onProgress }: UseGameHubOptions) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  useEffect(() => {
    if (!accessToken) return;

    const connection = buildConnection(accessToken);
    connectionRef.current = connection;

    connection.on('GameProgress', (progress: GameProgressDto) => {
      onProgressRef.current(progress);
    });

    connection.onreconnecting(() => {
      console.warn('[SignalR][Game] Reconnecting...');
    });

    connection.onreconnected(() => {
      connection.invoke('JoinUserGroup').catch(console.error);
    });

    connection.onclose((err) => {
      if (err) console.error('[SignalR][Game] Disconnected:', err);
    });

    connection
      .start()
      .then(() => connection.invoke('JoinUserGroup'))
      .catch((err) => console.error('[SignalR][Game] Connect failed:', err));

    return () => {
      connection.invoke('LeaveUserGroup').catch(() => {});
      connection.stop();
      connectionRef.current = null;
    };
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  return connectionRef;
}
