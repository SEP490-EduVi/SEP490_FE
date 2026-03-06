# Backend API Contract - EduVi Documents API

> 📋 **IMPORTANT**: Đây là tài liệu quy định format chuẩn mà Backend API **BẮT BUỘC** phải theo.
> Frontend sẽ consume data này trực tiếp mà KHÔNG có bất kỳ transformation nào.

---

## 📌 Tổng Quan

EduVi sử dụng **cấu trúc cây đệ quy** (recursive tree) để lưu trữ documents:

```
IDocument (Root)
  └── ICard[] (Slides - trục X)
       └── (ILayout | IBlock)[] (Containers & Content)
            └── IBlock[] (Nested content)
```

### Node Types

| Type | Mô tả | Ví dụ |
|------|-------|-------|
| **CARD** | Đại diện cho 1 slide | Slide 1, Slide 2, ... |
| **LAYOUT** | Container bố cục | 2-column, 3-column, sidebar |
| **BLOCK** | Nội dung thực tế | Text, Image, Video, Quiz |

### Card Categories

EduVi có **2 loại** card templates:

| Category | Đặc điểm | templateId | Ví dụ |
|----------|----------|------------|-------|
| **Basic (Layout)** | Dùng `ILayout` container để chia cột | `template-001` → `template-006` | 2-column, 3-column, sidebar |
| **Freeform** | KHÔNG dùng Layout, chỉ chứa trực tiếp `IBlock[]` | **Không có** (undefined) | Title, Bullet, Quiz, Flashcard, Fill-in-Blank, Summary, Section Divider |

## 🌐 API Endpoints

### 1. GET `/api/documents/:id`

**Mục đích**: Lấy thông tin document theo ID

**Response Format**:
```json
{
  "id": "doc-001",
  "title": "EduVi Product Launch",
  "activeCardId": "card-002",
  "createdAt": "2026-01-31T10:00:00.000Z",
  "updatedAt": "2026-01-31T14:30:00.000Z",
  "cards": [
    {
      "id": "card-001",
      "type": "CARD",
      "templateId": "template-001",
      "title": "Welcome",
      "backgroundColor": "#f0f9ff",
      "backgroundImage": null,
      "children": [
        {
          "id": "layout-001",
          "type": "LAYOUT",
          "variant": "SIDEBAR_LEFT",
          "gap": 6,
          "children": [
            {
              "id": "block-001",
              "type": "BLOCK",
              "content": {
                "type": "IMAGE",
                "src": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
                "alt": "EduVi Hero Image",
                "caption": "Transform your ideas into stunning presentations"
              },
              "children": []
            },
            {
              "id": "block-002",
              "type": "BLOCK",
              "content": {
                "type": "TEXT",
                "html": "<h1>Welcome to EduVi</h1><p>The next generation of <strong>slide-based presentations</strong>.</p>"
              },
              "children": []
            }
          ]
        }
      ]
    },
    {
      "id": "card-002",
      "type": "CARD",
      "templateId": "template-003",
      "title": "Key Features",
      "backgroundColor": null,
      "backgroundImage": null,
      "children": [
        {
          "id": "block-003",
          "type": "BLOCK",
          "content": {
            "type": "HEADING",
            "html": "Why Choose EduVi?",
            "level": 1
          },
          "children": []
        },
        {
          "id": "layout-002",
          "type": "LAYOUT",
          "variant": "TWO_COLUMN",
          "gap": 6,
          "children": [
            {
              "id": "block-004",
              "type": "BLOCK",
              "content": {
                "type": "TEXT",
                "html": "<h3>🚀 Lightning Fast</h3><p>Built with <em>Next.js 14</em>...</p>"
              },
              "children": []
            },
            {
              "id": "block-005",
              "type": "BLOCK",
              "content": {
                "type": "TEXT",
                "html": "<h3>🎨 Beautiful Design</h3><p>Professional templates...</p>"
              },
              "children": []
            }
          ]
        }
      ]
    }
  ]
}


## 📐 TypeScript Interfaces

### IDocument

```typescript
interface IDocument {
  id: string;                    // UUID (v4)
  title: string;                 // Max 255 chars
  activeCardId: string | null;   // ID của card đang active
  createdAt: string;             // ISO 8601: "2026-01-31T10:00:00.000Z"
  updatedAt: string;             // ISO 8601
  cards: ICard[];                // Min 0 cards
}
```

### ICard

```typescript
interface ICard {
  id: string;                    // UUID (v4)
  type: 'CARD';                  // NodeType enum
  templateId?: string;           // ✨ NEW: Optional template reference (e.g., "template-001")
  title: string;                 // Slide title
  backgroundColor?: string;      // Hex color: "#f0f9ff" hoặc null
  backgroundImage?: string;      // Image URL hoặc null
  children: (ILayout | IBlock)[]; // Array of child nodes
}
```

**⚠️ Important Notes về `templateId`:**
- ✅ **Optional field** - có thể `undefined` hoặc không có trong JSON
- ✅ **Metadata only** - KHÔNG validate cấu trúc children theo template
- ✅ **Giá trị hợp lệ**: `"template-001"` đến `"template-006"` (hoặc custom IDs)
- ✅ **Use case**: Tracking origin template cho analytics/UI hints
- ❌ **KHÔNG** enforce structure validation dựa trên templateId

**Example scenarios:**
```json
// ✅ Card có templateId
{
  "id": "card-001",
  "type": "CARD",
  "templateId": "template-001",
  "children": [...]
}

// ✅ Card không có templateId (custom card)
{
  "id": "card-002",
  "type": "CARD",
  "title": "Custom Slide",
  "children": [...]
}

// ✅ Card có templateId nhưng structure đã thay đổi hoàn toàn
{
  "id": "card-003",
  "type": "CARD",
  "templateId": "template-003",  // Gốc là 2-column
  "children": [
    // User đã xóa layout và thêm 5 blocks khác
    { "type": "BLOCK", "content": {...} },
    { "type": "BLOCK", "content": {...} }
  ]
}
```

### ILayout

```typescript
interface ILayout {
  id: string;                    // UUID (v4)
  type: 'LAYOUT';                // NodeType enum
  variant: LayoutVariant;        // Enum value (string)
  gap: number;                   // Số pixel spacing (default: 4)
  children: IBlock[];            // Array of blocks
}

enum LayoutVariant {
  SINGLE = 'SINGLE',
  TWO_COLUMN = 'TWO_COLUMN',
  THREE_COLUMN = 'THREE_COLUMN',
  SIDEBAR_LEFT = 'SIDEBAR_LEFT',
  SIDEBAR_RIGHT = 'SIDEBAR_RIGHT',
  GRID = 'GRID',
}
```

**⚠️ JSON Serialization:**
```json
{
  "id": "layout-001",
  "type": "LAYOUT",
  "variant": "TWO_COLUMN",  // ✅ String value, NOT { "TWO_COLUMN": ... }
  "gap": 6,
  "children": [...]
}
```

### IBlock

```typescript
interface IBlock {
  id: string;                    // UUID (v4)
  type: 'BLOCK';                 // NodeType enum
  content: BlockContent;         // Type-specific content
  children: IBlock[];            // Nested blocks (thường là [])
}

type BlockContent = 
  | TextBlockContent
  | HeadingBlockContent
  | ImageBlockContent
  | VideoBlockContent
  | QuizBlockContent
  | FlashcardBlockContent
  | FillBlankBlockContent;
```

### Block Content Types

#### TextBlockContent
```typescript
interface TextBlockContent {
  type: 'TEXT';
  html: string;  // Rich HTML từ Tiptap editor
}
```

**Example JSON:**
```json
{
  "type": "TEXT",
  "html": "<h3>🚀 Lightning Fast</h3><p>Built with <em>Next.js 14</em> for optimal performance.</p>"
}
```

#### HeadingBlockContent
```typescript
interface HeadingBlockContent {
  type: 'HEADING';
  html: string;    // Heading text
  level: 1 | 2 | 3 | 4 | 5 | 6;  // h1-h6
}
```

**Example JSON:**
```json
{
  "type": "HEADING",
  "html": "Why Choose EduVi?",
  "level": 1
}
```

#### ImageBlockContent
```typescript
interface ImageBlockContent {
  type: 'IMAGE';
  src: string;          // Image URL (absolute)
  alt: string;          // Alt text cho accessibility
  caption?: string;     // Optional caption
}
```

**Example JSON:**
```json
{
  "type": "IMAGE",
  "src": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800",
  "alt": "EduVi Hero Image",
  "caption": "Transform your ideas into stunning presentations"
}
```

#### VideoBlockContent
```typescript
interface VideoBlockContent {
  type: 'VIDEO';
  src: string;          // Video URL hoặc embed ID
  provider: 'youtube' | 'vimeo' | 'direct';
}
```

**Example JSON:**
```json
{
  "type": "VIDEO",
  "src": "dQw4w9WgXcQ",
  "provider": "youtube"
}
```

#### QuizBlockContent
```typescript
interface QuizBlockContent {
  type: 'QUIZ';
  title: string;
  questions: Array<{
    id: string;
    question: string;
    options: Array<{
      id: string;
      text: string;
    }>;
    correctIndex: number;      // Index của đáp án đúng
    explanation?: string;      // Giải thích đáp án
  }>;
}
```

**Example JSON:**
```json
{
  "type": "QUIZ",
  "title": "JavaScript Quiz",
  "questions": [
    {
      "id": "q1",
      "question": "What keyword declares a constant?",
      "options": [
        { "id": "q1-a", "text": "var" },
        { "id": "q1-b", "text": "let" },
        { "id": "q1-c", "text": "const" }
      ],
      "correctIndex": 2,
      "explanation": "The 'const' keyword declares a block-scoped constant."
    }
  ]
}
```

#### FlashcardBlockContent
```typescript
interface FlashcardBlockContent {
  type: 'FLASHCARD';
  front: string;  // Mặt trước thẻ
  back: string;   // Mặt sau thẻ
}
```

**Example JSON:**
```json
{
  "type": "FLASHCARD",
  "front": "What is React?",
  "back": "React is a JavaScript library for building user interfaces, maintained by Meta."
}
```

#### FillBlankBlockContent
```typescript
interface FillBlankBlockContent {
  type: 'FILL_BLANK';
  sentence: string;     // "In React, [useState] is a Hook..."
  blanks: string[];     // ["useState", "state"]
}
```

**Example JSON:**
```json
{
  "type": "FILL_BLANK",
  "sentence": "In React, [useState] is a Hook that lets you add [state] to components.",
  "blanks": ["useState", "state"]
}
```

---

## ✅ Validation Rules

### Document Level
- ✅ `id`: Required, UUID v4 format
- ✅ `title`: Required, max 255 chars, không empty
- ✅ `createdAt`: Required, ISO 8601 datetime
- ✅ `updatedAt`: Required, ISO 8601 datetime
- ✅ `cards`: Required array (có thể rỗng)
- ✅ `activeCardId`: Optional, must reference existing card ID hoặc null

### Card Level
- ✅ `id`: Required, unique UUID
- ✅ `type`: Must be `"CARD"` (string literal)
- ✅ `templateId`: **Optional** string (không validate)
- ✅ `title`: Required, max 255 chars
- ✅ `backgroundColor`: Optional, valid hex color (e.g., `"#f0f9ff"`) hoặc `null`
- ✅ `backgroundImage`: Optional, valid URL hoặc `null`
- ✅ `children`: Required array

### ⚠️ Interactive Card Constraints (BẮT BUỘC)

Các loại card **QUIZ**, **FLASHCARD**, và **FILL_BLANK** chỉ được phép có **đúng 1 block** trong `children`.

| Card Type | Max children | Lý do |
|-----------|-------------|-------|
| QUIZ card | **1 QUIZ block** | 1 slide = 1 bộ câu hỏi |
| FLASHCARD card | **1 FLASHCARD block** | 1 slide = 1 thẻ ghi nhớ |
| FILL_BLANK card | **1 FILL_BLANK block** | 1 slide = 1 câu điền khuyết |

**Quy tắc xử lý khi pipeline sinh ra nhiều blocks cùng loại:**

> Nếu pipeline / AI trả về nhiều QUIZ / FLASHCARD / FILL_BLANK items cho cùng 1 chủ đề, Backend **BẮT BUỘC** phải tách thành nhiều card riêng biệt — mỗi card chứa đúng 1 block.

```
// ❌ SAI — không được gộp nhiều flashcard vào 1 card
{
  "id": "card-001",
  "type": "CARD",
  "children": [
    { "type": "BLOCK", "content": { "type": "FLASHCARD", "front": "Q1", "back": "A1" } },
    { "type": "BLOCK", "content": { "type": "FLASHCARD", "front": "Q2", "back": "A2" } }
  ]
}

// ✅ ĐÚNG — mỗi flashcard là 1 card riêng
{
  "id": "card-001",
  "type": "CARD",
  "children": [
    { "type": "BLOCK", "content": { "type": "FLASHCARD", "front": "Q1", "back": "A1" } }
  ]
}
{
  "id": "card-002",
  "type": "CARD",
  "children": [
    { "type": "BLOCK", "content": { "type": "FLASHCARD", "front": "Q2", "back": "A2" } }
  ]
}
```

### Layout Level
- ✅ `id`: Required, unique UUID
- ✅ `type`: Must be `"LAYOUT"` (string literal)
- ✅ `variant`: Must be valid LayoutVariant enum value (as string)
- ✅ `gap`: Positive number (0-100)
- ✅ `children`: Required array of IBlock

### Block Level
- ✅ `id`: Required, unique UUID
- ✅ `type`: Must be `"BLOCK"` (string literal)
- ✅ `content.type`: Must be valid BlockType enum (as string)
- ✅ `content`: Must match corresponding content interface
- ✅ `children`: Required array (thường là `[]`)

### Enum Serialization Rules

**⚠️ CRITICAL: Enums MUST be serialized as strings, NOT objects!**

```json
// ✅ CORRECT
{
  "type": "CARD",
  "variant": "TWO_COLUMN",
  "content": {
    "type": "TEXT"
  }
}

// ❌ WRONG - Do NOT serialize as objects
{
  "type": { "CARD": "CARD" },
  "variant": { "TWO_COLUMN": "TWO_COLUMN" }
}
```

### Content Validation Examples

```typescript
// ❌ BAD - Missing required fields
{
  "type": "HEADING",
  "html": "Title"
  // Missing 'level' field!
}

// ✅ GOOD
{
  "type": "HEADING",
  "html": "Title",
  "level": 1
}

// ❌ BAD - Invalid enum value
{
  "type": "BLOCK",
  "content": {
    "type": "PARAGRAPH"  // ❌ Not a valid BlockType
  }
}

// ✅ GOOD
{
  "type": "BLOCK",
  "content": {
    "type": "TEXT",
    "html": "<p>Content</p>"
  }
}

// ❌ BAD - Enum as object
{
  "type": "LAYOUT",
  "variant": { "TWO_COLUMN": "TWO_COLUMN" }
}

// ✅ GOOD - Enum as string
{
  "type": "LAYOUT",
  "variant": "TWO_COLUMN"
}
```

---

## 📋 Template Reference Table

Frontend định nghĩa **2 nhóm** templates. Backend **KHÔNG** cần validate structure, chỉ lưu data as-is.

### Basic Templates (Layout-based, có `templateId`)

| Template ID | Name | Layout Variant | Mô tả |
|------------|------|---------------|-------|
| `template-001` | Image and text | `SIDEBAR_LEFT` | Image bên trái, text bên phải |
| `template-002` | Text and image | `SIDEBAR_RIGHT` | Text bên trái, image bên phải |
| `template-003` | Two columns | `TWO_COLUMN` | 2 cột text ngang nhau |
| `template-004` | Two column text | `TWO_COLUMN` | Variant 2 cột với heading |
| `template-005` | Three columns | `THREE_COLUMN` | 3 cột text |
| `template-006` | Three column text | `THREE_COLUMN` | Variant 3 cột với heading |

### Freeform Templates (KHÔNG có `templateId`, KHÔNG dùng Layout)

| Freeform Type | Name | Block Types | Default Children | Mô tả |
|---------------|------|-------------|------------------|-------|
| `title-card` | Title Card | `TEXT` | 1 TEXT block (h1 + subtitle) | Slide đầu tiên, tiêu đề bài học |
| `bullet-card` | Bullet List | `HEADING` + `TEXT` | 1 HEADING + 1 TEXT (ul/li) | Danh sách dạng bullet |
| `section-divider` | Section Divider | `TEXT` | 1 TEXT block (h1) + `backgroundColor: "#1e293b"` | Slide chuyển tiếp giữa các chủ đề |
| `quiz-card` | Quiz | `QUIZ` | **Đúng 1** QUIZ block | Câu hỏi trắc nghiệm — **max 1 block/card** |
| `flashcard-card` | Flashcard | `FLASHCARD` | **Đúng 1** FLASHCARD block | Thẻ ghi nhớ lật mặt — **max 1 block/card** |
| `fill-blank-card` | Fill in Blank | `FILL_BLANK` | **Đúng 1** FILL_BLANK block | Điền từ vào chỗ trống — **max 1 block/card** |
| `summary-card` | Summary | `HEADING` + `TEXT` | 1 HEADING + 1 TEXT (ul/li) | Slide tóm tắt cuối bài |

**⚠️ Important:**
- Freeform cards **KHÔNG có `templateId`** — field `templateId` là `undefined` hoặc không có trong JSON
- Freeform cards **KHÔNG dùng `ILayout`** — `children` chứa trực tiếp `IBlock[]`
- User có thể thay đổi structure sau khi tạo
- Backend KHÔNG validate `children` matching với template
- `templateId` chỉ để tracking/analytics
- **QUIZ / FLASHCARD / FILL_BLANK cards: tối đa 1 block trong `children`** — nếu nhiều items, tách thành nhiều cards

---

## 📝 Freeform Card JSON Examples

### Title Card
```json
{
  "id": "card-uuid",
  "type": "CARD",
  "title": "Title Card",
  "backgroundColor": null,
  "backgroundImage": null,
  "children": [
    {
      "id": "block-uuid",
      "type": "BLOCK",
      "content": {
        "type": "TEXT",
        "html": "<h1>Tiêu đề bài học</h1><p>Môn học · Lớp · Giáo viên</p>"
      },
      "children": []
    }
  ]
}
```

### Bullet List Card
```json
{
  "id": "card-uuid",
  "type": "CARD",
  "title": "Bullet List",
  "children": [
    {
      "id": "block-uuid-1",
      "type": "BLOCK",
      "content": {
        "type": "HEADING",
        "html": "Mục tiêu bài học",
        "level": 2
      },
      "children": []
    },
    {
      "id": "block-uuid-2",
      "type": "BLOCK",
      "content": {
        "type": "TEXT",
        "html": "<ul><li>Mục tiêu 1</li><li>Mục tiêu 2</li><li>Mục tiêu 3</li><li>Mục tiêu 4</li></ul>"
      },
      "children": []
    }
  ]
}
```

### Section Divider Card
```json
{
  "id": "card-uuid",
  "type": "CARD",
  "title": "Section Divider",
  "backgroundColor": "#1e293b",
  "children": [
    {
      "id": "block-uuid",
      "type": "BLOCK",
      "content": {
        "type": "TEXT",
        "html": "<h1>Tên chủ đề</h1>"
      },
      "children": []
    }
  ]
}
```

### Quiz Card
```json
{
  "id": "card-uuid",
  "type": "CARD",
  "title": "Quiz",
  "children": [
    {
      "id": "block-uuid",
      "type": "BLOCK",
      "content": {
        "type": "QUIZ",
        "title": "",
        "questions": [
          {
            "id": "q-uuid",
            "question": "What keyword declares a constant?",
            "options": [
              { "id": "opt-1", "text": "var" },
              { "id": "opt-2", "text": "let" },
              { "id": "opt-3", "text": "const" },
              { "id": "opt-4", "text": "def" }
            ],
            "correctIndex": 2,
            "explanation": "The 'const' keyword declares a block-scoped constant."
          }
        ]
      },
      "children": []
    }
  ]
}
```

### Flashcard Card
```json
{
  "id": "card-uuid",
  "type": "CARD",
  "title": "Flashcard",
  "children": [
    {
      "id": "block-uuid",
      "type": "BLOCK",
      "content": {
        "type": "FLASHCARD",
        "front": "Khái niệm",
        "back": "Định nghĩa chi tiết của khái niệm..."
      },
      "children": []
    }
  ]
}
```

### Fill in Blank Card
```json
{
  "id": "card-uuid",
  "type": "CARD",
  "title": "Fill in Blank",
  "children": [
    {
      "id": "block-uuid",
      "type": "BLOCK",
      "content": {
        "type": "FILL_BLANK",
        "sentence": "[Từ khoá] là một khái niệm quan trọng trong [lĩnh vực].",
        "blanks": ["Từ khoá", "lĩnh vực"]
      },
      "children": []
    }
  ]
}
```

### Summary Card
```json
{
  "id": "card-uuid",
  "type": "CARD",
  "title": "Summary",
  "children": [
    {
      "id": "block-uuid-1",
      "type": "BLOCK",
      "content": {
        "type": "HEADING",
        "html": "Tóm tắt bài học",
        "level": 2
      },
      "children": []
    },
    {
      "id": "block-uuid-2",
      "type": "BLOCK",
      "content": {
        "type": "TEXT",
        "html": "<ul><li>Ý chính 1</li><li>Ý chính 2</li><li>Ý chính 3</li><li>Ý chính 4</li></ul>"
      },
      "children": []
    }
  ]
}