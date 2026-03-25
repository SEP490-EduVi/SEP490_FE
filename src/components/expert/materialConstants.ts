// Shared constants for expert material components
export const MATERIAL_TYPE_OPTIONS = [
  { value: 'image', label: 'Hình ảnh' },
  { value: 'video',    label: 'Video' },
  { value: 'other',    label: 'Khác' },
];

export const APPROVAL_STATUS_MAP: Record<number, { label: string; color: string }> = {
  0: { label: 'Chờ duyệt', color: 'bg-amber-50 text-amber-700' },
  1: { label: 'Đã duyệt',  color: 'bg-emerald-50 text-emerald-700' },
  2: { label: 'Từ chối',   color: 'bg-red-50 text-red-700' },
};
