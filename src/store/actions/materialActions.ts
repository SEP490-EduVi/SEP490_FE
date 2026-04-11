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
  ICard,
  NodeType,
  BlockType,
  LayoutVariant,
  IMaterial,
  WidgetType,
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

      // Video Player widget → dedicated video slide with empty src (shows upload UI)
      if (material.widgetType === WidgetType.MATERIAL_VIDEO) {
        get().addVideoSlide(material.name);
        return;
      }

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
      
      // Prevent dropping into a video-only slide
      if (targetCard?.isVideoSlide) return;

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

    /**
     * Drop a purchased material into the document.
     * - Images: added as IMAGE block to the target card
     * - Videos: create a new slide with a VIDEO block
     */
    dropPurchasedMaterial: (
      targetCardId: string | null,
      item: { title: string; description?: string; type: string; resourceUrl: string | null; previewUrl?: string | null }
    ) => {
      const { document } = get();
      if (!document) return;

      const isVideo = item.type.toLowerCase().includes('video');
      // Fall back to previewUrl when resourceUrl is absent (e.g. image-only materials)
      const resourceUrl = item.resourceUrl || item.previewUrl || '';

      // Detect video provider from URL (youtube / vimeo / direct)
      const detectProvider = (url: string): 'youtube' | 'vimeo' | 'direct' => {
        if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
        if (/vimeo\.com/i.test(url)) return 'vimeo';
        return 'direct';
      };

      if (isVideo) {
        const blockId = `block-${uuidv4()}`;
        const cardId = `card-${uuidv4()}`;
        const provider = detectProvider(resourceUrl);
        const videoBlock: IBlock = {
          id: blockId,
          type: NodeType.BLOCK,
          content: {
            type: BlockType.VIDEO,
            src: resourceUrl,
            provider,
          },
          children: [],
          styles: {
            width: '100%',
            maxWidth: '800px',
            aspectRatio: '16/9',
          },
          isResizable: true,
        };
        const newCard: ICard = {
          id: cardId,
          type: NodeType.CARD,
          title: item.title,
          children: [videoBlock],
          isVideoSlide: true,
        };
        const newDoc = {
          ...document,
          cards: [...document.cards, newCard],
          updatedAt: new Date().toISOString(),
        };
        setDocumentWithHistory(newDoc, { activeCardId: cardId });
      } else {
        const cardId = targetCardId || document.cards[document.cards.length - 1]?.id;
        if (!cardId) return;

        // Prevent dropping into a video-only slide
        const targetCard = document.cards.find((c) => c.id === cardId);
        if (targetCard?.isVideoSlide) return;

        const blockId = `block-${uuidv4()}`;
        const imageBlock: IBlock = {
          id: blockId,
          type: NodeType.BLOCK,
          content: {
            type: BlockType.IMAGE,
            src: resourceUrl,
            alt: item.title,
            caption: '',
          },
          children: [],
          styles: {
            width: '100%',
            maxWidth: '800px',
          },
          isResizable: true,
        };

        if (targetCard) {
          // Normal card drop
          const newDoc = {
            ...document,
            cards: document.cards.map((card) =>
              card.id === cardId
                ? { ...card, children: [...card.children, imageBlock] }
                : card
            ),
            updatedAt: new Date().toISOString(),
          };
          setDocumentWithHistory(newDoc, { selectedNodeId: blockId });
        } else {
          // cardId is actually a layoutId — add the image block into that layout
          const newDoc = {
            ...document,
            cards: document.cards.map((card) => ({
              ...card,
              children: updateNodeInTree<ILayout | IBlock>(
                card.children,
                cardId,
                (node) => {
                  if (isLayout(node)) {
                    return { ...node, children: [...node.children, imageBlock] };
                  }
                  return node;
                }
              ),
            })),
            updatedAt: new Date().toISOString(),
          };
          setDocumentWithHistory(newDoc, { selectedNodeId: blockId });
        }
      }
    },
  };
}
