'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Modal from '@/components/common/Modal';
import StatusToast from '@/components/admin/StatusToast';
import { adminServices } from '@/services/adminServices';
import {
  AdminGradeResponse,
  AdminLessonResponse,
  AdminSubjectResponse,
  CreateGradeRequest,
  CreateLessonRequest,
  CreateSubjectRequest,
  UpdateGradeRequest,
  UpdateLessonRequest,
  UpdateSubjectRequest,
} from '@/types/admin';

type TabKey = 'grade' | 'subject' | 'lesson';
type ToastState = { kind: 'success' | 'error'; message: string } | null;

type EditState =
  | { type: 'grade'; originalCode: string; data: CreateGradeRequest }
  | { type: 'subject'; originalCode: string; data: CreateSubjectRequest }
  | { type: 'lesson'; originalCode: string; data: CreateLessonRequest }
  | null;

export default function AdminCurriculumPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('grade');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<ToastState>(null);

  const [grades, setGrades] = useState<AdminGradeResponse[]>([]);
  const [subjects, setSubjects] = useState<AdminSubjectResponse[]>([]);
  const [lessons, setLessons] = useState<AdminLessonResponse[]>([]);
  const [lessonFilterSubjectCode, setLessonFilterSubjectCode] = useState('');

  const [gradeForm, setGradeForm] = useState<CreateGradeRequest>({ gradeCode: '', gradeName: '' });
  const [subjectForm, setSubjectForm] = useState<CreateSubjectRequest>({ subjectCode: '', subjectName: '' });
  const [lessonForm, setLessonForm] = useState<CreateLessonRequest>({ lessonCode: '', lessonName: '', subjectCode: '' });

  const [editState, setEditState] = useState<EditState>(null);

  const parseErrorMessage = (err: unknown, fallback: string) =>
    (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fallback;

  const loadAll = async (subjectCodeForLesson?: string) => {
    setLoading(true);
    setError('');
    try {
      const [gradeRes, subjectRes, lessonRes] = await Promise.all([
        adminServices.getGrades(),
        adminServices.getSubjects(),
        adminServices.getLessons(subjectCodeForLesson),
      ]);

      setGrades(gradeRes.result ?? []);
      setSubjects(subjectRes.result ?? []);
      setLessons(lessonRes.result ?? []);
    } catch (err) {
      setError(parseErrorMessage(err, 'Không thể tải dữ liệu chương trình học.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const subjectOptions = useMemo(() => subjects.map((s) => ({ value: s.subjectCode, label: `${s.subjectCode} - ${s.subjectName}` })), [subjects]);

  const handleCreateGrade = async () => {
    if (!gradeForm.gradeCode.trim() || !gradeForm.gradeName.trim()) {
      setToast({ kind: 'error', message: 'Vui lòng nhập đầy đủ mã và tên khối lớp.' });
      return;
    }

    setBusy(true);
    try {
      await adminServices.createGrade({ gradeCode: gradeForm.gradeCode.trim(), gradeName: gradeForm.gradeName.trim() });
      setGradeForm({ gradeCode: '', gradeName: '' });
      setToast({ kind: 'success', message: 'Tạo khối lớp thành công.' });
      await loadAll(lessonFilterSubjectCode || undefined);
    } catch (err) {
      setToast({ kind: 'error', message: parseErrorMessage(err, 'Không thể tạo khối lớp.') });
    } finally {
      setBusy(false);
    }
  };

  const handleCreateSubject = async () => {
    if (!subjectForm.subjectCode.trim() || !subjectForm.subjectName.trim()) {
      setToast({ kind: 'error', message: 'Vui lòng nhập đầy đủ mã và tên môn học.' });
      return;
    }

    setBusy(true);
    try {
      await adminServices.createSubject({ subjectCode: subjectForm.subjectCode.trim(), subjectName: subjectForm.subjectName.trim() });
      setSubjectForm({ subjectCode: '', subjectName: '' });
      setToast({ kind: 'success', message: 'Tạo môn học thành công.' });
      await loadAll(lessonFilterSubjectCode || undefined);
    } catch (err) {
      setToast({ kind: 'error', message: parseErrorMessage(err, 'Không thể tạo môn học.') });
    } finally {
      setBusy(false);
    }
  };

  const handleCreateLesson = async () => {
    if (!lessonForm.lessonCode.trim() || !lessonForm.lessonName.trim() || !lessonForm.subjectCode.trim()) {
      setToast({ kind: 'error', message: 'Vui lòng nhập đầy đủ mã bài học, tên bài học và môn học.' });
      return;
    }

    setBusy(true);
    try {
      await adminServices.createLesson({
        lessonCode: lessonForm.lessonCode.trim(),
        lessonName: lessonForm.lessonName.trim(),
        subjectCode: lessonForm.subjectCode,
      });
      setLessonForm({ lessonCode: '', lessonName: '', subjectCode: '' });
      setToast({ kind: 'success', message: 'Tạo bài học thành công.' });
      await loadAll(lessonFilterSubjectCode || undefined);
    } catch (err) {
      setToast({ kind: 'error', message: parseErrorMessage(err, 'Không thể tạo bài học.') });
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteGrade = async (gradeCode: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa khối lớp ${gradeCode}?`)) return;

    setBusy(true);
    try {
      await adminServices.deleteGrade(gradeCode);
      setToast({ kind: 'success', message: 'Xóa khối lớp thành công.' });
      await loadAll(lessonFilterSubjectCode || undefined);
    } catch (err) {
      setToast({ kind: 'error', message: parseErrorMessage(err, 'Không thể xóa khối lớp.') });
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteSubject = async (subjectCode: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa môn học ${subjectCode}?`)) return;

    setBusy(true);
    try {
      await adminServices.deleteSubject(subjectCode);
      setToast({ kind: 'success', message: 'Xóa môn học thành công.' });
      if (lessonFilterSubjectCode === subjectCode) {
        setLessonFilterSubjectCode('');
      }
      await loadAll(lessonFilterSubjectCode === subjectCode ? undefined : lessonFilterSubjectCode || undefined);
    } catch (err) {
      setToast({ kind: 'error', message: parseErrorMessage(err, 'Không thể xóa môn học.') });
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteLesson = async (lessonCode: string) => {
    if (!window.confirm(`Bạn có chắc muốn xóa bài học ${lessonCode}?`)) return;

    setBusy(true);
    try {
      await adminServices.deleteLesson(lessonCode);
      setToast({ kind: 'success', message: 'Xóa bài học thành công.' });
      await loadAll(lessonFilterSubjectCode || undefined);
    } catch (err) {
      setToast({ kind: 'error', message: parseErrorMessage(err, 'Không thể xóa bài học.') });
    } finally {
      setBusy(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editState) return;

    setBusy(true);
    try {
      if (editState.type === 'grade') {
        const payload: UpdateGradeRequest = {
          gradeCode: editState.data.gradeCode.trim(),
          gradeName: editState.data.gradeName.trim(),
        };
        await adminServices.updateGrade(editState.originalCode, payload);
        setToast({ kind: 'success', message: 'Cập nhật khối lớp thành công.' });
      }

      if (editState.type === 'subject') {
        const payload: UpdateSubjectRequest = {
          subjectCode: editState.data.subjectCode.trim(),
          subjectName: editState.data.subjectName.trim(),
        };
        await adminServices.updateSubject(editState.originalCode, payload);
        setToast({ kind: 'success', message: 'Cập nhật môn học thành công.' });
      }

      if (editState.type === 'lesson') {
        const payload: UpdateLessonRequest = {
          lessonCode: editState.data.lessonCode.trim(),
          lessonName: editState.data.lessonName.trim(),
          subjectCode: editState.data.subjectCode,
        };
        await adminServices.updateLesson(editState.originalCode, payload);
        setToast({ kind: 'success', message: 'Cập nhật bài học thành công.' });
      }

      setEditState(null);
      await loadAll(lessonFilterSubjectCode || undefined);
    } catch (err) {
      setToast({ kind: 'error', message: parseErrorMessage(err, 'Không thể cập nhật dữ liệu.') });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-8 py-6">
      {toast && <StatusToast kind={toast.kind} message={toast.message} onClose={() => setToast(null)} />}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Grade, Subject, Lesson</h1>
        <p className="mt-1 text-sm text-gray-500">Quản trị chương trình học theo mã code từ</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('grade')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${activeTab === 'grade' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
        >
          Grade
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('subject')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${activeTab === 'subject' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
        >
          Subject
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('lesson')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${activeTab === 'lesson' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
        >
          Lesson
        </button>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {activeTab === 'grade' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-base font-semibold text-gray-900">Tạo khối lớp</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <input
                type="text"
                value={gradeForm.gradeCode}
                onChange={(e) => setGradeForm((prev) => ({ ...prev, gradeCode: e.target.value }))}
                placeholder="Mã khối lớp (VD: GRADE10)"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <input
                type="text"
                value={gradeForm.gradeName}
                onChange={(e) => setGradeForm((prev) => ({ ...prev, gradeName: e.target.value }))}
                placeholder="Tên khối lớp"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <button
                type="button"
                onClick={() => void handleCreateGrade()}
                disabled={busy}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {busy ? 'Đang xử lý...' : 'Tạo mới'}
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Mã khối</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Tên khối</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-16 text-center text-gray-500">Đang tải dữ liệu...</td>
                    </tr>
                  ) : grades.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-16 text-center text-gray-400">Chưa có dữ liệu.</td>
                    </tr>
                  ) : (
                    grades.map((g) => (
                      <tr key={g.gradeCode} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-900">{g.gradeCode}</td>
                        <td className="px-5 py-3 text-gray-700">{g.gradeName}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setEditState({
                                  type: 'grade',
                                  originalCode: g.gradeCode,
                                  data: { gradeCode: g.gradeCode, gradeName: g.gradeName },
                                })
                              }
                              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteGrade(g.gradeCode)}
                              className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'subject' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-base font-semibold text-gray-900">Tạo môn học</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <input
                type="text"
                value={subjectForm.subjectCode}
                onChange={(e) => setSubjectForm((prev) => ({ ...prev, subjectCode: e.target.value }))}
                placeholder="Mã môn học (VD: TOAN)"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <input
                type="text"
                value={subjectForm.subjectName}
                onChange={(e) => setSubjectForm((prev) => ({ ...prev, subjectName: e.target.value }))}
                placeholder="Tên môn học"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <button
                type="button"
                onClick={() => void handleCreateSubject()}
                disabled={busy}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {busy ? 'Đang xử lý...' : 'Tạo mới'}
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Mã môn</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Tên môn</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Số bài học</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-16 text-center text-gray-500">Đang tải dữ liệu...</td>
                    </tr>
                  ) : subjects.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-16 text-center text-gray-400">Chưa có dữ liệu.</td>
                    </tr>
                  ) : (
                    subjects.map((s) => (
                      <tr key={s.subjectCode} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-900">{s.subjectCode}</td>
                        <td className="px-5 py-3 text-gray-700">{s.subjectName}</td>
                        <td className="px-5 py-3 text-gray-600">{s.lessonCount ?? '-'}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setEditState({
                                  type: 'subject',
                                  originalCode: s.subjectCode,
                                  data: { subjectCode: s.subjectCode, subjectName: s.subjectName },
                                })
                              }
                              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteSubject(s.subjectCode)}
                              className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'lesson' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-base font-semibold text-gray-900">Tạo bài học</h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <input
                type="text"
                value={lessonForm.lessonCode}
                onChange={(e) => setLessonForm((prev) => ({ ...prev, lessonCode: e.target.value }))}
                placeholder="Mã bài học (VD: TOAN_01)"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <input
                type="text"
                value={lessonForm.lessonName}
                onChange={(e) => setLessonForm((prev) => ({ ...prev, lessonName: e.target.value }))}
                placeholder="Tên bài học"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
              <select
                value={lessonForm.subjectCode}
                onChange={(e) => setLessonForm((prev) => ({ ...prev, subjectCode: e.target.value }))}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Chọn môn học</option>
                {subjectOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void handleCreateLesson()}
                disabled={busy}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {busy ? 'Đang xử lý...' : 'Tạo mới'}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Lọc theo môn học:</label>
              <select
                value={lessonFilterSubjectCode}
                onChange={(e) => setLessonFilterSubjectCode(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Tất cả môn học</option>
                {subjectOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void loadAll(lessonFilterSubjectCode || undefined)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Áp dụng
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/70">
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Mã bài học</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Tên bài học</th>
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Môn học</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-16 text-center text-gray-500">Đang tải dữ liệu...</td>
                    </tr>
                  ) : lessons.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-16 text-center text-gray-400">Chưa có dữ liệu.</td>
                    </tr>
                  ) : (
                    lessons.map((l) => (
                      <tr key={l.lessonCode} className="hover:bg-gray-50">
                        <td className="px-5 py-3 font-medium text-gray-900">{l.lessonCode}</td>
                        <td className="px-5 py-3 text-gray-700">{l.lessonName}</td>
                        <td className="px-5 py-3 text-gray-600">{l.subjectName || l.subjectCode || '-'}</td>
                        <td className="px-5 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setEditState({
                                  type: 'lesson',
                                  originalCode: l.lessonCode,
                                  data: {
                                    lessonCode: l.lessonCode,
                                    lessonName: l.lessonName,
                                    subjectCode: l.subjectCode || '',
                                  },
                                })
                              }
                              className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleDeleteLesson(l.lessonCode)}
                              className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={!!editState}
        onClose={() => setEditState(null)}
        title={editState?.type === 'grade' ? 'Cập nhật khối lớp' : editState?.type === 'subject' ? 'Cập nhật môn học' : 'Cập nhật bài học'}
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditState(null)}
              disabled={busy}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void handleSaveEdit()}
              disabled={busy}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {busy ? 'Đang xử lý...' : 'Lưu thay đổi'}
            </button>
          </div>
        }
      >
        {editState?.type === 'grade' && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Mã khối lớp</label>
              <input
                type="text"
                value={editState.data.gradeCode}
                onChange={(e) =>
                  setEditState((prev) =>
                    prev && prev.type === 'grade'
                      ? { ...prev, data: { ...prev.data, gradeCode: e.target.value } }
                      : prev
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tên khối lớp</label>
              <input
                type="text"
                value={editState.data.gradeName}
                onChange={(e) =>
                  setEditState((prev) =>
                    prev && prev.type === 'grade'
                      ? { ...prev, data: { ...prev.data, gradeName: e.target.value } }
                      : prev
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
        )}

        {editState?.type === 'subject' && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Mã môn học</label>
              <input
                type="text"
                value={editState.data.subjectCode}
                onChange={(e) =>
                  setEditState((prev) =>
                    prev && prev.type === 'subject'
                      ? { ...prev, data: { ...prev.data, subjectCode: e.target.value } }
                      : prev
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tên môn học</label>
              <input
                type="text"
                value={editState.data.subjectName}
                onChange={(e) =>
                  setEditState((prev) =>
                    prev && prev.type === 'subject'
                      ? { ...prev, data: { ...prev.data, subjectName: e.target.value } }
                      : prev
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
        )}

        {editState?.type === 'lesson' && (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Mã bài học</label>
              <input
                type="text"
                value={editState.data.lessonCode}
                onChange={(e) =>
                  setEditState((prev) =>
                    prev && prev.type === 'lesson'
                      ? { ...prev, data: { ...prev.data, lessonCode: e.target.value } }
                      : prev
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Tên bài học</label>
              <input
                type="text"
                value={editState.data.lessonName}
                onChange={(e) =>
                  setEditState((prev) =>
                    prev && prev.type === 'lesson'
                      ? { ...prev, data: { ...prev.data, lessonName: e.target.value } }
                      : prev
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Môn học</label>
              <select
                value={editState.data.subjectCode}
                onChange={(e) =>
                  setEditState((prev) =>
                    prev && prev.type === 'lesson'
                      ? { ...prev, data: { ...prev.data, subjectCode: e.target.value } }
                      : prev
                  )
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Chọn môn học</option>
                {subjectOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
