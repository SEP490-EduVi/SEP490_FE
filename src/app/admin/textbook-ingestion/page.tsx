'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookText, Eye, FileText, Loader2, RefreshCw, Trash2, Upload, X } from 'lucide-react';
import { notify } from '@/components/common';
import {
  deleteTextbookNeo4j,
  getTextbookByCode,
  getTextbooks,
  uploadTextbook,
} from '@/services/textbookServices';
import type { TextbookDto } from '@/types/api';

const STATUS_TERMINAL = new Set([2, 3, 4]);

function StatusBadge({ doc }: { doc: TextbookDto }) {
  const name = doc.statusName ?? String(doc.status);
  if (doc.status === 2)
    return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">✓ {name}</span>;
  if (doc.status === 3 || doc.status === 4)
    return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-600">✗ {name}</span>;
  if (doc.status === 1)
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
        <Loader2 className="h-3 w-3 animate-spin" /> {name}
      </span>
    );
  return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-500">{name}</span>;
}

function FileDropZone({ file, accept, hint, onChange, onClear }: {
  file: File | null; accept: string; hint: string;
  onChange: (f: File) => void; onClear: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) onChange(f); }}
      className={`cursor-pointer select-none rounded-xl border-2 border-dashed p-5 text-center transition-all ${
        file ? 'border-teal-300 bg-teal-50' : 'border-gray-200 hover:border-teal-300 hover:bg-teal-50/40'
      }`}
    >
      {file ? (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-100">
            <FileText className="h-5 w-5 text-teal-600" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-medium text-teal-700">{file.name}</p>
            <p className="text-xs text-teal-400">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button type="button" onClick={(e) => { e.stopPropagation(); onClear(); }}
            className="flex-shrink-0 rounded-lg p-1.5 text-gray-400 transition-colors hover:text-red-500">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="py-1">
          <Upload className="mx-auto mb-2 h-7 w-7 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Kéo thả hoặc nhấn để chọn</p>
          <p className="mt-0.5 text-xs text-gray-400">{hint}</p>
        </div>
      )}
      <input ref={ref} type="file" accept={accept} className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onChange(f); }} />
    </div>
  );
}

const EMPTY_FORM = { SubjectCode: '', GradeCode: '', PublishYear: '', Publisher: '', Note: '' };
const labelInput = 'block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5';
const baseInput = 'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-teal-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-100';

const fmtDate = (s?: string | null) =>
  s ? new Date(new Date(s).getTime() + 7 * 60 * 60 * 1000).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

export default function TextbookIngestionPage() {
  const [docs, setDocs] = useState<TextbookDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [detailDoc, setDetailDoc] = useState<TextbookDto | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TextbookDto | null>(null);

  const parseApiMsg = (err: unknown, fallback: string) =>
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;

  const loadList = useCallback(async () => {
    setLoading(true); setError('');
    try { setDocs(await getTextbooks()); }
    catch (err) { setError(parseApiMsg(err, 'Không thể tải danh sách.')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadList(); }, [loadList]);
  useEffect(() => () => { if (pollingRef.current) clearInterval(pollingRef.current); }, []);

  const startPolling = (documentCode: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const updated = await getTextbookByCode(documentCode);
        setDetailDoc(updated);
        setDocs((prev) => prev.map((d) => (d.documentCode === documentCode ? updated : d)));
        if (STATUS_TERMINAL.has(updated.status)) { clearInterval(pollingRef.current!); pollingRef.current = null; }
      } catch { clearInterval(pollingRef.current!); pollingRef.current = null; }
    }, 3000);
  };

  const openDetail = (doc: TextbookDto) => {
    setDetailDoc(doc);
    if (!STATUS_TERMINAL.has(doc.status)) startPolling(doc.documentCode);
  };

  const closeDetail = () => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    setDetailDoc(null);
  };

  const closeUpload = () => { setUploadOpen(false); setForm(EMPTY_FORM); setFile(null); };

  const handleUpload = async () => {
    if (!form.SubjectCode.trim() || !form.GradeCode.trim()) {
      notify.error('Vui lòng nhập đầy đủ Mã môn và Mã khối/lớp.'); return;
    }
    if (!file) { notify.error('Vui lòng chọn file .pdf.'); return; }
    setBusy(true);
    try {
      const newDoc = await uploadTextbook({
        File: file,
        SubjectCode: form.SubjectCode.trim(),
        GradeCode: form.GradeCode.trim(),
        PublishYear: form.PublishYear ? Number(form.PublishYear) : undefined,
        Publisher: form.Publisher.trim() || undefined,
        Note: form.Note.trim() || undefined,
      });
      notify.success('Upload thành công. Đang xử lý...');
      closeUpload();
      setDocs((prev) => [newDoc, ...prev]);
      openDetail(newDoc);
    } catch (err) {
      notify.error(parseApiMsg(err, 'Upload thất bại.'));
    } finally { setBusy(false); }
  };

  const handleDeleteNeo4j = async () => {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      await deleteTextbookNeo4j(deleteTarget.documentCode);
      notify.success('Đã xóa khỏi Neo4j. Bản ghi DB được giữ lại.');
      setDeleteTarget(null);
      await loadList();
    } catch (err) {
      notify.error(parseApiMsg(err, 'Xóa khỏi Neo4j thất bại.'));
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-full bg-gray-50/60 p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BookText className="h-6 w-6 text-teal-600" />
            Sách giáo khoa
          </h1>
          <p className="mt-0.5 text-sm text-gray-500">Upload và theo dõi xử lý sách giáo khoa (.pdf)</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => void loadList()}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-colors">
            <RefreshCw className="h-4 w-4" /> Làm mới
          </button>
          <button onClick={() => setUploadOpen(true)}
            className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors">
            <Upload className="h-4 w-4" /> Upload sách giáo khoa
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <p className="text-sm font-semibold text-gray-700">
            Danh sách tài liệu
            <span className="ml-2 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-bold text-teal-600">{docs.length}</span>
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead>
              <tr className="bg-gray-50/70">
                {['Mã tài liệu', 'Tên file', 'Mã môn', 'Khối', 'Năm XB', 'NXB', 'Trạng thái', 'Ngày tạo', ''].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={9} className="py-16 text-center">
                  <Loader2 className="mx-auto h-6 w-6 animate-spin text-teal-400" />
                  <p className="mt-2 text-sm text-gray-400">Đang tải...</p>
                </td></tr>
              ) : docs.length === 0 ? (
                <tr><td colSpan={9} className="py-16 text-center">
                  <BookText className="mx-auto h-10 w-10 text-gray-200" />
                  <p className="mt-2 text-sm text-gray-400">Chưa có sách giáo khoa nào được upload.</p>
                </td></tr>
              ) : docs.map((doc) => (
                <tr key={doc.documentCode} className="hover:bg-teal-50/30 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs text-teal-600">{doc.documentCode}</td>
                  <td className="max-w-[200px] px-5 py-3.5">
                    <span className="truncate block font-medium text-gray-800" title={doc.originalFileName}>{doc.originalFileName}</span>
                  </td>
                  <td className="px-5 py-3.5"><span className="rounded-lg bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">{doc.subjectCode}</span></td>
                  <td className="px-5 py-3.5"><span className="rounded-lg bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700">{doc.gradeCode}</span></td>
                  <td className="px-5 py-3.5 text-gray-600">{doc.publishYear ?? '—'}</td>
                  <td className="max-w-[120px] px-5 py-3.5 text-xs text-gray-500 truncate">{doc.publisher ?? '—'}</td>
                  <td className="px-5 py-3.5"><StatusBadge doc={doc} /></td>
                  <td className="px-5 py-3.5 text-xs text-gray-400">{fmtDate(doc.createdAt)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openDetail(doc)}
                        className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-600 shadow-sm hover:border-teal-300 hover:text-teal-600 transition-colors">
                        <Eye className="h-3.5 w-3.5" /> Xem
                      </button>
                      <button onClick={() => setDeleteTarget(doc)}
                        className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-500 shadow-sm hover:border-red-300 hover:text-red-600 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" /> Neo4j
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload modal */}
      <AnimatePresence>
        {uploadOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeUpload} />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h2 className="text-base font-bold text-gray-900">Upload sách giáo khoa</h2>
                <button onClick={closeUpload} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="space-y-4 p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelInput}>Mã môn học *</label>
                    <input type="text" className={baseInput} placeholder="VD: MATH" maxLength={50}
                      value={form.SubjectCode} onChange={(e) => setForm((f) => ({ ...f, SubjectCode: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelInput}>Mã khối / lớp *</label>
                    <input type="text" className={baseInput} placeholder="VD: G10" maxLength={10}
                      value={form.GradeCode} onChange={(e) => setForm((f) => ({ ...f, GradeCode: e.target.value }))} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelInput}>Năm xuất bản</label>
                    <input type="number" className={baseInput} placeholder="VD: 2024"
                      value={form.PublishYear} onChange={(e) => setForm((f) => ({ ...f, PublishYear: e.target.value }))} />
                  </div>
                  <div>
                    <label className={labelInput}>Nhà xuất bản</label>
                    <input type="text" className={baseInput} placeholder="(tuỳ chọn)"
                      value={form.Publisher} onChange={(e) => setForm((f) => ({ ...f, Publisher: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label className={labelInput}>Ghi chú</label>
                  <textarea className={`${baseInput} resize-none`} rows={2} placeholder="(tuỳ chọn)"
                    value={form.Note} onChange={(e) => setForm((f) => ({ ...f, Note: e.target.value }))} />
                </div>
                <div>
                  <label className={labelInput}>File sách giáo khoa (.pdf) *</label>
                  <FileDropZone file={file} accept=".pdf,application/pdf"
                    hint="Chỉ chấp nhận file .pdf" onChange={setFile} onClear={() => setFile(null)} />
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
                <button onClick={closeUpload}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Hủy
                </button>
                <button disabled={busy} onClick={() => void handleUpload()}
                  className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-5 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 transition-colors">
                  {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang upload...</> : <><Upload className="h-4 w-4" /> Upload</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detail modal */}
      <AnimatePresence>
        {detailDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeDetail} />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <h2 className="text-base font-bold text-gray-900">Chi tiết sách giáo khoa</h2>
                <div className="flex items-center gap-2">
                  {!STATUS_TERMINAL.has(detailDoc.status) && (
                    <span className="flex items-center gap-1 text-xs text-amber-600">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang cập nhật...
                    </span>
                  )}
                  <button onClick={closeDetail} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ['Mã tài liệu', detailDoc.documentCode],
                    ['Mã môn', detailDoc.subjectCode],
                    ['Mã khối', detailDoc.gradeCode],
                    ['Năm XB', detailDoc.publishYear ? String(detailDoc.publishYear) : '—'],
                  ] as [string, string][]).map(([k, v]) => (
                    <div key={k} className="rounded-xl bg-gray-50 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{k}</p>
                      <p className="text-sm font-medium text-gray-800 break-all">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Tên file</p>
                  <p className="text-sm font-medium text-gray-800 break-all">{detailDoc.originalFileName}</p>
                </div>
                {detailDoc.publisher && (
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Nhà xuất bản</p>
                    <p className="text-sm font-medium text-gray-800">{detailDoc.publisher}</p>
                  </div>
                )}
                <div className="rounded-xl bg-gray-50 p-3 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Trạng thái</p>
                  <StatusBadge doc={detailDoc} />
                </div>
                {detailDoc.errorMessage && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-red-400 mb-1">Lỗi xử lý</p>
                    <p className="text-sm text-red-700">{detailDoc.errorMessage}</p>
                  </div>
                )}
                {detailDoc.warning && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-500 mb-1">Cảnh báo</p>
                    <p className="text-sm text-amber-700">{detailDoc.warning}</p>
                  </div>
                )}
                {detailDoc.createdAt && (
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">Ngày tạo</p>
                    <p className="text-sm text-gray-700">{fmtDate(detailDoc.createdAt)}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete confirm */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteTarget(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl">
              <div className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Xóa khỏi Neo4j?</h3>
                <p className="text-sm text-gray-600 mb-1">
                  Dữ liệu đồ thị của <span className="font-semibold text-gray-900">{deleteTarget.originalFileName}</span> sẽ bị xóa khỏi Neo4j.
                </p>
                <p className="text-xs text-gray-400">Bản ghi trong database vẫn được giữ lại để kiểm toán.</p>
              </div>
              <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
                <button onClick={() => setDeleteTarget(null)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Hủy
                </button>
                <button disabled={busy} onClick={() => void handleDeleteNeo4j()}
                  className="flex items-center gap-1.5 rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                  {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang xóa...</> : <><Trash2 className="h-4 w-4" /> Xóa Neo4j</>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
