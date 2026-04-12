/**
 * Skeleton Utilities
 * ==================
 *
 * Two-way conversion between a full ICard and a lightweight ITemplateSkeleton.
 *
 * extractSkeleton(card)      → strips IDs + all content data, keeps tree structure
 * hydrateSkeleton(skeleton)  → builds a fresh ICard with new UUIDs + placeholder content
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ICard,
  ILayout,
  IBlock,
  NodeType,
  BlockType,
  LayoutVariant,
  ITemplateSkeleton,
  ISkeletonLayout,
  ISkeletonBlock,
} from '@/types';
import {
  createTextBlock,
  createHeadingBlock,
  createImageBlock,
  createQuizBlock,
  createFlashcardBlock,
  createFillBlankBlock,
} from '@/data/mock-data';

// ============================================================================
// EXTRACT  (ICard → ITemplateSkeleton)
// ============================================================================

function extractNode(node: ILayout | IBlock): ISkeletonLayout | ISkeletonBlock {
  if (node.type === NodeType.LAYOUT) {
    return {
      type: 'LAYOUT',
      variant: node.variant,
      ...(node.gap !== undefined && { gap: node.gap }),
      ...(node.columnWidths && node.columnWidths.length > 0 && { columnWidths: node.columnWidths }),
      children: node.children.map(extractNode),
    } satisfies ISkeletonLayout;
  }

  // BLOCK — only keep blockType + minimal meta
  const block = node as IBlock;
  const blockType = block.content.type as BlockType;
  const meta: ISkeletonBlock['meta'] = {};

  if (blockType === BlockType.HEADING && 'level' in block.content) {
    meta.level = (block.content as { level: 1 | 2 | 3 | 4 | 5 | 6 }).level;
  }
  if (blockType === BlockType.QUIZ && 'questions' in block.content) {
    const q = (block.content as { questions: unknown[] }).questions;
    if (q.length > 0) meta.questionCount = q.length;
  }
  if (block.styles && Object.keys(block.styles).length > 0) {
    meta.styles = block.styles;
  }
  if (block.isResizable) {
    meta.isResizable = true;
  }

  return {
    blockType,
    ...(Object.keys(meta).length > 0 && { meta }),
  } satisfies ISkeletonBlock;
}

/**
 * Strip a full ICard down to a skeleton (no IDs, no content data).
 * Call this when admin clicks "Save" in the template editor.
 */
export function extractSkeleton(card: ICard): ITemplateSkeleton {
  const skeleton: ITemplateSkeleton = {
    children: card.children.map(extractNode),
  };
  if (card.backgroundColor) skeleton.backgroundColor = card.backgroundColor;
  if (card.contentAlignment) skeleton.contentAlignment = card.contentAlignment;
  if (card.isVideoSlide) skeleton.isVideoSlide = true;
  return skeleton;
}

// ============================================================================
// HYDRATE  (ITemplateSkeleton → ICard)
// ============================================================================

function hydrateSkeletonNode(node: ISkeletonLayout | ISkeletonBlock): ILayout | IBlock {
  if ('type' in node && node.type === 'LAYOUT') {
    const layout = node as ISkeletonLayout;
    return {
      id: `layout-${uuidv4()}`,
      type: NodeType.LAYOUT,
      variant: layout.variant as LayoutVariant,
      gap: layout.gap ?? 6,
      ...(layout.columnWidths && { columnWidths: layout.columnWidths }),
      children: layout.children.map(hydrateSkeletonNode) as (ILayout | IBlock)[],
    } as ILayout;
  }

  // BLOCK
  const skBlock = node as ISkeletonBlock;
  const id = `block-${uuidv4()}`;
  const meta = skBlock.meta ?? {};

  let block: IBlock;

  switch (skBlock.blockType) {
    case BlockType.HEADING:
      block = createHeadingBlock(id, 'Tiêu đề', meta.level ?? 2);
      break;
    case BlockType.TEXT:
      block = createTextBlock(id, '<p>Điền nội dung tại đây...</p>');
      break;
    case BlockType.IMAGE:
      block = createImageBlock(id, '', 'Hình ảnh');
      break;
    case BlockType.VIDEO:
      block = {
        id,
        type: NodeType.BLOCK,
        content: { type: BlockType.VIDEO, src: '', provider: 'direct' as const },
        children: [],
      };
      break;
    case BlockType.QUIZ: {
      const questionCount = meta.questionCount ?? 1;
      const questions = Array.from({ length: questionCount }, (_, i) => ({
        id: `q-${uuidv4()}`,
        question: `Câu hỏi ${i + 1}`,
        options: [
          { id: `opt-${uuidv4()}`, text: '' },
          { id: `opt-${uuidv4()}`, text: '' },
          { id: `opt-${uuidv4()}`, text: '' },
          { id: `opt-${uuidv4()}`, text: '' },
        ],
        correctIndex: -1,
        explanation: '',
      }));
      block = createQuizBlock(id, '', questions);
      break;
    }
    case BlockType.FLASHCARD:
      block = createFlashcardBlock(id, 'Mặt trước', 'Mặt sau');
      break;
    case BlockType.FILL_BLANK:
      block = createFillBlankBlock(id, '[Từ khoá] là một khái niệm quan trọng trong [lĩnh vực].');
      break;
    default:
      block = createTextBlock(id, '<p>Điền nội dung tại đây...</p>');
  }

  if (meta.styles) block.styles = meta.styles;
  if (meta.isResizable) block.isResizable = true;

  return block;
}

/**
 * Build a full ICard from a skeleton with fresh UUIDs and placeholder content.
 * Call this when teacher applies a template from the modal.
 */
export function hydrateSkeleton(skeleton: ITemplateSkeleton, title?: string): ICard {
  return {
    id: `card-${uuidv4()}`,
    type: NodeType.CARD,
    title: title ?? 'Slide mới',
    children: skeleton.children.map(hydrateSkeletonNode) as (ILayout | IBlock)[],
    ...(skeleton.backgroundColor && { backgroundColor: skeleton.backgroundColor }),
    ...(skeleton.contentAlignment && { contentAlignment: skeleton.contentAlignment }),
    ...(skeleton.isVideoSlide && { isVideoSlide: true }),
  };
}
