'use client';

/**
 * EduVi Slide Editor Page
 * =======================
 * 
 * The main editor page that assembles all components:
 * - Sidebar (left): Slide list with drag-and-drop reordering
 * - Toolbar (top): Content and layout buttons
 * - MainStage (center): Active slide editor
 * - MaterialSidebar (right): Material library for drag-and-drop widgets
 * - PresentationLayer: Full-screen overlay for presentation mode
 * 
 * Data Flow:
 * 1. On mount, fetch document from Mock API (/api/project)
 * 2. Store document in Zustand store
 * 3. Components read from store and render accordingly
 * 4. User edits trigger store updates
 * 5. Store updates propagate to all subscribed components
 * 
 * Material Drop Flow:
 * - Materials dragged from MaterialSidebar
 * - DndContext at page level catches drop events
 * - dropMaterial action creates new block with widget content
 * 
 * App Modes:
 * - EDITOR: Default editing mode with all UI elements
 * - PRESENT: Full-screen presentation with slide navigation
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  pointerWithin,
  rectIntersection,
  closestCenter,
  CollisionDetection,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useDocumentStore } from '@/store';
import { Sidebar, Toolbar, MainStage } from '@/components/layout';
import { MaterialSidebar } from '@/components/sidebar/MaterialSidebar';
import { PresentationLayer } from '@/components/presentation';
import { IMaterial } from '@/types';
import { Package } from 'lucide-react';
import { usePipelineHub, PipelineProgress } from '@/hooks/usePipelineHub';

/**
 * Custom collision detection
 * Priority:
 * 1. Sortable items (when dragging blocks) - use closestCenter for smooth reordering
 * 2. Layout columns (when dropping materials)
 * 3. Cards (fallback for material drops)
 */
const customCollisionDetection: CollisionDetection = (args) => {
  const { active } = args;
  
  // Check if we're dragging a sortable block (not a material)
  const isDraggingBlock = !active.data.current?.material;
  
  // For sortable blocks, use closestCenter for smooth reordering (like sidebar)
  if (isDraggingBlock) {
    return closestCenter(args);
  }
  
  // For materials: check for layout column collisions using pointer
  const pointerCollisions = pointerWithin(args);
  
  // If we have a layout column collision, prioritize it
  const columnCollision = pointerCollisions.find(
    (collision) => collision.data?.droppableContainer?.data?.current?.type === 'LAYOUT_COLUMN'
  );
  
  if (columnCollision) {
    return [columnCollision];
  }
  
  // Check for card collision as fallback
  const cardCollision = pointerCollisions.find(
    (collision) => collision.data?.droppableContainer?.data?.current?.type === 'CARD'
  );
  
  if (cardCollision) {
    return [cardCollision];
  }
  
  // Fall back to rect intersection for other collisions
  const rectCollisions = rectIntersection(args);
  return rectCollisions.length > 0 ? rectCollisions : pointerCollisions;
};

export default function EditorPage() {
  const loadDocument = useDocumentStore((state) => state.loadDocument);
  const activeCardId = useDocumentStore((state) => state.activeCardId);
  const dropMaterial = useDocumentStore((state) => state.dropMaterial);
  const reorderNodesInCard = useDocumentStore((state) => state.reorderNodesInCard);
  const reorderNodesInLayout = useDocumentStore((state) => state.reorderNodesInLayout);

  const [activeDragItem, setActiveDragItem] = React.useState<IMaterial | null>(null);

  // Pipeline progress state
  const [pipelineProgress, setPipelineProgress] = useState<PipelineProgress | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Đọc token từ localStorage sau khi mount (tránh SSR hydration error)
  useEffect(() => {
    setAccessToken(localStorage.getItem('accessToken'));
  }, []);

  usePipelineHub({
    accessToken,
    onProgress: (event) => {
      console.log('[Pipeline]', event.step, event.progress + '%', event.detail);
      setPipelineProgress(event);
      // Khi hoàn thành → xóa banner sau 3 giây
      if (event.status === 'completed' || event.status === 'failed') {
        setTimeout(() => setPipelineProgress(null), 3000);
      }
    },
  });

  // Load document on mount
  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  // Configure sensors for drag-and-drop
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

  // Handle drag start - track what's being dragged
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const dragData = active.data.current;

    // Only track materials for drag overlay
    if (dragData?.material) {
      setActiveDragItem(dragData.material as IMaterial);
    }
  };

  // Handle drag end - process material drops and reordering
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const dragData = active.data.current;

    // Reset drag state
    setActiveDragItem(null);

    if (!over) return;

    // Check if this is a material drop
    const isMaterialDrag = dragData?.material;

    if (isMaterialDrag) {
      // Handle material drop
      const material = dragData.material as IMaterial;
      
      // Check if dropped on a layout column (highest priority)
      if (over.data.current?.type === 'LAYOUT_COLUMN') {
        const layoutId = over.data.current.layoutId as string;
        const columnIndex = over.data.current.columnIndex as number;
        dropMaterial(layoutId, material, columnIndex);
        return;
      }
      
      // Check if dropped on a card directly
      if (over.data.current?.type === 'CARD') {
        const cardId = over.data.current.cardId as string;
        dropMaterial(cardId, material);
        return;
      }
      
      // Check if dropped on a layout (legacy support)
      if (over.data.current?.type === 'LAYOUT') {
        const layoutId = over.data.current.layoutId as string;
        dropMaterial(layoutId, material);
        return;
      }
      
      // Otherwise drop into the active card as fallback
      if (activeCardId) {
        dropMaterial(activeCardId, material);
      }
    } else {
      // Handle sortable block reordering
      if (active.id !== over.id && activeCardId) {
        // Check if drag is happening within a nested layout (template columns)
        const parentLayoutId = active.data.current?.parentLayoutId;
        
        if (parentLayoutId) {
          // Reorder within the nested layout (column)
          reorderNodesInLayout(activeCardId, parentLayoutId as string, active.id as string, over.id as string);
        } else {
          // Reorder at card level (same as before)
          reorderNodesInCard(activeCardId, active.id as string, over.id as string);
        }
      }
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="h-screen flex flex-col bg-surface-tertiary">
          {/* Top Toolbar */}
          <Toolbar />

          {/* Main content area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Sidebar */}
            <Sidebar />

            {/* Center Stage */}
            <MainStage />

            {/* Right Sidebar - Material Library */}
            <MaterialSidebar />
          </div>
        </div>

        {/* Drag Overlay - shows dragged item preview */}
        <DragOverlay>
          {activeDragItem && (
            <div className="bg-white border-2 border-indigo-400 rounded-lg p-3 shadow-xl opacity-90">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded flex items-center justify-center">
                  <Package className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{activeDragItem.name}</p>
                  <p className="text-xs text-gray-500">Drop to add</p>
                </div>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Presentation Mode Overlay */}
      <PresentationLayer />

      {/* Pipeline Progress Banner */}
      {pipelineProgress && (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">
              {pipelineProgress.status === 'completed' && '✅ Hoàn thành!'}
              {pipelineProgress.status === 'failed' && '❌ Có lỗi xảy ra'}
              {(pipelineProgress.status === 'queued' || pipelineProgress.status === 'processing') && '⚙️ Đang xử lý...'}
            </p>
            <button
              onClick={() => setPipelineProgress(null)}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                pipelineProgress.status === 'failed' ? 'bg-red-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${pipelineProgress.progress}%` }}
            />
          </div>

          {/* Detail text */}
          {pipelineProgress.detail && (
            <p className="text-xs text-slate-500">{pipelineProgress.detail}</p>
          )}
          {pipelineProgress.status === 'failed' && pipelineProgress.error && (
            <p className="text-xs text-red-500">{pipelineProgress.error}</p>
          )}
          {pipelineProgress.status === 'completed' && (
            <p className="text-xs text-slate-400">
              Tải dữ liệu đầy đủ từ server để render slide.
            </p>
          )}
        </div>
      )}
    </>
  );
}
