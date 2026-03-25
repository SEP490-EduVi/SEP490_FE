'use client';

/**
 * Sidebar Component
 * =================
 *
 * Thanh bên trái hiển thị danh sách trang trình bày.
 * Hỗ trợ kéo-thả để sắp xếp lại thứ tự trang.
 */

import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { useDocumentStore } from '@/store';
import {
  ICard, ILayout, IBlock, NodeType,
  ITextContent, IHeadingContent, IImageContent, IVideoContent,
  IQuizContent, IFlashcardContent, IFillBlankContent,
  BlockType, LayoutVariant,
} from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// THUMBNAIL RENDERER — read-only, no dnd-kit, CSS-scaled to fit
// ============================================================================

const SLIDE_W = 700;
const SLIDE_H = 540;
const THUMB_W = 180;
const THUMB_H = 90;
const SCALE = THUMB_W / SLIDE_W; // ~0.167

/** Recursively render a layout/block node without any interactive hooks */
function ThumbnailNode({ node }: { node: ILayout | IBlock }) {
  if (node.type === NodeType.LAYOUT) {
    const layout = node as ILayout;
    const isMultiCol =
      layout.variant === LayoutVariant.TWO_COLUMN ||
      layout.variant === LayoutVariant.THREE_COLUMN ||
      layout.variant === LayoutVariant.SIDEBAR_LEFT ||
      layout.variant === LayoutVariant.SIDEBAR_RIGHT;

    const widths = layout.columnWidths;
    const children = layout.children as (ILayout | IBlock)[];

    if (isMultiCol) {
      return (
        <div style={{ display: 'flex', gap: 16, width: '100%' }}>
          {children.map((child, i) => (
            <div
              key={child.id}
              style={{ flex: widths ? `0 0 ${widths[i]}%` : 1, minWidth: 0, overflow: 'hidden' }}
            >
              <ThumbnailNode node={child} />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {children.map((child) => (
          <ThumbnailNode key={child.id} node={child} />
        ))}
      </div>
    );
  }

  // BLOCK
  const block = node as IBlock;
  const content = block.content;
  if (!content) return null;

  if (content.type === BlockType.HEADING) {
    const c = content as IHeadingContent;
    const sizes: Record<number, number> = { 1: 36, 2: 30, 3: 24, 4: 20, 5: 18, 6: 16 };
    return (
      <div
        style={{ fontSize: sizes[c.level] ?? 28, fontWeight: 700, lineHeight: 1.2, color: '#1e293b', overflow: 'hidden' }}
        dangerouslySetInnerHTML={{ __html: c.html }}
      />
    );
  }

  if (content.type === BlockType.TEXT) {
    const c = content as ITextContent;
    return (
      <div
        style={{ fontSize: 14, lineHeight: 1.6, color: '#334155', overflow: 'hidden' }}
        dangerouslySetInnerHTML={{ __html: c.html }}
      />
    );
  }

  if (content.type === BlockType.IMAGE) {
    const c = content as IImageContent;
    return c.src ? (
      <img
        src={c.src}
        alt={c.alt}
        style={{ width: '100%', height: 'auto', objectFit: 'cover', borderRadius: 8, display: 'block' }}
      />
    ) : (
      <div style={{ width: '100%', height: 120, background: '#e2e8f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#94a3b8', fontSize: 12 }}>Hình ảnh</span>
      </div>
    );
  }

  if (content.type === BlockType.VIDEO) {
    return (
      <div style={{ width: '100%', aspectRatio: '16/9', background: '#0f172a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#60a5fa', fontSize: 12 }}>▶ Video</span>
      </div>
    );
  }

  if (content.type === BlockType.QUIZ) {
    const c = content as IQuizContent;
    return (
      <div style={{ background: '#eff6ff', borderRadius: 8, padding: 12, border: '1px solid #bfdbfe' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1d4ed8', marginBottom: 6 }}>{c.title || 'Câu hỏi'}</div>
        {c.questions.slice(0, 2).map((q, i) => (
          <div key={i} style={{ fontSize: 12, color: '#334155', marginBottom: 4 }}>• {q.question}</div>
        ))}
      </div>
    );
  }

  if (content.type === BlockType.FLASHCARD) {
    const c = content as IFlashcardContent;
    return (
      <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 12, border: '1px solid #bbf7d0', display: 'flex', gap: 8 }}>
        <div style={{ flex: 1, fontSize: 12, color: '#166534' }} dangerouslySetInnerHTML={{ __html: c.front }} />
        <div style={{ width: 1, background: '#86efac' }} />
        <div style={{ flex: 1, fontSize: 12, color: '#15803d' }} dangerouslySetInnerHTML={{ __html: c.back }} />
      </div>
    );
  }

  if (content.type === BlockType.FILL_BLANK) {
    const c = content as IFillBlankContent;
    return (
      <div style={{ background: '#fef9c3', borderRadius: 8, padding: 12, border: '1px solid #fde047', fontSize: 12, color: '#713f12' }}>
        {c.sentence}
      </div>
    );
  }

  return null;
}

function SlideThumbnailPreview({ card, isActive }: { card: ICard; isActive: boolean }) {
  return (
    <div
      className={cn(
        'flex-shrink-0 rounded overflow-hidden border-2 relative',
        isActive ? 'border-blue-500' : 'border-gray-200'
      )}
      style={{ width: THUMB_W, height: THUMB_H }}
    >
      {/* Full-size slide rendered at SLIDE_W × SLIDE_H then scaled down */}
      <div
        style={{
          width: SLIDE_W,
          height: SLIDE_H,
          transform: `scale(${SCALE})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          backgroundColor: (card.backgroundColor === '#1e293b' ? '#ffffff' : card.backgroundColor) || '#ffffff',
          backgroundImage: card.backgroundImage ? `url(${card.backgroundImage})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          padding: 40,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          overflow: 'hidden',
        }}
      >
        {(card.children as (ILayout | IBlock)[]).map((child) => (
          <ThumbnailNode key={child.id} node={child} />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// SORTABLE SLIDE ITEM
// ============================================================================

interface SlideItemProps {
  card: ICard;
  index: number;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

function SlideItem({ card, index, isActive, onClick, onDelete }: SlideItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative flex items-center gap-1 p-2 rounded-lg cursor-pointer group',
        'transition-all duration-150',
        isActive
          ? 'bg-blue-50 border-2 border-blue-500'
          : 'bg-white border-2 border-transparent hover:border-gray-300 hover:bg-gray-50',
        isDragging && 'opacity-50 shadow-lg'
      )}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      {/* Slide thumbnail — real content preview */}
      <SlideThumbnailPreview card={card} isActive={isActive} />

      {/* Delete button — shown on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-1 right-1 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-100 text-gray-400 hover:text-red-500 transition-all flex-shrink-0"
        title="Xóa trang"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}

// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================

export function Sidebar() {
  const document = useDocumentStore((state) => state.document);
  const activeCardId = useDocumentStore((state) => state.activeCardId);
  const setActiveCard = useDocumentStore((state) => state.setActiveCard);
  const addCard = useDocumentStore((state) => state.addCard);
  const deleteNode = useDocumentStore((state) => state.deleteNode);
  const reorderCards = useDocumentStore((state) => state.reorderCards);
  const isGenerating = useDocumentStore((state) => state.isGenerating);
  const revealedCardCount = useDocumentStore((state) => state.revealedCardCount);

  const slideListRef = React.useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      reorderCards(active.id as string, over.id as string);
    }
  };

  if (!document) {
    return (
      <aside className="w-64 bg-surface-secondary border-r border-border p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded" />
          <div className="h-20 bg-gray-200 rounded" />
          <div className="h-20 bg-gray-200 rounded" />
        </div>
      </aside>
    );
  }

  // During generation, only show revealed cards
  const visibleCards =
    isGenerating && revealedCardCount < document.cards.length
      ? document.cards.slice(0, revealedCardCount)
      : document.cards;

  return (
    <aside className="w-64 bg-surface-secondary border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-base font-bold text-gray-800">
          Trang trình bày
        </h2>
        <p className="text-xs text-gray-400 mt-0.5">
          {isGenerating && revealedCardCount < document.cards.length
            ? `${revealedCardCount} / ${document.cards.length} trang`
            : `${document.cards.length} trang`}
        </p>
      </div>

      {/* Slides list */}
      <div ref={slideListRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibleCards.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <AnimatePresence initial={false}>
              {visibleCards.map((card, index) => (
                <motion.div
                  key={card.id}
                  data-sidebar-card={card.id}
                  initial={isGenerating ? { opacity: 0, x: -40, scale: 0.9 } : false}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                >
                  <SlideItem
                    card={card}
                    index={index}
                    isActive={card.id === activeCardId}
                    onClick={() => setActiveCard(card.id)}
                    onDelete={() => deleteNode(card.id)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </SortableContext>
        </DndContext>
      </div>

      {/* Add slide button */}
      <div className="p-3 border-t border-border">
        <button
          onClick={() => addCard()}
          disabled={isGenerating}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg',
            'font-semibold text-sm transition-all duration-150',
            isGenerating
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:from-blue-700 hover:to-cyan-600 shadow-sm hover:shadow-md'
          )}
        >
          <Plus className="w-4 h-4" />
          Thêm trang mới
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
