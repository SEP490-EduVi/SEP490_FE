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
 * taskId: "05f723f4-c8bf-4a28-b0cd-57562d196485"
 * userId: "5" | productId: 1 | status: "completed"
 */
export const mockDocument: IDocument = {
  id: '05f723f4-c8bf-4a28-b0cd-57562d196485',
  title: 'BÀI 1: ĐỊA LÍ VỚI ĐỜI SỐNG',
  activeCardId: 'card-a6fdb051',
  createdAt: '2026-03-04T10:00:00.000Z',
  updatedAt: '2026-03-04T10:00:00.000Z',
  cards: [
    // ========================================================================
    // CARD 1: Title slide
    // ========================================================================
    {
      id: 'card-a6fdb051',
      type: NodeType.CARD,
      title: 'BÀI 1: ĐỊA LÍ VỚI ĐỜI SỐNG',
      backgroundColor: undefined,
      backgroundImage: undefined,
      children: [
        {
          id: 'block-d353aa7c',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.HEADING,
            html: 'BÀI 1: ĐỊA LÍ VỚI ĐỜI SỐNG',
            level: 1,
          },
          children: [],
        },
        {
          id: 'block-1544785c',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.TEXT,
            html: '<p>Môn Địa lí · Lớp 10 · Giáo viên</p>',
          },
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 2: Mục tiêu bài học
    // ========================================================================
    {
      id: 'card-1d257967',
      type: NodeType.CARD,
      title: 'Mục tiêu bài học',
      backgroundColor: undefined,
      backgroundImage: undefined,
      children: [
        {
          id: 'block-b91183c5',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.HEADING,
            html: 'Mục tiêu bài học',
            level: 2,
          },
          children: [],
        },
        {
          id: 'block-594de69c',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.TEXT,
            html: '<ul><li>Nêu được đặc điểm của môn Địa lí ở trường phổ thông.</li><li>Trình bày được vai trò của môn Địa lí đối với việc hình thành phẩm chất và năng lực của học sinh.</li><li>Phân tích được ý nghĩa của kiến thức Địa lí trong đời sống và các ngành nghề.</li><li>Vận dụng kiến thức Địa lí để giải thích các vấn đề thực tiễn.</li><li>Hình thành năng lực tư duy tổng hợp, liên hệ giữa các lĩnh vực.</li></ul>',
          },
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 3: Section divider - Đặc điểm và Vai trò
    // ========================================================================
    {
      id: 'card-0c0cb6c4',
      type: NodeType.CARD,
      title: 'Đặc điểm và Vai trò của Địa lí học',
      backgroundColor: '#1e293b',
      backgroundImage: undefined,
      children: [
        {
          id: 'block-8ee97291',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.HEADING,
            html: 'Đặc điểm và Vai trò của Địa lí học',
            level: 1,
          },
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 4: Khái niệm và Tính chất (Two Column, Template 004)
    // ========================================================================
    {
      id: 'card-6285a076',
      type: NodeType.CARD,
      templateId: 'template-004',
      title: 'Khái niệm và Tính chất của Địa lí học',
      backgroundColor: undefined,
      backgroundImage: undefined,
      children: [
        {
          id: 'block-4a836b9c',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.HEADING,
            html: 'Khái niệm và Tính chất của Địa lí học',
            level: 2,
          },
          children: [],
        },
        {
          id: 'layout-20dea364',
          type: NodeType.LAYOUT,
          variant: LayoutVariant.TWO_COLUMN,
          gap: 6,
          children: [
            {
              id: 'block-9b037cd7',
              type: NodeType.BLOCK,
              content: {
                type: BlockType.TEXT,
                html: '<h4>1. Khái niệm Địa lí học</h4><ul><li>Địa lí học là một ngành khoa học nghiên cứu về Trái Đất, đặc biệt là bề mặt Trái Đất.</li><li>Phạm vi nghiên cứu rộng lớn, bao gồm cả các yếu tố tự nhiên (địa hình, khí hậu, sông ngòi,...) và các yếu tố kinh tế - xã hội (dân cư, hoạt động sản xuất, văn hóa,...).</li></ul>',
              },
              children: [],
            },
            {
              id: 'block-6cb1f47a',
              type: NodeType.BLOCK,
              content: {
                type: BlockType.TEXT,
                html: '<h4>2. Tính chất tổng hợp</h4><ul><li>Môn Địa lí mang tính chất tổng hợp, kết hợp kiến thức của cả khoa học tự nhiên (Vật lí, Hóa học, Sinh học) và khoa học xã hội (Lịch sử, Kinh tế, Xã hội học).</li><li>Giúp chúng ta hiểu rõ mối quan hệ phức tạp giữa tự nhiên và con người, giữa các vùng miền trên Trái Đất.</li></ul>',
              },
              children: [],
            },
          ],
        },
      ],
    },

    // ========================================================================
    // CARD 5: Địa lí trong chương trình phổ thông
    // ========================================================================
    {
      id: 'card-e81b1c09',
      type: NodeType.CARD,
      title: 'Địa lí trong chương trình phổ thông',
      backgroundColor: undefined,
      backgroundImage: undefined,
      children: [
        {
          id: 'block-4e8678d1',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.HEADING,
            html: 'Địa lí trong chương trình phổ thông',
            level: 2,
          },
          children: [],
        },
        {
          id: 'block-f00cbd6e',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.TEXT,
            html: '<ul><li>Môn Địa lí được giảng dạy ở tất cả các cấp học phổ thông (Tiểu học, THCS, THPT).</li><li>Ở cấp Tiểu học và THCS: Nội dung giáo dục địa lí được tích hợp trong môn Lịch sử và Địa lí.</li><li>Ở cấp THPT: Địa lí là một môn học độc lập, thuộc nhóm môn khoa học xã hội.</li><li>Nội dung và hình thức giảng dạy được thiết kế phù hợp với đặc điểm tâm sinh lí và khả năng nhận thức của học sinh từng cấp học.</li></ul>',
          },
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 6: Vai trò của môn Địa lí (Three Column, Template 005)
    // ========================================================================
    {
      id: 'card-7cf05756',
      type: NodeType.CARD,
      templateId: 'template-005',
      title: 'Vai trò của môn Địa lí',
      backgroundColor: undefined,
      backgroundImage: undefined,
      children: [
        {
          id: 'block-79768805',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.HEADING,
            html: 'Vai trò của môn Địa lí',
            level: 2,
          },
          children: [],
        },
        {
          id: 'layout-ffd3130a',
          type: NodeType.LAYOUT,
          variant: LayoutVariant.THREE_COLUMN,
          gap: 6,
          children: [
            {
              id: 'block-e353e44c',
              type: NodeType.BLOCK,
              content: {
                type: BlockType.TEXT,
                html: '<h4>1. Cung cấp kiến thức</h4><ul><li>Giúp các em có cái nhìn toàn diện về Trái Đất, tự nhiên, dân cư và các hoạt động kinh tế - xã hội.</li><li>Là nền tảng để hiểu sâu hơn về các vấn đề toàn cầu như biến đổi khí hậu, phát triển bền vững.</li></ul>',
              },
              children: [],
            },
            {
              id: 'block-26a534e3',
              type: NodeType.BLOCK,
              content: {
                type: BlockType.TEXT,
                html: '<h4>2. Rèn luyện kĩ năng</h4><ul><li>Phát triển kĩ năng đọc, phân tích bản đồ, biểu đồ, số liệu thống kê.</li><li>Rèn luyện tư duy không gian, khả năng giải quyết vấn đề thực tiễn liên quan đến môi trường và xã hội.</li></ul>',
              },
              children: [],
            },
            {
              id: 'block-db3e619f',
              type: NodeType.BLOCK,
              content: {
                type: BlockType.TEXT,
                html: '<h4>3. Định hướng và phát triển</h4><ul><li>Nâng cao ý thức bảo vệ môi trường, tài nguyên thiên nhiên.</li><li>Định hướng nghề nghiệp trong các lĩnh vực như du lịch, quy hoạch, quản lí tài nguyên, môi trường.</li><li>Bồi dưỡng tình yêu quê hương, đất nước và ý thức công dân toàn cầu.</li></ul>',
              },
              children: [],
            },
          ],
        },
      ],
    },

    // ========================================================================
    // CARD 7: Kiểm tra kiến thức (Quiz)
    // ========================================================================
    {
      id: 'card-2ff29ba2',
      type: NodeType.CARD,
      title: 'Kiểm tra kiến thức',
      backgroundColor: undefined,
      backgroundImage: undefined,
      children: [
        {
          id: 'block-0472c9ea',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.HEADING,
            html: 'Kiểm tra kiến thức',
            level: 2,
          },
          children: [],
        },
        {
          id: 'block-10bd8610',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.QUIZ,
            title: 'Kiểm tra kiến thức',
            questions: [
              {
                id: 'q-3b4a9a44',
                question: 'Địa lí học được hiểu là gì?',
                options: [
                  { id: 'opt-f53b7411', text: 'A. Một môn học chỉ nghiên cứu về tự nhiên.' },
                  { id: 'opt-72dd4b10', text: 'B. Một ngành khoa học tổng hợp nghiên cứu cả tự nhiên và kinh tế – xã hội.' },
                  { id: 'opt-71616478', text: 'C. Một môn học chỉ nghiên cứu về kinh tế – xã hội.' },
                  { id: 'opt-9c076363', text: 'D. Một môn học chỉ có ở cấp Trung học phổ thông.' },
                ],
                correctIndex: 1,
                explanation: 'Địa lí học là một ngành khoa học tổng hợp, nghiên cứu cả địa lí tự nhiên và địa lí kinh tế – xã hội.',
              },
              {
                id: 'q-81368b75',
                question: 'Tính chất nổi bật của môn Địa lí được đề cập trong sách giáo khoa là gì?',
                options: [
                  { id: 'opt-70b32655', text: 'A. Chỉ nghiên cứu về các hiện tượng tự nhiên.' },
                  { id: 'opt-c6f2e72c', text: 'B. Chỉ nghiên cứu về các hoạt động kinh tế.' },
                  { id: 'opt-4ef7d6e4', text: 'C. Mang tính chất tổng hợp, bao gồm cả khoa học tự nhiên và khoa học xã hội.' },
                  { id: 'opt-6428a56e', text: 'D. Chỉ liên quan đến môn Lịch sử.' },
                ],
                correctIndex: 2,
                explanation: 'Môn Địa lí có tính chất tổng hợp, kết hợp cả kiến thức khoa học tự nhiên và khoa học xã hội.',
              },
              {
                id: 'q-939b2d9c',
                question: 'Một trong những vai trò quan trọng của môn Địa lí đối với học sinh là gì?',
                options: [
                  { id: 'opt-3a30d149', text: 'A. Cung cấp kiến thức chuyên sâu về toán học.' },
                  { id: 'opt-7d270f39', text: 'B. Giúp hình thành khả năng ứng dụng kiến thức địa lí vào đời sống.' },
                  { id: 'opt-b2c3abc5', text: 'C. Chỉ giúp ghi nhớ các địa danh.' },
                  { id: 'opt-656bbb8e', text: 'D. Phát triển kỹ năng vẽ bản đồ.' },
                ],
                correctIndex: 1,
                explanation: 'Môn Địa lí giúp học sinh có khả năng ứng dụng kiến thức vào thực tiễn đời sống.',
              },
            ],
          },
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 8: Section divider - Ứng dụng và Định hướng nghề nghiệp
    // ========================================================================
    {
      id: 'card-8763bbb4',
      type: NodeType.CARD,
      title: 'Ứng dụng và Định hướng nghề nghiệp',
      backgroundColor: '#1e293b',
      backgroundImage: undefined,
      children: [
        {
          id: 'block-d9b90b3b',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.HEADING,
            html: 'Ứng dụng và Định hướng nghề nghiệp',
            level: 1,
          },
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 9: Ứng dụng của Địa lí học trong đời sống
    // ========================================================================
    {
      id: 'card-e7cb7a1c',
      type: NodeType.CARD,
      title: 'Ứng dụng của Địa lí học trong đời sống',
      backgroundColor: undefined,
      backgroundImage: undefined,
      children: [
        {
          id: 'block-d4bd7411',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.HEADING,
            html: 'Ứng dụng của Địa lí học trong đời sống',
            level: 2,
          },
          children: [],
        },
        {
          id: 'block-02762f32',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.TEXT,
            html: '<ul><li><strong>Trong nông nghiệp:</strong> Xác định vùng đất phù hợp cho cây trồng, vật nuôi, tối ưu hóa sản xuất.</li><li><strong>Trong quy hoạch đô thị:</strong> Phân tích địa hình, dân cư, tài nguyên để xây dựng thành phố bền vững.</li><li><strong>Trong du lịch:</strong> Khám phá, quảng bá các địa điểm du lịch, phát triển các tour tuyến hấp dẫn.</li><li><strong>Trong quản lí tài nguyên và môi trường:</strong> Cung cấp dữ liệu để bảo vệ rừng, nguồn nước, ứng phó biến đổi khí hậu.</li><li><strong>Trong dự báo thời tiết:</strong> Phân tích các yếu tố khí hậu, đưa ra dự báo chính xác, phục vụ đời sống và sản xuất.</li><li><strong>Trong hệ thống định vị toàn cầu (GPS):</strong> Giúp xác định vị trí, dẫn đường, quản lí phương tiện giao thông.</li></ul>',
          },
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 10: Mối liên hệ của Địa lí với các môn học khác (Two Column, Template 003)
    // ========================================================================
    {
      id: 'card-333130e8',
      type: NodeType.CARD,
      templateId: 'template-003',
      title: 'Mối liên hệ của Địa lí với các môn học khác',
      backgroundColor: undefined,
      backgroundImage: undefined,
      children: [
        {
          id: 'block-aa9c5eb3',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.HEADING,
            html: 'Mối liên hệ của Địa lí với các môn học khác',
            level: 2,
          },
          children: [],
        },
        {
          id: 'layout-07cd3ed8',
          type: NodeType.LAYOUT,
          variant: LayoutVariant.TWO_COLUMN,
          gap: 6,
          children: [
            {
              id: 'block-ddac33f9',
              type: NodeType.BLOCK,
              content: {
                type: BlockType.TEXT,
                html: '<h4>1. Địa lí và Lịch sử</h4><p>Địa lí cung cấp bối cảnh không gian cho các sự kiện lịch sử. Ví dụ, hiểu về địa hình, khí hậu, tài nguyên của một vùng giúp chúng ta lí giải tại sao các nền văn minh lại phát triển ở đó, hoặc tại sao một cuộc chiến tranh lại diễn ra theo cách này hay cách khác.</p><p>Địa lí giúp chúng ta hiểu rõ hơn về bối cảnh và nguyên nhân của các sự kiện trong quá khứ.</p>',
              },
              children: [],
            },
            {
              id: 'block-24ce7d86',
              type: NodeType.BLOCK,
              content: {
                type: BlockType.TEXT,
                html: '<h4>2. Địa lí và Sinh học</h4><p>Địa lí nghiên cứu sự phân bố của các loài sinh vật, hệ sinh thái trên Trái Đất. Kiến thức địa lí về khí hậu, thổ nhưỡng, địa hình giúp giải thích tại sao một loài cây, con vật chỉ sống được ở một số vùng nhất định, hoặc tại sao có sự đa dạng sinh học khác nhau giữa các khu vực.</p><p>Địa lí là nền tảng để nghiên cứu sự sống và môi trường sống của sinh vật.</p>',
              },
              children: [],
            },
          ],
        },
      ],
    },

    // ========================================================================
    // CARD 11: Ôn tập khái niệm (Flashcards)
    // ========================================================================
    {
      id: 'card-dddc16eb',
      type: NodeType.CARD,
      title: 'Ôn tập khái niệm',
      backgroundColor: undefined,
      backgroundImage: undefined,
      children: [
        {
          id: 'block-a5c5ff81',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.FLASHCARD,
            front: 'Ứng dụng của Địa lí học trong đời sống và định hướng nghề nghiệp',
            back: 'Kiến thức Địa lí được ứng dụng rộng rãi trong quy hoạch đô thị, quản lí tài nguyên, du lịch, dự báo thời tiết, phòng chống thiên tai và nhiều ngành nghề khác như địa chất, môi trường, quy hoạch, giáo viên Địa lí.',
          },
          children: [],
        },
      ],
    },

    // ========================================================================
    // CARD 12: Tóm tắt bài học
    // ========================================================================
    {
      id: 'card-d6c9004c',
      type: NodeType.CARD,
      title: 'Tóm tắt bài học',
      backgroundColor: undefined,
      backgroundImage: undefined,
      children: [
        {
          id: 'block-0cf1e2cf',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.HEADING,
            html: 'Tóm tắt bài học',
            level: 2,
          },
          children: [],
        },
        {
          id: 'block-7ee4a167',
          type: NodeType.BLOCK,
          content: {
            type: BlockType.TEXT,
            html: '<ul><li>Địa lí học là khoa học nghiên cứu về Trái Đất, bao gồm cả tự nhiên và xã hội.</li><li>Môn Địa lí có tính chất tổng hợp, kết nối kiến thức từ nhiều lĩnh vực khác nhau.</li><li>Địa lí giúp chúng ta hiểu biết về thế giới, rèn luyện kĩ năng và hình thành phẩm chất công dân.</li><li>Kiến thức Địa lí có nhiều ứng dụng quan trọng trong đời sống và mở ra nhiều cơ hội nghề nghiệp.</li><li>Địa lí có mối liên hệ chặt chẽ với các môn học khác như Lịch sử, Sinh học, Toán học, thể hiện tính liên ngành sâu sắc.</li></ul>',
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
