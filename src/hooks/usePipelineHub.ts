// src/hooks/usePipelineHub.ts

import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { buildConnection } from '@/services/signalr.service';
import { getPipelineTaskStatus } from '@/services/pipelineServices';
import { usePipelineTaskStore } from '@/store/usePipelineTaskStore';
import { PipelineProgress } from '@/types/api';

export type { PipelineProgress };

interface UsePipelineHubOptions {
  accessToken: string | null;
  onProgress: (progress: PipelineProgress) => void;
}

/**
 * After joining the SignalR group (on first connect AND on reconnect),
 * check every stored taskId from localStorage. If a task is still
 * queued/processing, fire onProgress so the caller can show the modal.
 * If completed/failed, fire onProgress with the stored status so the
 * caller can clean up.
 */
async function checkStoredTasks(onProgress: (p: PipelineProgress) => void) {
  const allTasks = usePipelineTaskStore.getState().getAllTasks();
  if (allTasks.length === 0) return;

  await Promise.allSettled(
    allTasks.map(async ({ taskId }) => {
      try {
        const status = await getPipelineTaskStatus(taskId);
        onProgress(status);
      } catch {
        // Status endpoint unreachable for this taskId — leave stored for next reconnect
      }
    })
  );
}

export function usePipelineHub({ accessToken, onProgress }: UsePipelineHubOptions) {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  // Keep a stable ref so we don't add the effect dependency on onProgress
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;

  useEffect(() => {
    if (!accessToken) return;

    const connection = buildConnection(accessToken);
    connectionRef.current = connection;

    // Phải đăng ký listener TRƯỚC khi gọi .start() để không bỏ lỡ event nào
    connection.on('PipelineProgress', (progress: PipelineProgress) => {
      onProgressRef.current(progress);
    });

    connection.onreconnecting(() => {
      console.warn('[SignalR] Đang reconnect...');
    });

    connection.onreconnected(() => {
      console.info('[SignalR] Reconnected — rejoin group');
      // Group bị mất khi reconnect vì ConnectionId mới → phải join lại
      connection
        .invoke('JoinUserGroup')
        .then(() => checkStoredTasks(onProgressRef.current))
        .catch(console.error);
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
      .then(() => {
        console.info('[SignalR] Đã vào group người dùng');
        // Check for any in-progress tasks from a previous session / page refresh
        return checkStoredTasks(onProgressRef.current);
      })
      .catch((err) => console.error('[SignalR] Không thể kết nối:', err));

    return () => {
      connection.invoke('LeaveUserGroup').catch(() => {});
      connection.stop();
      connectionRef.current = null;
    };
  }, [accessToken]); // eslint-disable-line react-hooks/exhaustive-deps

  return connectionRef;
}
