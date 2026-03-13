# Cơ chế lưu và khôi phục Slide

## 1. Tổng quan

Slide được biểu diễn bằng một object TypeScript có tên `IDocument`. Toàn bộ nội dung, layout, màu sắc, và định dạng mà người dùng chỉnh sửa đều nằm trong object này. Để lưu xuống database, chỉ cần `JSON.stringify(document)` và gửi chuỗi đó lên API.

```
IDocument (Zustand store)
    └── JSON.stringify()
         └── chuỗi string
              └── PUT /api/Pipeline/products/{productCode}/slide
                   └── { "slideDocument": "..." }
                        └── Database lưu nguyên chuỗi (nvarchar(max) / text)
```

---

## 2. Cấu trúc `IDocument`

```typescript
interface IDocument {
  id: string;
  title: string;
  cards: ICard[];          // mảng các slide
  activeCardId: string;
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601 — thời điểm chỉnh sửa cuối
}
```

### Cây node bên trong mỗi `ICard` (slide)

```
ICard  (1 slide)
├── id, title, backgroundColor, contentAlignment
└── children[]
    ├── ILayout  (container 1 cột / 2 cột / 3 cột...)
    │   ├── variant: "SINGLE" | "TWO_COLUMN" | "THREE_COLUMN" | "SIDEBAR_LEFT" | "SIDEBAR_RIGHT"
    │   ├── columnWidths: [60, 40]   ← tỉ lệ cột người dùng đã kéo
    │   └── children[]
    │       └── IBlock  (leaf node chứa nội dung)
    └── IBlock  (có thể trực tiếp dưới card)
        ├── content  ← nội dung cụ thể theo type
        └── styles   ← kích thước sau khi resize
```

### Các loại `IBlock.content`

| `type` | Dữ liệu lưu | Ghi chú |
|---|---|---|
| `TEXT` | `{ html: "<p>...</p>" }` | HTML đầy đủ từ Tiptap, giữ bold/italic/màu chữ/alignment |
| `HEADING` | `{ html: "<h1>...</h1>", level: 1 }` | Tương tự TEXT |
| `IMAGE` | `{ src: "https://...", alt: "...", caption: "..." }` | URL ảnh |
| `VIDEO` | `{ src: "https://...", provider: "youtube" }` | YouTube / Vimeo / direct |
| `QUIZ` | `{ title, questions: [{ question, options[], correctIndex, explanation }] }` | Câu hỏi MCQ |
| `FLASHCARD` | `{ front: "...", back: "..." }` | Thẻ lật front/back |
| `FILL_BLANK` | `{ sentence: "Java là [ngôn ngữ]...", blanks: ["ngôn ngữ"], hint }` | Điền từ |
| `MATERIAL` | `{ widgetType, data: {...} }` | Widget từ Material Library |

---

## 3. Luồng lưu

### Bước 1 — Người dùng chỉnh sửa slide

Mọi thao tác chỉnh sửa đều được đồng bộ ngay về Zustand store qua `setDocumentWithHistory()`:

```
Gõ text    → Tiptap onUpdate (debounce 500ms) → updateBlockContent() → store.document
Thêm block → addBlockToCard()                                         → store.document
Kéo layout → addLayoutToCard() / updateLayoutColumnWidths()           → store.document
Đổi màu nền→ setCardBackground()                                      → store.document
Resize     → updateBlockStyles()                                      → store.document
Undo/Redo  → undo() / redo()                                          → store.document
```

`store.document` **luôn là bản mới nhất** của toàn bộ slide.

### Bước 2 — Gọi API lưu

Khi người dùng bấm nút **Lưu** (hoặc `Ctrl+S`) trong Toolbar:

```typescript
// src/store/actions/documentActions.ts — hàm saveSlide()
const { document, currentProductCode } = get();
await saveEditedSlide(currentProductCode, JSON.stringify(document));
```

```typescript
// src/services/pipelineServices.ts — hàm saveEditedSlide()
await api.put(
  `/api/Pipeline/products/${productCode}/slide`,
  { slideDocument: JSON.stringify(document) }
);
```

**Request body gửi lên:**
```json
{
  "slideDocument": "{\"id\":\"doc-abc\",\"title\":\"Bài học...\",\"cards\":[...]}"
}
```

`slideDocument` là một **chuỗi string** chứa toàn bộ JSON của `IDocument`. Backend lưu nguyên chuỗi này, không cần parse.

### Bước 3 — Persistence tầng client (sessionStorage)

Ngoài việc lưu lên server, khi `setDocument()` được gọi, dữ liệu còn được cache vào `sessionStorage` để editor không bị mất khi F5:

```typescript
sessionStorage.setItem('eduvi_slide_document', JSON.stringify(doc));
sessionStorage.setItem('eduvi_product_code', productCode);
```

---

## 4. Luồng lấy lại

### Khi bấm "Xem slide" từ trang Projects

```typescript
// src/app/projects/[id]/page.tsx — hàm handleViewSlide()

if (product.hasEditedSlide) {
  // Đã từng lưu → lấy bản người dùng chỉnh sửa
  const result = await getProductEditedSlide(productCode);
  //  GET /api/Product/{productCode}/slide/edited
  //  Response: { slideEditedDocument: IDocument, slideEditedAt: string }
  setDocument(result.slideEditedDocument, productCode);
} else {
  // Chưa chỉnh sửa → lấy bản AI tạo ra
  const result = await getProductSlide(productCode);
  //  GET /api/Product/{productCode}/slide
  //  Response: { slideDocument: IDocument, slideGeneratedAt: string }
  setDocument(result.slideDocument, productCode);
}

router.push('/editor');
```

### Khi editor load (kể cả sau F5)

```typescript
// src/store/actions/documentActions.ts — hàm loadDocument()

// 1. Nếu store đã có document (vừa navigate từ projects) → dùng luôn
if (existing) return;

// 2. Thử khôi phục từ sessionStorage (F5 reload)
const cached = sessionStorage.getItem('eduvi_slide_document');
const productCode = sessionStorage.getItem('eduvi_product_code');
if (cached) {
  setDocument(JSON.parse(cached));
  set({ currentProductCode: productCode });
  return;
}
```

### Khi `setDocument(doc)` được gọi → UI render lại

Mỗi React component đọc data từ store và render:

```
store.document.cards[0].backgroundColor    → CSS background-color slide
store.document.cards[0].contentAlignment   → flex alignment
layout.variant = "TWO_COLUMN"              → CSS grid 2 cột
layout.columnWidths = [60, 40]             → grid-template-columns: 60fr 40fr
block.content.html = "<p><strong>...</strong></p>" → Tiptap setContent(html)
block.content.src = "https://..."          → <img src=...>
block.styles.width = "80%"                 → inline style (kích thước sau resize)
block.content.questions = [...]            → render QuizBlock đầy đủ
```

**Kết quả: UI hoàn toàn giống lúc người dùng lưu.**

---

## 5. Trạng thái của Product

Từ API `GET /api/Product` và `GET /api/Product/{productCode}`, backend trả về các field để biết trạng thái:

| Field | Ý nghĩa |
|---|---|
| `hasSlide` | AI đã tạo xong slide chưa |
| `hasEditedSlide` | Người dùng đã lưu bản chỉnh sửa chưa |
| `slideGeneratedAt` | Thời điểm AI tạo |
| `slideEditedAt` | Thời điểm người dùng lưu lần cuối |
| `slideDocument` | Bản AI tạo (trong `GET /api/Product/{productCode}`) |
| `slideEditedDocument` | Bản người dùng chỉnh sửa (null nếu chưa lưu) |

---

## 6. Sơ đồ đầy đủ

```
[Projects page]
    │
    ├── hasEditedSlide = false  ──→  GET /api/Product/{code}/slide
    │                                    └── slideDocument: IDocument
    │
    └── hasEditedSlide = true   ──→  GET /api/Product/{code}/slide/edited
                                         └── slideEditedDocument: IDocument
                                                    │
                                              setDocument(doc, productCode)
                                              sessionStorage.setItem(...)
                                                    │
                                           router.push('/editor')
                                                    │
                                         [Editor page — loadDocument()]
                                                    │
                                              Render UI từ IDocument
                                                    │
                                         [Người dùng chỉnh sửa]
                                                    │
                                         store.document cập nhật real-time
                                                    │
                                      Ctrl+S / Bấm nút "Lưu"
                                                    │
                                    PUT /api/Pipeline/products/{code}/slide
                                    { "slideDocument": JSON.stringify(document) }
                                                    │
                                         Database lưu chuỗi JSON
                                         hasEditedSlide ← true
```

---

## 7. Lưu ý

**Debounce Tiptap (500ms):** TextBlock dùng debounce 500ms trước khi sync HTML về store. Nếu người dùng đang gõ dở và nhấn Ctrl+S ngay lập tức, ký tự cuối có thể chưa được lưu. Trong thực tế điều này hiếm xảy ra vì người dùng thường dừng gõ trước khi lưu.

**Format lưu:** `slideDocument` trong request body là **string** (JSON.stringify), không phải object. Backend chỉ cần lưu nguyên chuỗi dạng `nvarchar(max)` hoặc `text`, không cần parse.

**Tương thích Flutter:** Vì `IDocument` là JSON thuần (không có class đặc biệt), Flutter app có thể parse bằng `json.decode()` và tạo Dart model tương ứng. Phần `content.html` cần package `flutter_html` để render.
