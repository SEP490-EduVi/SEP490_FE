'use client';

import React, { useEffect, useRef } from 'react';

export function GameMakerPanel() {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let dispose: null | (() => void) = null;
    let cancelled = false;

    (async () => {
      if (!rootRef.current) return;
      const mod = await import('@/mediapipe-game/editor.js');
      if (cancelled) return;
      dispose = mod.initTeacherGameEditor({ rootEl: rootRef.current });
    })();

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="fixed bottom-4 right-4 z-40 w-[360px] max-w-[92vw] rounded-xl border border-border bg-surface shadow-card"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="text-sm font-semibold text-slate-800">MediaPipe Mini-Game</div>
        <button
          data-role="create-game-btn"
          className="text-sm px-3 py-1.5 rounded-lg border border-border bg-surface-secondary hover:bg-surface-tertiary"
          type="button"
        >
          Tạo game
        </button>
      </div>

      <div className="px-4 py-2 text-xs text-slate-500" data-role="engine-status" />

      <div className="px-3 pb-3">
        <div className="relative w-full aspect-video overflow-hidden rounded-lg border border-border bg-surface-tertiary">
          <video
            data-role="video"
            className="absolute inset-0 h-full w-full object-cover -scale-x-100"
            autoPlay
            playsInline
            muted
          />
          <canvas
            data-role="canvas"
            className="absolute inset-0 h-full w-full -scale-x-100"
          />
        </div>
      </div>

      {/* Config modal (vanilla DOM-driven) */}
      <div data-role="config-modal" className="hidden fixed inset-0 z-50 flex items-center justify-center p-4">
        <div data-role="config-backdrop" className="absolute inset-0 bg-black/50" />
        <div className="relative w-full max-w-md rounded-xl border border-border bg-surface shadow-stage">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div className="text-sm font-semibold text-slate-800">Cấu hình game</div>
            <button
              data-role="close-modal-btn"
              type="button"
              className="text-xs px-2 py-1 rounded-lg border border-border bg-surface-secondary hover:bg-surface-tertiary"
            >
              Đóng
            </button>
          </div>

          <div className="p-4 space-y-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Mẫu game</label>
              <select
                data-role="template-select"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                defaultValue="HOVER_SELECT"
              >
                <option value="HOVER_SELECT">HOVER_SELECT</option>
                <option value="DRAG_DROP">DRAG_DROP</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1">Thời gian (giây)</label>
              <input
                data-role="time-limit-input"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                type="number"
                defaultValue={60}
                min={5}
                max={600}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1">Giữ hover (ms)</label>
              <input
                data-role="hover-hold-input"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                type="number"
                defaultValue={2000}
                min={250}
                max={5000}
              />
            </div>

            <div>
              <label className="block text-xs text-slate-600 mb-1">Ngưỡng chụm tay</label>
              <input
                data-role="pinch-threshold-input"
                className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                type="number"
                defaultValue={0.045}
                min={0.005}
                max={0.2}
                step={0.001}
              />
            </div>

            <div className="flex justify-end">
              <button
                data-role="save-game-btn"
                type="button"
                className="text-sm px-3 py-2 rounded-lg border border-border bg-surface-secondary hover:bg-surface-tertiary"
              >
                Lưu game
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
