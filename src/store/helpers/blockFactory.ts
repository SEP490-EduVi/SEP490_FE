/**
 * Block Factory
 * =============
 * 
 * Factory function for creating new blocks by type.
 * Used when adding blocks via toolbar or programmatically.
 */

import { v4 as uuidv4 } from 'uuid';
import { IBlock, NodeType, BlockType } from '@/types';
import {
  createTextBlock,
  createHeadingBlock,
  createImageBlock,
} from '@/data/mock-data';

/**
 * Create a new block based on BlockType
 */
export function createBlockByType(blockType: BlockType): IBlock {
  const id = `block-${uuidv4()}`;
  
  switch (blockType) {
    case BlockType.TEXT:
      return createTextBlock(id, '<p>Start typing...</p>');
    case BlockType.HEADING:
      return createHeadingBlock(id, 'New Heading', 2);
    case BlockType.IMAGE:
      return createImageBlock(
        id,
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
        'Placeholder image'
      );
    case BlockType.VIDEO:
      return {
        id,
        type: NodeType.BLOCK,
        content: {
          type: BlockType.VIDEO,
          src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          provider: 'youtube',
        },
        children: [],
      };
    default:
      return createTextBlock(id, '<p>New block</p>');
  }
}
