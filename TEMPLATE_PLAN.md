# Plan: Admin Template Builder + Editor Integration (lưu BE)

> **Trạng thái:** Đang chỉnh sửa — chưa bắt đầu implement

## TL;DR

Admin thiết kế template trên một trang editor riêng (slide trắng, đầy đủ block editing như teacher editor). Lưu `ICard` JSON xuống BE. Teacher mở "Bố cục nhanh" → tab mới → apply template (re-ID). **Không chạm `addCardFromTemplate()` hay built-in templates.**

---

## Phase 1 — Nền tảng

1. **`src/types/api.ts`** — thêm interface:
   - `ICardTemplate { templateCode, name, description?, type: 'template'|'freeform', content: ICard, createdAt }`

2. **`src/constants/apiEndpoints.ts`** — thêm `buildTemplateEndpoint` + `TEMPLATE` section:
   - `GET_ALL` → GET `/api/Template`
   - `GET_BY_CODE(code)` → GET `/api/Template/{code}`
   - `CREATE` → POST `/api/Template`
   - `UPDATE(code)` → PUT `/api/Template/{code}`
   - `DELETE(code)` → DELETE `/api/Template/{code}`

3. **`src/hooks/useTemplateApi.ts`** (NEW) — theo pattern `useProjectApi.ts`:
   - `useAdminTemplates()` — GET_ALL
   - `useCreateTemplate()` — mutation POST, invalidates `['templates']`
   - `useUpdateTemplate()` — mutation PUT
   - `useDeleteTemplate()` — mutation DELETE, invalidates `['templates']`

---

## Phase 2 — Re-ID utility + store action

4. **`src/store/helpers/rehydrateTemplate.ts`** (NEW) — deep clone `ICard`, walk toàn bộ `card → layout → block`, thay mỗi `id` bằng `uuidv4()` mới. Giữ nguyên `content`, `type`, `variant`, `children`.

5. **`src/store/actions/cardActions.ts`** — thêm `addCardFromCustomTemplate(card: ICard)`:
   - Gọi `rehydrateTemplate(card)` → ICard với fresh IDs
   - Add vào `document.cards` qua `setDocumentWithHistory` (pattern giống `addCard`)

---

## Phase 3 — Admin Pages

6. **`src/app/admin/templates/page.tsx`** (NEW) — theo pattern `admin/packages/page.tsx`:
   - Table: Tên | Loại (template/freeform) | Mô tả | Ngày tạo | Hành động
   - "Tạo mới" → modal chọn loại → `router.push('/admin/templates/editor?type=...')`
   - "Sửa" → `router.push('/admin/templates/editor?templateCode=xxx')`
   - "Xóa" → confirm modal → `useDeleteTemplate()`

7. **`src/app/admin/templates/editor/page.tsx`** (NEW) — template builder:
   - Custom header bar (KHÔNG dùng `Toolbar`): `← Quay lại` | input tên template | badge loại | nút `Lưu Template`
   - Insert row: `Tiêu đề / Văn bản / Hình ảnh / Video` buttons (gọi store actions trực tiếp)
   - Body: `DndContext` + `MainStage` + `Sidebar` — giống `teacher/editor/page.tsx`
   - Mount: nếu có `templateCode` → `useGetTemplate(code)` → `setDocument`; nếu không → blank doc với 1 card
   - Lưu: lấy `activeCard` từ store → `useCreateTemplate()` hoặc `useUpdateTemplate()` → redirect `/admin/templates`

8. **`src/app/admin/layout.tsx`** — thêm nav item:
   - `{ href: '/admin/templates', label: 'Mẫu bình chiếu', icon: LayoutTemplate }`

---

## Phase 4 — Teacher Integration

9. **`src/components/sidebar/MaterialSidebar.tsx`** — thêm tab **"Quản trị"** trong `QuickLayoutSection` modal:
   - `useAdminTemplates()` để fetch
   - Mỗi item: tên + badge loại
   - Click → `addCardFromCustomTemplate(template.content)`
   - Rỗng → text "Admin chưa tạo template nào"

---

## Relevant Files

| File | Thay đổi |
|------|----------|
| `src/types/api.ts` | Thêm `ICardTemplate` |
| `src/constants/apiEndpoints.ts` | Thêm `TEMPLATE` section |
| `src/hooks/useTemplateApi.ts` | **NEW** |
| `src/store/helpers/rehydrateTemplate.ts` | **NEW** |
| `src/store/actions/cardActions.ts` | Thêm `addCardFromCustomTemplate` |
| `src/app/admin/templates/page.tsx` | **NEW** — CRUD list |
| `src/app/admin/templates/editor/page.tsx` | **NEW** — template builder |
| `src/app/admin/layout.tsx` | Thêm nav item |
| `src/components/sidebar/MaterialSidebar.tsx` | Thêm tab "Quản trị" |

---

## Backend API Contract

```
GET    /api/Template                → ICardTemplate[]
GET    /api/Template/{templateCode} → ICardTemplate
POST   /api/Template                body: { name, type, description?, content: ICard }
PUT    /api/Template/{templateCode} body: { name, type, description?, content: ICard }
DELETE /api/Template/{templateCode} → 204
```

---

## Verification

1. Admin tạo mới → editor mở với 1 slide trắng
2. Thêm Heading + Text block → Lưu → POST `/api/Template` với `content` = ICard JSON
3. Redirect về list → template mới xuất hiện
4. Sửa → editor load lại đúng nội dung cũ
5. Teacher mở "Bố cục nhanh" → tab "Quản trị" → thấy template → click → slide mới có đúng layout, toàn bộ node có ID mới
6. Xóa → template biến mất khỏi cả admin list lẫn teacher modal

---

## Decisions

- Template builder reuse `MainStage` + `Sidebar` + `DndContext`, nhưng có header riêng (không dùng `Toolbar`)
- `type: 'template' | 'freeform'` chọn 1 lần khi tạo, không đổi sau
- Content lưu là `activeCard` JSON (card đang active lúc nhấn Lưu)
- Re-ID toàn bộ node khi teacher apply (tránh duplicate UUID trong document)
- Phase 4 có thể làm sau Phase 3 nếu cần demo admin trước

---

## Ghi chú chỉnh sửa plan

> _Điền vào đây những điểm cần thay đổi..._
