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
 * taskId: "d2c06b2d-622b-4527-a7fe-6dda794bc138"
 * userId: "5" | productId: 1 | status: "completed"
 */
export const mockDocument: IDocument = {
  id: 'd2c06b2d-622b-4527-a7fe-6dda794bc138',
  title: 'BÀI 1: ĐỊA LÍ VỚI ĐỜI SỐNG',
  activeCardId: 'card-651a05d2',
  createdAt: '2026-03-06T10:00:00.000Z',
  updatedAt: '2026-03-06T10:00:00.000Z',
  cards: [
    // ========================================================================
    // CARD 1: Title slide
    // ========================================================================
    {
      id: 'card-651a05d2',
      type: NodeType.CARD,
      title: 'BÀI 1: ĐỊA LÍ VỚI ĐỜI SỐNG',
      children: [
        {
          id: 'block-9d84192b',
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
      id: 'card-77d01eab',
      type: NodeType.CARD,
      title: 'Mục tiêu bài học',
      children: [
        {
          id: 'block-897217f2',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.HEADING,
            html: 'Mục tiêu bài học',
            level: 2,
          },
          children: [],
        },
        {
          id: 'block-176712a1',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.TEXT,
            html: '<ul><li>Nêu được vai trò và phạm vi nghiên cứu của Địa lí học.</li><li>Trình bày được các ứng dụng của kiến thức địa lí trong đời sống.</li><li>Phát triển năng lực tìm hiểu và vận dụng kiến thức địa lí vào thực tiễn.</li><li>Hình thành phẩm chất yêu nước, nhân ái, trách nhiệm với môi trường và cộng đồng.</li></ul>',
          },
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 3: Section divider I
    // ========================================================================
    {
      id: 'card-b569c157',
      type: NodeType.CARD,
      title: 'I. KHÁI NIỆM, PHẠM VI VÀ ĐẶC ĐIỂM CỦA ĐỊA LÍ HỌC',
      backgroundColor: '#1e293b',
      children: [
        {
          id: 'block-90c1d7bf',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.TEXT,
            html: '<h1>I. KHÁI NIỆM, PHẠM VI VÀ ĐẶC ĐIỂM CỦA ĐỊA LÍ HỌC</h1>',
          },
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 4: 1. Khái niệm Địa lí học (SIDEBAR_RIGHT layout)
    // ========================================================================
    {
      id: 'card-e5576133',
      type: NodeType.CARD,
      title: '1. Khái niệm Địa lí học',
      templateId: 'template-002',
      children: [
        {
          id: 'layout-c0531b2b',
          type: NodeType.LAYOUT,
          variant: LayoutVariant.SIDEBAR_RIGHT,
          gap: 6,
          children: [
            {
              id: 'block-6be210d1',
              type: NodeType.BLOCK,
              content: {
                type: BlockType.TEXT,
                html: '<p>Địa lí học là một ngành khoa học lâu đời, nghiên cứu về Trái Đất và các hiện tượng trên bề mặt của nó.</p><p>Điểm đặc biệt của Địa lí học là tính tổng hợp. Nó không chỉ nghiên cứu các yếu tố tự nhiên (như địa hình, khí hậu, sông ngòi, đất đai) mà còn cả các yếu tố kinh tế – xã hội (như dân cư, hoạt động sản xuất, văn hóa).</p><p>Địa lí học giúp chúng ta hiểu rõ hơn về mối quan hệ phức tạp giữa con người và môi trường tự nhiên, từ đó có cái nhìn toàn diện về thế giới xung quanh.</p>',
              },
              children: [],
            },
            {
              id: 'block-ac05036b',
              type: NodeType.BLOCK,
              content: {
                type: BlockType.IMAGE,
                src: '',
                alt: 'Hình ảnh quả địa cầu với các biểu tượng về tự nhiên (núi, sông, rừng) và kinh tế-xã hội (thành phố, nhà máy, con người) đan xen',
              },
              children: [],
            },
          ],
        },
      ],
    },

    // ========================================================================
    // CARD 5: 2. Phạm vi nghiên cứu (TWO_COLUMN layout)
    // ========================================================================
    {
      id: 'card-c6372e32',
      type: NodeType.CARD,
      title: '2. Phạm vi nghiên cứu của Địa lí học',
      templateId: 'template-004',
      children: [
        {
          id: 'block-6b57aa3c',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.HEADING,
            html: '2. Phạm vi nghiên cứu của Địa lí học',
            level: 2,
          },
          children: [],
        },
        {
          id: 'layout-ad08a1f5',
          type: NodeType.LAYOUT,
          variant: LayoutVariant.TWO_COLUMN,
          gap: 6,
          children: [
            {
              id: 'block-cbcbf485',
              type: NodeType.BLOCK,
              content: {
                type: BlockType.TEXT,
                html: '<p><strong>1. Các hiện tượng tự nhiên</strong></p><ul><li>Nghiên cứu về địa hình, khí hậu, thủy văn, thổ nhưỡng, sinh vật trên bề mặt Trái Đất.</li><li>Tìm hiểu quy luật hình thành, phân bố và biến đổi của các yếu tố tự nhiên.</li><li>Ví dụ: Tại sao có sa mạc, tại sao có núi lửa, sự thay đổi của khí hậu toàn cầu.</li></ul>',
              },
              children: [],
            },
            {
              id: 'block-d7b46f1d',
              type: NodeType.BLOCK,
              content: {
                type: BlockType.TEXT,
                html: '<p><strong>2. Các hiện tượng kinh tế - xã hội và mối quan hệ</strong></p><ul><li>Nghiên cứu về dân cư, các hoạt động sản xuất (nông nghiệp, công nghiệp, dịch vụ), văn hóa, xã hội.</li><li>Phân tích sự phân bố, phát triển và mối liên hệ giữa các hoạt động kinh tế - xã hội với môi trường tự nhiên.</li><li>Ví dụ: Ảnh hưởng của khí hậu đến nông nghiệp, sự phân bố dân cư theo địa hình, tác động của con người đến môi trường.</li></ul>',
              },
              children: [],
            },
          ],
        },
      ],
    },

    // ========================================================================
    // CARD 6: 3. Đặc điểm (TWO_COLUMN layout)
    // ========================================================================
    {
      id: 'card-fb334671',
      type: NodeType.CARD,
      title: '3. Đặc điểm của môn Địa lí ở trường phổ thông',
      templateId: 'template-004',
      children: [
        {
          id: 'block-98c872f9',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.HEADING,
            html: '3. Đặc điểm của môn Địa lí ở trường phổ thông',
            level: 2,
          },
          children: [],
        },
        {
          id: 'layout-fc06d92a',
          type: NodeType.LAYOUT,
          variant: LayoutVariant.TWO_COLUMN,
          gap: 6,
          children: [
            {
              id: 'block-75dfc3b8',
              type: NodeType.BLOCK,
              content: {
                type: BlockType.TEXT,
                html: '<p><strong>1. Học ở tất cả các cấp</strong></p><ul><li>Tiểu học &amp; THCS: Nội dung Địa lí được tích hợp trong môn Lịch sử và Địa lí.</li><li>THPT: Địa lí là môn học độc lập, thuộc nhóm Khoa học xã hội.</li></ul><p><strong>2. Tính chất tổng hợp</strong></p><p>Môn Địa lí kết hợp kiến thức từ cả khoa học tự nhiên (như địa chất, khí tượng, sinh học) và khoa học xã hội (như kinh tế, dân số, văn hóa), giúp học sinh có cái nhìn đa chiều về thế giới.</p>',
              },
              children: [],
            },
            {
              id: 'block-c0af0d70',
              type: NodeType.BLOCK,
              content: {
                type: BlockType.TEXT,
                html: '<p><strong>3. Mối liên hệ với các môn học khác</strong></p><p>Địa lí có mối liên hệ chặt chẽ với nhiều môn học:</p><ul><li>Khoa học tự nhiên: Toán (thống kê, biểu đồ), Vật lí (khí hậu, địa chất), Hóa học (đất, nước), Sinh học (hệ sinh thái).</li><li>Khoa học xã hội: Lịch sử (bối cảnh địa lí của các sự kiện), Giáo dục kinh tế và pháp luật (phát triển kinh tế, quản lí tài nguyên).</li></ul><p>Điều này giúp học sinh vận dụng kiến thức liên môn để giải quyết các vấn đề thực tiễn.</p>',
              },
              children: [],
            },
          ],
        },
      ],
    },

    // ========================================================================
    // CARD 7: Quiz 1/3
    // ========================================================================
    {
      id: 'card-54f8448b',
      type: NodeType.CARD,
      title: 'Kiểm tra kiến thức (1/3)',
      children: [
        {
          id: 'block-7f821284',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.QUIZ,
            title: 'Kiểm tra kiến thức (1/3)',
            questions: [
              {
                id: 'q-ad7a43e5',
                question: 'Khái niệm nào sau đây mô tả đúng nhất về Địa lí học?',
                options: [
                  { id: 'opt-9fa0f494', text: 'A. Là môn khoa học chỉ nghiên cứu về các hiện tượng tự nhiên.' },
                  { id: 'opt-e72a8010', text: 'B. Là môn khoa học chỉ nghiên cứu về hoạt động kinh tế - xã hội của con người.' },
                  { id: 'opt-8dc4fc6d', text: 'C. Là một ngành khoa học hệ thống, nghiên cứu cả địa lí tự nhiên và địa lí kinh tế – xã hội.' },
                  { id: 'opt-be574ddc', text: 'D. Là môn học chỉ tập trung vào việc vẽ bản đồ và xác định vị trí.' },
                ],
                correctIndex: 2,
                explanation: 'Địa lí học là một ngành khoa học tổng hợp, nghiên cứu cả các yếu tố tự nhiên và các hoạt động kinh tế – xã hội trên Trái Đất.',
              },
            ],
          },
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 8: Quiz 2/3
    // ========================================================================
    {
      id: 'card-70206589',
      type: NodeType.CARD,
      title: 'Kiểm tra kiến thức (2/3)',
      children: [
        {
          id: 'block-b65ef581',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.QUIZ,
            title: 'Kiểm tra kiến thức (2/3)',
            questions: [
              {
                id: 'q-be67870b',
                question: 'Đặc điểm nào thể hiện tính chất tổng hợp của môn Địa lí?',
                options: [
                  { id: 'opt-dd266c95', text: 'A. Được học ở tất cả các cấp học phổ thông.' },
                  { id: 'opt-12a8ac8d', text: 'B. Có mối liên hệ với các môn khoa học tự nhiên như Toán, Vật lí, Sinh học.' },
                  { id: 'opt-90f4f89f', text: 'C. Bao gồm cả lĩnh vực khoa học tự nhiên và lĩnh vực khoa học xã hội.' },
                  { id: 'opt-79ee431a', text: 'D. Có mối liên hệ với các môn khoa học xã hội như Lịch sử, Giáo dục kinh tế và pháp luật.' },
                ],
                correctIndex: 2,
                explanation: 'Tính chất tổng hợp của môn Địa lí được thể hiện rõ nhất qua việc nó bao gồm cả lĩnh vực khoa học tự nhiên và khoa học xã hội.',
              },
            ],
          },
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 9: Quiz 3/3
    // ========================================================================
    {
      id: 'card-8e0ff88c',
      type: NodeType.CARD,
      title: 'Kiểm tra kiến thức (3/3)',
      children: [
        {
          id: 'block-64ecf095',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.QUIZ,
            title: 'Kiểm tra kiến thức (3/3)',
            questions: [
              {
                id: 'q-0a055367',
                question: 'Phạm vi nghiên cứu của Địa lí học bao gồm những lĩnh vực chính nào?',
                options: [
                  { id: 'opt-3ffee240', text: 'A. Chỉ nghiên cứu về khí hậu và địa hình.' },
                  { id: 'opt-19ff1963', text: 'B. Chỉ nghiên cứu về dân cư và các hoạt động sản xuất.' },
                  { id: 'opt-4525dc70', text: 'C. Nghiên cứu cả địa lí tự nhiên và địa lí kinh tế – xã hội.' },
                  { id: 'opt-04dba146', text: 'D. Nghiên cứu chủ yếu về lịch sử hình thành Trái Đất.' },
                ],
                correctIndex: 2,
                explanation: 'Phạm vi nghiên cứu của Địa lí học rất rộng, bao gồm cả các yếu tố tự nhiên (địa lí tự nhiên) và các hoạt động của con người (địa lí kinh tế – xã hội).',
              },
            ],
          },
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 10: Section divider II
    // ========================================================================
    {
      id: 'card-62e9b70e',
      type: NodeType.CARD,
      title: 'II. VAI TRÒ VÀ ỨNG DỤNG CỦA ĐỊA LÍ HỌC TRONG ĐỜI SỐNG',
      backgroundColor: '#1e293b',
      children: [
        {
          id: 'block-789296c3',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.TEXT,
            html: '<h1>II. VAI TRÒ VÀ ỨNG DỤNG CỦA ĐỊA LÍ HỌC TRONG ĐỜI SỐNG</h1>',
          },
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 11: Vai trò nhận thức và giáo dục
    // ========================================================================
    {
      id: 'card-12977773',
      type: NodeType.CARD,
      title: '1. Vai trò của Địa lí học: Nhận thức và Giáo dục',
      children: [
        {
          id: 'block-e6da3afd',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.HEADING,
            html: '1. Vai trò của Địa lí học: Nhận thức và Giáo dục',
            level: 2,
          },
          children: [],
        },
        {
          id: 'block-521478da',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.TEXT,
            html: '<ul><li>Cung cấp những hiểu biết cơ bản về khoa học địa lí, giúp các em khám phá thế giới xung quanh.</li><li>Hình thành thế giới quan khoa học, phát triển tư duy không gian và khả năng phân tích tổng hợp.</li><li>Giúp học sinh có khả năng ứng dụng kiến thức địa lí vào giải quyết các vấn đề thực tiễn trong đời sống.</li><li>Giáo dục ý thức bảo vệ môi trường, tài nguyên thiên nhiên và phát triển bền vững cho tương lai.</li><li>Góp phần hình thành các phẩm chất cần thiết như yêu nước, trách nhiệm cộng đồng.</li></ul>',
          },
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 12: Vai trò ứng dụng quản lý (TWO_COLUMN layout)
    // ========================================================================
    {
      id: 'card-6910e9de',
      type: NodeType.CARD,
      title: '1. Vai trò của Địa lí học: Ứng dụng trong quản lý và phát triển',
      templateId: 'template-004',
      children: [
        {
          id: 'block-5cde8f9a',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.HEADING,
            html: '1. Vai trò của Địa lí học: Ứng dụng trong quản lý và phát triển',
            level: 2,
          },
          children: [],
        },
        {
          id: 'layout-a6a360c5',
          type: NodeType.LAYOUT,
          variant: LayoutVariant.TWO_COLUMN,
          gap: 6,
          children: [
            {
              id: 'block-766126cc',
              type: NodeType.BLOCK,
              content: {
                type: BlockType.TEXT,
                html: '<p><strong>1. Quy hoạch lãnh thổ &amp; Quản lí tài nguyên</strong></p><p>Địa lí giúp chúng ta hiểu rõ đặc điểm tự nhiên, kinh tế - xã hội của một vùng để quy hoạch sử dụng đất hiệu quả, phát triển bền vững.</p><p>Giúp đánh giá, quản lí và khai thác tài nguyên (đất, nước, khoáng sản, rừng) một cách hợp lí, tránh lãng phí và suy thoái.</p>',
              },
              children: [],
            },
            {
              id: 'block-d98988ae',
              type: NodeType.BLOCK,
              content: {
                type: BlockType.TEXT,
                html: '<p><strong>2. Dự báo, phòng chống thiên tai</strong></p><p>Phân tích các hiện tượng tự nhiên (lũ lụt, hạn hán, bão, động đất) để dự báo, cảnh báo sớm và xây dựng kế hoạch phòng chống, giảm nhẹ thiệt hại.</p><p><strong>3. Hỗ trợ phát triển kinh tế - xã hội</strong></p><p>Cung cấp thông tin để xây dựng các dự án phát triển nông nghiệp, công nghiệp, du lịch, giao thông vận tải phù hợp với điều kiện địa lí từng địa phương. Giúp giải quyết các vấn đề môi trường, xã hội.</p>',
              },
              children: [],
            },
          ],
        },
      ],
    },

    // ========================================================================
    // CARD 13: Ứng dụng trong các lĩnh vực (THREE_COLUMN layout)
    // ========================================================================
    {
      id: 'card-43a32608',
      type: NodeType.CARD,
      title: '2. Ứng dụng của Địa lí học trong các lĩnh vực đời sống',
      templateId: 'template-005',
      children: [
        {
          id: 'block-9d495980',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.HEADING,
            html: '2. Ứng dụng của Địa lí học trong các lĩnh vực đời sống',
            level: 2,
          },
          children: [],
        },
        {
          id: 'layout-cb7008cb',
          type: NodeType.LAYOUT,
          variant: LayoutVariant.THREE_COLUMN,
          gap: 6,
          children: [
            {
              id: 'block-cbbfc380',
              type: NodeType.BLOCK,
              content: {
                type: BlockType.TEXT,
                html: '<p><strong>Nông nghiệp &amp; Công nghiệp</strong></p><p>Nông nghiệp: Chọn cây trồng, vật nuôi phù hợp với khí hậu, thổ nhưỡng; quy hoạch vùng sản xuất.</p><p>Công nghiệp: Lựa chọn địa điểm xây dựng nhà máy, khu công nghiệp dựa trên nguồn nguyên liệu, lao động, thị trường.</p>',
              },
              children: [],
            },
            {
              id: 'block-9d3d11d4',
              type: NodeType.BLOCK,
              content: {
                type: BlockType.TEXT,
                html: '<p><strong>Du lịch &amp; Giao thông vận tải</strong></p><p>Du lịch: Khai thác các cảnh quan tự nhiên, di tích lịch sử - văn hóa để phát triển du lịch bền vững.</p><p>Giao thông: Thiết kế tuyến đường, cầu cống, cảng biển tối ưu, an toàn, hiệu quả.</p>',
              },
              children: [],
            },
            {
              id: 'block-c60731dd',
              type: NodeType.BLOCK,
              content: {
                type: BlockType.TEXT,
                html: '<p><strong>Y tế &amp; Quản lí đô thị</strong></p><p>Y tế: Phân tích sự phân bố bệnh tật, dịch tễ để đưa ra giải pháp phòng ngừa, điều trị.</p><p>Quản lí đô thị: Quy hoạch không gian sống, xây dựng hạ tầng, quản lí dân cư và môi trường đô thị.</p>',
              },
              children: [],
            },
          ],
        },
      ],
    },

    // ========================================================================
    // CARD 14: Định hướng nghề nghiệp (SIDEBAR_LEFT layout)
    // ========================================================================
    {
      id: 'card-49d6ca08',
      type: NodeType.CARD,
      title: '3. Môn Địa lí với định hướng nghề nghiệp',
      templateId: 'template-001',
      children: [
        {
          id: 'layout-18985b91',
          type: NodeType.LAYOUT,
          variant: LayoutVariant.SIDEBAR_LEFT,
          gap: 6,
          children: [
            {
              id: 'block-be5b19e4',
              type: NodeType.BLOCK,
              content: {
                type: BlockType.IMAGE,
                src: '',
                alt: 'Hình ảnh các ngành nghề liên quan đến Địa lí: nhà khí tượng, người làm bản đồ, hướng dẫn viên du lịch, nhà quy hoạch đô thị.',
              },
              children: [],
            },
            {
              id: 'block-97cc0bd9',
              type: NodeType.BLOCK,
              content: {
                type: BlockType.TEXT,
                html: '<p>Kiến thức Địa lí mở ra nhiều cơ hội nghề nghiệp đa dạng, giúp các em đóng góp vào sự phát triển của đất nước:</p><ul><li>Khí tượng Thủy văn: Dự báo thời tiết, khí hậu, cảnh báo thiên tai.</li><li>Quy hoạch đô thị/nông thôn: Thiết kế không gian sống, làm việc, giải trí.</li><li>Bản đồ học &amp; GIS: Xây dựng, phân tích bản đồ số, hệ thống thông tin địa lí.</li><li>Du lịch: Hướng dẫn viên, quản lí tour, phát triển sản phẩm du lịch.</li><li>Quản lí tài nguyên &amp; Môi trường: Bảo vệ, khai thác bền vững tài nguyên thiên nhiên.</li><li>Giáo dục: Giáo viên Địa lí, nghiên cứu khoa học.</li></ul><p>Ngoài ra còn có các ngành liên quan đến logistics, bất động sản, nghiên cứu thị trường,...</p>',
              },
              children: [],
            },
          ],
        },
      ],
    },

    // ========================================================================
    // CARD 15: Ôn tập khái niệm 1/2 (Flashcard - new cards[] format)
    // ========================================================================
    {
      id: 'card-93409869',
      type: NodeType.CARD,
      title: 'Ôn tập khái niệm (1/2)',
      children: [
        {
          id: 'block-71a5f470',
          type: NodeType.BLOCK,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content: {
            type: BlockType.FLASHCARD,
            cards: [
              {
                id: 'fc-e7e88499',
                front: 'Vai trò của môn Địa lí',
                back: 'Địa lí giúp các em có được những hiểu biết cơ bản về khoa học địa lí, khả năng ứng dụng kiến thức địa lí trong đời sống, giáo dục phẩm chất và định hướng nghề nghiệp.',
              },
            ],
          } as any,
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 16: Ôn tập khái niệm 2/2 (Flashcard - new cards[] format)
    // ========================================================================
    {
      id: 'card-770a9a67',
      type: NodeType.CARD,
      title: 'Ôn tập khái niệm (2/2)',
      children: [
        {
          id: 'block-11385082',
          type: NodeType.BLOCK,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content: {
            type: BlockType.FLASHCARD,
            cards: [
              {
                id: 'fc-1ce39404',
                front: 'Ứng dụng của Địa lí học trong đời sống và định hướng nghề nghiệp',
                back: 'Kiến thức Địa lí được ứng dụng trong quy hoạch đô thị, phát triển du lịch, quản lý tài nguyên, dự báo thời tiết, sử dụng GPS và nhiều ngành nghề khác như quy hoạch, môi trường, giáo dục.',
              },
            ],
          } as any,
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 17: Vận dụng và mở rộng
    // ========================================================================
    {
      id: 'card-f32dd595',
      type: NodeType.CARD,
      title: 'Vận dụng và mở rộng',
      children: [
        {
          id: 'block-4fb3b030',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.HEADING,
            html: 'Vận dụng và mở rộng',
            level: 2,
          },
          children: [],
        },
        {
          id: 'block-0959350e',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.TEXT,
            html: '<ul><li>Tìm hiểu các vấn đề địa lí nổi bật tại địa phương em (ví dụ: ô nhiễm môi trường, biến đổi khí hậu, phát triển du lịch).</li><li>Đề xuất giải pháp cho một vấn đề môi trường hoặc xã hội ở địa phương dựa trên kiến thức Địa lí đã học.</li><li>Thực hành đọc bản đồ, phân tích số liệu thống kê địa lí để hiểu rõ hơn về thế giới xung quanh.</li><li>Khám phá các ngành nghề liên quan đến Địa lí như quy hoạch đô thị, quản lý tài nguyên, du lịch, khí tượng thủy văn.</li><li>Sử dụng các công cụ địa lí hiện đại như Google Earth, GPS để tìm hiểu về các địa điểm và hiện tượng địa lí.</li></ul>',
          },
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 18: Tóm tắt bài học
    // ========================================================================
    {
      id: 'card-568a058d',
      type: NodeType.CARD,
      title: 'Tóm tắt bài học',
      children: [
        {
          id: 'block-cfd0976f',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.HEADING,
            html: 'Tóm tắt bài học',
            level: 2,
          },
          children: [],
        },
        {
          id: 'block-9e90094e',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.TEXT,
            html: '<ul><li>Địa lí học là một ngành khoa học tổng hợp, nghiên cứu về các hiện tượng tự nhiên và kinh tế - xã hội trên bề mặt Trái Đất.</li><li>Phạm vi nghiên cứu của Địa lí học rất rộng, bao gồm cả địa lí tự nhiên và địa lí kinh tế - xã hội, có mối liên hệ với nhiều môn khoa học khác.</li><li>Môn Địa lí có vai trò quan trọng trong việc cung cấp kiến thức, rèn luyện kĩ năng, giáo dục phẩm chất và định hướng nghề nghiệp cho học sinh.</li><li>Kiến thức Địa lí được ứng dụng rộng rãi trong đời sống, từ quy hoạch phát triển, quản lý tài nguyên đến dự báo thời tiết và phát triển du lịch.</li><li>Học Địa lí giúp chúng ta hiểu rõ hơn về thế giới, đưa ra các quyết định hợp lí và có trách nhiệm với môi trường và xã hội.</li></ul>',
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
