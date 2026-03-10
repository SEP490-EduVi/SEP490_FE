'use client';

/**
 * MainStage Component
 * ===================
 * 
 * The central canvas area where the active slide is rendered.
 * Provides a document-like editing experience.
 * 
 * Note: DndContext is now at page level to handle both sorting and material drops.
 */

import React from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { useDocumentStore } from '@/store';
import { NodeRenderer } from '@/components/renderer';
import { Loader2 } from 'lucide-react';

export function MainStage() {
  const document = useDocumentStore((state) => state.document);
  const activeCardId = useDocumentStore((state) => state.activeCardId);
  const isLoading = useDocumentStore((state) => state.isLoading);
  const error = useDocumentStore((state) => state.error);
  const setSelectedNode = useDocumentStore((state) => state.setSelectedNode);

  const activeCard = document?.cards.find((card) => card.id === activeCardId);

  // Clear selection when clicking on stage background
  const handleStageClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedNode(null);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <main className="flex-1 bg-surface-tertiary flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-rose-400 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading presentation...</p>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="flex-1 bg-surface-tertiary flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to Load
          </h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  // Empty state
  if (!activeCard) {
    return (
      <main className="flex-1 bg-surface-tertiary flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Select a slide from the sidebar</p>
        </div>
      </main>
    );
  }

  return (
    <main
      className={cn(
        'flex-1 bg-surface-tertiary',
        'mt-5'
      )}
      onClick={handleStageClick}
    >
      {/* Stage container - centers the card */}
      <div className="max-w-4xl mx-auto">
        {/* Sortable context for reordering blocks within the card */}
        <SortableContext
          items={activeCard.children.map((n) => n.id)}
          strategy={verticalListSortingStrategy}
        >
          {/* Render the active card */}
          <NodeRenderer node={activeCard} />
        </SortableContext>

        {/* Slide navigation hint */}
        <div className="mt-6 text-center text-sm text-gray-400">
          Slide {document?.cards.findIndex((c) => c.id === activeCardId)! + 1} of{' '}
          {document?.cards.length}
        </div>
      </div>
    </main>
  );
}

export default MainStage;
