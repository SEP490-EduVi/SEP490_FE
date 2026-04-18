'use client';

import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  GraduationCap,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
  X,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import AppHeader from '@/components/sidebar/AppHeader';
import { notify } from '@/components/common';
import { Pagination } from '@/components/paging';
import {
  useClassrooms,
  useClassroom,
  useCreateClassroom,
  useUpdateClassroom,
  useDeleteClassroom,
  useImportStudents,
} from '@/hooks/useClassroomApi';
import type { ClassroomDto } from '@/services/classroomServices';

const PAGE_SIZE = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (iso: string) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN') : '—';



// ─── ClassroomCard ─────────────────────────────────────────────────────────────
function ClassroomCard({
  classroom,
  index,
  onOpen,
  onEdit,
  onDelete,
}: {
  classroom: ClassroomDto;
  index: number;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const colors = [
    'from-blue-500 to-blue-600',
    'from-violet-500 to-violet-600',
    'from-emerald-500 to-emerald-600',
    'from-amber-500 to-amber-600',
    'from-rose-500 to-rose-600',
    'from-cyan-500 to-cyan-600',
  ];
  const grad = colors[index % colors.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.04 }}
      className="group relative bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
      onClick={onOpen}
    >
      {/* Color bar */}
      <div className={`h-2 bg-gradient-to-r ${grad}`} />

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center flex-shrink-0 shadow-sm`}>
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{classroom.description}</p>
            </div>
          </div>

          {/* Menu */}
          <div
            className="relative flex-shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-8 z-20 w-40 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onEdit(); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Chỉnh sửa
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); onDelete(); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Xóa lớp
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Users className="w-3.5 h-3.5" />
            <span>{classroom.studentCount} học sinh</span>
          </div>
          <span className="text-gray-200">·</span>
          <span className="text-xs text-gray-400">Tạo {formatDate(classroom.createdAt)}</span>
        </div>

        <div className="mt-3 flex items-center justify-end text-xs text-blue-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          Xem chi tiết <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </div>
      </div>
    </motion.div>
  );
}

// ─── ClassroomFormModal ────────────────────────────────────────────────────────
function ClassroomFormModal({
  open,
  initial,
  isLoading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  initial?: ClassroomDto | null;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: (data: { description: string }) => void;
}) {
  const [description, setDescription] = useState(initial?.description ?? '');
  const isEdit = !!initial;

  React.useEffect(() => {
    if (open) {
      setDescription(initial?.description ?? '');
    }
  }, [open, initial]);

  const canSubmit = description.trim();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', damping: 28, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">
                  {isEdit ? 'Chỉnh sửa danh sách học sinh' : 'Tạo danh sách học sinh mới'}
                </h2>
              </div>
              <button onClick={onClose} disabled={isLoading} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tên danh sách <span className="text-red-400">*</span>
                </label>
                <input
                  autoFocus
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="VD: Lớp 10A1 — 2025–2026"
                  disabled={isLoading}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={() => onConfirm({ description: description.trim() })}
                disabled={isLoading || !canSubmit}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isEdit ? 'Lưu thay đổi' : 'Tạo danh sách học sinh mới'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function TeacherClassPage() {
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [activeCode, setActiveCode] = useState<string | null>(null);
  // studentListCode used as the active code

  // list state
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTarget, setEditTarget] = useState<ClassroomDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassroomDto | null>(null);

  // detail state
  const [studentSearch, setStudentSearch] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const [importMenuOpen, setImportMenuOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<string[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: classrooms = [], isLoading: listLoading } = useClassrooms();
  const { data: activeClassroom, isLoading: detailLoading, refetch: refetchDetail } = useClassroom(activeCode ?? undefined);
  const createClassroom = useCreateClassroom();
  const updateClassroom = useUpdateClassroom();
  const deleteClassroom = useDeleteClassroom();
  const importStudents = useImportStudents();

  // ── filtered classrooms ────────────────────────────────────────────────────
  const filteredClassrooms = classrooms.filter((c) =>
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  // ── student list in detail view ────────────────────────────────────────────
  const allStudents: { index: number; name: string }[] = (activeClassroom?.students ?? []).map((s, i) => {
    // students array contains "STT. Họ tên" or just "Họ tên"
    const match = s.match(/^(\d+)\.\s*(.+)$/);
    if (match) return { index: parseInt(match[1]), name: match[2].trim() };
    return { index: i + 1, name: s };
  });

  const filteredStudents = allStudents.filter((s) =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase())
  );
  const totalStudentPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
  const pagedStudents = filteredStudents.slice((studentPage - 1) * PAGE_SIZE, studentPage * PAGE_SIZE);

  // ── handlers ───────────────────────────────────────────────────────────────
  const handleOpenDetail = (code: string) => {
    setActiveCode(code);
    setStudentSearch('');
    setStudentPage(1);
    setView('detail');
  };

  const handleCreate = (data: { description: string }) => {
    createClassroom.mutate(data, {
      onSuccess: () => {
        notify.success('Đã tạo danh sách học sinh mới');
        setShowCreateModal(false);
      },
      onError: () => notify.error('Tạo danh sách học sinh thất bại. Vui lòng thử lại.'),
    });
  };

  const handleUpdate = (data: { description: string }) => {
    if (!editTarget) return;
    updateClassroom.mutate({ studentListCode: editTarget.studentListCode, input: data }, {
      onSuccess: () => {
        notify.success('Đã cập nhật danh sách học sinh');
        setEditTarget(null);
        if (activeCode === editTarget.studentListCode) refetchDetail();
      },
      onError: () => notify.error('Cập nhật danh sách học sinh thất bại. Vui lòng thử lại.'),
    });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteClassroom.mutate(deleteTarget.studentListCode, {
      onSuccess: () => {
        notify.success(`Đã xóa "${deleteTarget.description}"`);
        setDeleteTarget(null);
        if (view === 'detail' && activeCode === deleteTarget.studentListCode) {
          setView('list');
          setActiveCode(null);
        }
      },
      onError: () => notify.error('Xóa danh sách học sinh thất bại. Vui lòng thử lại.'),
    });
  };

  // ── Excel import ───────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target!.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: (string | number)[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Find header row (contains STT / Số thứ tự and name columns)
        let headerRow = -1;
        let sttCol = -1;
        let nameCol = -1;

        for (let r = 0; r < Math.min(rows.length, 10); r++) {
          const row = rows[r];
          for (let c = 0; c < row.length; c++) {
            const cell = String(row[c] ?? '').toLowerCase().trim();
            if (cell === 'stt' || cell.startsWith('số thứ') || cell === 'tt') sttCol = c;
            if (cell.includes('họ') || cell.includes('tên') || cell.includes('name')) nameCol = c;
          }
          if (sttCol !== -1 && nameCol !== -1) { headerRow = r; break; }
        }

        // Fallback: assume col 0 = STT, col 1 = name
        if (headerRow === -1) { headerRow = 0; sttCol = 0; nameCol = 1; }

        const students: string[] = [];
        for (let r = headerRow + 1; r < rows.length; r++) {
          const row = rows[r];
          const sttVal = row[sttCol];
          const nameVal = row[nameCol];
          if (!nameVal || String(nameVal).trim() === '') continue;
          const stt = sttVal !== undefined && sttVal !== '' ? String(sttVal).trim() : String(r - headerRow);
          const name = String(nameVal).trim();
          students.push(`${stt}. ${name}`);
        }

        if (students.length === 0) {
          notify.error('Không tìm thấy dữ liệu học sinh trong file. Vui lòng kiểm tra lại.');
          return;
        }
        setImportPreview(students);
      } catch {
        notify.error('Không thể đọc file Excel. Vui lòng kiểm tra lại định dạng.');
      }
    };
    reader.readAsArrayBuffer(file);
    // reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleConfirmImport = () => {
    if (!activeCode || !importPreview) return;
    importStudents.mutate({ studentListCode: activeCode, input: { students: importPreview } }, {
      onSuccess: () => {
        notify.success(`Đã nhập ${importPreview.length} học sinh`);
        setImportPreview(null);
        refetchDetail();
      },
      onError: () => notify.error('Nhập danh sách thất bại. Vui lòng thử lại.'),
    });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW: LIST
  // ─────────────────────────────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <AppHeader />

        <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
          {/* Page header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Danh sách học sinh của tôi</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {listLoading ? '...' : `${classrooms.length} Danh sách học sinh`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tạo danh sách học sinh mới
            </button>
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên danh sách..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>

          {/* Loading */}
          {listLoading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-7 h-7 animate-spin text-blue-400" />
            </div>
          )}

          {/* Empty */}
          {!listLoading && classrooms.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                <GraduationCap className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-base font-semibold text-gray-700 mb-1">Chưa có danh sách học sinh nào</h3>
              <p className="text-sm text-gray-400 mb-5">Tạo danh sách học sinh đầu tiên để bắt đầu quản lý học sinh.</p>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" /> Tạo danh sách học sinh mới
              </button>
            </div>
          )}

          {/* Grid */}
          {!listLoading && classrooms.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Create card */}
              <motion.button
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="group bg-white border-2 border-dashed border-gray-200 rounded-2xl overflow-hidden hover:border-blue-400 hover:bg-blue-50/20 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-center h-28">
                  <div className="w-12 h-12 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                    <Plus className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
                <div className="px-4 py-3 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-400 group-hover:text-blue-600 transition-colors">
                    Tạo danh sách học sinh mới
                  </p>
                </div>
              </motion.button>

              <AnimatePresence mode="popLayout">
                {filteredClassrooms.map((c, idx) => (
                  <ClassroomCard
                    key={c.studentListCode}
                    classroom={c}
                    index={idx}
                    onOpen={() => handleOpenDetail(c.studentListCode)}
                    onEdit={() => setEditTarget(c)}
                    onDelete={() => setDeleteTarget(c)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* No search results */}
          {!listLoading && classrooms.length > 0 && filteredClassrooms.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-10">
              Không tìm thấy lớp nào khớp với &ldquo;{search}&rdquo;
            </p>
          )}
        </div>

        {/* Create / Edit modals */}
        <ClassroomFormModal
          open={showCreateModal}
          isLoading={createClassroom.isPending}
          onClose={() => setShowCreateModal(false)}
          onConfirm={handleCreate}
        />
        <ClassroomFormModal
          open={!!editTarget}
          initial={editTarget}
          isLoading={updateClassroom.isPending}
          onClose={() => setEditTarget(null)}
          onConfirm={handleUpdate}
        />

        {/* Delete confirm */}
        <AnimatePresence>
          {deleteTarget && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
              onClick={() => setDeleteTarget(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
              >
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-5 h-5 text-red-500" />
                </div>
                <h3 className="text-base font-bold text-gray-900 text-center mb-1">Xóa danh sách học sinh?</h3>
                <p className="text-sm text-gray-500 text-center mb-5">
                  Danh sách <strong>{deleteTarget.description}</strong> sẽ bị xóa vĩnh viễn. Không thể hoàn tác.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    disabled={deleteClassroom.isPending}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteClassroom.isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {deleteClassroom.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Xóa
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // VIEW: DETAIL
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <AppHeader />

      {/* hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Breadcrumb + header */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <button
            type="button"
            onClick={() => { setView('list'); setActiveCode(null); }}
            className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
              Danh sách học sinh
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-700 font-medium">{activeClassroom?.description ?? '...'}</span>
        </div>

        {/* Class info bar */}
        {detailLoading ? (
          <div className="h-20 rounded-2xl bg-white border border-gray-200 animate-pulse" />
        ) : activeClassroom ? (
          <div className="bg-white rounded-2xl border border-gray-200 px-6 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <GraduationCap className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{activeClassroom.description}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <div className="text-center px-4 py-2 bg-blue-50 rounded-xl">
                <p className="text-xl font-bold text-blue-700">{activeClassroom.studentCount}</p>
                <p className="text-xs text-blue-500">Học sinh</p>
              </div>
              <button
                type="button"
                onClick={() => setEditTarget(activeClassroom)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Sửa
              </button>
            </div>
          </div>
        ) : null}

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={studentSearch}
              onChange={(e) => { setStudentSearch(e.target.value); setStudentPage(1); }}
              placeholder="Tìm theo tên học sinh..."
              className="pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 w-64"
            />
          </div>

          {/* Import button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setImportMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />
              Nhập danh sách
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <AnimatePresence>
              {importMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden w-56"
                >
                  <button
                    type="button"
                    onClick={() => { setImportMenuOpen(false); fileInputRef.current?.click(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                  >
                    <Upload className="w-4 h-4 text-blue-500" />
                    <div className="text-left">
                      <p className="font-medium">Nhập từ Excel</p>
                      <p className="text-[11px] text-gray-400">Đọc cột STT và Họ tên</p>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Students table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70">
                  <th className="px-5 py-3.5 text-left font-medium text-gray-500 w-16">STT</th>
                  <th className="px-5 py-3.5 text-left font-medium text-gray-500">Họ và tên</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {detailLoading ? (
                  <tr>
                    <td colSpan={2} className="px-5 py-14 text-center text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    </td>
                  </tr>
                ) : pagedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-5 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            {studentSearch ? 'Không tìm thấy học sinh' : 'Chưa có học sinh nào'}
                          </p>
                          {!studentSearch && (
                            <p className="text-xs text-gray-400 mt-1">
                              Nhập danh sách từ file Excel để bắt đầu.
                            </p>
                          )}
                        </div>
                        {!studentSearch && (
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                          >
                            <Upload className="w-3.5 h-3.5" /> Nhập từ Excel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  pagedStudents.map((student, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-gray-500 font-mono text-xs">
                        {student.index}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-gray-900">
                        {student.name}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredStudents.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                {filteredStudents.length} học sinh
                {studentSearch && ` · tìm kiếm "${studentSearch}"`}
              </p>
              {totalStudentPages > 1 && (
                <Pagination page={studentPage} totalPages={totalStudentPages} onPageChange={setStudentPage} />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit modal (from detail) */}
      <ClassroomFormModal
        open={!!editTarget}
        initial={editTarget}
        isLoading={updateClassroom.isPending}
        onClose={() => setEditTarget(null)}
        onConfirm={handleUpdate}
      />

      {/* Excel import preview */}
      <AnimatePresence>
        {importPreview && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-semibold text-gray-900">
                  Xem trước — {importPreview.length} học sinh
                </h3>
                <button onClick={() => setImportPreview(null)} className="p-1.5 rounded-lg hover:bg-gray-100">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="overflow-y-auto max-h-72 divide-y divide-gray-100">
                {importPreview.slice(0, 50).map((s, i) => {
                  const match = s.match(/^(\d+)\.\s*(.+)$/);
                  const stt = match ? match[1] : String(i + 1);
                  const name = match ? match[2] : s;
                  return (
                    <div key={i} className="flex items-center gap-4 px-6 py-2.5">
                      <span className="text-xs text-gray-400 font-mono w-8 flex-shrink-0">{stt}</span>
                      <span className="text-sm text-gray-800">{name}</span>
                    </div>
                  );
                })}
                {importPreview.length > 50 && (
                  <p className="px-6 py-3 text-xs text-gray-400 text-center">
                    ... và {importPreview.length - 50} học sinh khác
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                <button
                  onClick={() => setImportPreview(null)}
                  disabled={importStudents.isPending}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={importStudents.isPending}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50"
                >
                  {importStudents.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Xác nhận nhập {importPreview.length} học sinh
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
