/**
 * Reorder Actions
 * ===============
 * 
 * Drag & drop reordering for cards, nodes within cards,
 * and nodes within layouts.
 */

import { ILayout, IBlock } from '@/types';
import { updateNodeInTree, arrayMove } from '../helpers/treeUtils';
import type { StoreGet, StoreSet, SetDocumentWithHistory } from '../types';

export function createReorderActions(
  set: StoreSet,
  get: StoreGet,
  setDocumentWithHistory: SetDocumentWithHistory,
) {
  return {
    reorderCards: (activeId: string, overId: string) => {
      const { document } = get();
      if (!document || activeId === overId) return;

      const oldIndex = document.cards.findIndex((c) => c.id === activeId);
      const newIndex = document.cards.findIndex((c) => c.id === overId);

      if (oldIndex === -1 || newIndex === -1) return;

      const newDoc = {
        ...document,
        cards: arrayMove(document.cards, oldIndex, newIndex),
        updatedAt: new Date().toISOString(),
      };

      setDocumentWithHistory(newDoc);
    },

    reorderNodesInCard: (cardId: string, activeId: string, overId: string) => {
      const { document } = get();
      if (!document || activeId === overId) return;

      const newDoc = {
        ...document,
        cards: document.cards.map((card) => {
          if (card.id !== cardId) return card;

          const children = card.children;
          const oldIndex = children.findIndex((n) => n.id === activeId);
          const newIndex = children.findIndex((n) => n.id === overId);

          if (oldIndex === -1 || newIndex === -1) return card;

          return {
            ...card,
            children: arrayMove(children, oldIndex, newIndex),
          };
        }),
        updatedAt: new Date().toISOString(),
      };

      setDocumentWithHistory(newDoc);
    },

    reorderNodesInLayout: (cardId: string, layoutId: string, activeId: string, overId: string) => {
      const { document } = get();
      if (!document || activeId === overId) return;

      const newDoc = {
        ...document,
        cards: document.cards.map((card) => {
          if (card.id !== cardId) return card;

          return {
            ...card,
            children: updateNodeInTree<ILayout | IBlock>(
              card.children,
              layoutId,
              (layout) => {
                if (!('children' in layout)) return layout;
                
                const children = layout.children;
                const oldIndex = children.findIndex((n) => n.id === activeId);
                const newIndex = children.findIndex((n) => n.id === overId);

                if (oldIndex === -1 || newIndex === -1) return layout;

                return {
                  ...layout,
                  children: arrayMove(children, oldIndex, newIndex),
                } as ILayout;
              }
            ),
          };
        }),
        updatedAt: new Date().toISOString(),
      };

      setDocumentWithHistory(newDoc);
    },
  };
}
