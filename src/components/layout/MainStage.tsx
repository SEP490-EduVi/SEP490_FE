'use client';

/**
 * MainStage Component
 * ===================
 *
 * Canvas trung tâm — hiển thị TẤT CẢ slides theo chiều dọc (Gamma-style).
 * - Scroll xuống để xem slide tiếp theo
 * - IntersectionObserver tự cập nhật activeCardId khi scroll
 * - Khi sidebar click → tự cuộn tới đúng slide
 */

import React, { useRef, useEffect, useCallback } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { useDocumentStore } from '@/store';
import { NodeRenderer } from '@/components/renderer';
import { Loader2 } from 'lucide-react';

export function MainStage() {
  const document        = useDocumentStore((state) => state.document);
  const activeCardId    = useDocumentStore((state) => state.activeCardId);
  const isLoading       = useDocumentStore((state) => state.isLoading);
  const error           = useDocumentStore((state) => state.error);
  const setSelectedNode = useDocumentStore((state) => state.setSelectedNode);

  // Map cardId → DOM div ref (used to scroll-to on sidebar click)
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const setCardRef = useCallback((cardId: string, el: HTMLDivElement | null) => {
    if (el) cardRefs.current.set(cardId, el);
    else    cardRefs.current.delete(cardId);
  }, []);

  // ── Scroll to active card when sidebar is clicked ────────────────────────
  useEffect(() => {
    if (!activeCardId) return;
    const el = cardRefs.current.get(activeCardId);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeCardId]);

  // ── Clear selection on background click ──────────────────────────────────
  const handleStageClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) setSelectedNode(null);
  };

  // ── States ───────────────────────────────────────────────────────────────
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

  if (error) {
    return (
      <main className="flex-1 bg-surface-tertiary flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load</h2>
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

  if (!document) {
    return (
      <main className="flex-1 bg-surface-tertiary flex items-center justify-center">
        <p className="text-gray-500">Select a slide from the sidebar</p>
      </main>
    );
  }

  // ── Main render: all slides stacked vertically ───────────────────────────
  return (
    <main
      className={cn('flex-1 overflow-y-auto bg-surface-tertiary')}
      onClick={handleStageClick}
    >
      <div className="w-full max-w-4xl mx-auto px-6 py-10 space-y-10">
        {document.cards.map((card, index) => (
          <div
            key={card.id}
            data-card-id={card.id}
            ref={(el) => setCardRef(card.id, el)}
          >
            <SortableContext
              items={card.children.map((n) => n.id)}
              strategy={verticalListSortingStrategy}
            >
              <NodeRenderer node={card} />
            </SortableContext>
          </div>
        ))}

        {/* Bottom padding so last slide doesn't sit flush at bottom */}
        <div className="h-24" />
      </div>
    </main>
  );
}

export default MainStage;
