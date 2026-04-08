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
  createQuizBlock,
  createFlashcardBlock,
  createFillBlankBlock,
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
    case BlockType.QUIZ:
      return createQuizBlock(id, '', [
        {
          id: `q-${uuidv4()}`,
          question: '',
          options: [
            { id: `opt-${uuidv4()}`, text: '' },
            { id: `opt-${uuidv4()}`, text: '' },
            { id: `opt-${uuidv4()}`, text: '' },
            { id: `opt-${uuidv4()}`, text: '' },
          ],
          correctIndex: -1,
          explanation: '',
        },
      ]);
    case BlockType.FLASHCARD:
      return createFlashcardBlock(id, 'Khái niệm', 'Định nghĩa chi tiết của khái niệm...');
    case BlockType.FILL_BLANK:
      return createFillBlankBlock(id, '[Từ khoá] là một khái niệm quan trọng trong [lĩnh vực].');
    default:
      return createTextBlock(id, '<p>Điền nội dung tại đây...</p>');
  }
}
