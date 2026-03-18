'use client';

/**
 * Test Slide Viewer Page
 * ======================
 *
 * Same layout as the editor page but loads slide data from
 * src/data/slidedata.json instead of the API.
 *
 * Useful for UI development and testing without a live backend.
 */

import React, { useEffect, useCallback } from 'react';
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
import { IMaterial, IDocument } from '@/types';
import { Package } from 'lucide-react';
import slideData from '@/data/slidedata.json';

// Same collision detection as the editor
const customCollisionDetection: CollisionDetection = (args) => {
  const { active } = args;
  const isDraggingBlock = !active.data.current?.material;
  if (isDraggingBlock) return closestCenter(args);

  const pointerCollisions = pointerWithin(args);
  const columnCollision = pointerCollisions.find(
    (c) => c.data?.droppableContainer?.data?.current?.type === 'LAYOUT_COLUMN',
  );
  if (columnCollision) return [columnCollision];

  const cardCollision = pointerCollisions.find(
    (c) => c.data?.droppableContainer?.data?.current?.type === 'CARD',
  );
  if (cardCollision) return [cardCollision];

  const rectCollisions = rectIntersection(args);
  return rectCollisions.length > 0 ? rectCollisions : pointerCollisions;
};

export default function TestPage() {
  const setDocument = useDocumentStore((state) => state.setDocument);
  const activeCardId = useDocumentStore((state) => state.activeCardId);
  const dropMaterial = useDocumentStore((state) => state.dropMaterial);
  const reorderNodesInCard = useDocumentStore((state) => state.reorderNodesInCard);
  const reorderNodesInLayout = useDocumentStore((state) => state.reorderNodesInLayout);

  const [activeDragItem, setActiveDragItem] = React.useState<IMaterial | null>(null);

  // Load from slidedata.json on mount
  useEffect(() => {
    const result = slideData.result as unknown as IDocument;
    const doc: IDocument = {
      id: slideData.taskId,
      title: result.title,
      cards: result.cards,
      activeCardId: result.activeCardId || result.cards?.[0]?.id || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDocument(doc, 'test');
  }, [setDocument]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    const dragData = event.active.data.current;
    if (dragData?.material) setActiveDragItem(dragData.material as IMaterial);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const dragData = active.data.current;
    setActiveDragItem(null);
    if (!over) return;

    if (dragData?.material) {
      const material = dragData.material as IMaterial;
      if (over.data.current?.type === 'LAYOUT_COLUMN') {
        dropMaterial(over.data.current.layoutId as string, material, over.data.current.columnIndex as number);
        return;
      }
      if (over.data.current?.type === 'CARD') {
        dropMaterial(over.data.current.cardId as string, material);
        return;
      }
      if (over.data.current?.type === 'LAYOUT') {
        dropMaterial(over.data.current.layoutId as string, material);
        return;
      }
      if (activeCardId) dropMaterial(activeCardId, material);
    } else {
      if (active.id !== over.id && activeCardId) {
        const parentLayoutId = active.data.current?.parentLayoutId;
        if (parentLayoutId) {
          reorderNodesInLayout(activeCardId, parentLayoutId as string, active.id as string, over.id as string);
        } else {
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
          <Toolbar />
          <div className="flex-1 flex overflow-hidden">
            <Sidebar />
            <MainStage />
            <MaterialSidebar />
          </div>
        </div>

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

      <PresentationLayer />
    </>
  );
}
