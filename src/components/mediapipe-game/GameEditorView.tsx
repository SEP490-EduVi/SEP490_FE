'use client';

/**
 * GameEditorView
 * ==============
 * Lets the teacher review and edit game content before starting.
 * Supports HOVER_SELECT and DRAG_DROP templates.
 * All edits live only in React state — nothing is persisted.
 */

import React from 'react';
import { Plus, Trash2, Play, Check, Download, Loader2 } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type HoverChoice = { id: string; text: string; zone: { x: number; y: number; w: number; h: number } };
type HoverRound  = { prompt: string; choices: HoverChoice[]; correctChoiceId: string };

type DragItem    = { id: string; label: string };
type DragZone    = { id: string; label: string; acceptsItemId: string };
type DragRound   = { prompt: string; items: DragItem[]; dropZones: DragZone[] };

export type GameEditorPlayable = { templateId: string; payload: unknown; settings?: Record<string, unknown> };

type Props = {
  playable: GameEditorPlayable;
  onStart: (edited: GameEditorPlayable) => void;
  onExportGameEduvi?: (edited: GameEditorPlayable) => void;
  isExportingGameEduvi?: boolean;
  productName?: string;
  productGameCode?: string;
  onSave?: (edited: GameEditorPlayable) => Promise<void>;
};

// ── Utilities ─────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function cloneDeep<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

// ── Hover Select Editor ───────────────────────────────────────────────────────

const BADGE_LABELS  = ['A', 'B', 'C', 'D'];
const BADGE_COLORS  = ['#e21b3c', '#1368ce', '#d89e00', '#26890c'];

// Default zone layout (matches HOVER_SELECT_HTML_ZONES in mediapipe-engine.js)
const DEFAULT_ZONES = [
  { x: 0,     y: 0.44,  w: 0.495, h: 0.27 },
  { x: 0.505, y: 0.44,  w: 0.495, h: 0.27 },
  { x: 0,     y: 0.725, w: 0.495, h: 0.27 },
  { x: 0.505, y: 0.725, w: 0.495, h: 0.27 },
];

function HoverRoundEditor({
  round,
  onChange,
}: {
  round: HoverRound;
  onChange: (r: HoverRound) => void;
}) {
  const setPrompt = (prompt: string) => onChange({ ...round, prompt });

  const setChoiceText = (id: string, text: string) =>
    onChange({ ...round, choices: round.choices.map((c) => (c.id === id ? { ...c, text } : c)) });

  const setCorrect = (id: string) => onChange({ ...round, correctChoiceId: id });

  const addChoice = () => {
    if (round.choices.length >= 4) return;
    const idx = round.choices.length;
    onChange({
      ...round,
      choices: [
        ...round.choices,
        { id: uid(), text: `Đáp án ${idx + 1}`, zone: DEFAULT_ZONES[idx] ?? DEFAULT_ZONES[0] },
      ],
    });
  };

  const removeChoice = (id: string) => {
    const next = round.choices.filter((c) => c.id !== id);
    onChange({
      ...round,
      choices: next,
      correctChoiceId: round.correctChoiceId === id ? (next[0]?.id ?? '') : round.correctChoiceId,
    });
  };

  return (
    <div className="space-y-4">
      {/* Prompt */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
          Câu hỏi
        </label>
        <textarea
          className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
          rows={2}
          value={round.prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Nhập câu hỏi..."
        />
      </div>

      {/* Choices */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Các đáp án (tối đa 4)
          </label>
          {round.choices.length < 4 && (
            <button
              type="button"
              onClick={addChoice}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors"
            >
              <Plus size={11} />
              Thêm
            </button>
          )}
        </div>

        <div className="space-y-2">
          {round.choices.map((c, idx) => {
            const isCorrect = c.id === round.correctChoiceId;
            const color = BADGE_COLORS[idx] ?? '#888';
            return (
              <div
                key={c.id}
                className="flex items-center gap-2 rounded-xl p-2 border transition-colors"
                style={{
                  borderColor: isCorrect ? `${color}66` : 'rgba(148,163,184,0.45)',
                  background: isCorrect ? `${color}18` : '#ffffff',
                }}
              >
                {/* Badge */}
                <div
                  className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: color }}
                >
                  {BADGE_LABELS[idx] ?? idx + 1}
                </div>

                {/* Text input */}
                <input
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none min-w-0"
                  value={c.text}
                  onChange={(e) => setChoiceText(c.id, e.target.value)}
                  placeholder={`Đáp án ${BADGE_LABELS[idx] ?? idx + 1}`}
                />

                {/* Correct toggle */}
                <button
                  type="button"
                  title={isCorrect ? 'Đáp án đúng' : 'Đánh dấu là đúng'}
                  onClick={() => setCorrect(c.id)}
                  className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center border transition-colors"
                  style={{
                    borderColor: isCorrect ? `${color}88` : 'rgba(148,163,184,0.55)',
                    background: isCorrect ? `${color}33` : 'transparent',
                    color: isCorrect ? color : 'rgba(71,85,105,0.7)',
                  }}
                >
                  <Check size={13} strokeWidth={2.5} />
                </button>

                {/* Remove */}
                {round.choices.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeChoice(c.id)}
                    className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Drag Drop Editor ──────────────────────────────────────────────────────────

function DragRoundEditor({
  round,
  onChange,
}: {
  round: DragRound;
  onChange: (r: DragRound) => void;
}) {
  const setPrompt = (prompt: string) => onChange({ ...round, prompt });

  // Update item label
  const setItemLabel = (id: string, label: string) =>
    onChange({ ...round, items: round.items.map((it) => (it.id === id ? { ...it, label } : it)) });

  // Update zone label
  const setZoneLabel = (id: string, label: string) =>
    onChange({ ...round, dropZones: round.dropZones.map((z) => (z.id === id ? { ...z, label } : z)) });

  // Swap which zone accepts an item (re-link)
  const setZoneAccepts = (zoneId: string, acceptsItemId: string) => {
    // Unlink any other zone that was pointing to this item
    const nextZones = round.dropZones.map((z) => {
      if (z.id === zoneId) return { ...z, acceptsItemId };
      if (z.acceptsItemId === acceptsItemId) return { ...z, acceptsItemId: '' };
      return z;
    });
    onChange({ ...round, dropZones: nextZones });
  };

  // Add a new pair
  const addPair = () => {
    if (round.items.length >= 6) return;
    const newItemId = uid();
    const newZoneId = uid();
    onChange({
      ...round,
      items: [...round.items, { id: newItemId, label: `Khái niệm ${round.items.length + 1}` }],
      dropZones: [...round.dropZones, { id: newZoneId, label: `Nội dung ${round.dropZones.length + 1}`, acceptsItemId: newItemId }],
    });
  };

  // Remove a pair by item id
  const removePair = (itemId: string) => {
    if (round.items.length <= 2) return;
    onChange({
      ...round,
      items: round.items.filter((it) => it.id !== itemId),
      dropZones: round.dropZones.filter((z) => z.acceptsItemId !== itemId),
    });
  };

  return (
    <div className="space-y-4">
      {/* Prompt */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
          Câu hỏi / Chủ đề
        </label>
        <textarea
          className="w-full rounded-xl px-3 py-2.5 text-sm text-slate-900 bg-white border border-slate-300 focus:outline-none focus:border-blue-500 resize-none leading-relaxed"
          rows={2}
          value={round.prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Nhập câu hỏi hoặc chủ đề nối..."
        />
      </div>

      {/* Pairs */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Các cặp nối (tối đa 6)
          </label>
          {round.items.length < 6 && (
            <button
              type="button"
              onClick={addPair}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors"
            >
              <Plus size={11} />
              Thêm cặp
            </button>
          )}
        </div>

        {/* Header row */}
        <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 mb-1 px-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Khái niệm (trái)</span>
          <span />
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Nối với (phải)</span>
          <span />
        </div>

        <div className="space-y-2">
          {round.items.map((item, idx) => {
            // Find the zone that accepts this item
            const zone = round.dropZones.find((z) => z.acceptsItemId === item.id);
            const PAIR_COLORS = ['#60a5fa', '#a78bfa', '#34d399', '#fb923c', '#f472b6', '#facc15'];
            const color = PAIR_COLORS[idx % PAIR_COLORS.length];

            return (
              <div key={item.id} className="grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
                {/* Left: item label */}
                <input
                  className="rounded-lg px-2.5 py-2 text-sm text-slate-900 bg-white border border-slate-300 focus:outline-none focus:border-blue-500 w-full"
                  value={item.label}
                  onChange={(e) => setItemLabel(item.id, e.target.value)}
                  placeholder="Khái niệm..."
                />

                {/* Arrow */}
                <div className="shrink-0 flex items-center justify-center w-6">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                  <div className="w-3 h-px mx-0.5" style={{ background: color }} />
                  <div
                    className="w-0 h-0"
                    style={{
                      borderTop: '4px solid transparent',
                      borderBottom: '4px solid transparent',
                      borderLeft: `5px solid ${color}`,
                    }}
                  />
                </div>

                {/* Right: zone label */}
                <input
                  className="rounded-lg px-2.5 py-2 text-sm text-slate-900 bg-white border border-slate-300 focus:outline-none focus:border-blue-500 w-full"
                  value={zone?.label ?? ''}
                  onChange={(e) => zone && setZoneLabel(zone.id, e.target.value)}
                  placeholder="Nội dung tương ứng..."
                />

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removePair(item.id)}
                  disabled={round.items.length <= 2}
                  className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-100 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Editor ───────────────────────────────────────────────────────────────

export function GameEditorView({
  playable,
  onStart,
  onExportGameEduvi,
  isExportingGameEduvi = false,
  productName,
  onSave,
}: Props) {
  const [edited, setEdited] = React.useState<GameEditorPlayable>(() => cloneDeep(playable));

  // Rounds as array regardless of single/multi
  const rawPayload = edited.payload;
  const rounds: unknown[] = Array.isArray(rawPayload) ? rawPayload : [rawPayload];
  const [activeRound, setActiveRound] = React.useState(0);

  const isHover = edited.templateId === 'HOVER_SELECT';
  const isDrag  = edited.templateId === 'DRAG_DROP';

  const updateRound = (idx: number, next: unknown) => {
    const nextRounds = rounds.map((r, i) => (i === idx ? next : r));
    setEdited((prev) => ({
      ...prev,
      payload: Array.isArray(rawPayload) ? nextRounds : nextRounds[0],
    }));
  };

  const handleStart = async () => {
    if (onSave) {
      try { await onSave(edited); } catch { /* ignore save error, still start */ }
    }
    onStart(edited);
  };
  const handleExportGameEduvi = () => {
    if (!onExportGameEduvi || isExportingGameEduvi) return;
    onExportGameEduvi(edited);
  };

  const canStart = (() => {
    if (isHover) {
      return rounds.every((r) => {
        const hr = r as HoverRound;
        return hr.prompt?.trim() && hr.choices?.length >= 2 && hr.correctChoiceId;
      });
    }
    if (isDrag) {
      return rounds.every((r) => {
        const dr = r as DragRound;
        return dr.prompt?.trim() && dr.items?.length >= 2 && dr.dropZones?.length >= 2;
      });
    }
    return true;
  })();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-50 overflow-hidden">

      {/* ── Header ── */}
      <div
        className="shrink-0 flex items-center justify-between h-14 px-5 border-b"
        style={{ background: '#ffffff', borderColor: 'rgba(148,163,184,0.35)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl leading-none select-none">✏️</span>
          <div>
            <p className="text-slate-800 font-semibold text-sm leading-tight">Chỉnh sửa nội dung game</p>
            <p className="text-slate-500 text-xs">
              {isHover ? 'Trắc nghiệm (Giơ tay chọn)' : isDrag ? 'Nối cặp (Kéo thả)' : edited.templateId}
              {rounds.length > 1 ? ` · ${rounds.length} câu` : ''}
              {productName ? ` · ${productName}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportGameEduvi}
            disabled={isExportingGameEduvi}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 border border-slate-300 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExportingGameEduvi ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Xuất game .eduvi
          </button>

          {/* Start button */}
          <button
            type="button"
            disabled={!canStart}
            onClick={handleStart}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-150 hover:scale-[1.03] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            style={{
              background: canStart
                ? 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)'
                : 'rgba(148,163,184,0.65)',
              boxShadow: canStart ? '0 4px 18px rgba(79,70,229,0.45)' : 'none',
            }}
          >
            <Play size={14} strokeWidth={2.5} />
            Bắt đầu
          </button>
        </div>
      </div>

      {/* ── Round tabs (if multi-round) ── */}
      {rounds.length > 1 && (
        <div
          className="shrink-0 flex items-center gap-1 px-4 py-2 border-b overflow-x-auto"
          style={{ borderColor: 'rgba(148,163,184,0.3)', background: 'rgba(248,250,252,0.85)' }}
        >
          {rounds.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveRound(i)}
              className="shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{
                background: activeRound === i ? 'rgba(59,130,246,0.25)' : 'transparent',
                color: activeRound === i ? '#2563eb' : 'rgba(71,85,105,0.8)',
                border: `1px solid ${activeRound === i ? 'rgba(96,165,250,0.4)' : 'transparent'}`,
              }}
            >
              Câu {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* ── Editor body ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-5 py-6">

          {/* Round editor */}
          {isHover && (
            <HoverRoundEditor
              key={activeRound}
              round={rounds[activeRound] as HoverRound}
              onChange={(r) => updateRound(activeRound, r)}
            />
          )}

          {isDrag && (
            <DragRoundEditor
              key={activeRound}
              round={rounds[activeRound] as DragRound}
              onChange={(r) => updateRound(activeRound, r)}
            />
          )}

          {!isHover && !isDrag && (
            <div className="text-center text-slate-500 text-sm py-16">
              Loại game <strong className="text-slate-700">{edited.templateId}</strong> chưa hỗ trợ chỉnh sửa trực tiếp.
              <br />
              <button
                type="button"
                onClick={handleStart}
                className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #2563eb, #4f46e5)', boxShadow: '0 4px 18px rgba(79,70,229,0.45)' }}
              >
                <Play size={14} />
                Bắt đầu ngay
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
