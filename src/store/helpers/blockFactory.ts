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
      return createTextBlock(id, '<p>Điền nội dung tại đây...</p>');
    case BlockType.HEADING:
      return createHeadingBlock(id, 'Tiêu đề', 2);
    case BlockType.IMAGE:
      return createImageBlock(id, '', 'Hình ảnh');
    case BlockType.VIDEO:
      return {
        id,
        type: NodeType.BLOCK,
        content: {
          type: BlockType.VIDEO,
          src: '',
          provider: 'direct' as const,
        },
        children: [],
      };
    default:
      return createTextBlock(id, '<p>Điền nội dung tại đây...</p>');
  }
}
