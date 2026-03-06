/**
 * EduVi Mock Data - BACKEND API CONTRACT
 * =======================================
 * 
 * ⚠️ IMPORTANT: This file defines the EXACT JSON structure that Backend API must return.
 * 
 * BACKEND API ENDPOINTS:
 * ----------------------
 * GET    /api/documents/:id      → Returns IDocument (this structure)
 * POST   /api/documents           → Creates document, returns IDocument
 * PUT    /api/documents/:id      → Updates document, returns IDocument
 * DELETE /api/documents/:id      → Returns { success: boolean }
 * GET    /api/documents?userId=X → Returns IDocument[]
 * 
 * DATA FORMAT REQUIREMENTS:
 * -------------------------
 * ✅ Pure JSON - NO helper functions like createCard(), createBlock()
 * ✅ All IDs must be UUID strings (use uuid library: uuid.v4())
 * ✅ Dates must be ISO 8601 format: "2026-02-24T10:00:00.000Z"
 * ✅ All enums must use string values: "CARD", "BLOCK", "TEXT", etc.
 * ✅ Node hierarchy: IDocument → ICard[] → (ILayout | IBlock)[] → IBlock[]
 * 
 * VALIDATION RULES:
 * -----------------
 * - document.id: required, UUID string
 * - document.title: required, max 255 chars
 * - document.cards: required, min 1 card
 * - card.type: must be "CARD"
 * - block.type: must be "BLOCK"
 * - layout.type: must be "LAYOUT"
 * - block.content.type: must be valid BlockType enum
 * 
 * DATABASE STORAGE:
 * -----------------
 * Recommended: Store as JSONB in PostgreSQL or MongoDB document
 * Alternative: Normalize into documents/cards/blocks/layouts tables
 */

import {
  IDocument,
  ICard,
  ILayout,
  IBlock,
  NodeType,
  BlockType,
  LayoutVariant,
  ICardOutline,
} from '@/types';

// ============================================================================
// FRONTEND HELPER FUNCTIONS (NOT FOR BACKEND)
// ============================================================================

/**
 * ⚠️ WARNING: These helper functions are ONLY for Frontend development.
 * Backend API should NOT use these - just return pure JSON.
 * 
 * These are convenience utilities for:
 * - Creating new blocks in the UI editor
 * - Testing components
 * - Seeding data
 */

/**
 * Creates a text block (Frontend helper only)
 */
export function createTextBlock(id: string, html: string): IBlock {
  return {
    id,
    type: NodeType.BLOCK,
    content: {
      type: BlockType.TEXT,
      html,
    },
    children: [],
  };
}

/**
 * Creates a heading block (Frontend helper only)
 */
export function createHeadingBlock(
  id: string,
  html: string,
  level: 1 | 2 | 3 | 4 | 5 | 6 = 1
): IBlock {
  return {
    id,
    type: NodeType.BLOCK,
    content: {
      type: BlockType.HEADING,
      html,
      level,
    },
    children: [],
  };
}

/**
 * Creates an image block (Frontend helper only)
 */
export function createImageBlock(
  id: string,
  src: string,
  alt: string,
  caption?: string
): IBlock {
  return {
    id,
    type: NodeType.BLOCK,
    content: {
      type: BlockType.IMAGE,
      src,
      alt,
      caption,
    },
    children: [],
  };
}

/**
 * Creates a video block (Frontend helper only)
 */
export function createVideoBlock(
  id: string,
  src: string,
  provider: 'youtube' | 'vimeo' | 'direct' = 'youtube'
): IBlock {
  return {
    id,
    type: NodeType.BLOCK,
    content: {
      type: BlockType.VIDEO,
      src,
      provider,
    },
    children: [],
  };
}

/**
 * Creates a layout node (Frontend helper only)
 */
export function createLayout(
  id: string,
  variant: LayoutVariant,
  children: IBlock[] = [],
  gap: number = 4
): ILayout {
  return {
    id,
    type: NodeType.LAYOUT,
    variant,
    gap,
    children,
  };
}

/**
 * Creates a card/slide node (Frontend helper only)
 */
export function createCard(
  id: string,
  title: string,
  children: (ILayout | IBlock)[] = [],
  options?: { backgroundColor?: string; backgroundImage?: string }
): ICard {
  return {
    id,
    type: NodeType.CARD,
    title,
    children,
    backgroundColor: options?.backgroundColor,
    backgroundImage: options?.backgroundImage,
  };
}

/**
 * Creates a Quiz block (Frontend helper only)
 */
export function createQuizBlock(
  id: string,
  title: string,
  questions: Array<{
    id: string;
    question: string;
    options: Array<{ id: string; text: string }>;
    correctIndex: number;
    explanation?: string;
  }>
): IBlock {
  return {
    id,
    type: NodeType.BLOCK,
    content: {
      type: BlockType.QUIZ,
      title,
      questions,
    },
    children: [],
  };
}

/**
 * Creates a Flashcard block (Frontend helper only)
 */
export function createFlashcardBlock(
  id: string,
  front: string,
  back: string
): IBlock {
  return {
    id,
    type: NodeType.BLOCK,
    content: {
      type: BlockType.FLASHCARD,
      front,
      back,
    },
    children: [],
  };
}

/**
 * Creates a Fill-in-the-Blank block (Frontend helper only)
 */
export function createFillBlankBlock(
  id: string,
  sentence: string
): IBlock {
  const regex = /\[([^\]]+)\]/g;
  const blanks: string[] = [];
  let match;
  while ((match = regex.exec(sentence)) !== null) {
    blanks.push(match[1]);
  }

  return {
    id,
    type: NodeType.BLOCK,
    content: {
      type: BlockType.FILL_BLANK,
      sentence,
      blanks,
    },
    children: [],
  };
}

// ============================================================================
// MOCK API RESPONSE - FULL DOCUMENT EXAMPLE
// ============================================================================



/**
 * Example API Response: POST /api/documents (Create new document)
 * 
 * Minimal document template for new projects.
 * Backend should generate UUIDs and timestamps automatically.
 */
export const emptyDocument: IDocument = {
  id: 'doc-new',
  title: 'Untitled Presentation',
  activeCardId: 'card-new-001',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  cards: [
    {
      id: 'card-new-001',
      type: NodeType.CARD,
      templateId: 'template-003',
      title: 'Slide 1',
      backgroundColor: undefined,
      backgroundImage: undefined,
      children: [
        {
          id: 'block-new-001',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.HEADING,
            html: '<h1>Your Title Here</h1>',
            level: 1,
          },
          children: [],
        },
        {
          id: 'layout-new-001',
          type: NodeType.LAYOUT,
          variant: LayoutVariant.TWO_COLUMN,
          gap: 6,
          children: [
            {
              id: 'block-new-002',
              type: NodeType.BLOCK,
              content: {
                type: BlockType.TEXT,
                html: '<p>Start typing your content...</p>',
              },
              children: [],
            },
            {
              id: 'block-new-003',
              type: NodeType.BLOCK,
              content: {
                type: BlockType.TEXT,
                html: '<p>Add more content here...</p>',
              },
              children: [],
            },
          ],
        },
      ],
    },
  ],
};

// ============================================================================
// MOCK API RESPONSE - GEOGRAPHY LESSON DOCUMENT
// ============================================================================

/**
 * Example API Response: Task result for "BÀI 1: ĐỊA LÍ VỚI ĐỜI SỐNG"
 * 
 * taskId: "d8e48da4-6eb1-4b76-b71c-503c0f3e97a5"
 * userId: "5" | productId: 1 | status: "completed"
 */
export const mockDocument: IDocument = {
  id: 'd8e48da4-6eb1-4b76-b71c-503c0f3e97a5',
  title: 'BÀI 1: ĐỊA LÍ VỚI ĐỜI SỐNG',
  activeCardId: 'card-7dc58994',
  createdAt: '2026-03-06T10:00:00.000Z',
  updatedAt: '2026-03-06T10:00:00.000Z',
  cards: [
    // ========================================================================
    // CARD 1: Title slide
    // ========================================================================
    {
      id: 'card-7dc58994',
      type: NodeType.CARD,
      title: 'BÀI 1: ĐỊA LÍ VỚI ĐỜI SỐNG',
      backgroundColor: undefined,
      backgroundImage: undefined,
      children: [
        {
          id: 'block-90a00cfd',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.TEXT,
            html: '<h1>BÀI 1: ĐỊA LÍ VỚI ĐỜI SỐNG</h1><p>Lớp 10</p>',
          },
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 2: Mục tiêu bài học
    // ========================================================================
    {
      id: 'card-e58720dd',
      type: NodeType.CARD,
      title: 'Mục tiêu bài học',
      backgroundColor: undefined,
      backgroundImage: undefined,
      children: [
        {
          id: 'block-a85bc490',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.HEADING,
            html: 'Mục tiêu bài học',
            level: 2,
          },
          children: [],
        },
        {
          id: 'block-8aafbfb6',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.TEXT,
            html: '<ul><li>Nêu được khái niệm, đặc điểm và vai trò của Địa lí học.</li><li>Rèn luyện khả năng tự học, giao tiếp, hợp tác và giải quyết vấn đề.</li><li>Phát triển năng lực nhận thức, tìm tòi, khám phá và vận dụng kiến thức địa lí vào thực tiễn.</li><li>Hình thành ý thức chăm chỉ, trách nhiệm với môi trường và xã hội.</li></ul>',
          },
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 3: Section divider - Địa lí học là gì?
    // ========================================================================
    {
      id: 'card-76541604',
      type: NodeType.CARD,
      title: 'Địa lí học là gì?',
      backgroundColor: '#1e293b',
      backgroundImage: undefined,
      children: [
        {
          id: 'block-63bdea3c',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.TEXT,
            html: '<h1>Địa lí học là gì?</h1>',
          },
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 4: Khái niệm Địa lí học
    // ========================================================================
    {
      id: 'card-354877e8',
      type: NodeType.CARD,
      title: 'Khái niệm Địa lí học',
      backgroundColor: undefined,
      backgroundImage: undefined,
      children: [
        {
          id: 'block-13d0a063',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.HEADING,
            html: 'Khái niệm Địa lí học',
            level: 2,
          },
          children: [],
        },
        {
          id: 'block-14588e7b',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.TEXT,
            html: '<ul><li>Là một ngành khoa học nghiên cứu về không gian địa lí.</li><li>Tìm hiểu các hiện tượng tự nhiên và xã hội trên bề mặt Trái Đất.</li><li>Là một hệ thống khoa học, bao gồm địa lí tự nhiên và địa lí kinh tế – xã hội.</li><li>Có tính tổng hợp cao, kết nối nhiều lĩnh vực kiến thức.</li></ul>',
          },
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 5: Đặc điểm của môn Địa lí ở trường phổ thông
    // ========================================================================
    {
      id: 'card-5245c77a',
      type: NodeType.CARD,
      title: 'Đặc điểm của môn Địa lí ở trường phổ thông',
      backgroundColor: undefined,
      backgroundImage: undefined,
      children: [
        {
          id: 'block-11ad3315',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.HEADING,
            html: 'Đặc điểm của môn Địa lí ở trường phổ thông',
            level: 2,
          },
          children: [],
        },
        {
          id: 'block-ea2ffb51',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.TEXT,
            html: '<ul><li>Được học ở tất cả các cấp học phổ thông (Tiểu học, THCS, THPT).</li><li>Ở Tiểu học và THCS: nội dung địa lí thuộc môn Lịch sử và Địa lí.</li><li>Ở THPT: Địa lí là môn học thuộc nhóm môn khoa học xã hội.</li><li>Có tính chất tổng hợp, bao gồm cả khoa học tự nhiên và khoa học xã hội.</li><li>Có mối liên quan chặt chẽ với nhiều môn học khác.</li></ul>',
          },
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 6: Vai trò của môn Địa lí
    // ========================================================================
    {
      id: 'card-16041832',
      type: NodeType.CARD,
      title: 'Vai trò của môn Địa lí',
      backgroundColor: undefined,
      backgroundImage: undefined,
      children: [
        {
          id: 'block-21e6428a',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.HEADING,
            html: 'Vai trò của môn Địa lí',
            level: 2,
          },
          children: [],
        },
        {
          id: 'block-892a3df6',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.TEXT,
            html: '<ul><li>Cung cấp kiến thức cơ bản về khoa học địa lí.</li><li>Giúp hiểu biết về môi trường, tài nguyên, dân cư, kinh tế.</li><li>Phát triển khả năng ứng dụng kiến thức địa lí vào đời sống thực tiễn.</li><li>Góp phần hình thành thế giới quan khoa học và giáo dục phẩm chất.</li><li>Giúp các em hiểu rõ hơn về thế giới xung quanh và các vấn đề toàn cầu.</li></ul>',
          },
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 7: Kiểm tra kiến thức (Quiz)
    // ========================================================================
    {
      id: 'card-718bb740',
      type: NodeType.CARD,
      title: 'Kiểm tra kiến thức',
      backgroundColor: undefined,
      backgroundImage: undefined,
      children: [
        {
          id: 'block-166693c3',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.QUIZ,
            title: 'Kiểm tra kiến thức',
            questions: [
              {
                id: 'q-71ade54d',
                question: 'Đặc điểm nổi bật nhất của môn Địa lí ở trường phổ thông là gì?',
                options: [
                  { id: 'opt-166804cd', text: 'Chỉ thuộc nhóm môn khoa học xã hội' },
                  { id: 'opt-296ff523', text: 'Chỉ thuộc nhóm môn khoa học tự nhiên' },
                  { id: 'opt-825fead7', text: 'Mang tính chất tổng hợp, bao gồm cả khoa học tự nhiên và xã hội' },
                  { id: 'opt-17331bf8', text: 'Không liên quan đến các môn học khác' },
                ],
                correctIndex: 2,
                explanation: 'Môn Địa lí mang tính chất tổng hợp, nghiên cứu cả các hiện tượng tự nhiên và các hoạt động kinh tế - xã hội của con người.',
              }
            ],
          },
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 8: Section divider - Ứng dụng và định hướng nghề nghiệp
    // ========================================================================
    {
      id: 'card-3e728417',
      type: NodeType.CARD,
      title: 'Ứng dụng và định hướng nghề nghiệp',
      backgroundColor: '#1e293b',
      backgroundImage: undefined,
      children: [
        {
          id: 'block-39674eed',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.TEXT,
            html: '<h1>Ứng dụng và định hướng nghề nghiệp</h1>',
          },
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 9: Ứng dụng của Địa lí học trong đời sống
    // ========================================================================
    {
      id: 'card-1a1defb8',
      type: NodeType.CARD,
      title: 'Ứng dụng của Địa lí học trong đời sống',
      backgroundColor: undefined,
      backgroundImage: undefined,
      children: [
        {
          id: 'block-cc808261',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.HEADING,
            html: 'Ứng dụng của Địa lí học trong đời sống',
            level: 2,
          },
          children: [],
        },
        {
          id: 'block-f463814d',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.TEXT,
            html: '<ul><li><strong>Quy hoạch đô thị và nông thôn:</strong> Địa lí giúp phân tích vị trí, điều kiện tự nhiên, dân cư để xây dựng các khu dân cư, công nghiệp, giao thông một cách hợp lí.</li><li><strong>Quản lí tài nguyên và môi trường:</strong> Nghiên cứu sự phân bố, khai thác và bảo vệ tài nguyên (đất, nước, rừng...) cũng như đánh giá tác động môi trường.</li><li><strong>Dự báo thời tiết và khí hậu:</strong> Phân tích các yếu tố địa lí để đưa ra dự báo về thời tiết, cảnh báo thiên tai (bão, lũ lụt, hạn hán).</li><li><strong>Phát triển du lịch:</strong> Xác định các địa điểm có tiềm năng du lịch, xây dựng tuyến điểm và quản lí hoạt động du lịch bền vững.</li><li><strong>Hệ thống định vị toàn cầu (GPS) và bản đồ số:</strong> Ứng dụng trong giao thông, vận tải, tìm đường, quản lí đất đai và nhiều lĩnh vực khác.</li></ul>',
          },
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 10: Môn Địa lí với định hướng nghề nghiệp
    // ========================================================================
    {
      id: 'card-d54dcc40',
      type: NodeType.CARD,
      title: 'Môn Địa lí với định hướng nghề nghiệp',
      backgroundColor: undefined,
      backgroundImage: undefined,
      children: [
        {
          id: 'block-ed5a421e',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.HEADING,
            html: 'Môn Địa lí với định hướng nghề nghiệp',
            level: 2,
          },
          children: [],
        },
        {
          id: 'block-fb50dbd8',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.TEXT,
            html: '<ul><li><strong>Chuyên gia Quy hoạch:</strong> Lập kế hoạch phát triển đô thị, nông thôn, sử dụng đất đai hiệu quả.</li><li><strong>Hướng dẫn viên du lịch, Quản lí du lịch:</strong> Khám phá, giới thiệu các vùng đất, văn hóa và cảnh quan.</li><li><strong>Kĩ sư Địa chất, Khí tượng thủy văn:</strong> Nghiên cứu đất đai, khoáng sản, dự báo thời tiết và khí hậu.</li><li><strong>Chuyên viên Hệ thống thông tin địa lí (GIS):</strong> Xử lí, phân tích dữ liệu không gian để đưa ra các quyết định.</li><li><strong>Giáo viên Địa lí:</strong> Truyền đạt kiến thức, niềm đam mê về thế giới tự nhiên và con người.</li><li><strong>Nghiên cứu viên Địa lí:</strong> Khám phá, giải quyết các vấn đề môi trường, xã hội và phát triển bền vững.</li></ul>',
          },
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 11: Mối liên hệ của Địa lí với các môn học khác
    // ========================================================================
    {
      id: 'card-a8eff5e0',
      type: NodeType.CARD,
      title: 'Mối liên hệ của Địa lí với các môn học khác',
      backgroundColor: undefined,
      backgroundImage: undefined,
      children: [
        {
          id: 'block-9e23a8c3',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.HEADING,
            html: 'Mối liên hệ của Địa lí với các môn học khác',
            level: 2,
          },
          children: [],
        },
        {
          id: 'block-8e554541',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.TEXT,
            html: '<ul><li><strong>Lịch sử:</strong> Hiểu bối cảnh không gian của các sự kiện lịch sử, sự hình thành và phát triển của các nền văn minh.</li><li><strong>Toán học:</strong> Ứng dụng trong xử lí số liệu, tính toán tỉ lệ bản đồ, diện tích, vẽ biểu đồ, đồ thị.</li><li><strong>Vật lí, Hóa học:</strong> Giải thích các hiện tượng tự nhiên như khí hậu, thủy văn, cấu tạo địa chất, tài nguyên.</li><li><strong>Sinh học:</strong> Nghiên cứu sự phân bố của các loài sinh vật, hệ sinh thái và mối quan hệ với môi trường địa lí.</li><li><strong>Tin học:</strong> Ứng dụng công nghệ thông tin trong thu thập, phân tích dữ liệu không gian (GIS, viễn thám).</li><li><strong>Giáo dục kinh tế và pháp luật:</strong> Phân tích các vấn đề kinh tế, xã hội, môi trường dưới góc độ không gian và chính sách.</li></ul>',
          },
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 12: Ôn tập khái niệm (Flashcards)
    // ========================================================================
    {
      id: 'card-5b0f66c8',
      type: NodeType.CARD,
      title: 'Ôn tập khái niệm',
      backgroundColor: undefined,
      backgroundImage: undefined,
      children: [
        {
          id: 'block-fc-077d6c7c',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.FLASHCARD,
            front: 'Khái niệm Địa lí học',
            back: 'Địa lí là một ngành khoa học nghiên cứu về Trái Đất, bao gồm các yếu tố tự nhiên và kinh tế – xã hội, sự phân bố và mối quan hệ giữa chúng.',
          },
          children: [],
        },
        {
          id: 'block-fc-2963a541',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.FLASHCARD,
            front: 'Tính chất tổng hợp của môn Địa lí',
            back: 'Địa lí là môn học tổng hợp, kết hợp kiến thức từ cả khoa học tự nhiên (địa lí tự nhiên) và khoa học xã hội (địa lí kinh tế – xã hội).',
          },
          children: [],
        },
        {
          id: 'block-fc-5d041154',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.FLASHCARD,
            front: 'Vai trò của môn Địa lí',
            back: 'Cung cấp kiến thức về thế giới, rèn luyện kĩ năng, hình thành phẩm chất, giúp hiểu và giải quyết các vấn đề thực tiễn, định hướng nghề nghiệp.',
          },
          children: [],
        },
        {
          id: 'block-fc-bb5aecde',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.FLASHCARD,
            front: 'Ứng dụng của Địa lí học trong đời sống và định hướng nghề nghiệp',
            back: 'Ứng dụng trong quy hoạch, quản lí tài nguyên, du lịch, dự báo thời tiết, nghiên cứu môi trường, và nhiều ngành nghề khác như địa chất, GIS, giáo dục.',
          },
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 13: Tóm tắt bài học
    // ========================================================================
    {
      id: 'card-270ad76b',
      type: NodeType.CARD,
      title: 'Tóm tắt bài học',
      backgroundColor: undefined,
      backgroundImage: undefined,
      children: [
        {
          id: 'block-4d21c994',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.HEADING,
            html: 'Tóm tắt bài học',
            level: 2,
          },
          children: [],
        },
        {
          id: 'block-d1e9740b',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.TEXT,
            html: '<ul><li>Địa lí là một ngành khoa học tổng hợp, nghiên cứu cả tự nhiên và kinh tế – xã hội.</li><li>Môn Địa lí có tính đặc thù, được giảng dạy ở tất cả các cấp học và có mối liên hệ với nhiều môn khoa học khác.</li><li>Vai trò của Địa lí là cung cấp kiến thức cơ bản, giúp hiểu biết về thế giới và ứng dụng vào thực tiễn cuộc sống.</li><li>Kiến thức Địa lí có giá trị giáo dục to lớn và liên quan đến nhiều ngành nghề trong xã hội.</li></ul>',
          },
          children: [],
        },
      ],
    },
  ],
};

// ============================================================================
// PROMPT EDITOR MOCK DATA
// ============================================================================

/**
 * Sample prompts for testing Prompt Editor
 * These represent typical user input before AI generation
 */
export const mockPrompts = {
  eduViLaunch: {
    mainPrompt: 'Tạo bài thuyết trình về sản phẩm EduVi - nền tảng tạo slide thế hệ mới',
    additionalInstructions: 'Tập trung vào các tính năng công nghệ, kiến trúc hệ thống, và lợi ích cho người dùng. Thêm ví dụ tương tác.',
  },
  jsBasics: {
    mainPrompt: 'Tạo bài giảng JavaScript cơ bản cho sinh viên',
    additionalInstructions: 'Bao gồm biến, hàm, vòng lặp và ví dụ thực tế',
  },
  reactIntro: {
    mainPrompt: 'Giới thiệu React framework cho developer',
    additionalInstructions: 'Giải thích components, hooks, state management',
  },
};

/**
 * Generated card outlines for Prompt Editor
 * This represents what the AI would return after processing a prompt
 * Based on the mockDocument slides content
 */
export const mockCardOutlines: ICardOutline[] = [
  {
    id: 'outline-001',
    title: 'Welcome',
    bullets: [
      'Giới thiệu EduVi - nền tảng slide thế hệ mới',
      'Tạo nội dung đẹp và động với trình soạn thảo trực quan',
      'Hình ảnh hero với caption "Transform your ideas into stunning presentations"',
    ],
    order: 0,
  },
  {
    id: 'outline-002',
    title: 'Key Features',
    bullets: [
      '🚀 Lightning Fast - Xây dựng với Next.js 14, tối ưu hiệu suất',
      '🎨 Beautiful Design - Template chuyên nghiệp với Tailwind CSS',
      '📝 Rich Text Editing - Trình soạn thảo Tiptap mạnh mẽ',
      '🔄 Real-time Collaboration - Làm việc nhóm, đồng bộ tức thì',
    ],
    order: 1,
  },
  {
    id: 'outline-003',
    title: 'Architecture',
    bullets: [
      'Kiến trúc Node-Based với cấu trúc cây đệ quy',
      'Card Node - Đại diện cho một slide (trục X)',
      'Layout Node - Container cấu trúc (trục Y)',
      'Block Node - Phần tử nội dung (độ sâu Z)',
      'Layout linh hoạt: Grid, Column, Masonry',
    ],
    order: 2,
  },
  {
    id: 'outline-004',
    title: 'Demo',
    bullets: [
      'Xem EduVi hoạt động thực tế',
      'Nội dung tự động reflow khi chỉnh sửa',
      'Không cần điều chỉnh vị trí thủ công',
      'Thử mở rộng block và xem các phần tử khác tự động điều chỉnh',
    ],
    order: 3,
  },
  {
    id: 'outline-005',
    title: 'Get Started',
    bullets: [
      'Sẵn sàng tạo bài thuyết trình của bạn',
      'Free Tier: 5 presentations, basic templates, PDF export',
      'Pro Tier: Unlimited presentations, premium templates, all formats, collaboration',
      'EduVi giúp tạo nội dung chuyên nghiệp, hấp dẫn và động',
    ],
    order: 4,
  },
  {
    id: 'outline-006',
    title: 'Interactive Demo',
    bullets: [
      'Widget học tập tương tác',
      'Quiz: Câu hỏi trắc nghiệm JavaScript với giải thích',
      'Flashcard: Thẻ ghi nhớ lật hai mặt',
      'Fill-in-Blank: Điền vào chỗ trống',
      'Hoạt động mượt mà trên Flutter Viewer app',
    ],
    order: 5,
  },
];

/**
 * Alternative outline examples for different topics
 */
export const mockJavaScriptOutline: ICardOutline[] = [
  {
    id: 'js-outline-001',
    title: 'Giới thiệu JavaScript',
    bullets: [
      'JavaScript là ngôn ngữ lập trình phổ biến nhất',
      'Chạy trên mọi trình duyệt web',
      'Sử dụng cho cả Frontend và Backend (Node.js)',
    ],
    order: 0,
  },
  {
    id: 'js-outline-002',
    title: 'Biến và Kiểu dữ liệu',
    bullets: [
      'var, let, const - cách khai báo biến',
      'Kiểu dữ liệu: String, Number, Boolean, Object, Array',
      'Template literals với backticks',
      'Ví dụ thực tế về khai báo và sử dụng biến',
    ],
    order: 1,
  },
  {
    id: 'js-outline-003',
    title: 'Hàm (Functions)',
    bullets: [
      'Function declaration vs Function expression',
      'Arrow functions (ES6+)',
      'Parameters và return values',
      'Callback functions',
    ],
    order: 2,
  },
  {
    id: 'js-outline-004',
    title: 'Vòng lặp và Điều kiện',
    bullets: [
      'if/else statements',
      'Switch case',
      'for loop, while loop, forEach',
      'map, filter, reduce cho arrays',
    ],
    order: 3,
  },
  {
    id: 'js-outline-005',
    title: 'DOM Manipulation',
    bullets: [
      'querySelector và getElementById',
      'Thay đổi nội dung HTML',
      'Thêm/xóa CSS classes',
      'Event listeners',
    ],
    order: 4,
  },
];

export const mockReactOutline: ICardOutline[] = [
  {
    id: 'react-outline-001',
    title: 'React là gì?',
    bullets: [
      'Thư viện JavaScript để xây dựng giao diện',
      'Được phát triển bởi Meta (Facebook)',
      'Component-based architecture',
      'Virtual DOM để tối ưu hiệu suất',
    ],
    order: 0,
  },
  {
    id: 'react-outline-002',
    title: 'Components',
    bullets: [
      'Function Components vs Class Components',
      'Props - truyền dữ liệu giữa components',
      'Children và composition',
      'Component lifecycle',
    ],
    order: 1,
  },
  {
    id: 'react-outline-003',
    title: 'Hooks',
    bullets: [
      'useState - quản lý state',
      'useEffect - side effects',
      'useContext - global state',
      'Custom hooks',
    ],
    order: 2,
  },
  {
    id: 'react-outline-004',
    title: 'State Management',
    bullets: [
      'Local state vs Global state',
      'Context API',
      'Redux Toolkit',
      'Zustand (lightweight alternative)',
    ],
    order: 3,
  },
  {
    id: 'react-outline-005',
    title: 'Best Practices',
    bullets: [
      'Component composition',
      'Avoid prop drilling',
      'Memoization với useMemo và useCallback',
      'Code splitting và lazy loading',
    ],
    order: 4,
  },
];

export default mockDocument;
