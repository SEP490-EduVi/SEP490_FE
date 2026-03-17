'use client';

/**
 * Toolbar Component
 * =================
 *
 * Two-row toolbar:
 *  Row 1 (header): Logo / doc title / undo-redo / online users / present / share
 *  Row 2 (insert bar): Quick-insert buttons for teachers (Tiêu đề, Văn bản, …)
 */

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { useDocumentStore } from '@/store';
import { BlockType, LayoutVariant } from '@/types';
import { exportToEduvi } from '@/lib/exportToEduvi';
import {
  Undo2,
  Redo2,
  Play,
  ShoppingBag,
  Heading1,
  AlignLeft,
  Image as ImageIcon,
  Video,
  HelpCircle,
  CreditCard,
  PenLine,
  ChevronDown,
  Save,
  Loader2,
} from 'lucide-react';

// ============================================================================
// INSERT BUTTON — large, icon + label, used in the secondary toolbar
// ============================================================================

interface InsertButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  accent?: boolean;
}

function InsertButton({ icon, label, onClick, disabled, accent }: InsertButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg',
        'text-sm font-medium transition-all duration-150',
        disabled
          ? 'text-gray-300 cursor-not-allowed'
          : accent
          ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
          : 'text-slate-600 hover:bg-gray-100 hover:text-blue-500'
      )}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function InsertDivider() {
  return <div className="w-px h-6 bg-gray-200 mx-1 flex-shrink-0" />;
}

// ============================================================================
// BACKGROUND COLOR PICKER
// ============================================================================

const SLIDE_BG_COLORS = [
  { label: 'Trắng', value: '#ffffff' },
  { label: 'Xám nhạt', value: '#f8fafc' },
  { label: 'Vàng nhạt', value: '#fefce8' },
  { label: 'Xanh nhạt', value: '#eff6ff' },
  { label: 'Hồng nhạt', value: '#fff1f2' },
  { label: 'Xanh lá', value: '#f0fdf4' },
  { label: 'Tím nhạt', value: '#faf5ff' },
  { label: 'Cam nhạt', value: '#fff7ed' },
  { label: 'Đen', value: '#0f172a' },
  { label: 'Xám đậm', value: '#1e293b' },
  { label: 'Xanh đậm', value: '#1e3a5f' },
  { label: 'Đỏ đậm', value: '#7f1d1d' },
];

function BgColorPicker({
  currentColor,
  onApplyCurrent,
  onApplyAll,
}: {
  currentColor: string;
  onApplyCurrent: (color: string) => void;
  onApplyAll: (color: string) => void;
}) {
  const [selected, setSelected] = useState(currentColor || '#ffffff');

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Màu nền slide</p>
      <div className="grid grid-cols-6 gap-1.5">
        {SLIDE_BG_COLORS.map((c) => (
          <button
            key={c.value}
            title={c.label}
            onClick={() => setSelected(c.value)}
            className={cn(
              'w-7 h-7 rounded border-2 transition-all hover:scale-110',
              selected === c.value
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-200'
            )}
            style={{ backgroundColor: c.value }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 flex-shrink-0">Tuỳ chỉnh:</label>
        <input
          type="color"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-7 h-7 rounded border border-gray-200 cursor-pointer p-0 flex-shrink-0"
        />
        <span className="text-xs text-gray-400 font-mono truncate">{selected}</span>
      </div>
      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <button
          onClick={() => onApplyCurrent(selected)}
          className="flex-1 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
        >
          Slide này
        </button>
        <button
          onClick={() => onApplyAll(selected)}
          className="flex-1 py-1.5 rounded-lg bg-slate-700 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
        >
          Tất cả
        </button>
      </div>
    </div>
  );
}

export function Toolbar() {
  const activeCardId = useDocumentStore((state) => state.activeCardId);
  const addBlockToCard = useDocumentStore((state) => state.addBlockToCard);
  const addLayoutToCard = useDocumentStore((state) => state.addLayoutToCard);
  const addCardFromTemplate = useDocumentStore((state) => state.addCardFromTemplate);
  const document = useDocumentStore((state) => state.document);
  const startPresentation = useDocumentStore((state) => state.startPresentation);
  const canUndo = useDocumentStore((state) => state.canUndo());
  const canRedo = useDocumentStore((state) => state.canRedo());
  const onlineUsers = useDocumentStore((state) => state.onlineUsers);
  const setCardContentAlignment = useDocumentStore((state) => state.setCardContentAlignment);
  const setCardBackground = useDocumentStore((state) => state.setCardBackground);
  const currentProductCode = useDocumentStore((state) => state.currentProductCode);
  const isSaving = useDocumentStore((state) => state.isSaving);
  const saveSlide = useDocumentStore((state) => state.saveSlide);

  const activeCard = document?.cards.find((c) => c.id === activeCardId);
  const currentAlignment = activeCard?.contentAlignment ?? 'center';
  const currentBgColor = activeCard?.backgroundColor ?? '';
  const hasActiveCard = !!activeCardId;

  const [showBgPicker, setShowBgPicker] = useState(false);
  const bgPickerRef = useRef<HTMLDivElement>(null);
  const bgButtonRef = useRef<HTMLButtonElement>(null);
  const [bgPickerPos, setBgPickerPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bgPickerRef.current && !bgPickerRef.current.contains(e.target as Node) &&
          bgButtonRef.current && !bgButtonRef.current.contains(e.target as Node)) {
        setShowBgPicker(false);
      }
    };
    if (showBgPicker) window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [showBgPicker]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useDocumentStore.getState().undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        useDocumentStore.getState().redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        useDocumentStore.getState().saveSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAddBlock = (blockType: BlockType) => {
    if (activeCardId) {
      addBlockToCard(activeCardId, blockType);
    }
  };

  const handleAddLayout = (variant: LayoutVariant) => {
    if (activeCardId) {
      addLayoutToCard(activeCardId, variant);
    }
  };

  const handleAddTemplate = (templateType: string) => {
    addCardFromTemplate(templateType);
  };

  return (
    <div className="flex flex-col shadow-md">
      {/* ── Row 1: Main navigation bar ────────────────────────────────────── */}
      <header className="h-14 bg-gradient-to-r from-[#0d3349] via-[#1a5276] to-[#2980b9] px-4 flex items-center justify-between">
        {/* Left: menu + title + undo/redo */}
        <div className="flex items-center gap-3">
          <button
            className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
            title="Menu"
          >
            <div className="w-5 h-5 flex flex-col justify-center gap-1">
              <div className="w-full h-0.5 bg-white rounded" />
              <div className="w-full h-0.5 bg-white rounded" />
              <div className="w-full h-0.5 bg-white rounded" />
            </div>
          </button>

          <h1 className="text-base font-semibold text-white max-w-[200px] truncate">
            {document?.title || 'EduVi'}
          </h1>

          <div className="flex items-center gap-1 ml-1">
            <button
              onClick={() => useDocumentStore.getState().undo()}
              disabled={!canUndo}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-white transition-colors',
                canUndo ? 'hover:bg-white/15' : 'opacity-40 cursor-not-allowed'
              )}
              title="Hoàn tác (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
              <span>Hoàn tác</span>
            </button>
            <button
              onClick={() => useDocumentStore.getState().redo()}
              disabled={!canRedo}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-white transition-colors',
                canRedo ? 'hover:bg-white/15' : 'opacity-40 cursor-not-allowed'
              )}
              title="Làm lại (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
              <span>Làm lại</span>
            </button>
          </div>
        </div>

        {/* Right: online users + action buttons */}
        <div className="flex items-center gap-3">
          {/* Online Users */}
          <div className="flex items-center -space-x-2">
            {onlineUsers.slice(0, 3).map((user) => (
              <div
                key={user.id}
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold border-2 border-white shadow-sm',
                  user.color
                )}
                title={user.name}
              >
                {user.avatar}
              </div>
            ))}
            {onlineUsers.length > 3 && (
              <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white text-xs font-semibold border-2 border-white shadow-sm">
                +{onlineUsers.length - 3}
              </div>
            )}
          </div>

          <button
            onClick={() => window.location.href = '/shop'}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/15 hover:bg-white/25 text-white font-semibold text-sm transition-colors"
            title="Shop"
          >
            <ShoppingBag className="w-4 h-4" />
            Shop
          </button>

          <button
            onClick={startPresentation}
            disabled={!document || !document.cards.length}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              'bg-white/15 hover:bg-white/25 text-white font-semibold text-sm transition-colors',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
            title="Thuyết trình"
          >
            <Play className="w-4 h-4" />
            Thuyết trình
          </button>

          <button
            onClick={saveSlide}
            disabled={!document || !currentProductCode || isSaving}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              'bg-white/15 hover:bg-white/25 text-white font-semibold text-sm transition-colors',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
            title="Lưu (Ctrl+S)"
          >
            {isSaving
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Save className="w-4 h-4" />}
            Lưu
          </button>

          <button
            onClick={() => {
              if (document) exportToEduvi(document);
            }}
            disabled={!document}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              'bg-white text-blue-700 hover:bg-blue-50 font-semibold text-sm transition-colors shadow-sm',
              'disabled:opacity-40 disabled:cursor-not-allowed'
            )}
            title="Chia sẻ"
          >
            Chia sẻ
          </button>
        </div>
      </header>

      {/* ── Row 2: Insert toolbar ──────────────────────────────────────────── */}
      <div className="h-11 bg-white border-b border-gray-200 px-4 flex items-center gap-1 overflow-x-auto">
        <span className="text-sm font-semibold text-gray-500 mr-2 flex-shrink-0 select-none">
          Chèn:
        </span>

        {/* Text blocks */}
        <InsertButton
          icon={<Heading1 className="w-4 h-4" />}
          label="Tiêu đề"
          onClick={() => handleAddBlock(BlockType.HEADING)}
          disabled={!hasActiveCard}
        />
        <InsertButton
          icon={<AlignLeft className="w-4 h-4" />}
          label="Văn bản"
          onClick={() => handleAddBlock(BlockType.TEXT)}
          disabled={!hasActiveCard}
        />
        <InsertButton
          icon={<ImageIcon className="w-4 h-4" />}
          label="Hình ảnh"
          onClick={() => handleAddBlock(BlockType.IMAGE)}
          disabled={!hasActiveCard}
        />
        <InsertButton
          icon={<Video className="w-4 h-4" />}
          label="Video"
          onClick={() => handleAddBlock(BlockType.VIDEO)}
          disabled={!hasActiveCard}
        />

        <InsertDivider />

        {/* Background color */}
        <div className="relative flex-shrink-0">
          <button
            ref={bgButtonRef}
            onClick={() => {
              if (!showBgPicker && bgButtonRef.current) {
                const rect = bgButtonRef.current.getBoundingClientRect();
                setBgPickerPos({ top: rect.bottom + 4, left: rect.left });
              }
              setShowBgPicker((v) => !v);
            }}
            disabled={!hasActiveCard}
            title="Màu nền slide"
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
              !hasActiveCard
                ? 'text-gray-300 cursor-not-allowed'
                : showBgPicker
                ? 'bg-gray-100 text-slate-700'
                : 'text-slate-600 hover:bg-gray-100 hover:text-blue-500'
            )}
          >
            <span
              className="w-4 h-4 rounded border border-gray-300 flex-shrink-0"
              style={{ backgroundColor: currentBgColor || '#ffffff' }}
            />
            <span>Màu nền</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showBgPicker && typeof window !== 'undefined' && createPortal(
            <div
              ref={bgPickerRef}
              className="fixed z-[9999] bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-56"
              style={{ top: bgPickerPos.top, left: bgPickerPos.left }}
            >
              <BgColorPicker
                currentColor={currentBgColor}
                onApplyCurrent={(color) => {
                  if (activeCardId) setCardBackground(activeCardId, color);
                  setShowBgPicker(false);
                }}
                onApplyAll={(color) => {
                  setCardBackground(null, color);
                  setShowBgPicker(false);
                }}
              />
            </div>,
            globalThis.document.body
          )}
        </div>

        <InsertDivider />

        {/* Interactive blocks */}
        <InsertButton
          icon={<HelpCircle className="w-4 h-4" />}
          label="Thẻ câu hỏi"
          onClick={() => handleAddTemplate('quiz-card')}
          disabled={!hasActiveCard}
          accent
        />
        <InsertButton
          icon={<CreditCard className="w-4 h-4" />}
          label="Thẻ nhớ"
          onClick={() => handleAddTemplate('flashcard-card')}
          disabled={!hasActiveCard}
          accent
        />
        <InsertButton
          icon={<PenLine className="w-4 h-4" />}
          label="Điền từ"
          onClick={() => handleAddTemplate('fill-blank-card')}
          disabled={!hasActiveCard}
          accent
        />
      </div>
    </div>
  );
}

export default Toolbar;
