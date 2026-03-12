// src/hooks/usePipelineHub.ts

import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { buildConnection } from '@/services/signalr.service';
import { PipelineProgress } from '@/types/api';

export type { PipelineProgress };

interface UsePipelineHubOptions {
  accessToken: string | null;
  onProgress: (progress: PipelineProgress) => void;
}

export function usePipelineHub({ accessToken, onProgress }: UsePipelineHubOptions) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  useEffect(() => {
    if (!accessToken) return;

    const connection = buildConnection(accessToken);
    connectionRef.current = connection;

    // Phải đăng ký listener TRƯỚC khi gọi .start() để không bỏ lỡ event nào
    connection.on('PipelineProgress', (progress: PipelineProgress) => {
      onProgress(progress);
    });

    connection.onreconnecting(() => {
      console.warn('[SignalR] Đang reconnect...');
    });

    connection.onreconnected(() => {
      console.info('[SignalR] Reconnected — rejoin group');
      // Group bị mất khi reconnect vì ConnectionId mới → phải join lại
      connection.invoke('JoinUserGroup').catch(console.error);
    });

    connection.onclose((err) => {
      if (err) console.error('[SignalR] Mất kết nối:', err);
    });

    connection
      .start()
      .then(() => {
        console.info('[SignalR] Kết nối thành công');
        return connection.invoke('JoinUserGroup');
      })
      .then(() => console.info('[SignalR] Đã vào group người dùng'))
      .catch((err) => console.error('[SignalR] Không thể kết nối:', err));

    return () => {
      connection.invoke('LeaveUserGroup').catch(() => {});
      connection.stop();
      connectionRef.current = null;
    };
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  return connectionRef;
}
