'use client';

import React from 'react';

import { GameEngine, MediaPipeTracker } from '@/mediapipe-game/mediapipe-engine.js';

type Props = {
  playable: any;
};

export function PresentationGamePlayer({ playable }: Props) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const [status, setStatus] = React.useState<string>('Đang khởi tạo...');

  React.useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const tracker = new MediaPipeTracker({
      videoEl: videoRef.current,
      onFrame: () => {},
    });

    const engine = new GameEngine({
      canvasEl: canvasRef.current,
      videoEl: videoRef.current,
      playable,
      tracker,
      onStatus: (msg: string) => setStatus(msg),
    });

    let cancelled = false;

    (async () => {
      try {
        await engine.init();
      } catch (e) {
        if (cancelled) return;
        // eslint-disable-next-line no-console
        console.error(e);
        setStatus(e instanceof Error ? e.message : 'Failed to start game');
      }
    })();

    return () => {
      cancelled = true;
      engine.dispose();
    };
  }, [playable]);

  return (
    <div className="w-full">
      <div className="text-sm font-semibold text-slate-800 mb-2">Mini-game</div>
      <div className="text-xs text-slate-500 mb-3">{status}</div>

      <div className="relative w-full aspect-video overflow-hidden rounded-xl border border-border bg-surface-tertiary">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover -scale-x-100"
          autoPlay
          playsInline
          muted
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full -scale-x-100"
        />
      </div>
    </div>
  );
}
