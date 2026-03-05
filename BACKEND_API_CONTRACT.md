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

### Visual Example (từ UI)

```
Document: "Bài học Địa lí"
  ├── Card 1: "Title Card" (freeform - no templateId)
  │   └── Block: TEXT "<h1>Tiêu đề bài học</h1>..."
  │
  ├── Card 2: "Key Features" (template-003)
  │   ├── Block: HEADING "Why Choose EduVi?"
  │   └── Layout: TWO_COLUMN
  │       ├── Block: TEXT (Left column)
  │       └── Block: TEXT (Right column)
  │
  ├── Card 3: "Bullet List" (freeform - no templateId)
  │   ├── Block: HEADING "Mục tiêu bài học"
  │   └── Block: TEXT "<ul><li>...</li></ul>"
  │
  ├── Card 4: "Quiz" (freeform - no templateId)
  │   └── Block: QUIZ { questions: [...] }
  │
  ├── Card 5: "Flashcard" (freeform - no templateId)
  │   └── Block: FLASHCARD { front, back }
  │
  ├── Card 6: "Fill in Blank" (freeform - no templateId)
  │   └── Block: FILL_BLANK { sentence, blanks }
  │
  ├── Card 7: "Section Divider" (freeform - backgroundColor: "#1e293b")
  │   └── Block: TEXT "<h1>Tên chủ đề</h1>"
  │
  └── Card 8: "Summary" (freeform - no templateId)
      ├── Block: HEADING "Tóm tắt bài học"
      └── Block: TEXT "<ul><li>Ý chính 1</li>...</ul>"
```

---

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
```

**Status Codes**:
- `200 OK` - Document found
- `404 Not Found` - Document không tồn tại
- `401 Unauthorized` - User không có quyền truy cập
- `500 Internal Server Error` - Lỗi server

---

### 2. POST `/api/documents`

**Mục đích**: Tạo document mới

**Request Body**:
```json
{
  "title": "Untitled Presentation",
  "userId": "user-123"
}
```

**Response**: Trả về `IDocument` đầy đủ với:
- `id`: UUID tự động generate
- `createdAt`: Timestamp hiện tại
- `updatedAt`: Timestamp hiện tại
- `cards`: Array với 1 card mặc định (template-003)
- `activeCardId`: ID của card đầu tiên

**Default Card Structure**:
```json
{
  "id": "generated-uuid",
  "type": "CARD",
  "templateId": "template-003",
  "title": "Slide 1",
  "backgroundColor": null,
  "backgroundImage": null,
  "children": [
    {
      "id": "generated-uuid",
      "type": "LAYOUT",
      "variant": "TWO_COLUMN",
      "gap": 4,
      "children": [
        {
          "id": "generated-uuid",
          "type": "BLOCK",
          "content": {
            "type": "TEXT",
            "html": "<p>Left column content</p>"
          },
          "children": []
        },
        {
          "id": "generated-uuid",
          "type": "BLOCK",
          "content": {
            "type": "TEXT",
            "html": "<p>Right column content</p>"
          },
          "children": []
        }
      ]
    }
  ]
}
```

---

### 3. PUT `/api/documents/:id`

**Mục đích**: Cập nhật toàn bộ document

**Request Body**: Toàn bộ `IDocument` object
```json
{
  "id": "doc-001",
  "title": "Updated Title",
  "activeCardId": "card-002",
  "cards": [
    {
      "id": "card-002",
      "type": "CARD",
      "templateId": "template-003",
      "title": "Updated Slide",
      "children": [...]
    }
  ]
}
```

**Response**: `IDocument` sau khi update với `updatedAt` mới

**⚠️ Lưu ý**:
- Phải validate toàn bộ cấu trúc tree
- Check circular references
- Validate node types và content
- **`templateId` là optional metadata** - không validate structure

---

### 4. DELETE `/api/documents/:id`

**Mục đích**: Xóa document

**Response**:
```json
{
  "success": true,
  "deletedId": "doc-001"
}
```

---

### 5. GET `/api/documents?userId=:userId`

**Mục đích**: Lấy danh sách documents của user

**Query Parameters**:
- `userId` (required): ID của user
- `limit` (optional): Số lượng documents (default: 20)
- `offset` (optional): Pagination offset (default: 0)
- `sort` (optional): `createdAt` | `updatedAt` | `title` (default: `updatedAt`)
- `order` (optional): `asc` | `desc` (default: `desc`)

**Response**:
```json
{
  "data": [
    {
      "id": "doc-001",
      "title": "EduVi Launch",
      "createdAt": "2026-01-31T10:00:00.000Z",
      "updatedAt": "2026-02-24T15:30:00.000Z",
      "cardCount": 6
    }
  ],
  "total": 45,
  "limit": 20,
  "offset": 0
}
```

---

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

## 🗄️ Database Schema Recommendations

### Option 1: JSONB Storage (Recommended)

**PostgreSQL Example**:
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  active_card_id UUID,
  data JSONB NOT NULL,  -- Lưu toàn bộ document structure
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT title_not_empty CHECK (title <> '')
);

-- Indexes for performance
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_updated_at ON documents(updated_at DESC);
CREATE INDEX idx_documents_data_cards ON documents USING GIN ((data->'cards'));

-- Full-text search on title
CREATE INDEX idx_documents_title_fts ON documents USING GIN (to_tsvector('english', title));

-- ✨ NEW: Index for template tracking
CREATE INDEX idx_documents_templates ON documents USING GIN ((data->'cards'->'templateId'));
```

**Example Query - Find all cards using template-003:**
```sql
SELECT id, title 
FROM documents 
WHERE data @> '{"cards": [{"templateId": "template-003"}]}';
```

**Ưu điểm**:
- ✅ Dễ implement - chỉ cần serialize/deserialize JSON
- ✅ Flexible schema - dễ thêm fields mới
- ✅ Match frontend data structure hoàn toàn
- ✅ Atomic operations - update toàn bộ document một lần
- ✅ Không cần validate templateId vs structure

**Nhược điểm**:
- ⚠️ Khó query vào nested data
- ⚠️ Không enforce foreign keys cho cards/blocks

---

### Option 2: Normalized Tables

**PostgreSQL Example**:
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  active_card_id UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  template_id VARCHAR(50),  -- ✨ NEW: Nullable template reference
  title VARCHAR(255) NOT NULL,
  background_color VARCHAR(7),
  background_image TEXT,
  order_index INT NOT NULL,
  
  UNIQUE(document_id, order_index)
);

-- ✨ NEW: Optional templates table for analytics
CREATE TABLE card_templates (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  preview_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ❌ NO foreign key constraint on cards.template_id
-- Vì user có thể modify structure sau khi tạo

CREATE TABLE nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES nodes(id) ON DELETE CASCADE,
  node_type VARCHAR(10) NOT NULL CHECK (node_type IN ('LAYOUT', 'BLOCK')),
  order_index INT NOT NULL,
  
  -- Layout-specific fields
  layout_variant VARCHAR(20),
  layout_gap INT,
  
  -- Block content (JSONB for flexibility)
  block_content JSONB,
  
  CONSTRAINT valid_layout CHECK (
    node_type <> 'LAYOUT' OR (layout_variant IS NOT NULL AND layout_gap IS NOT NULL)
  ),
  CONSTRAINT valid_block CHECK (
    node_type <> 'BLOCK' OR block_content IS NOT NULL
  )
);

CREATE INDEX idx_nodes_card ON nodes(card_id);
CREATE INDEX idx_nodes_parent ON nodes(parent_id);
CREATE INDEX idx_cards_template ON cards(template_id) WHERE template_id IS NOT NULL;
```

**Example Query - Template usage analytics:**
```sql
-- Count cards by template
SELECT 
  template_id,
  COUNT(*) as usage_count
FROM cards
WHERE template_id IS NOT NULL
GROUP BY template_id
ORDER BY usage_count DESC;

-- Find users using specific template
SELECT DISTINCT d.user_id
FROM documents d
JOIN cards c ON c.document_id = d.id
WHERE c.template_id = 'template-003';
```

**Ưu điểm**:
- ✅ Relational integrity với foreign keys
- ✅ Dễ query specific nodes
- ✅ Better indexing cho complex queries
- ✅ Template analytics queries dễ dàng

**Nhược điểm**:
- ⚠️ Phức tạp hơn implement
- ⚠️ Cần recursive queries để build tree
- ⚠️ Multiple queries thay vì single document fetch

---

## 🔐 Security & Authorization

### Access Control

```typescript
// Middleware example (Node.js/Express)
async function checkDocumentAccess(req, res, next) {
  const { id } = req.params;
  const userId = req.user.id;  // From JWT token
  
  const doc = await db.documents.findById(id);
  
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }
  
  if (doc.userId !== userId && !doc.sharedWith.includes(userId)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
}
```

### Input Sanitization

```typescript
// Validate và sanitize HTML content
import DOMPurify from 'isomorphic-dompurify';

function sanitizeBlockContent(content: BlockContent): BlockContent {
  if (content.type === 'TEXT' || content.type === 'HEADING') {
    return {
      ...content,
      html: DOMPurify.sanitize(content.html, {
        ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li'],
        ALLOWED_ATTR: ['class'],
      }),
    };
  }
  return content;
}

// ✨ NEW: Validate templateId (optional)
function validateTemplateId(templateId?: string): boolean {
  if (!templateId) return true; // templateId is optional
  
  const validTemplates = [
    'template-001', 'template-002', 'template-003',
    'template-004', 'template-005', 'template-006'
  ];
  
  return validTemplates.includes(templateId);
}
```

---

## 🚀 Performance Optimization

### Caching Strategy

```typescript
// Redis cache example
import Redis from 'ioredis';
const redis = new Redis();

async function getDocument(id: string): Promise<IDocument> {
  // Check cache first
  const cached = await redis.get(`document:${id}`);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fetch from database
  const doc = await db.documents.findById(id);
  
  // Cache for 5 minutes
  await redis.setex(`document:${id}`, 300, JSON.stringify(doc));
  
  return doc;
}

// Invalidate cache on update
async function updateDocument(id: string, data: IDocument): Promise<IDocument> {
  const updated = await db.documents.update(id, data);
  
  // Invalidate cache
  await redis.del(`document:${id}`);
  
  return updated;
}
```

### Pagination

```typescript
// GET /api/documents?userId=X&limit=20&offset=0
async function listDocuments(req, res) {
  const { userId, limit = 20, offset = 0 } = req.query;
  
  const [documents, total] = await Promise.all([
    db.documents
      .where('user_id', userId)
      .orderBy('updated_at', 'desc')
      .limit(limit)
      .offset(offset)
      .select('id', 'title', 'created_at', 'updated_at'),
    
    db.documents
      .where('user_id', userId)
      .count(),
  ]);
  
  res.json({
    data: documents,
    total,
    limit,
    offset,
  });
}
```

---

## 🧪 Testing

### Example Test Cases

```typescript
describe('GET /api/documents/:id', () => {
  it('should return document with valid structure', async () => {
    const res = await request(app)
      .get('/api/documents/doc-001')
      .set('Authorization', 'Bearer <token>');
    
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      cards: expect.any(Array),
      createdAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      updatedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
    });
  });
  
  it('should validate card structure with optional templateId', async () => {
    const res = await request(app)
      .get('/api/documents/doc-001')
      .set('Authorization', 'Bearer <token>');
    
    const firstCard = res.body.cards[0];
    expect(firstCard).toMatchObject({
      id: expect.any(String),
      type: 'CARD',
      title: expect.any(String),
      children: expect.any(Array),
    });
    
    // templateId is optional
    if (firstCard.templateId) {
      expect(typeof firstCard.templateId).toBe('string');
    }
  });
  
  it('should serialize enums as strings', async () => {
    const res = await request(app)
      .get('/api/documents/doc-001')
      .set('Authorization', 'Bearer <token>');
    
    const card = res.body.cards[0];
    expect(card.type).toBe('CARD'); // Not { CARD: 'CARD' }
    
    const layout = card.children.find(c => c.type === 'LAYOUT');
    if (layout) {
      expect(typeof layout.variant).toBe('string'); // "TWO_COLUMN"
    }
  });
  
  it('should return 404 for non-existent document', async () => {
    const res = await request(app)
      .get('/api/documents/non-existent-id')
      .set('Authorization', 'Bearer <token>');
    
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/documents/:id', () => {
  it('should allow cards without templateId', async () => {
    const document = {
      id: 'doc-001',
      title: 'Test',
      cards: [
        {
          id: 'card-001',
          type: 'CARD',
          // No templateId - should be valid
          title: 'Custom Slide',
          children: []
        }
      ]
    };
    
    const res = await request(app)
      .put('/api/documents/doc-001')
      .set('Authorization', 'Bearer <token>')
      .send(document);
    
    expect(res.status).toBe(200);
  });
  
  it('should allow structure different from template', async () => {
    const document = {
      id: 'doc-001',
      title: 'Test',
      cards: [
        {
          id: 'card-001',
          type: 'CARD',
          templateId: 'template-003', // Originally 2-column
          title: 'Modified Slide',
          children: [
            // User changed to 3-column - should be valid!
            {
              id: 'layout-001',
              type: 'LAYOUT',
              variant: 'THREE_COLUMN',
              gap: 4,
              children: [...]
            }
          ]
        }
      ]
    };
    
    const res = await request(app)
      .put('/api/documents/doc-001')
      .set('Authorization', 'Bearer <token>')
      .send(document);
    
    expect(res.status).toBe(200);
  });
});
```

---

## 📦 Example Implementation (Node.js + Express + PostgreSQL)

```typescript
import express from 'express';
import { Pool } from 'pg';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const db = new Pool({ connectionString: process.env.DATABASE_URL });

app.use(express.json());

// GET /api/documents/:id
app.get('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // From auth middleware
    
    const result = await db.query(
      'SELECT * FROM documents WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const doc = result.rows[0];
    
    // Transform database row to IDocument format
    const document: IDocument = {
      id: doc.id,
      title: doc.title,
      activeCardId: doc.active_card_id,
      createdAt: doc.created_at.toISOString(),
      updatedAt: doc.updated_at.toISOString(),
      cards: doc.data.cards, // If using JSONB
    };
    
    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/documents
app.post('/api/documents', async (req, res) => {
  try {
    const { title } = req.body;
    const userId = req.user.id;
    
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const id = uuidv4();
    const cardId = uuidv4();
    const layoutId = uuidv4();
    const block1Id = uuidv4();
    const block2Id = uuidv4();
    const now = new Date().toISOString();
    
    // ✨ Create default card with template-003 (TWO_COLUMN)
    const document: IDocument = {
      id,
      title,
      activeCardId: cardId,
      createdAt: now,
      updatedAt: now,
      cards: [
        {
          id: cardId,
          type: NodeType.CARD,
          templateId: 'template-003', // ✨ NEW
          title: 'Slide 1',
          backgroundColor: undefined,
          backgroundImage: undefined,
          children: [
            {
              id: layoutId,
              type: NodeType.LAYOUT,
              variant: LayoutVariant.TWO_COLUMN,
              gap: 4,
              children: [
                {
                  id: block1Id,
                  type: NodeType.BLOCK,
                  content: {
                    type: BlockType.TEXT,
                    html: '<p>Left column content</p>',
                  },
                  children: [],
                },
                {
                  id: block2Id,
                  type: NodeType.BLOCK,
                  content: {
                    type: BlockType.TEXT,
                    html: '<p>Right column content</p>',
                  },
                  children: [],
                },
              ],
            },
          ],
        },
      ],
    };
    
    await db.query(
      `INSERT INTO documents (id, user_id, title, data, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, userId, title, JSON.stringify(document), now, now]
    );
    
    res.status(201).json(document);
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/documents/:id
app.put('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const document: IDocument = req.body;
    
    // Validate structure
    if (!document.id || !document.title || !Array.isArray(document.cards)) {
      return res.status(400).json({ error: 'Invalid document structure' });
    }
    
    // ✨ Validate enum serialization
    for (const card of document.cards) {
      if (typeof card.type !== 'string' || card.type !== 'CARD') {
        return res.status(400).json({ 
          error: 'Invalid card type. Must be string "CARD"' 
        });
      }
      
      // Validate optional templateId
      if (card.templateId !== undefined && typeof card.templateId !== 'string') {
        return res.status(400).json({ 
          error: 'Invalid templateId. Must be string or undefined' 
        });
      }
      
      // Validate layouts
      for (const child of card.children) {
        if (child.type === 'LAYOUT') {
          if (typeof child.variant !== 'string') {
            return res.status(400).json({ 
              error: 'Invalid layout variant. Must be string' 
            });
          }
        }
      }
    }
    
    const updatedAt = new Date().toISOString();
    document.updatedAt = updatedAt;
    
    const result = await db.query(
      `UPDATE documents 
       SET title = $1, data = $2, updated_at = $3
       WHERE id = $4 AND user_id = $5
       RETURNING *`,
      [document.title, JSON.stringify(document), updatedAt, id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(document);
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/documents/:id
app.delete('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await db.query(
      'DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✨ NEW: Template analytics endpoint
app.get('/api/analytics/templates', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await db.query(`
      SELECT 
        c.template_id,
        COUNT(*) as usage_count,
        MAX(d.updated_at) as last_used
      FROM documents d
      JOIN cards c ON c.document_id = d.id
      WHERE d.user_id = $1 AND c.template_id IS NOT NULL
      GROUP BY c.template_id
      ORDER BY usage_count DESC
    `, [userId]);
    
    res.json({
      templates: result.rows
    });
  } catch (error) {
    console.error('Error fetching template analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
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
| `quiz-card` | Quiz | `QUIZ` | 1 QUIZ block (1 empty question) | Câu hỏi trắc nghiệm |
| `flashcard-card` | Flashcard | `FLASHCARD` | 1 FLASHCARD block (front/back) | Thẻ ghi nhớ lật mặt |
| `fill-blank-card` | Fill in Blank | `FILL_BLANK` | 1 FILL_BLANK block (sentence + blanks) | Điền từ vào chỗ trống |
| `summary-card` | Summary | `HEADING` + `TEXT` | 1 HEADING + 1 TEXT (ul/li) | Slide tóm tắt cuối bài |

**⚠️ Important:**
- Freeform cards **KHÔNG có `templateId`** — field `templateId` là `undefined` hoặc không có trong JSON
- Freeform cards **KHÔNG dùng `ILayout`** — `children` chứa trực tiếp `IBlock[]`
- User có thể thay đổi structure sau khi tạo
- Backend KHÔNG validate `children` matching với template
- `templateId` chỉ để tracking/analytics

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

### ⚠️ So sánh: Basic vs Freeform Card Structure

```json
// ✅ Basic Card (có templateId, dùng Layout)
{
  "id": "card-001",
  "type": "CARD",
  "templateId": "template-003",
  "title": "Key Features",
  "children": [
    {
      "id": "layout-001",
      "type": "LAYOUT",
      "variant": "TWO_COLUMN",
      "gap": 6,
      "children": [
        { "id": "block-001", "type": "BLOCK", "content": { "type": "TEXT", "html": "..." }, "children": [] },
        { "id": "block-002", "type": "BLOCK", "content": { "type": "TEXT", "html": "..." }, "children": [] }
      ]
    }
  ]
}

// ✅ Freeform Card (KHÔNG có templateId, KHÔNG dùng Layout)
{
  "id": "card-002",
  "type": "CARD",
  "title": "Quiz",
  "children": [
    {
      "id": "block-003",
      "type": "BLOCK",
      "content": {
        "type": "QUIZ",
        "title": "",
        "questions": [...]
      },
      "children": []
    }
  ]
}
```

---

## 📞 Questions & Support

Nếu Backend team có câu hỏi về API contract, hãy liên hệ:

- **Frontend Lead**: [Tên của bạn]
- **Slack Channel**: `#eduvi-api-discussion`
- **Reference Implementation**: `src/data/mock-data.ts`
- **TypeScript Types**: `src/types/nodes.ts`
- **Template Definitions**: `src/components/sidebar/MaterialSidebar.tsx`

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-24 | Initial API contract |
| 1.1.0 | 2026-02-24 | Added `templateId` optional field, enum serialization clarification |
| 1.2.0 | 2026-03-05 | Added Freeform templates documentation (Title, Bullet, Section Divider, Quiz, Flashcard, Fill-in-Blank, Summary) |