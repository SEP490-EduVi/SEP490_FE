'use client';

import React from 'react';

import { GameEngine, MediaPipeTracker } from '@/mediapipe-game/mediapipe-engine.js';

type Props = {
  playable: any;
};

type CameraCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

function overlapArea(a: { x: number; y: number; w: number; h: number }, b: { x: number; y: number; w: number; h: number }): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  if (x2 <= x1 || y2 <= y1) return 0;
  return (x2 - x1) * (y2 - y1);
}

function chooseBestCameraCorner(playable: any): CameraCorner {
  const payload = Array.isArray(playable?.payload) ? playable.payload[0] : playable?.payload;
  const zones = Array.isArray(payload?.dropZones) ? payload.dropZones : [];
  const items = Array.isArray(payload?.items) ? payload.items : [];

  const obstacleRects: Array<{ x: number; y: number; w: number; h: number }> = [];

  for (const z of zones) {
    if (z?.zone) obstacleRects.push(z.zone);
  }

  for (const it of items) {
    if (!it?.start || !it?.size) continue;
    obstacleRects.push({
      x: it.start.x - it.size.w / 2,
      y: it.start.y - it.size.h / 2,
      w: it.size.w,
      h: it.size.h,
    });
  }

  if (!obstacleRects.length) return 'top-right';

  const margin = 0.02;
  const camW = 0.24;
  const camH = camW * 9 / 16;

  const candidates: Record<CameraCorner, { x: number; y: number; w: number; h: number }> = {
    'top-left': { x: margin, y: margin, w: camW, h: camH },
    'top-right': { x: 1 - margin - camW, y: margin, w: camW, h: camH },
    'bottom-left': { x: margin, y: 1 - margin - camH, w: camW, h: camH },
    'bottom-right': { x: 1 - margin - camW, y: 1 - margin - camH, w: camW, h: camH },
  };

  let bestCorner: CameraCorner = 'top-right';
  let bestScore = Number.POSITIVE_INFINITY;

  for (const key of Object.keys(candidates) as CameraCorner[]) {
    const rect = candidates[key];
    let score = 0;
    for (const obs of obstacleRects) {
      score += overlapArea(rect, obs);
    }
    if (score < bestScore) {
      bestScore = score;
      bestCorner = key;
    }
  }

  return bestCorner;
}

export function PresentationGamePlayer({ playable }: Props) {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const [status, setStatus] = React.useState<string>('Đang khởi tạo...');
  const initialCorner = React.useMemo(() => chooseBestCameraCorner(playable), [playable]);
  const [cameraCorner, setCameraCorner] = React.useState<CameraCorner>(initialCorner);
  const [cameraVisible, setCameraVisible] = React.useState(true);

  React.useEffect(() => {
    setCameraCorner(initialCorner);
    setCameraVisible(true);
  }, [initialCorner]);

  const cameraPosClass = React.useMemo(() => {
    if (cameraCorner === 'top-left') return 'top-4 left-4';
    if (cameraCorner === 'bottom-left') return 'bottom-4 left-4';
    if (cameraCorner === 'bottom-right') return 'bottom-4 right-4';
    return 'top-4 right-4';
  }, [cameraCorner]);

  const cycleCameraCorner = React.useCallback(() => {
    const order: CameraCorner[] = ['top-right', 'bottom-right', 'bottom-left', 'top-left'];
    const current = order.indexOf(cameraCorner);
    const next = (current + 1) % order.length;
    setCameraCorner(order[next]);
  }, [cameraCorner]);

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
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full -scale-x-100 z-10"
        />

        <div className="absolute left-3 top-3 z-30 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCameraVisible((v) => !v)}
            className="rounded-lg bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-black/65"
          >
            {cameraVisible ? 'Ẩn camera' : 'Hiện camera'}
          </button>
          {cameraVisible && (
            <button
              type="button"
              onClick={cycleCameraCorner}
              className="rounded-lg bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-black/65"
            >
              Đổi góc
            </button>
          )}
        </div>

        {cameraVisible && (
          <div className={`absolute ${cameraPosClass} z-20 w-[22%] min-w-[150px] max-w-[260px] aspect-video rounded-xl overflow-hidden border-2 border-white/85 shadow-lg bg-black/50`}>
            <video
              ref={videoRef}
              className="h-full w-full object-cover -scale-x-100"
              autoPlay
              playsInline
              muted
            />
            <div className="absolute left-2 top-2 rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white">
              Camera
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
