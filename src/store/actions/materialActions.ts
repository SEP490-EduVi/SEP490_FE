/**
 * Material & Widget Actions
 * =========================
 * 
 * Actions for dropping materials/widgets into the document,
 * creating widget groups, and wrapping blocks in layouts.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ILayout,
  IBlock,
  NodeType,
  BlockType,
  LayoutVariant,
  IMaterial,
  isLayout,
} from '@/types';
import { updateNodeInTree, getColumnCountForVariant } from '../helpers/treeUtils';
import type { StoreGet, StoreSet, SetDocumentWithHistory } from '../types';

export function createMaterialActions(
  set: StoreSet,
  get: StoreGet,
  setDocumentWithHistory: SetDocumentWithHistory,
) {
  return {
    /**
     * Drop a material into the document
     * @param parentId - Can be a cardId or layoutId
     * @param material - The material being dropped
     * @param columnIndex - Optional column index for layout drops
     * @param customData - Optional custom data to override defaults
     */
    dropMaterial: (parentId: string, material: IMaterial, columnIndex?: number, customData?: Record<string, unknown>) => {
      const { document } = get();
      if (!document) return;

      const newBlock: IBlock = {
        id: `block-${uuidv4()}`,
        type: NodeType.BLOCK,
        content: {
          type: BlockType.MATERIAL,
          widgetType: material.widgetType,
          data: customData || material.defaultData,
        },
        children: [],
        styles: material.defaultStyles,
        isResizable: true,
      };

      // Check if parentId is a card
      const targetCard = document.cards.find((card) => card.id === parentId);
      
      if (targetCard) {
        const newDoc = {
          ...document,
          cards: document.cards.map((card) =>
            card.id === parentId
              ? { ...card, children: [...card.children, newBlock] }
              : card
          ),
          updatedAt: new Date().toISOString(),
        };
        
        setDocumentWithHistory(newDoc, {
          selectedNodeId: newBlock.id,
        });
        return;
      }

      // Otherwise, try to find a layout with this ID and add to specific column
      const newDoc = {
        ...document,
        cards: document.cards.map((card) => ({
          ...card,
          children: updateNodeInTree<ILayout | IBlock>(
            card.children,
            parentId,
            (node) => {
              if (isLayout(node)) {
                // Check if children are nested layouts (one layout per column)
                const childrenAreLayouts = node.children.every(child => isLayout(child));
                
                // If columnIndex is specified and children are nested layouts
                if (columnIndex !== undefined && childrenAreLayouts) {
                  const targetColumn = node.children[columnIndex] as ILayout;
                  if (targetColumn) {
                    const updatedChildren = [...node.children];
                    updatedChildren[columnIndex] = {
                      ...targetColumn,
                      children: [...targetColumn.children, newBlock],
                    };
                    return { ...node, children: updatedChildren };
                  }
                }
                
                // If columnIndex is specified but children are blocks (old distribution logic)
                if (columnIndex !== undefined && !childrenAreLayouts) {
                  const columnCount = getColumnCountForVariant(node.variant);
                  const currentColCounts = Array(columnCount).fill(0);
                  node.children.forEach((_, idx) => {
                    currentColCounts[idx % columnCount]++;
                  });
                  
                  let insertPosition = 0;
                  for (let i = 0; i < node.children.length; i++) {
                    if (i % columnCount === columnIndex) {
                      insertPosition = i + columnCount;
                    }
                  }
                  if (currentColCounts[columnIndex] === 0) {
                    insertPosition = columnIndex;
                  } else {
                    insertPosition = Math.min(insertPosition, node.children.length);
                  }
                  
                  const newChildren = [...node.children];
                  newChildren.splice(insertPosition, 0, newBlock);
                  return { ...node, children: newChildren };
                }
                
                // Default: add to end
                return {
                  ...node,
                  children: [...node.children, newBlock],
                };
              }
              return node;
            }
          ),
        })),
        updatedAt: new Date().toISOString(),
      };
      
      setDocumentWithHistory(newDoc, {
        selectedNodeId: newBlock.id,
      });
    },

    /**
     * Create a multi-column layout with widgets
     * Used to group multiple materials side-by-side
     */
    createWidgetGroup: (
      cardId: string,
      variant: LayoutVariant,
      materials: IMaterial[]
    ) => {
      const { document } = get();
      if (!document || materials.length === 0) return;

      const blocks: IBlock[] = materials.map((material) => ({
        id: `block-${uuidv4()}`,
        type: NodeType.BLOCK as const,
        content: {
          type: BlockType.MATERIAL as const,
          widgetType: material.widgetType,
          data: material.defaultData,
        },
        children: [] as [],
        styles: material.defaultStyles,
        isResizable: true,
      }));

      const newLayout: ILayout = {
        id: `layout-${uuidv4()}`,
        type: NodeType.LAYOUT,
        variant,
        gap: 4,
        children: blocks,
      };

      const newDoc = {
        ...document,
        cards: document.cards.map((card) =>
          card.id === cardId
            ? { ...card, children: [...card.children, newLayout] }
            : card
        ),
        updatedAt: new Date().toISOString(),
      };
      
      setDocumentWithHistory(newDoc, {
        selectedNodeId: newLayout.id,
      });
    },

    /**
     * Wrap existing blocks in a layout (for grouping existing widgets)
     */
    wrapBlocksInLayout: (
      cardId: string,
      blockIds: string[],
      variant: LayoutVariant
    ) => {
      const { document } = get();
      if (!document || blockIds.length < 2) return;

      const newDoc = {
        ...document,
        cards: document.cards.map((card) => {
          if (card.id !== cardId) return card;

          const blocksToWrap: (ILayout | IBlock)[] = [];
          const remainingChildren: (ILayout | IBlock)[] = [];

          card.children.forEach((child) => {
            if (blockIds.includes(child.id)) {
              blocksToWrap.push(child);
            } else {
              remainingChildren.push(child);
            }
          });

          if (blocksToWrap.length < 2) return card;

          const wrapperLayout: ILayout = {
            id: `layout-${uuidv4()}`,
            type: NodeType.LAYOUT,
            variant,
            gap: 4,
            children: blocksToWrap,
          };

          return {
            ...card,
            children: [...remainingChildren, wrapperLayout],
          };
        }),
        updatedAt: new Date().toISOString(),
      };
      
      setDocumentWithHistory(newDoc);
    },
  };
}
