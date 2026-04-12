'use client';

/**
 * NodeRenderer Component
 * ======================
 * 
 * The heart of EduVi's rendering system.
 * Recursively renders the node tree based on node.type.
 * 
 * Node Type Mapping:
 * ------------------
 * CARD   â†’ CardRenderer (slide container)
 * LAYOUT â†’ LayoutRenderer (structural container with Flex/Grid)
 * BLOCK  â†’ BlockRenderer (content: Text, Image, Video)
 * 
 * Reflow Logic:
 * -------------
 * All content uses standard CSS Flow (Flex/Grid).
 * When a Tiptap block expands, it naturally pushes siblings down.
 * NO absolute positioning is used for content elements.
 */

import React, { useRef, useState, useEffect, useCallback, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { useDocumentStore } from '@/store';
import {
  INode,
  ICard,
  ILayout,
  IBlock,
  NodeType,
  LayoutVariant,
  isCard,
  isLayout,
  isBlock,
  isTextContent,
  isHeadingContent,
  isImageContent,
  isVideoContent,
  isMaterialContent,
  isQuizContent,
  isFlashcardContent,
  isFillBlankContent,
  IBlockStyles,
} from '@/types';
import { TextBlock, HeadingBlock, ImageBlock, VideoBlock } from '@/components/blocks';
import { ResizableBlockWrapper } from '@/components/blocks/ResizableBlockWrapper';
import { renderWidget } from '@/components/widgets';
import { QuizBlock, FlashcardBlock, FillInBlankBlock } from '@/components/interactive';
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, LayoutGrid, X, Plus } from 'lucide-react';
import { ColumnStretchContext, useColumnStretch } from './ColumnStretchContext';

// Context that marks whether the current render tree is the active presentation slide.
// Consumed by VideoBlock to gate autoplay.
const ActiveSlideContext = createContext(false);
export function ActiveSlideProvider({ children }: { children: React.ReactNode }) {
  return <ActiveSlideContext.Provider value={true}>{children}</ActiveSlideContext.Provider>;
}

// ============================================================================
// LAYOUT PICKER MODAL
// ============================================================================

interface LayoutTemplate {
  label: string;
  variant: LayoutVariant;
  /** SVG preview node */
  preview: React.ReactNode;
}

const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    label: 'Hai cột',
    variant: LayoutVariant.TWO_COLUMN,
    preview: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        <rect x="4" y="4" width="52" height="72" rx="4" fill="#f3f4f6" />
        <rect x="8" y="8" width="44" height="28" rx="2" fill="#d1d5db" />
        <rect x="8" y="42" width="44" height="6" rx="2" fill="#9ca3af" />
        <rect x="8" y="52" width="36" height="5" rx="2" fill="#d1d5db" />
        <rect x="8" y="61" width="40" height="5" rx="2" fill="#d1d5db" />
        <rect x="64" y="4" width="52" height="72" rx="4" fill="#f3f4f6" />
        <rect x="68" y="8" width="44" height="28" rx="2" fill="#d1d5db" />
        <rect x="68" y="42" width="44" height="6" rx="2" fill="#9ca3af" />
        <rect x="68" y="52" width="36" height="5" rx="2" fill="#d1d5db" />
        <rect x="68" y="61" width="40" height="5" rx="2" fill="#d1d5db" />
      </svg>
    ),
  },
  {
    label: 'Ba cột',
    variant: LayoutVariant.THREE_COLUMN,
    preview: (
      <svg viewBox="0 0 120 80" className="w-full h-full" fill="none">
        <rect x="2" y="4" width="34" height="72" rx="3" fill="#f3f4f6" />
        <rect x="5" y="8" width="28" height="20" rx="2" fill="#d1d5db" />
        <rect x="5" y="32" width="28" height="5" rx="2" fill="#9ca3af" />
        <rect x="5" y="41" width="22" height="4" rx="2" fill="#d1d5db" />
        <rect x="5" y="49" width="26" height="4" rx="2" fill="#d1d5db" />
        <rect x="43" y="4" width="34" height="72" rx="3" fill="#f3f4f6" />
        <rect x="46" y="8" width="28" height="20" rx="2" fill="#d1d5db" />
        <rect x="46" y="32" width="28" height="5" rx="2" fill="#9ca3af" />
        <rect x="46" y="41" width="22" height="4" rx="2" fill="#d1d5db" />
        <rect x="46" y="49" width="26" height="4" rx="2" fill="#d1d5db" />
        <rect x="84" y="4" width="34" height="72" rx="3" fill="#f3f4f6" />
        <rect x="87" y="8" width="28" height="20" rx="2" fill="#d1d5db" />
        <rect x="87" y="32" width="28" height="5" rx="2" fill="#9ca3af" />
        <rect x="87" y="41" width="22" height="4" rx="2" fill="#d1d5db" />
        <rect x="87" y="49" width="26" height="4" rx="2" fill="#d1d5db" />
      </svg>
    ),
  },
];

interface LayoutPickerModalProps {
  onSelect: (variant: LayoutVariant) => void;
  onClose: () => void;
}

function LayoutPickerModal({ onSelect, onClose }: LayoutPickerModalProps) {
  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">Chọn bố cục trang</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <p className="text-xs text-gray-500 mb-4">Chọn số cột</p>
          <div className="grid grid-cols-2 gap-4">
            {LAYOUT_TEMPLATES.map((tpl, i) => (
              <button
                key={i}
                onClick={() => { onSelect(tpl.variant); onClose(); }}
                className="group flex flex-col items-center gap-2.5 p-3 rounded-xl border-2 border-gray-100 hover:border-blue-400 hover:shadow-md transition-all duration-150 focus:outline-none focus:border-blue-500"
              >
                <div className="w-full aspect-[3/2] rounded-lg overflow-hidden bg-gray-50 group-hover:bg-blue-50 transition-colors">
                  {tpl.preview}
                </div>
                <span className="text-xs font-medium text-gray-600 group-hover:text-blue-600 transition-colors text-center leading-tight">
                  {tpl.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ============================================================================
// PROPS INTERFACES
// ============================================================================

interface NodeRendererProps {
  node: INode;
  depth?: number;
}

interface SortableNodeProps {
  node: INode;
  depth?: number;
  parentLayoutId?: string;
  children: React.ReactNode;
}

// ============================================================================
// SORTABLE WRAPPER
// ============================================================================

/**
 * SortableNode wraps content with drag-and-drop functionality
 */
function SortableNode({ node, depth = 0, parentLayoutId, children }: SortableNodeProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: node.id,
    data: {
      parentLayoutId,
    },
  });

  const selectedNodeId = useDocumentStore((state) => state.selectedNodeId);
  const setSelectedNode = useDocumentStore((state) => state.setSelectedNode);
  const deleteNode = useDocumentStore((state) => state.deleteNode);
  const wrapNodeInLayout = useDocumentStore((state) => state.wrapNodeInLayout);
  const editingNodeId = useDocumentStore((state) => state.editingNodeId);
  const appMode = useDocumentStore((state) => state.appMode);
  const isPresenting = appMode === 'PRESENT';

  const isSelected = selectedNodeId === node.id;
  const isEditing = editingNodeId === node.id;
  const isColumnStretch = useColumnStretch();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null);
  const [showLayoutModal, setShowLayoutModal] = useState(false);

  useEffect(() => {
    if (!isSelected) {
      setToolbarPos(null);
      return;
    }

    const updatePos = () => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      const toolbarHeight = 44;
      const above = rect.top - toolbarHeight - 4;
      const top = above < 8 ? rect.bottom + 4 : above;
      const left = rect.left + rect.width / 2;
      setToolbarPos({ top, left });
    };

    updatePos();

    // Re-calculate on scroll (capture phase catches nested scroll containers)
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [isSelected]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const toolbarContent = (
    <>
      <button
        {...attributes}
        {...listeners}
        className="p-1.5 rounded hover:bg-gray-100 cursor-grab active:cursor-grabbing transition-colors"
        title="Di chuyển"
      >
        <GripVertical className="w-4 h-4 text-gray-600" />
      </button>

      <div className="w-px h-5 bg-gray-200 mx-0.5" />

      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowLayoutModal(true);
        }}
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 text-gray-600 transition-colors text-xs font-medium"
        title="Chọn bố cục"
      >
        <LayoutGrid className="w-4 h-4" />
        <span>Bố cục</span>
      </button>

      <div className="w-px h-5 bg-gray-200 mx-0.5" />

      <button
        onClick={(e) => {
          e.stopPropagation();
          deleteNode(node.id);
        }}
        className="p-1.5 rounded hover:bg-red-50 text-gray-600 hover:text-red-500 transition-colors"
        title="Xóa"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </>
  );

  return (
    <>
      {depth > 0 && isSelected && !isEditing && !isPresenting && toolbarPos && createPortal(
        <div
          className="fixed z-[9999] flex items-center gap-1 px-2 py-1.5 bg-white rounded-lg shadow-lg border border-gray-200 -translate-x-1/2"
          style={{ top: toolbarPos.top, left: toolbarPos.left }}
        >
          {toolbarContent}
        </div>,
        document.body
      )}
      {showLayoutModal && (
        <LayoutPickerModal
          onSelect={(variant) => {
            const activeCardId = useDocumentStore.getState().activeCardId;
            if (activeCardId) wrapNodeInLayout(activeCardId, node.id, variant);
          }}
          onClose={() => setShowLayoutModal(false)}
        />
      )}
      <div
        ref={(el) => {
          setNodeRef(el);
          (wrapperRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
        style={style}
        className={cn(
          'relative group',
          isColumnStretch && 'h-full',
          isDragging && 'opacity-50 z-50'
        )}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            setSelectedNode(node.id);
          }}
          className={isColumnStretch ? 'h-full' : undefined}
        >
          {children}
        </div>
      </div>
    </>
  );
}

// ============================================================================
// BLOCK RENDERER
// ============================================================================

/**
 * BlockRenderer handles leaf nodes (content blocks)
 */
function  BlockRenderer({ node }: { node: IBlock }) {
  const selectedNodeId = useDocumentStore((state) => state.selectedNodeId);
  const setSelectedNode = useDocumentStore((state) => state.setSelectedNode);
  const updateBlockStyles = useDocumentStore((state) => state.updateBlockStyles);
  const isActiveSlide = useContext(ActiveSlideContext);
  
  const isSelected = selectedNodeId === node.id;
  const { content, styles } = node;

  const handleSelect = () => setSelectedNode(node.id);

  // Handle style updates from ResizableBlockWrapper
  const handleStyleChange = (newStyles: Partial<IBlockStyles>) => {
    updateBlockStyles(node.id, newStyles);
  };

  // Render based on content type
  if (isTextContent(content)) {
    return (
      <ResizableBlockWrapper
        id={node.id}
        styles={styles}
        isSelected={isSelected}
        onStyleChange={handleStyleChange}
        onClick={handleSelect}
        minHeight={30}
      >
        <TextBlock
          id={node.id}
          content={content}
          isSelected={isSelected}
          onSelect={handleSelect}
        />
      </ResizableBlockWrapper>
    );
  }

  if (isHeadingContent(content)) {
    return (
      <ResizableBlockWrapper
        id={node.id}
        styles={styles}
        isSelected={isSelected}
        onStyleChange={handleStyleChange}
        onClick={handleSelect}
        minHeight={30}
      >
        <HeadingBlock
          id={node.id}
          content={content}
          isSelected={isSelected}
          onSelect={handleSelect}
        />
      </ResizableBlockWrapper>
    );
  }

  if (isImageContent(content)) {
    return (
      <ResizableBlockWrapper
        id={node.id}
        styles={styles}
        isSelected={isSelected}
        onStyleChange={handleStyleChange}
        onClick={handleSelect}
        minHeight={100}
      >
        <ImageBlock
          id={node.id}
          content={content}
          isSelected={isSelected}
          onSelect={handleSelect}
        />
      </ResizableBlockWrapper>
    );
  }

  if (isVideoContent(content)) {
    return (
      <ResizableBlockWrapper
        id={node.id}
        styles={styles}
        isSelected={isSelected}
        onStyleChange={handleStyleChange}
        onClick={handleSelect}
        minHeight={200}
      >
        <VideoBlock
          id={node.id}
          content={content}
          isSelected={isSelected}
          onSelect={handleSelect}
          isActiveSlide={isActiveSlide}
        />
      </ResizableBlockWrapper>
    );
  }

  // Handle Material blocks with Widget Registry
  if (isMaterialContent(content)) {
    const widgetElement = renderWidget(content.widgetType, content.data, {
      id: node.id,
      styles,
      isSelected,
      onSelect: handleSelect,
    });
    
    return (
      <ResizableBlockWrapper
        id={node.id}
        styles={styles}
        isSelected={isSelected}
        onStyleChange={handleStyleChange}
        onClick={handleSelect}
      >
        {widgetElement}
      </ResizableBlockWrapper>
    );
  }

  // Handle Interactive blocks (Quiz, Flashcard, Fill-in-Blank)
  if (isQuizContent(content)) {
    return (
      <QuizBlock
        id={node.id}
        data={content}
        isSelected={isSelected}
        onUpdate={(newData) => {
          useDocumentStore.getState().updateBlockContent(node.id, {
            ...content,
            ...newData,
          });
        }}
      />
    );
  }

  if (isFlashcardContent(content)) {
    return (
      <FlashcardBlock
        id={node.id}
        data={content}
        isSelected={isSelected}
        onUpdate={(newData) => {
          useDocumentStore.getState().updateBlockContent(node.id, {
            ...content,
            ...newData,
          });
        }}
      />
    );
  }

  if (isFillBlankContent(content)) {
    return (
      <FillInBlankBlock
        id={node.id}
        data={content}
        isSelected={isSelected}
        onUpdate={(newData) => {
          useDocumentStore.getState().updateBlockContent(node.id, {
            ...content,
            ...newData,
          });
        }}
      />
    );
  }

  // Fallback for unknown content types
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
      Unknown block type: {(content as any).type}
    </div>
  );
}

// ============================================================================
// LAYOUT RENDERER
// ============================================================================

/**
 * Get column count for a layout variant
 */
function getColumnCount(variant: LayoutVariant): number {
  switch (variant) {
    case LayoutVariant.TWO_COLUMN:
    case LayoutVariant.SIDEBAR_LEFT:
    case LayoutVariant.SIDEBAR_RIGHT:
      return 2;
    case LayoutVariant.THREE_COLUMN:
      return 3;
    default:
      return 1;
  }
}

/**
 * Default column widths (percentages) for each layout variant
 */
function getDefaultColumnWidths(variant: LayoutVariant, columnCount: number): number[] {
  switch (variant) {
    case LayoutVariant.SIDEBAR_LEFT:  return [33, 67];
    case LayoutVariant.SIDEBAR_RIGHT: return [67, 33];
    case LayoutVariant.THREE_COLUMN:  return [33.33, 33.33, 33.34];
    default: return Array(columnCount).fill(100 / columnCount);
  }
}

/**
 * ColumnDropZone - A droppable zone for a specific column in a layout
 */
function ColumnDropZone({ 
  layoutId, 
  columnIndex, 
  children 
}: { 
  layoutId: string; 
  columnIndex: number; 
  children: React.ReactNode[];
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `layout-${layoutId}-col-${columnIndex}`,
    data: {
      type: 'LAYOUT_COLUMN',
      layoutId,
      columnIndex,
      accepts: ['MATERIAL'],
    },
  });
  const isColumnStretch = useColumnStretch();

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[120px] rounded-lg transition-all duration-200 w-full',
        isColumnStretch ? 'flex-1 flex flex-col' : 'h-full',
        isOver && 'bg-blue-50 ring-2 ring-blue-400 ring-inset',
        children.length === 0 && !isOver && 'border-2 border-dashed border-gray-200'
      )}
    >
      {children.length > 0 ? (
        <div className={cn('flex flex-col gap-4', isColumnStretch ? 'flex-1' : 'h-full')}>
          {children}
        </div>
      ) : (
        <div
          className={cn(
            'flex items-center justify-center h-full min-h-[120px]',
            isOver ? 'text-blue-600' : 'text-gray-400'
          )}
        >
          <div className="text-center p-4">
            <Plus className="w-5 h-5 mx-auto mb-1" />
            <p className="text-xs">
              {isOver ? 'Thả vào đây' : 'Kéo thả widget'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * ColumnResizeDivider â€” draggable handle between two adjacent columns.
 * Calls updateLayoutColumnWidths with the new percentages on every mousemove.
 */
function ColumnResizeDivider({
  layoutId,
  dividerIndex,
  columnWidths,
  containerRef,
}: {
  layoutId: string;
  dividerIndex: number;
  columnWidths: number[];
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  const updateLayoutColumnWidths = useDocumentStore((s) => s.updateLayoutColumnWidths);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startWidths = useRef<number[]>([]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      isDragging.current = true;
      startX.current = e.clientX;
      startWidths.current = [...columnWidths];

      const handleMouseMove = (ev: MouseEvent) => {
        if (!isDragging.current || !containerRef.current) return;
        const containerWidth = containerRef.current.clientWidth;
        if (containerWidth === 0) return;

        const deltaX = ev.clientX - startX.current;
        const deltaPercent = (deltaX / containerWidth) * 100;
        const MIN_COL = 15;

        const newWidths = [...startWidths.current];
        newWidths[dividerIndex] = Math.max(MIN_COL, startWidths.current[dividerIndex] + deltaPercent);
        newWidths[dividerIndex + 1] = Math.max(MIN_COL, startWidths.current[dividerIndex + 1] - deltaPercent);

        // Re-normalise so columns always sum to 100%
        const total = newWidths.reduce((s, w) => s + w, 0);
        const normalized = newWidths.map((w) => (w / total) * 100);
        updateLayoutColumnWidths(layoutId, normalized);
      };

      const handleMouseUp = () => {
        isDragging.current = false;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [columnWidths, dividerIndex, layoutId, containerRef, updateLayoutColumnWidths]
  );

  return (
    <div
      className="absolute top-0 bottom-0 w-[10px] cursor-col-resize flex items-stretch justify-center group select-none z-20"
      style={{ right: '-5px' }}
      onMouseDown={handleMouseDown}
    >
      <div className="w-px bg-transparent group-hover:bg-blue-400 transition-colors duration-150" />
    </div>
  );
}

/**
 * LayoutRenderer handles container nodes with Flex/Grid layouts.
 */
function LayoutRenderer({ node, depth = 0 }: { node: ILayout; depth?: number }) {
  const selectedNodeId = useDocumentStore((state) => state.selectedNodeId);
  const setSelectedNode = useDocumentStore((state) => state.setSelectedNode);
  const isSelected = selectedNodeId === node.id;

  const columnCount = getColumnCount(node.variant);
  const containerRef = useRef<HTMLDivElement>(null);

  // Check if all children are LAYOUT nodes (nested layouts for columns)
  const childrenAreLayouts = node.children.every(child => isLayout(child));
  const parentIsColumnStretch = useColumnStretch();
  const stretchApplies = parentIsColumnStretch && columnCount === 1 && node.children.length === 1;

  // ---- SINGLE COLUMN ----
  if (columnCount === 1) {
    const childIds = node.children.map(child => child.id);
    return (
      <ColumnStretchContext.Provider value={stretchApplies}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            setSelectedNode(node.id);
          }}
          className={cn(
            'flex flex-col gap-4',
            stretchApplies && 'flex-1',
            isSelected && 'ring-2 ring-primary-300 ring-offset-2 rounded-lg',
            'transition-all duration-200'
          )}
        >
          {childrenAreLayouts ? (
            node.children.map((child) => (
              <div key={child.id} className={cn('min-w-0', stretchApplies && 'h-full')}>
                <NodeRenderer node={child as INode} depth={depth + 1} />
              </div>
            ))
          ) : (
            <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
              <ColumnDropZone layoutId={node.id} columnIndex={0}>
                {node.children.map((child) => (
                  <div key={child.id} className={cn('min-w-0', stretchApplies && 'h-full')}>
                    <SortableNode node={child as INode} depth={depth + 1} parentLayoutId={node.id}>
                      <NodeRenderer node={child as INode} depth={depth + 1} />
                    </SortableNode>
                  </div>
                ))}
              </ColumnDropZone>
            </SortableContext>
          )}
        </div>
      </ColumnStretchContext.Provider>
    );
  }

  // ---- MULTI-COLUMN: flex row with draggable column dividers ----
  const defaultWidths = getDefaultColumnWidths(node.variant, columnCount);
  const columnWidths = node.columnWidths ?? defaultWidths;

  // Build the content for each column
  let columnContents: React.ReactNode[];

  if (childrenAreLayouts && node.children.length <= columnCount) {
    // Each direct child is a column layout â€” wrap in card box with border
    columnContents = node.children.map((child) => (
      <ColumnStretchContext.Provider key={child.id} value={true}>
        <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 flex-1 min-h-[120px] flex flex-col">
          <NodeRenderer node={child as INode} depth={depth + 1} />
        </div>
      </ColumnStretchContext.Provider>
    ));
    // Pad missing columns with empty drop zones
    while (columnContents.length < columnCount) {
      const emptyIdx = columnContents.length;
      columnContents.push(
        <div key={`empty-${emptyIdx}`} className="bg-gray-50 border border-gray-200 rounded-xl p-4 h-full min-h-[120px]">
          <ColumnDropZone layoutId={node.id} columnIndex={emptyIdx}>
            {[]}
          </ColumnDropZone>
        </div>
      );
    }
  } else {
    // Distribute children across columns, wrapped in SortableNode
    const childrenByColumn: INode[][] = Array.from({ length: columnCount }, () => []);
    node.children.forEach((child, index) => {
      childrenByColumn[index % columnCount].push(child as INode);
    });
    columnContents = childrenByColumn.map((colChildren, colIndex) => {
      const stretchCol = colChildren.length === 1;
      const colIds = colChildren.map((c) => c.id);
      return (
        <ColumnStretchContext.Provider key={colIndex} value={stretchCol}>
          <SortableContext items={colIds} strategy={verticalListSortingStrategy}>
            <ColumnDropZone layoutId={node.id} columnIndex={colIndex}>
              {colChildren.map((child) => (
                <div key={child.id} className={cn('min-w-0', stretchCol && 'h-full')}>
                  <SortableNode node={child} depth={depth + 1} parentLayoutId={node.id}>
                    <NodeRenderer node={child} depth={depth + 1} />
                  </SortableNode>
                </div>
              ))}
            </ColumnDropZone>
          </SortableContext>
        </ColumnStretchContext.Provider>
      );
    });
  }

  // Build columns with embedded resize handles on the right edge
  const cols: React.ReactNode[] = [];
  columnContents.forEach((colContent, i) => {
    const isLast = i === columnContents.length - 1;
    cols.push(
      <div
        key={`col-${i}`}
        className="relative min-w-0 flex flex-col"
        style={{ flexGrow: columnWidths[i] ?? 100 / columnCount, flexShrink: 1, flexBasis: '0%' }}
      >
        {colContent}
        {!isLast && (
          <ColumnResizeDivider
            layoutId={node.id}
            dividerIndex={i}
            columnWidths={columnWidths}
            containerRef={containerRef}
          />
        )}
      </div>
    );
  });

  return (
    <div
      ref={containerRef}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedNode(node.id);
      }}
      className={cn(
        'flex flex-row gap-2 w-full',
        isSelected && 'ring-2 ring-primary-300 ring-offset-2 rounded-lg',
        'transition-shadow duration-200'
      )}
    >
      {cols}
    </div>
  );
}

// ============================================================================
// CARD RENDERER
// ============================================================================

/**
 * CardRenderer handles slide-level nodes.
 * Acts as the main container for a slide's content.
 */
function CardRenderer({ node }: { node: ICard }) {
  // Make the card a droppable zone for materials
  const { isOver, setNodeRef } = useDroppable({
    id: `card-${node.id}`,
    data: {
      type: 'CARD',
      cardId: node.id,
      accepts: ['MATERIAL'],
    },
  });

  // Get child IDs for SortableContext
  const childIds = node.children.map(child => child.id);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        // Width fills container; height shrinks to content but never exceeds 600px
        'w-full max-h-[600px]',
        // Normal block flow â€” no fixed height, no flex-stretch
        'flex flex-col',
        // Hide overflow when content hits the max-height
        'overflow-hidden',
        // Card styling
        'bg-white rounded-2xl shadow-stage',
        // Smooth transitions for layout shifts
        'transition-all duration-300 ease-out',
        // Drop indicator
        isOver && 'ring-4 ring-blue-400 ring-inset'
      )}
      style={{
        backgroundColor: node.backgroundColor === '#1e293b' ? '#ffffff' : (node.backgroundColor || undefined),
        backgroundImage: node.backgroundImage
          ? `url(${node.backgroundImage})`
          : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Content always starts from the top */}
      <div className="flex flex-col px-6 py-6 gap-3">
        {/* Wrap children in SortableContext for drag and drop */}
        <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
          {node.children.map((child) => (
            <div key={child.id} className="flex-shrink-0">
              <SortableNode node={child as INode} depth={1}>
                <NodeRenderer node={child as INode} depth={1} />
              </SortableNode>
            </div>
          ))}
        </SortableContext>

        {/* Empty state */}
        {node.children.length === 0 && (
          <div className="flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="mb-2">Slide đang trống. Thêm nội dung từ thanh công cụ bên trên.</p>
              {isOver && <p className="text-blue-500 font-semibold">Thả tài nguyên vào đây</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN NODE RENDERER
// ============================================================================

/**
 * NodeRenderer - Main recursive component
 * 
 * Determines the node type and delegates to the appropriate renderer.
 * This creates a clean separation of concerns and makes the code extensible.
 * 
 * @param node - The node to render
 * @param depth - Current depth in the tree (0 = card level)
 */
export function NodeRenderer({ node, depth = 0 }: NodeRendererProps) {
  // Type guard switch for proper TypeScript narrowing
  if (isCard(node)) {
    return <CardRenderer node={node} />;
  }

  if (isLayout(node)) {
    return <LayoutRenderer node={node} depth={depth} />;
  }

  if (isBlock(node)) {
    return <BlockRenderer node={node} />;
  }

  // Fallback for unknown node types (shouldn't happen with proper types)
  console.warn('Unknown node type:', node);
  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-700">
      Unknown node type: {(node as any).type}
    </div>
  );
}

export default NodeRenderer;
