'use client';

/**
 * Toolbar Component
 * =================
 *
 * Two-row toolbar:
 *  Row 1 (header): Logo / doc title / undo-redo / online users / present / share
 *  Row 2 (insert bar): Quick-insert buttons for teachers (Tiêu đề, Văn bản, …)
 */

import React, { useEffect } from 'react';
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
  Columns2,
  Columns3,
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
          ? 'bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200'
          : 'text-gray-700 hover:bg-gray-100 hover:text-primary-700'
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
// TOOLBAR
// ============================================================================

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

  const hasActiveCard = !!activeCardId;

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useDocumentStore.getState().undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        useDocumentStore.getState().redo();
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
      <header className="h-14 bg-primary-700 px-4 flex items-center justify-between">
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
            onClick={() => {
              if (document) exportToEduvi(document);
            }}
            disabled={!document}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              'bg-white text-primary-700 hover:bg-gray-100 font-semibold text-sm transition-colors shadow-sm',
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
