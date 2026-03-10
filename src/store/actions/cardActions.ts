/**
 * Card Actions
 * ============
 * 
 * Actions for adding cards: blank cards and template-based cards.
 * Includes both basic layout templates and freeform special-purpose templates.
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ICard,
  ILayout,
  IBlock,
  NodeType,
  BlockType,
  LayoutVariant,
} from '@/types';
import {
  createTextBlock,
  createHeadingBlock,
  createImageBlock,
  createLayout,
  createCard,
  createQuizBlock,
  createFlashcardBlock,
  createFillBlankBlock,
} from '@/data/mock-data';
import { createBlockByType } from '../helpers/blockFactory';
import { updateNodeInTree } from '../helpers/treeUtils';
import type { StoreGet, StoreSet, SetDocumentWithHistory } from '../types';
import { isLayout } from '@/types';

export function createCardActions(
  set: StoreSet,
  get: StoreGet,
  setDocumentWithHistory: SetDocumentWithHistory,
) {
  return {
    addCard: (title?: string) => {
      const { document } = get();
      if (!document) return;

      const newCard = createCard(
        `card-${uuidv4()}`,
        title || `Slide ${document.cards.length + 1}`,
        [createTextBlock(`block-${uuidv4()}`, '<p>New slide content...</p>')]
      );

      const newDoc = {
        ...document,
        cards: [...document.cards, newCard],
        updatedAt: new Date().toISOString(),
      };

      setDocumentWithHistory(newDoc, {
        activeCardId: newCard.id,
      });
    },

    addCardFromTemplate: (templateType: string) => {
      const { document } = get();
      if (!document) return;

      const cardId = `card-${uuidv4()}`;
      let cardChildren: (ILayout | IBlock)[] = [];

      // ==============================================================
      // BASIC LAYOUT TEMPLATES
      // ==============================================================

      // Template 1: Image left, Text right
      if (templateType === 'image-text-left') {
        const layoutId = `layout-${uuidv4()}`;
        cardChildren = [
          {
            id: layoutId,
            type: NodeType.LAYOUT,
            variant: LayoutVariant.TWO_COLUMN,
            gap: 6,
            children: [
              createImageBlock(`block-${uuidv4()}`, 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=300&fit=crop', 'Hình ảnh'),
              {
                id: `layout-${uuidv4()}`,
                type: NodeType.LAYOUT,
                variant: LayoutVariant.SINGLE,
                gap: 4,
                children: [
                  createHeadingBlock(`block-${uuidv4()}`, 'Tiêu đề', 2),
                  createTextBlock(`block-${uuidv4()}`, '<p>Điền nội dung tại đây...</p>'),
                ],
              },
            ],
          } as ILayout,
        ];
      }
      // Template 2: Text left, Image right
      else if (templateType === 'text-image-right') {
        const layoutId = `layout-${uuidv4()}`;
        cardChildren = [
          {
            id: layoutId,
            type: NodeType.LAYOUT,
            variant: LayoutVariant.TWO_COLUMN,
            gap: 6,
            children: [
              {
                id: `layout-${uuidv4()}`,
                type: NodeType.LAYOUT,
                variant: LayoutVariant.SINGLE,
                gap: 4,
                children: [
                  createHeadingBlock(`block-${uuidv4()}`, 'Tiêu đề', 2),
                  createTextBlock(`block-${uuidv4()}`, '<p>Điền nội dung tại đây...</p>'),
                ],
              },
              createImageBlock(`block-${uuidv4()}`, 'https://images.unsplash.com/photo-1557683316-973673baf926?w=400&h=300&fit=crop', 'Hình ảnh'),
            ],
          } as ILayout,
        ];
      }
      // Template 3: Two columns text
      else if (templateType === 'two-columns') {
        const layoutId = `layout-${uuidv4()}`;
        cardChildren = [
          createHeadingBlock(`block-${uuidv4()}`, 'Tiêu đề', 2),
          {
            id: layoutId,
            type: NodeType.LAYOUT,
            variant: LayoutVariant.TWO_COLUMN,
            gap: 6,
            children: [
              {
                id: `layout-${uuidv4()}`,
                type: NodeType.LAYOUT,
                variant: LayoutVariant.SINGLE,
                gap: 4,
                children: [
                  createTextBlock(`block-${uuidv4()}`, '<p>Cột 1...</p>'),
                ],
              },
              {
                id: `layout-${uuidv4()}`,
                type: NodeType.LAYOUT,
                variant: LayoutVariant.SINGLE,
                gap: 4,
                children: [
                  createTextBlock(`block-${uuidv4()}`, '<p>Cột 2...</p>'),
                ],
              },
            ],
          } as ILayout,
        ];
      }
      // Template 4: Two columns text (alternative)
      else if (templateType === 'two-columns-alt') {
        const layoutId = `layout-${uuidv4()}`;
        cardChildren = [
          createHeadingBlock(`block-${uuidv4()}`, 'Tiêu đề', 2),
          {
            id: layoutId,
            type: NodeType.LAYOUT,
            variant: LayoutVariant.TWO_COLUMN,
            gap: 6,
            children: [
              {
                id: `layout-${uuidv4()}`,
                type: NodeType.LAYOUT,
                variant: LayoutVariant.SINGLE,
                gap: 4,
                children: [
                  createTextBlock(`block-${uuidv4()}`, '<p>Nội dung 1...</p>'),
                ],
              },
              {
                id: `layout-${uuidv4()}`,
                type: NodeType.LAYOUT,
                variant: LayoutVariant.SINGLE,
                gap: 4,
                children: [
                  createTextBlock(`block-${uuidv4()}`, '<p>Nội dung 2...</p>'),
                ],
              },
            ],
          } as ILayout,
        ];
      }
      // Template 5: Three columns
      else if (templateType === 'three-columns') {
        const layoutId = `layout-${uuidv4()}`;
        cardChildren = [
          createHeadingBlock(`block-${uuidv4()}`, 'Tiêu đề', 2),
          {
            id: layoutId,
            type: NodeType.LAYOUT,
            variant: LayoutVariant.THREE_COLUMN,
            gap: 6,
            children: [
              {
                id: `layout-${uuidv4()}`,
                type: NodeType.LAYOUT,
                variant: LayoutVariant.SINGLE,
                gap: 4,
                children: [
                  createTextBlock(`block-${uuidv4()}`, '<p>Cột 1...</p>'),
                ],
              },
              {
                id: `layout-${uuidv4()}`,
                type: NodeType.LAYOUT,
                variant: LayoutVariant.SINGLE,
                gap: 4,
                children: [
                  createTextBlock(`block-${uuidv4()}`, '<p>Cột 2...</p>'),
                ],
              },
              {
                id: `layout-${uuidv4()}`,
                type: NodeType.LAYOUT,
                variant: LayoutVariant.SINGLE,
                gap: 4,
                children: [
                  createTextBlock(`block-${uuidv4()}`, '<p>Cột 3...</p>'),
                ],
              },
            ],
          } as ILayout,
        ];
      }
      // Template 6: Three columns (alternative)
      else if (templateType === 'three-columns-alt') {
        const layoutId = `layout-${uuidv4()}`;
        cardChildren = [
          createHeadingBlock(`block-${uuidv4()}`, 'Tiêu đề', 2),
          {
            id: layoutId,
            type: NodeType.LAYOUT,
            variant: LayoutVariant.THREE_COLUMN,
            gap: 6,
            children: [
              {
                id: `layout-${uuidv4()}`,
                type: NodeType.LAYOUT,
                variant: LayoutVariant.SINGLE,
                gap: 4,
                children: [
                  createTextBlock(`block-${uuidv4()}`, '<p>Nội dung 1</p>'),
                ],
              },
              {
                id: `layout-${uuidv4()}`,
                type: NodeType.LAYOUT,
                variant: LayoutVariant.SINGLE,
                gap: 4,
                children: [
                  createTextBlock(`block-${uuidv4()}`, '<p>Nội dung 2</p>'),
                ],
              },
              {
                id: `layout-${uuidv4()}`,
                type: NodeType.LAYOUT,
                variant: LayoutVariant.SINGLE,
                gap: 4,
                children: [
                  createTextBlock(`block-${uuidv4()}`, '<p>Nội dung 3</p>'),
                ],
              },
            ],
          } as ILayout,
        ];
      }

      // ==============================================================
      // FREEFORM TEMPLATES (no templateId, special-purpose cards)
      // ==============================================================

      // TITLE_CARD: First slide only. Title + subject info.
      else if (templateType === 'title-card') {
        cardChildren = [
          createTextBlock(`block-${uuidv4()}`, '<h1>Tiêu đề bài học</h1><p>Môn học · Lớp · Giáo viên</p>'),
        ];
      }
      // BULLET_CARD: List of 4+ items. E.g. objectives, applications.
      else if (templateType === 'bullet-card') {
        cardChildren = [
          createHeadingBlock(`block-${uuidv4()}`, 'Mục tiêu bài học', 2),
          createTextBlock(
            `block-${uuidv4()}`,
            '<ul><li>Mục tiêu 1</li><li>Mục tiêu 2</li><li>Mục tiêu 3</li><li>Mục tiêu 4</li></ul>'
          ),
        ];
      }
      // SECTION_DIV: Transition slide between major topics. Dark bg.
      else if (templateType === 'section-divider') {
        const newSectionCard: ICard = {
          id: cardId,
          type: NodeType.CARD,
          title: 'Section Divider',
          backgroundColor: '#1e293b',
          children: [
            createTextBlock(`block-${uuidv4()}`, '<h1>Tên chủ đề</h1>'),
          ],
        };

        const newDoc = {
          ...document,
          cards: [...document.cards, newSectionCard],
          updatedAt: new Date().toISOString(),
        };

        setDocumentWithHistory(newDoc, {
          activeCardId: newSectionCard.id,
        });
        return;
      }
      // QUIZ_CARD: 2-4 multiple choice questions.
      else if (templateType === 'quiz-card') {
        cardChildren = [
          createQuizBlock(`block-${uuidv4()}`, '', [
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
          ]),
        ];
      }
      // FLASHCARD_CARD: Review cards. Front = concept, Back = definition.
      else if (templateType === 'flashcard-card') {
        cardChildren = [
          createFlashcardBlock(`block-${uuidv4()}`, 'Khái niệm', 'Định nghĩa chi tiết của khái niệm...'),
        ];
      }
      // FILL_BLANK_CARD: Active review. Key sentences with blanks.
      else if (templateType === 'fill-blank-card') {
        cardChildren = [
          createFillBlankBlock(`block-${uuidv4()}`, '[Từ khoá] là một khái niệm quan trọng trong [lĩnh vực].'),
        ];
      }
      // SUMMARY_CARD: Last slide. Summary of 4-6 key points.
      else if (templateType === 'summary-card') {
        cardChildren = [
          createHeadingBlock(`block-${uuidv4()}`, 'Tóm tắt bài học', 2),
          createTextBlock(
            `block-${uuidv4()}`,
            '<ul><li>Ý chính 1</li><li>Ý chính 2</li><li>Ý chính 3</li><li>Ý chính 4</li></ul>'
          ),
        ];
      }

      // Map freeform types to descriptive card titles
      const freeformTitles: Record<string, string> = {
        'title-card': 'Title Card',
        'bullet-card': 'Bullet List',
        'quiz-card': 'Quiz',
        'flashcard-card': 'Flashcard',
        'fill-blank-card': 'Fill in Blank',
        'summary-card': 'Summary',
      };

      const cardTitle = freeformTitles[templateType] || `Slide ${document.cards.length + 1}`;

      const newCard = createCard(
        cardId,
        cardTitle,
        cardChildren
      );

      const newDoc = {
        ...document,
        cards: [...document.cards, newCard],
        updatedAt: new Date().toISOString(),
      };

      setDocumentWithHistory(newDoc, {
        activeCardId: newCard.id,
      });
    },

    addBlockToCard: (cardId: string, blockType: BlockType) => {
      const { document } = get();
      if (!document) return;

      const newBlock = createBlockByType(blockType);

      const newDoc = {
        ...document,
        cards: document.cards.map((card) =>
          card.id === cardId
            ? { ...card, children: [...card.children, newBlock] }
            : card
        ),
        updatedAt: new Date().toISOString(),
      };

      setDocumentWithHistory(newDoc, {
        selectedNodeId: newBlock.id,
      });
    },

    addLayoutToCard: (cardId: string, variant: LayoutVariant) => {
      const { document } = get();
      if (!document) return;

      const newLayout = createLayout(
        `layout-${uuidv4()}`,
        variant,
        [],
        4
      );

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

    addBlockToLayout: (layoutId: string, blockType: BlockType) => {
      const { document } = get();
      if (!document) return;

      const newBlock = createBlockByType(blockType);

      const newDoc = {
        ...document,
        cards: document.cards.map((card) => ({
          ...card,
          children: updateNodeInTree<ILayout | IBlock>(
            card.children,
            layoutId,
            (node) => {
              if (isLayout(node)) {
                return {
                  ...node,
                  children: [...node.children, newBlock],
                } as ILayout;
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
  };
}
