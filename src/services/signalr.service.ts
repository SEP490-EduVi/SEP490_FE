// src/services/signalr.service.ts

import * as signalR from '@microsoft/signalr';

const HUB_URL =
  process.env.NEXT_PUBLIC_SIGNALR_HUB_URL ??
  `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080'}/hubs/pipeline`;

let connection: signalR.HubConnection | null = null;

export function buildConnection(accessToken: string): signalR.HubConnection {
  connection = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, {
      // JWT phải đặt qua accessTokenFactory vì WebSocket không hỗ trợ Authorization header
      accessTokenFactory: () => accessToken,
    })
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  return connection;
}

export function getConnection(): signalR.HubConnection | null {
  return connection;
}
