/**
 * Node Update & Delete Actions
 * =============================
 * 
 * Actions for updating node properties, block content/styles,
 * card titles, and deleting nodes from the document tree.
 */

import {
  ICard,
  ILayout,
  IBlock,
  INode,
  BlockContent,
  IBlockStyles,
  isBlock,
} from '@/types';
import { updateNodeInTree, deleteNodeFromTree } from '../helpers/treeUtils';
import type { StoreGet, StoreSet, SetDocumentWithHistory } from '../types';

export function createNodeActions(
  set: StoreSet,
  get: StoreGet,
  setDocumentWithHistory: SetDocumentWithHistory,
) {
  return {
    // ======================================================================
    // UPDATE ACTIONS
    // ======================================================================

    updateNode: (nodeId: string, updates: Partial<INode>) => {
      const { document } = get();
      if (!document) return;

      const newDoc = {
        ...document,
        cards: document.cards.map((card) => {
          if (card.id === nodeId) {
            return { ...card, ...updates } as ICard;
          }
          return {
            ...card,
            children: updateNodeInTree<ILayout | IBlock>(
              card.children,
              nodeId,
              (node) => ({ ...node, ...updates } as INode)
            ),
          };
        }),
        updatedAt: new Date().toISOString(),
      };

      setDocumentWithHistory(newDoc);
    },

    updateBlockContent: (blockId: string, content: BlockContent) => {
      const { document } = get();
      if (!document) return;

      const newDoc = {
        ...document,
        cards: document.cards.map((card) => ({
          ...card,
          children: updateNodeInTree<ILayout | IBlock>(
            card.children,
            blockId,
            (node) => {
              if (isBlock(node)) {
                return { ...node, content };
              }
              return node;
            }
          ),
        })),
        updatedAt: new Date().toISOString(),
      };

      setDocumentWithHistory(newDoc);
    },

    updateBlockStyles: (blockId: string, styles: IBlockStyles) => {
      const { document } = get();
      if (!document) return;

      const newDoc = {
        ...document,
        cards: document.cards.map((card) => ({
          ...card,
          children: updateNodeInTree<ILayout | IBlock>(
            card.children,
            blockId,
            (node) => {
              if (isBlock(node)) {
                return {
                  ...node,
                  styles: { ...node.styles, ...styles },
                };
              }
              return node;
            }
          ),
        })),
        updatedAt: new Date().toISOString(),
      };

      setDocumentWithHistory(newDoc);
    },

    updateCardTitle: (cardId: string, title: string) => {
      const { document } = get();
      if (!document) return;

      const newDoc = {
        ...document,
        cards: document.cards.map((card) =>
          card.id === cardId ? { ...card, title } : card
        ),
        updatedAt: new Date().toISOString(),
      };

      setDocumentWithHistory(newDoc);
    },

    setCardContentAlignment: (cardId: string, alignment: 'top' | 'center' | 'bottom') => {
      const { document } = get();
      if (!document) return;

      const newDoc = {
        ...document,
        cards: document.cards.map((card) =>
          card.id === cardId ? { ...card, contentAlignment: alignment } : card
        ),
        updatedAt: new Date().toISOString(),
      };

      setDocumentWithHistory(newDoc);
    },

    updateLayoutColumnWidths: (layoutId: string, columnWidths: number[]) => {
      const { document } = get();
      if (!document) return;

      const newDoc = {
        ...document,
        cards: document.cards.map((card) => ({
          ...card,
          children: updateNodeInTree<ILayout | IBlock>(
            card.children,
            layoutId,
            (node) => {
              if (node.type === 'LAYOUT') {
                return { ...node, columnWidths } as ILayout;
              }
              return node;
            }
          ),
        })),
        updatedAt: new Date().toISOString(),
      };

      // Use set (not setDocumentWithHistory) to avoid polluting the undo stack
      // while dragging — the final state is committed on mouseup
      set({ document: newDoc });
    },

    // ======================================================================
    // DELETE ACTIONS
    // ======================================================================

    deleteNode: (nodeId: string) => {
      const { document, activeCardId } = get();
      if (!document) return;

      const isCardNode = document.cards.some((card) => card.id === nodeId);
      
      if (isCardNode) {
        if (document.cards.length <= 1) return;

        const newCards = document.cards.filter((card) => card.id !== nodeId);
        const newActiveId =
          activeCardId === nodeId ? newCards[0]?.id || null : activeCardId;

        const newDoc = {
          ...document,
          cards: newCards,
          updatedAt: new Date().toISOString(),
        };

        setDocumentWithHistory(newDoc, {
          activeCardId: newActiveId,
          selectedNodeId: null,
        });
      } else {
        const newDoc = {
          ...document,
          cards: document.cards.map((card) => ({
            ...card,
            children: deleteNodeFromTree<ILayout | IBlock>(
              card.children,
              nodeId
            ),
          })),
          updatedAt: new Date().toISOString(),
        };

        setDocumentWithHistory(newDoc, {
          selectedNodeId: null,
        });
      }
    },
  };
}
