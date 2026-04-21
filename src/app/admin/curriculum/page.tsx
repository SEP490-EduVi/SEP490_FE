'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Modal from '@/components/common/Modal';
import { notify, MSGS } from '@/components/common';
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

type EditState =
  | { type: 'grade'; originalCode: string; data: CreateGradeRequest }
  | { type: 'subject'; originalCode: string; data: CreateSubjectRequest }
  | { type: 'lesson'; originalCode: string; data: CreateLessonRequest }
  | null;

type DeleteConfirmState =
  | { type: 'grade'; code: string; name: string }
  | { type: 'subject'; code: string; name: string }
  | { type: 'lesson'; code: string; name: string }
  | null;

export default function AdminCurriculumPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('grade');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [grades, setGrades] = useState<AdminGradeResponse[]>([]);
  const [subjects, setSubjects] = useState<AdminSubjectResponse[]>([]);
  const [lessons, setLessons] = useState<AdminLessonResponse[]>([]);
  const [lessonFilterSubjectCode, setLessonFilterSubjectCode] = useState('');

  const [gradeForm, setGradeForm] = useState<CreateGradeRequest>({ gradeCode: '', gradeName: '' });
  const [subjectForm, setSubjectForm] = useState<CreateSubjectRequest>({ subjectCode: '', subjectName: '' });
  const [lessonForm, setLessonForm] = useState<CreateLessonRequest>({ lessonCode: '', lessonName: '', subjectCode: '' });

  const [editState, setEditState] = useState<EditState>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

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
      notify.error(MSGS.curriculum.missingGrade);
      return;
    }

    setBusy(true);
    try {
      await adminServices.createGrade({ gradeCode: gradeForm.gradeCode.trim(), gradeName: gradeForm.gradeName.trim() });
      setGradeForm({ gradeCode: '', gradeName: '' });
      notify.success(MSGS.curriculum.gradeCreateSuccess);
      await loadAll(lessonFilterSubjectCode || undefined);
    } catch (err) {
      notify.error(MSGS.curriculum.gradeCreateError);
    } finally {
      setBusy(false);
    }
  };

  const handleCreateSubject = async () => {
    if (!subjectForm.subjectCode.trim() || !subjectForm.subjectName.trim()) {
      notify.error(MSGS.curriculum.missingSubject);
      return;
    }

    setBusy(true);
    try {
      await adminServices.createSubject({ subjectCode: subjectForm.subjectCode.trim(), subjectName: subjectForm.subjectName.trim() });
      setSubjectForm({ subjectCode: '', subjectName: '' });
      notify.success(MSGS.curriculum.subjectCreateSuccess);
      await loadAll(lessonFilterSubjectCode || undefined);
    } catch (err) {
      notify.error(MSGS.curriculum.subjectCreateError);
    } finally {
      setBusy(false);
    }
  };

  const handleCreateLesson = async () => {
    if (!lessonForm.lessonCode.trim() || !lessonForm.lessonName.trim() || !lessonForm.subjectCode.trim()) {
      notify.error(MSGS.curriculum.missingLesson);
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
      notify.success(MSGS.curriculum.lessonCreateSuccess);
      await loadAll(lessonFilterSubjectCode || undefined);
    } catch (err) {
      notify.error(MSGS.curriculum.lessonCreateError);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteGrade = async (gradeCode: string) => {
    setBusy(true);
    try {
      await adminServices.deleteGrade(gradeCode);
      notify.success(MSGS.curriculum.gradeDeleteSuccess);
      await loadAll(lessonFilterSubjectCode || undefined);
    } catch (err) {
      notify.error(MSGS.curriculum.gradeDeleteError);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteSubject = async (subjectCode: string) => {
    setBusy(true);
    try {
      await adminServices.deleteSubject(subjectCode);
      notify.success(MSGS.curriculum.subjectDeleteSuccess);
      if (lessonFilterSubjectCode === subjectCode) {
        setLessonFilterSubjectCode('');
      }
      await loadAll(lessonFilterSubjectCode === subjectCode ? undefined : lessonFilterSubjectCode || undefined);
    } catch (err) {
      notify.error(MSGS.curriculum.subjectDeleteError);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteLesson = async (lessonCode: string) => {
    setBusy(true);
    try {
      await adminServices.deleteLesson(lessonCode);
      notify.success(MSGS.curriculum.lessonDeleteSuccess);
      await loadAll(lessonFilterSubjectCode || undefined);
    } catch (err) {
      notify.error(MSGS.curriculum.lessonDeleteError);
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    if (deleteConfirmText.trim().toUpperCase() !== 'XOA') {
      notify.error(MSGS.curriculum.confirmDeletePrompt);
      return;
    }

    if (deleteConfirm.type === 'grade') {
      await handleDeleteGrade(deleteConfirm.code);
    }

    if (deleteConfirm.type === 'subject') {
      await handleDeleteSubject(deleteConfirm.code);
    }

    if (deleteConfirm.type === 'lesson') {
      await handleDeleteLesson(deleteConfirm.code);
    }

    setDeleteConfirm(null);
    setDeleteConfirmText('');
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
        notify.success(MSGS.curriculum.gradeUpdateSuccess);
      }

      if (editState.type === 'subject') {
        const payload: UpdateSubjectRequest = {
          subjectCode: editState.data.subjectCode.trim(),
          subjectName: editState.data.subjectName.trim(),
        };
        await adminServices.updateSubject(editState.originalCode, payload);
        notify.success(MSGS.curriculum.subjectUpdateSuccess);
      }

      if (editState.type === 'lesson') {
        const payload: UpdateLessonRequest = {
          lessonCode: editState.data.lessonCode.trim(),
          lessonName: editState.data.lessonName.trim(),
          subjectCode: editState.data.subjectCode,
        };
        await adminServices.updateLesson(editState.originalCode, payload);
        notify.success(MSGS.curriculum.lessonUpdateSuccess);
      }

      setEditState(null);
      await loadAll(lessonFilterSubjectCode || undefined);
    } catch (err) {
      notify.error(MSGS.curriculum.updateError);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-8 py-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Quản lý chương trình học</h1>
        <p className="mt-1 text-sm text-gray-500">Quản trị Khối lớp, Môn học, Bài học</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('grade')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${activeTab === 'grade' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
        >
          Khối lớp
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('subject')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${activeTab === 'subject' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
        >
          Môn học
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('lesson')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${activeTab === 'lesson' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}
        >
          Bài học
        </button>
      </div>

      {error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {activeTab === 'grade' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600">Biểu mẫu tạo mới</p>
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
            <div className="border-b border-gray-100 px-5 py-3 text-sm font-semibold text-gray-700">Danh sách khối lớp</div>
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
                              onClick={() => {
                                setDeleteConfirm({ type: 'grade', code: g.gradeCode, name: g.gradeName });
                                setDeleteConfirmText('');
                              }}
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
          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600">Biểu mẫu tạo mới</p>
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
            <div className="border-b border-gray-100 px-5 py-3 text-sm font-semibold text-gray-700">Danh sách môn học</div>
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
                              onClick={() => {
                                setLessonFilterSubjectCode(s.subjectCode);
                                setActiveTab('lesson');
                                void loadAll(s.subjectCode);
                              }}
                              className="rounded-md border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                            >
                              Xem bài học
                            </button>
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
                              onClick={() => {
                                setDeleteConfirm({ type: 'subject', code: s.subjectCode, name: s.subjectName });
                                setDeleteConfirmText('');
                              }}
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
          <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600">Biểu mẫu tạo mới</p>
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
            <div className="border-b border-gray-100 px-5 py-3 text-sm font-semibold text-gray-700">Danh sách bài học</div>
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
                              onClick={() => {
                                setDeleteConfirm({ type: 'lesson', code: l.lessonCode, name: l.lessonName });
                                setDeleteConfirmText('');
                              }}
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

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => {
          if (!busy) {
            setDeleteConfirm(null);
            setDeleteConfirmText('');
          }
        }}
        title="Xác nhận xóa dữ liệu"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setDeleteConfirm(null);
                setDeleteConfirmText('');
              }}
              disabled={busy}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void handleConfirmDelete()}
              disabled={busy}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
            >
              {busy ? 'Đang xử lý...' : 'Xác nhận xóa'}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-sm text-gray-600">
          <p>
            Bạn sắp xóa{' '}
            <strong>
              {deleteConfirm?.type === 'grade' && 'khối lớp'}
              {deleteConfirm?.type === 'subject' && 'môn học'}
              {deleteConfirm?.type === 'lesson' && 'bài học'}
            </strong>{' '}
            <strong>{deleteConfirm?.name}</strong> ({deleteConfirm?.code}).
          </p>
          <p>Hành động này có thể ảnh hưởng dữ liệu liên quan. Nhập <strong>XOA</strong> để xác nhận.</p>
          <input
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Nhập XOA"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200"
          />
        </div>
      </Modal>
    </div>
  );
}
