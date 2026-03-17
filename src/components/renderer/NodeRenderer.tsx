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
 * CARD   → CardRenderer (slide container)
 * LAYOUT → LayoutRenderer (structural container with Flex/Grid)
 * BLOCK  → BlockRenderer (content: Text, Image, Video)
 * 
 * Reflow Logic:
 * -------------
 * All content uses standard CSS Flow (Flex/Grid).
 * When a Tiptap block expands, it naturally pushes siblings down.
 * NO absolute positioning is used for content elements.
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { useDocumentStore } from '@/store';
import {
  INode,
  ICard,
  ILayout,
  IBlock,
  NodeType,
  BlockType,
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
import { GripVertical, Trash2, Plus } from 'lucide-react';

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
  const editingNodeId = useDocumentStore((state) => state.editingNodeId);

  const isSelected = selectedNodeId === node.id;
  const isEditing = editingNodeId === node.id;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (isSelected && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      const toolbarHeight = 44;
      const above = rect.top - toolbarHeight - 4;
      const top = above < 8 ? rect.bottom + 4 : above;
      const left = rect.left + rect.width / 2;
      setToolbarPos({ top, left });
    } else {
      setToolbarPos(null);
    }
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
          const activeCard = useDocumentStore.getState().activeCardId;
          if (activeCard) useDocumentStore.getState().addBlockToCard(activeCard, BlockType.HEADING);
        }}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
        title="Thêm Heading"
      >
        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          const activeCard = useDocumentStore.getState().activeCardId;
          if (activeCard) useDocumentStore.getState().addBlockToCard(activeCard, BlockType.TEXT);
        }}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
        title="Thêm Text"
      >
        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          const activeCard = useDocumentStore.getState().activeCardId;
          if (activeCard) useDocumentStore.getState().addBlockToCard(activeCard, BlockType.IMAGE);
        }}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
        title="Thêm Image"
      >
        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          const activeCard = useDocumentStore.getState().activeCardId;
          if (activeCard) useDocumentStore.getState().addBlockToCard(activeCard, BlockType.VIDEO);
        }}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
        title="Thêm Video"
      >
        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>

      <div className="w-px h-5 bg-gray-200 mx-0.5" />

      <button
        onClick={(e) => {
          e.stopPropagation();
          // Copy action - TODO: implement
        }}
        className="p-1.5 rounded hover:bg-gray-100 transition-colors"
        title="Sao chép"
      >
        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>

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
      {depth > 0 && isSelected && !isEditing && toolbarPos && createPortal(
        <div
          className="fixed z-[9999] flex items-center gap-1 px-2 py-1.5 bg-white rounded-lg shadow-lg border border-gray-200 -translate-x-1/2"
          style={{ top: toolbarPos.top, left: toolbarPos.left }}
        >
          {toolbarContent}
        </div>,
        document.body
      )}
      <div
        ref={(el) => {
          setNodeRef(el);
          (wrapperRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
        }}
        style={style}
        className={cn(
          'relative group',
          isDragging && 'opacity-50 z-50'
        )}
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            setSelectedNode(node.id);
          }}
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

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-[120px] rounded-lg transition-all duration-200 w-full h-full',
        isOver && 'bg-blue-50 ring-2 ring-blue-400 ring-inset',
        children.length === 0 && !isOver && 'border-2 border-dashed border-gray-200'
      )}
    >
      {children.length > 0 ? (
        <div className="flex flex-col gap-4 h-full">
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
 * ColumnResizeDivider — draggable handle between two adjacent columns.
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
      className="flex-shrink-0 w-3 cursor-col-resize flex items-center justify-center group select-none z-10"
      onMouseDown={handleMouseDown}
    >
      <div className="w-0.5 h-8 bg-gray-200 group-hover:bg-blue-400 transition-colors duration-150 rounded-full" />
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

  // ---- SINGLE COLUMN ----
  if (columnCount === 1) {
    const childIds = node.children.map(child => child.id);
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          setSelectedNode(node.id);
        }}
        className={cn(
          'flex flex-col gap-4',
          isSelected && 'ring-2 ring-primary-300 ring-offset-2 rounded-lg',
          'transition-all duration-200'
        )}
      >
        {childrenAreLayouts ? (
          node.children.map((child) => (
            <div key={child.id} className="min-w-0">
              <NodeRenderer node={child as INode} depth={depth + 1} />
            </div>
          ))
        ) : (
          <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
            <ColumnDropZone layoutId={node.id} columnIndex={0}>
              {node.children.map((child) => (
                <div key={child.id} className="min-w-0">
                  <SortableNode node={child as INode} depth={depth + 1} parentLayoutId={node.id}>
                    <NodeRenderer node={child as INode} depth={depth + 1} />
                  </SortableNode>
                </div>
              ))}
            </ColumnDropZone>
          </SortableContext>
        )}
      </div>
    );
  }

  // ---- MULTI-COLUMN: flex row with draggable column dividers ----
  const defaultWidths = getDefaultColumnWidths(node.variant, columnCount);
  const columnWidths = node.columnWidths ?? defaultWidths;

  // Build the content for each column
  let columnContents: React.ReactNode[];

  if (childrenAreLayouts && node.children.length <= columnCount) {
    // Each direct child is a column layout — wrap in card box with border
    columnContents = node.children.map((child) => (
      <div key={child.id} className="bg-gray-100 border border-gray-200 rounded-xl p-4 h-full min-h-[120px]">
        <NodeRenderer node={child as INode} depth={depth + 1} />
      </div>
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
    // Distribute children across columns
    const childrenByColumn: React.ReactNode[][] = Array.from({ length: columnCount }, () => []);
    node.children.forEach((child, index) => {
      const columnIndex = index % columnCount;
      childrenByColumn[columnIndex].push(
        <div key={child.id} className="min-w-0">
          <NodeRenderer node={child as INode} depth={depth + 1} />
        </div>
      );
    });
    columnContents = childrenByColumn.map((columnChildren, colIndex) => (
      <ColumnDropZone key={colIndex} layoutId={node.id} columnIndex={colIndex}>
        {columnChildren}
      </ColumnDropZone>
    ));
  }

  // Interleave column content + dividers
  const interleaved: React.ReactNode[] = [];
  columnContents.forEach((colContent, i) => {
    interleaved.push(
      <div
        key={`col-${i}`}
        className="min-w-0 overflow-hidden"
        style={{ width: `${columnWidths[i] ?? 100 / columnCount}%`, flexShrink: 0 }}
      >
        {colContent}
      </div>
    );
    if (i < columnContents.length - 1) {
      interleaved.push(
        <ColumnResizeDivider
          key={`divider-${i}`}
          layoutId={node.id}
          dividerIndex={i}
          columnWidths={columnWidths}
          containerRef={containerRef}
        />
      );
    }
  });

  return (
    <div
      ref={containerRef}
      onClick={(e) => {
        e.stopPropagation();
        setSelectedNode(node.id);
      }}
      className={cn(
        'flex flex-row w-full',
        isSelected && 'ring-2 ring-primary-300 ring-offset-2 rounded-lg',
        'transition-shadow duration-200'
      )}
    >
      {interleaved}
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
        // Normal block flow — no fixed height, no flex-stretch
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
        backgroundColor: node.backgroundColor || undefined,
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
