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
import { ICard, ILayout, IBlock, NodeType } from '@/types';
import { Plus, GripVertical, Trash2, FileText, Image as ImageIcon, Video, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// SLIDE THUMBNAIL PREVIEW
// ============================================================================

/**
 * Renders a miniature visual preview of a slide card.
 * Shows background color, simulated content lines, and block-type indicators.
 */
function SlideThumbnailPreview({ card, isActive }: { card: ICard; isActive: boolean }) {
  // Count block types recursively
  const countBlockTypes = (children: (ILayout | IBlock)[]) => {
    let hasImage = false;
    let hasVideo = false;
    let hasInteractive = false;
    let textLineCount = 0;

    const traverse = (nodes: (ILayout | IBlock)[]) => {
      for (const node of nodes) {
        if (node.type === NodeType.BLOCK) {
          const block = node as IBlock;
          const ct = block.content?.type;
          if (ct === 'IMAGE') hasImage = true;
          else if (ct === 'VIDEO') hasVideo = true;
          else if (ct === 'QUIZ' || ct === 'FLASHCARD' || ct === 'FILL_BLANK') hasInteractive = true;
          else if (ct === 'TEXT' || ct === 'HEADING') textLineCount++;
        }
        if (node.type === NodeType.LAYOUT) {
          traverse((node as ILayout).children as (ILayout | IBlock)[]);
        }
      }
    };

    traverse(children);
    return { hasImage, hasVideo, hasInteractive, textLineCount };
  };

  const { hasImage, hasVideo, hasInteractive, textLineCount } =
    countBlockTypes(card.children as (ILayout | IBlock)[]);

  const hasAnyContent = card.children.length > 0;

  return (
    <div
      className={cn(
        'flex-shrink-0 w-20 h-[54px] rounded overflow-hidden border-2 relative',
        isActive ? 'border-primary-500' : 'border-gray-200'
      )}
      style={{
        backgroundColor: card.backgroundColor || (isActive ? '#ffe4e6' : '#f5f5f5'),
        backgroundImage: card.backgroundImage ? `url(${card.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {hasAnyContent ? (
        <div className="absolute inset-0 p-1.5 flex flex-col gap-1">
          {/* Simulated text content lines */}
          {textLineCount > 0 && (
            <>
              <div
                className={cn('h-1.5 rounded-sm w-4/5', isActive ? 'bg-primary-400' : 'bg-gray-400')}
              />
              <div
                className={cn('h-1 rounded-sm w-full', isActive ? 'bg-primary-300' : 'bg-gray-300')}
              />
              {textLineCount > 1 && (
                <div
                  className={cn('h-1 rounded-sm w-3/4', isActive ? 'bg-primary-200' : 'bg-gray-200')}
                />
              )}
            </>
          )}
          {/* Block type icon indicators */}
          <div className="flex gap-1 mt-auto">
            {hasImage && <ImageIcon className="w-3 h-3 text-blue-400 opacity-80" />}
            {hasVideo && <Video className="w-3 h-3 text-red-400 opacity-80" />}
            {hasInteractive && <HelpCircle className="w-3 h-3 text-green-500 opacity-80" />}
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <FileText className="w-5 h-5 text-gray-300" />
        </div>
      )}
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
        'relative flex items-center gap-2 p-2 rounded-lg cursor-pointer',
        'transition-all duration-150',
        isActive
          ? 'bg-primary-50 border-2 border-primary-500'
          : 'bg-white border-2 border-transparent hover:border-gray-300 hover:bg-gray-50',
        isDragging && 'opacity-50 shadow-lg'
      )}
      onClick={onClick}
    >
      {/* Drag handle — always visible so teachers know it's draggable */}
      <button
        {...attributes}
        {...listeners}
        className="p-1 rounded hover:bg-gray-200 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
        title="Kéo để sắp xếp"
      >
        <GripVertical className="w-4 h-4" />
      </button>

      {/* Slide thumbnail — real content preview */}
      <SlideThumbnailPreview card={card} isActive={isActive} />

      {/* Slide info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate leading-tight">
          {card.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">
          Trang {index + 1}
        </p>
      </div>

      {/* Delete button — always visible (muted colour, not hidden) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="p-1 rounded hover:bg-red-100 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
        title="Xóa trang"
      >
        <Trash2 className="w-4 h-4" />
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
              : 'bg-gradient-to-r from-rose-500 to-violet-500 text-white hover:from-rose-600 hover:to-violet-600 shadow-sm hover:shadow-md'
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
