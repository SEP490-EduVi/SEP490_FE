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

```

---

## 🎮 Game Blueprint API (Mini-game)

### Mục tiêu

FE có một trang “Tạo & chơi mini-game” cho giáo viên:

1) Teacher chọn loại game + cấu hình cơ bản
2) FE gửi **GameConfigRequest** xuống Backend
3) Backend trả về **PlayableGameResponse** (payload đã “flattened”) để FE render trực tiếp bằng MediaPipe engine

> ✅ Ở giai đoạn hiện tại, FE **không yêu cầu persistence** (không lưu game). Backend có thể lưu hoặc không; miễn là trả về đúng payload để chơi.

### Endpoint

#### POST `/api/games/playable`

- **Content-Type**: `application/json`
- **Auth**: tuỳ hệ thống (khuyến nghị `Authorization: Bearer <token>`). Nếu chưa có auth, có thể để public trong giai đoạn mock.

**Request**: `GameConfigRequest`

**Response 200**: `PlayableGameResponse`

**Errors** (gợi ý chuẩn hoá):

- `400 Bad Request`: body không hợp lệ (missing field / sai kiểu / templateId không hỗ trợ)
- `401 Unauthorized`: thiếu/invalid token (nếu bật auth)
- `403 Forbidden`: user không có quyền với document/slide reference
- `422 Unprocessable Entity`: reference hợp lệ nhưng không thể compile (thiếu asset/metadata)
- `500 Internal Server Error`

> FE hiện đang mock endpoint tương đương ở `POST /api/games/mock` (Next.js API route). Khi Backend thật có endpoint, FE chỉ đổi URL/BASE_URL.

---

## 📦 Data Contracts

### 1) `GameConfigRequest` (FE → BE)

```ts
type GameBlueprintTemplateId = 'HOVER_SELECT' | 'DRAG_DROP';

type SlideDataReferences = {
  documentId?: string;
  slideIds?: string[];
  assetUrls?: string[];
  note?: string;
};

type TeacherConfigs = {
  timeLimitSec?: number;    // default 60
  hoverHoldMs?: number;     // default 2000 (chỉ dùng cho HOVER_SELECT)
  pinchThreshold?: number;  // default 0.045 (chỉ dùng cho DRAG_DROP)
  enableSound?: boolean;
};

type GameConfigRequest = {
  templateId: GameBlueprintTemplateId;
  slideDataReferences: SlideDataReferences;
  teacherConfigs: TeacherConfigs;
};
```

**Validation rules** (khuyến nghị):

- `templateId`: required, chỉ nhận `HOVER_SELECT` | `DRAG_DROP`
- `slideDataReferences`: required object (có thể rỗng nếu BE chưa cần)
- `teacherConfigs`: required object (có thể rỗng; BE tự default)

---

### 2) `PlayableGameResponse` (BE → FE)

#### Common types

```ts
type NormalizedRect = { x: number; y: number; w: number; h: number }; // 0..1
```

**Coordinate system (CRITICAL)**

- Tất cả tọa độ trong response đều là **normalized** theo canvas: $x,y,w,h \in [0,1]$
- Gốc tọa độ: **top-left** (0,0)
- `w`, `h` là kích thước tương đối theo canvas
- Backend **không cần** xử lý mirroring; chỉ cần set `settings.mirror = true` (FE engine sẽ tự đồng bộ mirrored video/canvas)

#### Response interface

```ts
type PlayableGameResponse = {
  gameId: string;
  templateId: 'HOVER_SELECT' | 'DRAG_DROP';
  version: string; // khuyến nghị date/versioning, ví dụ "2026-03-31"
  settings: {
    mirror: true;          // BẮT BUỘC: luôn true
    timeLimitSec: number;  // 5..600
    hoverHoldMs: number;   // 250..5000
    pinchThreshold: number; // 0.005..0.2
  };
  scene: {
    title?: string;
    backgroundUrl?: string;
  };
  // payload có thể là 1 câu (single) hoặc list nhiều câu (multi-round)
  payload: HoverSelectPlayable | DragDropPlayable | Array<HoverSelectPlayable | DragDropPlayable>;
};
```

**Multi-question rule (CRITICAL)**

- Nếu `payload` là array thì đây là **nhiều round / nhiều câu** trong cùng 1 game.
- `templateId` vẫn là **1 giá trị cố định** cho cả game.
  - Nếu `templateId = HOVER_SELECT` → mọi phần tử trong array phải là `HoverSelectPlayable`
  - Nếu `templateId = DRAG_DROP` → mọi phần tử trong array phải là `DragDropPlayable`

---

## 🧩 Blueprint Payloads

### A) `HOVER_SELECT`

```ts
type HoverChoice = {
  id: string;
  text: string;
  zone: NormalizedRect;
};

type HoverSelectPlayable = {
  prompt: string;
  choices: HoverChoice[];      // min 2
  correctChoiceId: string;
};
```

### B) `DRAG_DROP`

```ts
type DraggableItem = {
  id: string;
  label: string;
  start: { x: number; y: number }; // 0..1 (center point)
  size: { w: number; h: number };  // 0..1
};

type DropZone = {
  id: string;
  label: string;
  zone: NormalizedRect;
  acceptsItemId: string;
};

type DragDropPlayable = {
  prompt: string;
  items: DraggableItem[];
  dropZones: DropZone[];
};
```

---

## 📤 Template Pack (nên gửi cho BE)

BE đang hỏi “template” thì nên hiểu là: **templateId + payload schema** mà BE cần trả về để FE render.

### 1) Template catalog

- `HOVER_SELECT` → payload theo `HoverSelectPlayable`
- `DRAG_DROP` → payload theo `DragDropPlayable`
- Multi-question: `payload` có thể là array **nhiều round**, nhưng **không được mix loại** (tất cả phần tử phải cùng loại với `templateId`).

### 2) JSON Schemas (copy/paste cho BE validator như AJV)

> Đây là phiên bản JSON hoá (không phụ thuộc code FE). Nếu BE cần “source of truth”, xem trực tiếp file contract phía FE: `src/mediapipe-game/api-contracts.js`.

#### `GameConfigRequestSchema`

```json
{
  "$id": "GameConfigRequest",
  "type": "object",
  "additionalProperties": false,
  "required": ["templateId", "slideDataReferences", "teacherConfigs"],
  "properties": {
    "templateId": {
      "type": "string",
      "enum": ["HOVER_SELECT", "DRAG_DROP"]
    },
    "slideDataReferences": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "documentId": { "type": "string" },
        "slideIds": { "type": "array", "items": { "type": "string" } },
        "assetUrls": { "type": "array", "items": { "type": "string" } },
        "note": { "type": "string" }
      }
    },
    "teacherConfigs": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "timeLimitSec": { "type": "number", "minimum": 5, "maximum": 600 },
        "hoverHoldMs": { "type": "number", "minimum": 250, "maximum": 5000 },
        "pinchThreshold": { "type": "number", "minimum": 0.005, "maximum": 0.2 },
        "enableSound": { "type": "boolean" }
      }
    }
  }
}
```

#### `PlayableGameResponseSchema`

```json
{
  "$id": "PlayableGameResponse",
  "type": "object",
  "additionalProperties": false,
  "required": ["gameId", "templateId", "version", "settings", "scene", "payload"],
  "properties": {
    "gameId": { "type": "string" },
    "templateId": {
      "type": "string",
      "enum": ["HOVER_SELECT", "DRAG_DROP"]
    },
    "version": { "type": "string" },
    "settings": {
      "type": "object",
      "additionalProperties": false,
      "required": ["mirror", "timeLimitSec", "hoverHoldMs", "pinchThreshold"],
      "properties": {
        "mirror": { "const": true },
        "timeLimitSec": { "type": "number", "minimum": 5, "maximum": 600 },
        "hoverHoldMs": { "type": "number", "minimum": 250, "maximum": 5000 },
        "pinchThreshold": { "type": "number", "minimum": 0.005, "maximum": 0.2 }
      }
    },
    "scene": {
      "type": "object",
      "additionalProperties": false,
      "properties": {
        "title": { "type": "string" },
        "backgroundUrl": { "type": "string" }
      }
    },
    "payload": {
      "oneOf": [
        {
          "type": "object",
          "additionalProperties": false,
          "required": ["prompt", "choices", "correctChoiceId"],
          "properties": {
            "prompt": { "type": "string" },
            "correctChoiceId": { "type": "string" },
            "choices": {
              "type": "array",
              "minItems": 2,
              "items": {
                "type": "object",
                "additionalProperties": false,
                "required": ["id", "text", "zone"],
                "properties": {
                  "id": { "type": "string" },
                  "text": { "type": "string" },
                  "zone": {
                    "type": "object",
                    "additionalProperties": false,
                    "required": ["x", "y", "w", "h"],
                    "properties": {
                      "x": { "type": "number", "minimum": 0, "maximum": 1 },
                      "y": { "type": "number", "minimum": 0, "maximum": 1 },
                      "w": { "type": "number", "minimum": 0, "maximum": 1 },
                      "h": { "type": "number", "minimum": 0, "maximum": 1 }
                    }
                  }
                }
              }
            }
          }
        },
        {
          "type": "object",
          "additionalProperties": false,
          "required": ["prompt", "items", "dropZones"],
          "properties": {
            "prompt": { "type": "string" },
            "items": {
              "type": "array",
              "minItems": 1,
              "items": {
                "type": "object",
                "additionalProperties": false,
                "required": ["id", "label", "start", "size"],
                "properties": {
                  "id": { "type": "string" },
                  "label": { "type": "string" },
                  "start": {
                    "type": "object",
                    "additionalProperties": false,
                    "required": ["x", "y"],
                    "properties": {
                      "x": { "type": "number", "minimum": 0, "maximum": 1 },
                      "y": { "type": "number", "minimum": 0, "maximum": 1 }
                    }
                  },
                  "size": {
                    "type": "object",
                    "additionalProperties": false,
                    "required": ["w", "h"],
                    "properties": {
                      "w": { "type": "number", "minimum": 0.01, "maximum": 1 },
                      "h": { "type": "number", "minimum": 0.01, "maximum": 1 }
                    }
                  }
                }
              }
            },
            "dropZones": {
              "type": "array",
              "minItems": 1,
              "items": {
                "type": "object",
                "additionalProperties": false,
                "required": ["id", "label", "zone", "acceptsItemId"],
                "properties": {
                  "id": { "type": "string" },
                  "label": { "type": "string" },
                  "acceptsItemId": { "type": "string" },
                  "zone": {
                    "type": "object",
                    "additionalProperties": false,
                    "required": ["x", "y", "w", "h"],
                    "properties": {
                      "x": { "type": "number", "minimum": 0, "maximum": 1 },
                      "y": { "type": "number", "minimum": 0, "maximum": 1 },
                      "w": { "type": "number", "minimum": 0, "maximum": 1 },
                      "h": { "type": "number", "minimum": 0, "maximum": 1 }
                    }
                  }
                }
              }
            }
          }
        },
        {
          "type": "array",
          "minItems": 1,
          "items": {
            "oneOf": [
              {
                "type": "object",
                "additionalProperties": false,
                "required": ["prompt", "choices", "correctChoiceId"],
                "properties": {
                  "prompt": { "type": "string" },
                  "correctChoiceId": { "type": "string" },
                  "choices": {
                    "type": "array",
                    "minItems": 2,
                    "items": {
                      "type": "object",
                      "additionalProperties": false,
                      "required": ["id", "text", "zone"],
                      "properties": {
                        "id": { "type": "string" },
                        "text": { "type": "string" },
                        "zone": {
                          "type": "object",
                          "additionalProperties": false,
                          "required": ["x", "y", "w", "h"],
                          "properties": {
                            "x": { "type": "number", "minimum": 0, "maximum": 1 },
                            "y": { "type": "number", "minimum": 0, "maximum": 1 },
                            "w": { "type": "number", "minimum": 0, "maximum": 1 },
                            "h": { "type": "number", "minimum": 0, "maximum": 1 }
                          }
                        }
                      }
                    }
                  }
                }
              },
              {
                "type": "object",
                "additionalProperties": false,
                "required": ["prompt", "items", "dropZones"],
                "properties": {
                  "prompt": { "type": "string" },
                  "items": {
                    "type": "array",
                    "minItems": 1,
                    "items": {
                      "type": "object",
                      "additionalProperties": false,
                      "required": ["id", "label", "start", "size"],
                      "properties": {
                        "id": { "type": "string" },
                        "label": { "type": "string" },
                        "start": {
                          "type": "object",
                          "additionalProperties": false,
                          "required": ["x", "y"],
                          "properties": {
                            "x": { "type": "number", "minimum": 0, "maximum": 1 },
                            "y": { "type": "number", "minimum": 0, "maximum": 1 }
                          }
                        },
                        "size": {
                          "type": "object",
                          "additionalProperties": false,
                          "required": ["w", "h"],
                          "properties": {
                            "w": { "type": "number", "minimum": 0.01, "maximum": 1 },
                            "h": { "type": "number", "minimum": 0.01, "maximum": 1 }
                          }
                        }
                      }
                    }
                  },
                  "dropZones": {
                    "type": "array",
                    "minItems": 1,
                    "items": {
                      "type": "object",
                      "additionalProperties": false,
                      "required": ["id", "label", "zone", "acceptsItemId"],
                      "properties": {
                        "id": { "type": "string" },
                        "label": { "type": "string" },
                        "acceptsItemId": { "type": "string" },
                        "zone": {
                          "type": "object",
                          "additionalProperties": false,
                          "required": ["x", "y", "w", "h"],
                          "properties": {
                            "x": { "type": "number", "minimum": 0, "maximum": 1 },
                            "y": { "type": "number", "minimum": 0, "maximum": 1 },
                            "w": { "type": "number", "minimum": 0, "maximum": 1 },
                            "h": { "type": "number", "minimum": 0, "maximum": 1 }
                          }
                        }
                      }
                    }
                  }
                }
              }
            ]
          }
        }
      ]
    }
  }
}
```

---

## ✅ JSON Examples

### Example 1 — Request: `HOVER_SELECT`

```json
{
  "templateId": "HOVER_SELECT",
  "slideDataReferences": {
    "documentId": "doc-001",
    "slideIds": ["card-001"],
    "assetUrls": [],
    "note": "Temp preview only (no persistence)"
  },
  "teacherConfigs": {
    "timeLimitSec": 60,
    "hoverHoldMs": 2000,
    "pinchThreshold": 0.045,
    "enableSound": false
  }
}
```

### Example 1 — Response: `HOVER_SELECT`

```json
{
  "gameId": "game_7d4d8a0c-2bde-4f33-a4be-4a0e2f9b7b1b",
  "templateId": "HOVER_SELECT",
  "version": "2026-03-31",
  "settings": {
    "mirror": true,
    "timeLimitSec": 60,
    "hoverHoldMs": 2000,
    "pinchThreshold": 0.045
  },
  "scene": {
    "title": "Hover & Select"
  },
  "payload": {
    "prompt": "Chọn đáp án đúng: 2 + 2 = ?",
    "correctChoiceId": "c2",
    "choices": [
      { "id": "c1", "text": "3", "zone": { "x": 0.08, "y": 0.28, "w": 0.38, "h": 0.18 } },
      { "id": "c2", "text": "4", "zone": { "x": 0.54, "y": 0.28, "w": 0.38, "h": 0.18 } },
      { "id": "c3", "text": "5", "zone": { "x": 0.08, "y": 0.56, "w": 0.38, "h": 0.18 } },
      { "id": "c4", "text": "6", "zone": { "x": 0.54, "y": 0.56, "w": 0.38, "h": 0.18 } }
    ]
  }
}
```

---

### Example 2 — Request: `DRAG_DROP`

```json
{
  "templateId": "DRAG_DROP",
  "slideDataReferences": {
    "documentId": "doc-001",
    "slideIds": ["card-002"],
    "assetUrls": [],
    "note": "Temp preview only (no persistence)"
  },
  "teacherConfigs": {
    "timeLimitSec": 60,
    "hoverHoldMs": 2000,
    "pinchThreshold": 0.045,
    "enableSound": false
  }
}
```

### Example 2 — Response: `DRAG_DROP`

```json
{
  "gameId": "game_1c5e5dfc-0c50-4e2e-9c53-a97bf0434a44",
  "templateId": "DRAG_DROP",
  "version": "2026-03-31",
  "settings": {
    "mirror": true,
    "timeLimitSec": 60,
    "hoverHoldMs": 2000,
    "pinchThreshold": 0.045
  },
  "scene": {
    "title": "Drag & Drop"
  },
  "payload": {
    "prompt": "Kéo đúng nhãn vào đúng ô:",
    "items": [
      {
        "id": "item_cat",
        "label": "Mèo",
        "start": { "x": 0.15, "y": 0.75 },
        "size": { "w": 0.18, "h": 0.12 }
      },
      {
        "id": "item_dog",
        "label": "Chó",
        "start": { "x": 0.38, "y": 0.75 },
        "size": { "w": 0.18, "h": 0.12 }
      }
    ],
    "dropZones": [
      {
        "id": "zone_cat",
        "label": "Ô Mèo",
        "acceptsItemId": "item_cat",
        "zone": { "x": 0.12, "y": 0.2, "w": 0.32, "h": 0.22 }
      },
      {
        "id": "zone_dog",
        "label": "Ô Chó",
        "acceptsItemId": "item_dog",
        "zone": { "x": 0.56, "y": 0.2, "w": 0.32, "h": 0.22 }
      }
    ]
  }
}
```

---

### Example 3 — Response multi-question (payload list) — `HOVER_SELECT`

```json
{
  "gameId": "game_multi_abc123",
  "templateId": "HOVER_SELECT",
  "version": "2026-03-31",
  "settings": {
    "mirror": true,
    "timeLimitSec": 60,
    "hoverHoldMs": 2000,
    "pinchThreshold": 0.045
  },
  "scene": {
    "title": "Hover & Select (3 câu)"
  },
  "payload": [
    {
      "prompt": "Câu 1: 2 + 2 = ?",
      "correctChoiceId": "c0_2",
      "choices": [
        { "id": "c0_1", "text": "3", "zone": { "x": 0.08, "y": 0.28, "w": 0.38, "h": 0.18 } },
        { "id": "c0_2", "text": "4", "zone": { "x": 0.54, "y": 0.28, "w": 0.38, "h": 0.18 } },
        { "id": "c0_3", "text": "5", "zone": { "x": 0.08, "y": 0.56, "w": 0.38, "h": 0.18 } },
        { "id": "c0_4", "text": "6", "zone": { "x": 0.54, "y": 0.56, "w": 0.38, "h": 0.18 } }
      ]
    },
    {
      "prompt": "Câu 2: 3 + 3 = ?",
      "correctChoiceId": "c1_2",
      "choices": [
        { "id": "c1_1", "text": "5", "zone": { "x": 0.08, "y": 0.28, "w": 0.38, "h": 0.18 } },
        { "id": "c1_2", "text": "6", "zone": { "x": 0.54, "y": 0.28, "w": 0.38, "h": 0.18 } },
        { "id": "c1_3", "text": "7", "zone": { "x": 0.08, "y": 0.56, "w": 0.38, "h": 0.18 } },
        { "id": "c1_4", "text": "8", "zone": { "x": 0.54, "y": 0.56, "w": 0.38, "h": 0.18 } }
      ]
    },
    {
      "prompt": "Câu 3: 4 + 4 = ?",
      "correctChoiceId": "c2_2",
      "choices": [
        { "id": "c2_1", "text": "7", "zone": { "x": 0.08, "y": 0.28, "w": 0.38, "h": 0.18 } },
        { "id": "c2_2", "text": "8", "zone": { "x": 0.54, "y": 0.28, "w": 0.38, "h": 0.18 } },
        { "id": "c2_3", "text": "9", "zone": { "x": 0.08, "y": 0.56, "w": 0.38, "h": 0.18 } },
        { "id": "c2_4", "text": "10", "zone": { "x": 0.54, "y": 0.56, "w": 0.38, "h": 0.18 } }
      ]
    }
  ]
}
```

---

## 🔒 Compatibility Notes (để FE không bị crash)

- `settings.mirror` **bắt buộc** là `true` (schema phía FE đang yêu cầu `const: true`)
- `payload` phải đúng shape theo `templateId`:
  - `HOVER_SELECT` → có `choices[]` và `correctChoiceId`
  - `DRAG_DROP` → có `items[]` và `dropZones[]`
- Nếu `payload` là array thì các phần tử **phải cùng loại** với `templateId` (không mix)
- Tất cả number trong `NormalizedRect`, `start`, `size` nên nằm trong [0..1] để tránh vẽ ngoài canvas

> Nguồn contract chuẩn phía FE: `src/mediapipe-game/api-contracts.js` (có JSON Schemas để BE team copy sang validator như AJV).