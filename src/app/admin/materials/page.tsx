'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, Eye, FileText, Loader2, Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-react';
import Pagination from '@/components/admin/Pagination';
import { GcsImage, resolveGcsUrl } from '@/components/common/GcsImage';
import { uploadMaterialFilesToGcs } from '@/services/gcsServices';
import { useSubjects, useGrades } from '@/hooks/useMetadataApi';
import type { SubjectDto, GradeDto } from '@/types/api';
import { notify } from '@/components/common';
import { adminServices } from '@/services/adminServices';
import {
  AdminCreateMaterialRequest,
  AdminMaterialResponse,
  AdminUpdateMaterialRequest,
} from '@/types/admin';
import { MATERIAL_TYPE_OPTIONS, APPROVAL_STATUS_MAP } from '@/components/expert';

// ─── constants ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 8;

const APPROVAL_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: '0', label: 'Chờ duyệt' },
  { value: '1', label: 'Đã duyệt' },
  { value: '2', label: 'Từ chối' },
  { value: '3', label: 'Bị cấm' },
];

const TYPE_FILTER_OPTIONS = [
  { value: '', label: 'Tất cả loại' },
  ...MATERIAL_TYPE_OPTIONS,
];

// ─── helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (s?: string | null) =>
  s ? new Date(new Date(s).getTime() + 7 * 60 * 60 * 1000).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '–';

const fmtPrice = (n: number) =>
  n === 0 ? 'Miễn phí' : n.toLocaleString('vi-VN') + ' EduCoin';

function ApprovalBadge({ status }: { status: number }) {
  const cfg = APPROVAL_STATUS_MAP[status] ?? APPROVAL_STATUS_MAP[0];
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const label = MATERIAL_TYPE_OPTIONS.find(o => o.value === type)?.label ?? type;
  const colors: Record<string, string> = {
    image: 'bg-blue-50 text-blue-700',
    video: 'bg-purple-50 text-purple-700',
    other: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${colors[type] ?? 'bg-gray-100 text-gray-600'}`}>
      {label}
    </span>
  );
}

// ─── FileDropZone ──────────────────────────────────────────────────────────────
function FileDropZone({
  label, accept, file, onChange, onClear, hint, accent = 'blue',
}: {
  label: string; accept?: string; file: File | null;
  onChange: (f: File) => void; onClear: () => void; hint?: string; accent?: 'blue' | 'emerald';
}) {
  const ref = useRef<HTMLInputElement>(null);
  const c = accent === 'emerald'
    ? { active: 'border-emerald-300 bg-emerald-50', icon: 'text-emerald-600', bg: 'bg-emerald-100', text: 'text-emerald-700', sub: 'text-emerald-400' }
    : { active: 'border-blue-300 bg-blue-50',       icon: 'text-blue-600',    bg: 'bg-blue-100',    text: 'text-blue-700',    sub: 'text-blue-400' };
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      <div
        onClick={() => ref.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onChange(f); }}
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all select-none ${file ? c.active : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/40'}`}
      >
        {file ? (
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${c.bg}`}>
              {file.type.startsWith('image/')
                ? <img src={URL.createObjectURL(file)} alt="" className="w-9 h-9 rounded-lg object-cover" />
                : <FileText className={`w-4 h-4 ${c.icon}`} />}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className={`text-sm font-medium truncate ${c.text}`}>{file.name}</p>
              <p className={`text-xs ${c.sub}`}>{(file.size / 1024).toFixed(0)} KB</p>
            </div>
            <button type="button" onClick={e => { e.stopPropagation(); onClear(); }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="py-2">
            <Upload className="w-7 h-7 text-gray-300 mx-auto mb-1.5" />
            <p className="text-sm font-medium text-gray-600">Kéo thả hoặc nhấn để chọn</p>
            {hint && <p className="text-xs text-gray-400 mt-0.5">{hint}</p>}
          </div>
        )}
        <input ref={ref} type="file" accept={accept} onChange={e => { const f = e.target.files?.[0]; if (f) onChange(f); }} className="hidden" />
      </div>
    </div>
  );
}

// ─── ViewModal ────────────────────────────────────────────────────────────────
function ViewModal({ item, onClose }: { item: AdminMaterialResponse; onClose: () => void }) {
  const [resolvedUrl, setResolvedUrl] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    if (!item.resourceUrl) return;
    setResolving(true);
    resolveGcsUrl(item.resourceUrl).then(setResolvedUrl).catch(() => {}).finally(() => setResolving(false));
  }, [item.resourceUrl]);

  const previewKind = (() => {
    const src = (resolvedUrl || item.resourceUrl || '').toLowerCase();
    if (item.type === 'video' || /\.(mp4|webm|ogg|mov)(\?|$)/.test(src)) return 'video';
    if (item.type === 'image' || /\.(png|jpg|jpeg|gif|webp|svg)(\?|$)/.test(src)) return 'image';
    return 'other';
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col md:flex-row"
      >
        {/* left – media */}
        <div className="md:w-[42%] flex-shrink-0 bg-gray-900 flex flex-col">
          <div className="relative flex-1 min-h-[220px] bg-gradient-to-br from-purple-900/60 to-gray-900 flex items-center justify-center">
            {item.previewUrl
              ? <GcsImage src={item.previewUrl} alt={item.title} className="w-full h-full object-cover opacity-80" />
              : <BookOpen className="w-16 h-16 text-white/20" />}
            <button onClick={onClose}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors z-10">
              <X className="w-4 h-4" />
            </button>
          </div>
          {resolving && (
            <div className="p-4 flex items-center justify-center gap-2 text-white/60 text-xs">
              <Loader2 className="w-4 h-4 animate-spin" /> Đang tải xem trước...
            </div>
          )}
          {!resolving && resolvedUrl && (
            <div className="p-3 border-t border-white/10">
              {previewKind === 'image' && <img src={resolvedUrl} alt={item.title} className="w-full max-h-52 object-contain rounded-lg bg-black" />}
              {previewKind === 'video' && <video controls src={resolvedUrl} className="w-full max-h-52 rounded-lg bg-black" />}
              {previewKind === 'other' && (
                <a href={resolvedUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 text-xs font-semibold transition-colors">
                  <FileText className="w-4 h-4" /> Mở tài nguyên
                </a>
              )}
            </div>
          )}
        </div>

        {/* right – info */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 flex-1 overflow-y-auto space-y-5">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <TypeBadge type={item.type} />
                <ApprovalBadge status={item.approvalStatus} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">{item.title}</h2>
              <p className="text-xs font-mono text-gray-400 mt-1">{item.materialCode}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {([
                ['Giá', fmtPrice(item.price)],
                ['Ngày tạo', fmtDate(item.createdAt)],
                ['Môn học', item.subjectName ?? item.subjectCode ?? '–'],
                ['Khối lớp', item.gradeName ?? item.gradeCode ?? '–'],
                ['Expert', item.expertCode ? `${item.expertName ?? ''} (${item.expertCode})` : 'Admin'],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{k}</p>
                  <p className="font-medium text-gray-800 break-words text-sm">{v}</p>
                </div>
              ))}
            </div>
            {item.rejectionReason && (
              <div className="rounded-xl bg-red-50 border border-red-100 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-1">Lý do từ chối</p>
                <p className="text-red-700 text-sm">{item.rejectionReason}</p>
              </div>
            )}
            {item.description && (
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">Mô tả</p>
                <p className="text-gray-700 text-sm leading-relaxed">{item.description}</p>
              </div>
            )}
            {item.resourceUrl && (
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-1">URL Tài nguyên</p>
                <p className="text-blue-600 break-all text-xs font-mono">{item.resourceUrl}</p>
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
            <button onClick={onClose}
              className="px-5 py-2 rounded-xl bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-colors">
              Đóng
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── MaterialFormModal ────────────────────────────────────────────────────────
function MaterialFormModal({
  mode, initial, subjects, grades, onClose, onSaved,
}: {
  mode: 'create' | 'edit';
  initial: AdminMaterialResponse | null;
  subjects: SubjectDto[];
  grades: GradeDto[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title:           initial?.title           ?? '',
    description:     initial?.description     ?? '',
    type:            initial?.type            ?? 'image',
    price:           initial?.price           ?? 0,
    subjectCode:     initial?.subjectCode     ?? '',
    gradeCode:       initial?.gradeCode       ?? '',
    expertCode:      initial?.expertCode      ?? '',
    approvalStatus:  initial?.approvalStatus  ?? 1,
    rejectionReason: initial?.rejectionReason ?? '',
  });
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [previewFile,  setPreviewFile]  = useState<File | null>(null);
  const [uploading, setUploading]       = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const set = (k: string) => (v: string | number) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.title.trim())                    { setError('Vui lòng nhập tiêu đề.'); return; }
    if (mode === 'create' && !resourceFile)    { setError('Vui lòng chọn tệp tài nguyên.'); return; }
    setError(null); setUploading(true);
    try {
      let resourceUrl = initial?.resourceUrl ?? '';
      let previewUrl  = initial?.previewUrl  ?? '';
      if (resourceFile) {
        const gcs = await uploadMaterialFilesToGcs({
          file: resourceFile, previewFile: previewFile ?? undefined,
          prefix: form.subjectCode || 'admin-material',
        });
        resourceUrl = gcs.resourceUrl;
        if (gcs.previewUrl) previewUrl = gcs.previewUrl;
      } else if (previewFile) {
        const gcs = await uploadMaterialFilesToGcs({ file: previewFile, prefix: form.subjectCode || 'admin-preview' });
        previewUrl = gcs.resourceUrl;
      }
      const base = {
        title: form.title.trim(),
        description: form.description?.trim() || undefined,
        type: form.type, price: form.price,
        subjectCode: form.subjectCode?.trim() || undefined,
        gradeCode: form.gradeCode?.trim() || undefined,
        expertCode: form.expertCode?.trim() || undefined,
        approvalStatus: form.approvalStatus,
        rejectionReason: (form.approvalStatus === 2 || form.approvalStatus === 3) ? (form.rejectionReason?.trim() || undefined) : undefined,
      };
      if (mode === 'create') {
        await adminServices.createAdminMaterial({ ...base, resourceUrl, previewUrl: previewUrl || undefined } as AdminCreateMaterialRequest);
        notify.success('Tạo học liệu thành công.');
      } else {
        await adminServices.updateAdminMaterial(initial!.materialCode, { ...base, resourceUrl: resourceUrl || undefined, previewUrl: previewUrl || undefined } as AdminUpdateMaterialRequest);
        notify.success('Cập nhật học liệu thành công.');
      }
      onSaved();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg ?? (mode === 'create' ? 'Tạo học liệu thất bại.' : 'Cập nhật thất bại.'));
    } finally { setUploading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {mode === 'create' ? 'Tạo học liệu mới' : 'Chỉnh sửa học liệu'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* body – 2 columns */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            {/* col left: files */}
            <div className="p-6 space-y-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Tệp &amp; Ảnh</p>
              <FileDropZone label="Tệp tài nguyên *" file={resourceFile}
                onChange={f => setResourceFile(f)} onClear={() => setResourceFile(null)}
                hint="PDF, JPG, PNG, MP4 · Tối đa 50 MB" accent="blue" />
              <FileDropZone label="Ảnh xem trước (tùy chọn)" accept="image/*" file={previewFile}
                onChange={f => setPreviewFile(f)} onClear={() => setPreviewFile(null)}
                hint="JPG, PNG, GIF · Tối đa 5 MB" accent="emerald" />
              {initial?.previewUrl && !previewFile && (
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Ảnh hiện tại</p>
                  <div className="w-full h-28 rounded-xl overflow-hidden bg-gray-100">
                    <GcsImage src={initial.previewUrl} alt={initial.title} className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                  Mã Expert <span className="normal-case font-normal">(để trống nếu admin tạo)</span>
                </label>
                <input value={form.expertCode} onChange={e => set('expertCode')(e.target.value)}
                  placeholder="EXPERT000001"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400" />
              </div>
            </div>

            {/* col right: metadata */}
            <div className="p-6 space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Thông tin</p>
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{error}</div>}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Tiêu đề <span className="text-red-500">*</span></label>
                <input value={form.title} onChange={e => set('title')(e.target.value)}
                  placeholder="Nhập tiêu đề học liệu..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Loại <span className="text-red-500">*</span></label>
                  <select value={form.type} onChange={e => set('type')(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white">
                    {MATERIAL_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Giá (EduCoin)</label>
                  <input type="number" min={0} value={form.price} onChange={e => set('price')(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Môn học</label>
                  <select value={form.subjectCode} onChange={e => set('subjectCode')(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white">
                    <option value="">– Chọn môn –</option>
                    {subjects.map(s => <option key={s.subjectCode} value={s.subjectCode}>{s.subjectName}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Khối lớp</label>
                  <select value={form.gradeCode} onChange={e => set('gradeCode')(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white">
                    <option value="">– Chọn lớp –</option>
                    {grades.map(g => <option key={g.gradeCode} value={g.gradeCode}>{g.gradeName}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Trạng thái duyệt</label>
                <select value={form.approvalStatus} onChange={e => set('approvalStatus')(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white">
                  <option value={0}>Chờ duyệt</option>
                  <option value={1}>Đã duyệt</option>
                  <option value={2}>Từ chối</option>
                  <option value={3}>Bị cấm</option>
                </select>
              </div>
              {(form.approvalStatus === 2 || form.approvalStatus === 3) && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                    {form.approvalStatus === 3 ? 'Lý do bị cấm' : 'Lý do từ chối'}
                  </label>
                  <input value={form.rejectionReason} onChange={e => set('rejectionReason')(e.target.value)}
                    placeholder="Nhập lý do..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
                </div>
              )}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">Mô tả</label>
                <textarea value={form.description} onChange={e => set('description')(e.target.value)}
                  rows={3} placeholder="Mô tả ngắn về học liệu..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none" />
              </div>
            </div>
          </div>
        </div>

        {/* footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          {uploading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              {resourceFile ? 'Đang tải lên GCS...' : 'Đang lưu...'}
            </div>
          )}
          <div className="flex gap-3 ml-auto">
            <button onClick={onClose} disabled={uploading}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50">
              Huỷ
            </button>
            <button onClick={handleSubmit} disabled={uploading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl disabled:opacity-50 transition-colors">
              {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'create' ? 'Tạo học liệu' : 'Lưu thay đổi'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────
export default function AdminMaterialsPage() {
  const { data: subjects = [] } = useSubjects();
  const { data: grades = [] }   = useGrades();

  const [activeTab, setActiveTab] = useState<0 | 1>(0);

  const [allRows, setAllRows]   = useState<AdminMaterialResponse[]>([]);
  const [expertPage, setExpertPage] = useState(1);
  const [adminPage, setAdminPage]   = useState(1);
  const [loading, setLoading]       = useState(false);

  const [search, setSearch]             = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType]     = useState('');

  const [viewItem, setViewItem]     = useState<AdminMaterialResponse | null>(null);
  const [editItem, setEditItem]     = useState<AdminMaterialResponse | null>(null);
  const [deleteCode, setDeleteCode] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      let accumulated: AdminMaterialResponse[] = [];
      let page = 1;
      const pageSize = 50;
      while (true) {
        const res = await adminServices.listAdminMaterials({
          search: search.trim() || undefined,
          approvalStatus: filterStatus !== '' ? Number(filterStatus) : undefined,
          type: filterType || undefined,
          page, pageSize,
        });
        const result = res.result as Record<string, unknown>;
        const items = (result?.items ?? result?.data ?? []) as AdminMaterialResponse[];
        accumulated = [...accumulated, ...items];
        const total = (result?.totalCount ?? result?.total ?? result?.totalItems ?? 0) as number;
        if (items.length < pageSize || accumulated.length >= total) break;
        page++;
      }
      setAllRows(accumulated);
    } catch { notify.error('Không thể tải học liệu.'); }
    finally { setLoading(false); }
  }, [search, filterStatus, filterType]);

  useEffect(() => { setExpertPage(1); setAdminPage(1); }, [search, filterStatus, filterType, activeTab]);
  useEffect(() => { void fetchAll(); }, [fetchAll]);

  const expertRows     = allRows.filter(m => !!m.expertCode);
  const adminRows      = allRows.filter(m => !m.expertCode);
  const currentRows    = activeTab === 0 ? expertRows : adminRows;
  const currentPage    = activeTab === 0 ? expertPage : adminPage;
  const setCurrentPage = activeTab === 0 ? setExpertPage : setAdminPage;
  const pagedRows      = currentRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const reload = useCallback(() => { void fetchAll(); }, [fetchAll]);

  const handleDelete = async () => {
    if (!deleteCode) return;
    setDeleting(true);
    try {
      await adminServices.deleteAdminMaterial(deleteCode);
      notify.success('Đã xóa học liệu.');
      setDeleteCode(null);
      reload();
    } catch { notify.error('Không thể xóa học liệu.'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Học liệu</h1>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl shadow-lg shadow-purple-600/20 transition-colors">
          <Plus className="w-4 h-4" /> Tạo học liệu mới
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm theo tiêu đề, mã, tên expert..."
            className="w-full pl-9 pr-9 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400" />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white">
          {APPROVAL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-white">
          {TYPE_FILTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {/* Tabs + Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {([
            { label: 'Học liệu Expert', count: expertRows.length, value: 0 },
            { label: 'Học liệu Admin',  count: adminRows.length,  value: 1 },
          ] as const).map(tab => (
            <button key={tab.value} onClick={() => setActiveTab(tab.value)}
              className={`px-6 py-4 text-sm font-semibold transition-colors border-b-2 -mb-px flex items-center gap-2 ${
                activeTab === tab.value ? 'text-purple-700 border-purple-600' : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}>
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === tab.value ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Học liệu</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Loại</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Giá</th>
                    {activeTab === 0 && <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Expert</th>}
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Môn / Lớp</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Trạng thái</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Ngày tạo</th>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {currentRows.length === 0 ? (
                    <tr>
                      <td colSpan={activeTab === 0 ? 8 : 7} className="px-4 py-16 text-center">
                        <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                        <p className="text-sm text-gray-400">Không có học liệu nào.</p>
                      </td>
                    </tr>
                  ) : pagedRows.map(m => (
                    <tr key={m.materialCode} className="hover:bg-purple-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {m.previewUrl
                              ? <GcsImage src={m.previewUrl} alt={m.title} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center"><BookOpen className="w-4 h-4 text-gray-300" /></div>}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 truncate max-w-[200px]">{m.title}</p>
                            <p className="text-[11px] text-gray-400 font-mono">{m.materialCode}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><TypeBadge type={m.type} /></td>
                      <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">{fmtPrice(m.price)}</td>
                      {activeTab === 0 && <td className="px-4 py-3 text-sm text-gray-600">{m.expertName ?? '–'}</td>}
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {m.subjectName ?? m.subjectCode ?? '–'}
                        {m.gradeName || m.gradeCode ? ` / ${m.gradeName ?? m.gradeCode}` : ''}
                      </td>
                      <td className="px-4 py-3"><ApprovalBadge status={m.approvalStatus} /></td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{fmtDate(m.createdAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setViewItem(m)} title="Xem chi tiết"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditItem(m)} title="Chỉnh sửa"
                            className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteCode(m.materialCode)} title="Xóa"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {currentRows.length > PAGE_SIZE && (
              <div className="px-4 py-3 border-t border-gray-100">
                <Pagination page={currentPage} pageSize={PAGE_SIZE} total={currentRows.length} onChange={setCurrentPage} />
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {viewItem && <ViewModal item={viewItem} onClose={() => setViewItem(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showCreate && (
          <MaterialFormModal mode="create" initial={null} subjects={subjects} grades={grades}
            onClose={() => setShowCreate(false)}
            onSaved={() => { setShowCreate(false); setExpertPage(1); setAdminPage(1); void fetchAll(); }} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editItem && (
          <MaterialFormModal mode="edit" initial={editItem} subjects={subjects} grades={grades}
            onClose={() => setEditItem(null)}
            onSaved={() => { setEditItem(null); reload(); }} />
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteCode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteCode(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6 space-y-4"
            >
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-bold text-gray-900">Xác nhận xóa</h3>
                <p className="text-sm text-gray-500 mt-1">Bạn có chắc muốn xóa học liệu này không?</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteCode(null)} disabled={deleting}
                  className="flex-1 py-2 text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors">
                  Huỷ
                </button>
                <button onClick={handleDelete} disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-xl disabled:opacity-50 transition-colors">
                  {deleting && <Loader2 className="w-4 h-4 animate-spin" />} Xóa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}