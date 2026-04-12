# Template API Contract

Tài liệu này mô tả toàn bộ những gì Backend cần implement để phục vụ tính năng **Quản lý mẫu bố cục trang (Card Template)**.

---

## Tổng quan

| Phương thức | Endpoint                      | Mô tả                        | Phân quyền     |
|-------------|-------------------------------|------------------------------|----------------|
| `GET`       | `/api/Template`               | Lấy danh sách tất cả template | Public / Auth  |
| `GET`       | `/api/Template/{templateCode}` | Lấy chi tiết một template    | Public / Auth  |
| `POST`      | `/api/Template`               | Tạo template mới             | Admin only     |
| `PUT`       | `/api/Template/{templateCode}` | Cập nhật template            | Admin only     |
| `DELETE`    | `/api/Template/{templateCode}` | Xóa template                 | Admin only     |

---

## Quy tắc chung

### Response wrapper

Tất cả response **phải** bọc trong envelope sau (đồng nhất với các API khác trong hệ thống):

```json
{
  "code": 200,
  "message": "Success",
  "result": <data>
}
```

| Field     | Type     | Mô tả                                         |
|-----------|----------|-----------------------------------------------|
| `code`    | `int`    | HTTP status code (hoặc business code)         |
| `message` | `string` | Mô tả kết quả (thành công / lỗi)             |
| `result`  | `T`      | Dữ liệu thực tế (null nếu lỗi hoặc DELETE)   |

---

## Kiểu dữ liệu cốt lõi

### `ICardTemplate` — Object Template

Đây là object đầy đủ mà backend lưu và trả về.

```json
{
  "templateCode": "tpl_abc123",
  "name": "Hai cột cân bằng",
  "description": "Bố cục hai cột kích thước bằng nhau",
  "category": "layout",
  "skeleton": { ... },
  "createdAt": "2026-04-08T10:00:00Z",
  "updatedAt": "2026-04-08T10:00:00Z"
}
```

| Field          | Type                   | Bắt buộc | Mô tả                                                    |
|----------------|------------------------|----------|----------------------------------------------------------|
| `templateCode` | `string`               | ✅       | Mã định danh duy nhất, do BE tự sinh (UUID hoặc slug)    |
| `name`         | `string`               | ✅       | Tên hiển thị của template                               |
| `description`  | `string \| null`       | ❌       | Mô tả ngắn, tuỳ chọn                                    |
| `category`     | `"layout" \| "freeform"` | ✅     | Phân loại template (xem bảng bên dưới)                  |
| `skeleton`     | `ITemplateSkeleton`    | ✅       | Cấu trúc xương sống của slide (xem chi tiết bên dưới)   |
| `createdAt`    | `string (ISO 8601)`    | ✅       | Thời điểm tạo                                           |
| `updatedAt`    | `string (ISO 8601)`    | ✅       | Thời điểm cập nhật lần cuối                             |

**`category` values:**

| Giá trị    | Ý nghĩa                                        |
|------------|------------------------------------------------|
| `layout`   | Template dạng bố cục cột (1 cột, 2 cột, ...)  |
| `freeform` | Template đặc biệt (Quiz, Flashcard, ...)       |

---

### `ITemplateSkeleton` — Cấu trúc xương sống slide

Đây là phần quan trọng nhất. Backend **chỉ lưu skeleton**, không lưu toàn bộ nội dung slide. Mục đích: tối ưu dung lượng (~300 bytes thay vì 1–5 KB cho full ICard).

```json
{
  "backgroundColor": "#ffffff",
  "contentAlignment": "center",
  "isVideoSlide": false,
  "children": [ ... ]
}
```

| Field              | Type                                   | Bắt buộc | Mô tả                                          |
|--------------------|----------------------------------------|----------|------------------------------------------------|
| `backgroundColor`  | `string (hex) \| null`                 | ❌       | Màu nền slide, ví dụ `"#f0f4ff"`              |
| `contentAlignment` | `"top" \| "center" \| "bottom" \| null` | ❌      | Căn chỉnh dọc của nội dung trong slide         |
| `isVideoSlide`     | `boolean \| null`                      | ❌       | Slide dành riêng cho video                     |
| `children`         | `(ISkeletonLayout \| ISkeletonBlock)[]` | ✅      | Các node con (layout hoặc block trực tiếp)     |

---

### `ISkeletonLayout` — Node layout trong skeleton

```json
{
  "type": "LAYOUT",
  "variant": "TWO_COLUMN",
  "gap": 4,
  "columnWidths": [50, 50],
  "children": [ ... ]
}
```

| Field          | Type                                    | Bắt buộc | Mô tả                                                  |
|----------------|-----------------------------------------|----------|--------------------------------------------------------|
| `type`         | `"LAYOUT"`                              | ✅       | Phân biệt với ISkeletonBlock (không có trường `type`)  |
| `variant`      | `LayoutVariant` (enum, xem bên dưới)    | ✅       | Dạng bố cục cột                                        |
| `gap`          | `number \| null`                        | ❌       | Khoảng cách giữa các cột (Tailwind spacing scale)      |
| `columnWidths` | `number[] \| null`                      | ❌       | Tỉ lệ % từng cột, tổng = 100. VD: `[40, 60]`          |
| `children`     | `(ISkeletonLayout \| ISkeletonBlock)[]` | ✅       | Các node con (có thể lồng layout)                      |

**`LayoutVariant` enum:**

| Giá trị          | Mô tả                         |
|------------------|-------------------------------|
| `SINGLE`         | 1 cột (mặc định)              |
| `TWO_COLUMN`     | 2 cột bằng nhau               |
| `THREE_COLUMN`   | 3 cột bằng nhau               |
| `SIDEBAR_LEFT`   | Sidebar trái hẹp, nội dung rộng |
| `SIDEBAR_RIGHT`  | Nội dung rộng, sidebar phải hẹp |
| `MASONRY`        | Masonry grid                  |

---

### `ISkeletonBlock` — Node block trong skeleton

```json
{
  "blockType": "HEADING",
  "meta": {
    "level": 1,
    "questionCount": null,
    "styles": { "aspectRatio": "16/9" },
    "isResizable": true
  }
}
```

> ⚠️ `ISkeletonBlock` **không có trường `type`** — để phân biệt với `ISkeletonLayout`, FE/BE nhận diện bằng sự vắng mặt của `"type": "LAYOUT"`.

| Field       | Type                   | Bắt buộc | Mô tả                              |
|-------------|------------------------|----------|------------------------------------|
| `blockType` | `BlockType` (enum)     | ✅       | Loại nội dung của block            |
| `meta`      | object (bên dưới)      | ❌       | Metadata tùy chọn theo loại block  |

**`meta` fields:**

| Field           | Type               | Áp dụng cho    | Mô tả                                            |
|-----------------|--------------------|----------------|--------------------------------------------------|
| `level`         | `1-6 \| null`      | `HEADING`      | Cấp độ heading (h1–h6)                           |
| `questionCount` | `number \| null`   | `QUIZ`         | Số câu hỏi sẽ được hydrate khi áp dụng template |
| `styles`        | object             | Mọi block      | Inline styles giữ lại (width, aspectRatio, ...)  |
| `isResizable`   | `boolean \| null`  | Mọi block      | Block có thể resize hay không                    |

**`BlockType` enum:**

| Giá trị      | Mô tả                        |
|--------------|------------------------------|
| `TEXT`       | Văn bản rich text (Tiptap)   |
| `HEADING`    | Tiêu đề                       |
| `IMAGE`      | Hình ảnh                      |
| `VIDEO`      | Video embed                   |
| `QUIZ`       | Quiz trắc nghiệm              |
| `FLASHCARD`  | Flashcard lật                 |
| `FILL_BLANK` | Điền vào chỗ trống            |
| `MATERIAL`   | Widget từ thư viện tài liệu   |

---

## Chi tiết từng endpoint

---

### 1. `GET /api/Template` — Lấy danh sách template

#### Request

- **Params:** Không có
- **Body:** Không có
- **Headers:** `Authorization: Bearer <token>` _(nếu yêu cầu đăng nhập)_

#### Response `200 OK`

```json
{
  "code": 200,
  "message": "Success",
  "result": [
    {
      "templateCode": "tpl_abc123",
      "name": "Hai cột cân bằng",
      "description": "Bố cục hai cột kích thước bằng nhau",
      "category": "layout",
      "skeleton": {
        "backgroundColor": null,
        "contentAlignment": "center",
        "isVideoSlide": false,
        "children": [
          {
            "type": "LAYOUT",
            "variant": "TWO_COLUMN",
            "gap": 4,
            "columnWidths": [50, 50],
            "children": [
              { "blockType": "TEXT", "meta": null },
              { "blockType": "IMAGE", "meta": { "isResizable": true } }
            ]
          }
        ]
      },
      "createdAt": "2026-04-08T10:00:00Z",
      "updatedAt": "2026-04-08T10:00:00Z"
    }
  ]
}
```

---

### 2. `GET /api/Template/{templateCode}` — Lấy chi tiết một template

#### Request

| Vị trí    | Tên            | Kiểu     | Bắt buộc | Mô tả                  |
|-----------|----------------|----------|----------|------------------------|
| Path Param | `templateCode` | `string` | ✅       | Mã template cần tra cứu |

#### Response `200 OK`

```json
{
  "code": 200,
  "message": "Success",
  "result": {
    "templateCode": "tpl_abc123",
    "name": "Hai cột cân bằng",
    "description": "...",
    "category": "layout",
    "skeleton": { ... },
    "createdAt": "2026-04-08T10:00:00Z",
    "updatedAt": "2026-04-08T10:00:00Z"
  }
}
```

#### Response `404 Not Found`

```json
{
  "code": 404,
  "message": "Template not found",
  "result": null
}
```

---

### 3. `POST /api/Template` — Tạo template mới

#### Request

- **Headers:** `Authorization: Bearer <token>` _(Admin only)_
- **Content-Type:** `application/json`

**Request Body:**

```json
{
  "name": "Tiêu đề + Nội dung",
  "category": "layout",
  "description": "Slide có tiêu đề lớn phía trên và văn bản bên dưới",
  "skeleton": {
    "backgroundColor": null,
    "contentAlignment": "top",
    "isVideoSlide": false,
    "children": [
      { "blockType": "HEADING", "meta": { "level": 1 } },
      { "blockType": "TEXT", "meta": null }
    ]
  }
}
```

| Field         | Kiểu                     | Bắt buộc | Validation                            |
|---------------|--------------------------|----------|---------------------------------------|
| `name`        | `string`                 | ✅       | Không rỗng, tối đa 200 ký tự         |
| `category`    | `"layout" \| "freeform"` | ✅       | Chỉ nhận 2 giá trị này               |
| `description` | `string`                 | ❌       | Tối đa 500 ký tự                     |
| `skeleton`    | `ITemplateSkeleton`      | ✅       | Không null, phải có `children` array |

#### Response `201 Created`

```json
{
  "code": 201,
  "message": "Template created successfully",
  "result": {
    "templateCode": "tpl_xyz789",
    "name": "Tiêu đề + Nội dung",
    "description": "Slide có tiêu đề lớn phía trên và văn bản bên dưới",
    "category": "layout",
    "skeleton": { ... },
    "createdAt": "2026-04-08T11:00:00Z",
    "updatedAt": "2026-04-08T11:00:00Z"
  }
}
```

#### Response lỗi

| HTTP Code | Trường hợp                  |
|-----------|-----------------------------|
| `400`     | Body không hợp lệ / thiếu field bắt buộc |
| `401`     | Chưa đăng nhập              |
| `403`     | Không phải Admin            |

---

### 4. `PUT /api/Template/{templateCode}` — Cập nhật template

#### Request

| Vị trí     | Tên            | Kiểu     | Bắt buộc |
|------------|----------------|----------|----------|
| Path Param | `templateCode` | `string` | ✅       |

- **Headers:** `Authorization: Bearer <token>` _(Admin only)_
- **Content-Type:** `application/json`

**Request Body:** _(giống POST, toàn bộ object — không dùng PATCH)_

```json
{
  "name": "Hai cột cân bằng (cập nhật)",
  "category": "layout",
  "description": "Đã cập nhật mô tả",
  "skeleton": {
    "backgroundColor": "#f0f4ff",
    "contentAlignment": "center",
    "isVideoSlide": false,
    "children": [
      {
        "type": "LAYOUT",
        "variant": "TWO_COLUMN",
        "gap": 6,
        "columnWidths": [40, 60],
        "children": [
          { "blockType": "IMAGE", "meta": { "isResizable": true } },
          { "blockType": "TEXT", "meta": null }
        ]
      }
    ]
  }
}
```

| Field         | Kiểu                     | Bắt buộc | Validation                            |
|---------------|--------------------------|----------|---------------------------------------|
| `name`        | `string`                 | ✅       | Không rỗng, tối đa 200 ký tự         |
| `category`    | `"layout" \| "freeform"` | ✅       | Chỉ nhận 2 giá trị này               |
| `description` | `string`                 | ❌       | Tối đa 500 ký tự                     |
| `skeleton`    | `ITemplateSkeleton`      | ✅       | Không null, phải có `children` array |

#### Response `200 OK`

```json
{
  "code": 200,
  "message": "Template updated successfully",
  "result": {
    "templateCode": "tpl_abc123",
    "name": "Hai cột cân bằng (cập nhật)",
    "description": "Đã cập nhật mô tả",
    "category": "layout",
    "skeleton": { ... },
    "createdAt": "2026-04-08T10:00:00Z",
    "updatedAt": "2026-04-08T12:30:00Z"
  }
}
```

#### Response lỗi

| HTTP Code | Trường hợp               |
|-----------|--------------------------|
| `400`     | Body không hợp lệ        |
| `401`     | Chưa đăng nhập           |
| `403`     | Không phải Admin         |
| `404`     | Template không tồn tại   |

---

### 5. `DELETE /api/Template/{templateCode}` — Xóa template

#### Request

| Vị trí     | Tên            | Kiểu     | Bắt buộc |
|------------|----------------|----------|----------|
| Path Param | `templateCode` | `string` | ✅       |

- **Headers:** `Authorization: Bearer <token>` _(Admin only)_
- **Body:** Không có

#### Response `204 No Content`

> Không trả về body. Hoặc nếu muốn đồng nhất envelope:

```json
{
  "code": 200,
  "message": "Template deleted successfully",
  "result": null
}
```

#### Response lỗi

| HTTP Code | Trường hợp               |
|-----------|--------------------------|
| `401`     | Chưa đăng nhập           |
| `403`     | Không phải Admin         |
| `404`     | Template không tồn tại   |

---

## Ví dụ `skeleton` hoàn chỉnh theo từng loại template

### Layout: Tiêu đề + 2 cột nội dung

```json
{
  "backgroundColor": null,
  "contentAlignment": "top",
  "isVideoSlide": false,
  "children": [
    { "blockType": "HEADING", "meta": { "level": 1 } },
    {
      "type": "LAYOUT",
      "variant": "TWO_COLUMN",
      "gap": 4,
      "columnWidths": [50, 50],
      "children": [
        { "blockType": "TEXT", "meta": null },
        { "blockType": "IMAGE", "meta": { "isResizable": true } }
      ]
    }
  ]
}
```

### Freeform: Slide Quiz

```json
{
  "backgroundColor": null,
  "contentAlignment": "center",
  "isVideoSlide": false,
  "children": [
    { "blockType": "HEADING", "meta": { "level": 2 } },
    { "blockType": "QUIZ", "meta": { "questionCount": 3 } }
  ]
}
```

### Freeform: Slide Flashcard

```json
{
  "backgroundColor": null,
  "contentAlignment": "center",
  "isVideoSlide": false,
  "children": [
    { "blockType": "FLASHCARD", "meta": null }
  ]
}
```

### Layout: Slide video toàn màn hình

```json
{
  "backgroundColor": "#000000",
  "contentAlignment": "center",
  "isVideoSlide": true,
  "children": [
    { "blockType": "VIDEO", "meta": { "isResizable": false } }
  ]
}
```

---

## Lưu ý cho Backend

1. **`templateCode`** nên là UUID v4 hoặc slug unique (không cho phép trùng). BE tự sinh, FE không gửi.
2. **`skeleton` là JSON object thuần** — lưu dạng `jsonb` (PostgreSQL) hoặc `nvarchar(max)` serialize JSON (SQL Server).
3. **Không validate sâu bên trong `skeleton`** — FE đã đảm bảo tính hợp lệ. BE chỉ cần kiểm tra: `skeleton != null` và `skeleton.children` là array.
4. **Phân biệt `ISkeletonLayout` vs `ISkeletonBlock`** trong skeleton dựa vào trường `type`: nếu có `"type": "LAYOUT"` → là layout; không có `type` → là block.
5. **`GET /api/Template`** nên trả về tất cả (không phân trang) vì số lượng template dự kiến nhỏ (< 100).
6. **Quyền truy cập:** Teacher và người dùng đã đăng nhập được phép `GET`. Chỉ Admin mới được `POST`, `PUT`, `DELETE`.
