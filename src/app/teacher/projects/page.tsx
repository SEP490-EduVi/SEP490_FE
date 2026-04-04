'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import {
  Plus,
  FolderOpen,
  Search,
  Grid3X3,
  List,
  Loader2,
  AlertCircle,
  FolderKanban,
} from 'lucide-react';

import { useProjects, useCreateProject, useDeleteProject, useUpdateProject } from '@/hooks/useProjectApi';
import { useSubjects, useGrades } from '@/hooks/useMetadataApi';
import AppHeader from '@/components/sidebar/AppHeader';
import { Breadcrumb, notify } from '@/components/common';
import { Pagination } from '@/components/paging';
import { usePipelineHub } from '@/hooks/usePipelineHub';
import { usePipelineTaskStore } from '@/store/usePipelineTaskStore';
import { usePipelineProgressStore } from '@/store/usePipelineProgressStore';
import type { PipelineProgress } from '@/types/api';
import ProjectCard from '@/components/projects/ProjectCard';
import FolderTile from '@/components/projects/FolderTile';
import ProjectListTable from '@/components/projects/ProjectListTable';
import CreateProjectModal from '@/components/projects/CreateProjectModal';
import EditProjectModal from '@/components/projects/EditProjectModal';
import Modal from '@/components/common/Modal';
import type { ProjectDto, UpdateProjectInput } from '@/types/api';

const GRADE_PICKER_TONE = [
  {
    border: 'border-blue-300',
    bg: 'bg-blue-50/70',
    chip: 'bg-blue-100 text-blue-700',
  },
  {
    border: 'border-indigo-300',
    bg: 'bg-indigo-50/70',
    chip: 'bg-indigo-100 text-indigo-700',
  },
  {
    border: 'border-emerald-300',
    bg: 'bg-emerald-50/70',
    chip: 'bg-emerald-100 text-emerald-700',
  },
] as const;

export default function TeacherProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSubjectCode = searchParams.get('subjectCode') ?? '';
  const selectedGradeCode = searchParams.get('gradeCode') ?? '';

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [gradePickerSubjectCode, setGradePickerSubjectCode] = useState<string | null>(null);
  const [showEmptySubjects, setShowEmptySubjects] = useState(false);

  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<ProjectDto | null>(null);
  const [pipelineProgress, setPipelineProgress] = useState<PipelineProgress | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const setGlobalProgress = usePipelineProgressStore((s) => s.setProgress);
  const clearGlobalProgress = usePipelineProgressStore((s) => s.clear);

  useEffect(() => {
    setAccessToken(localStorage.getItem('accessToken'));
    // Hydrate task store so GlobalPipelinePill can read projectCodes
    usePipelineTaskStore.getState().hydrate();
  }, []);

  usePipelineHub({
    accessToken,
    onProgress: (event) => {
      setPipelineProgress(event);
      if (event.status !== 'completed' && event.status !== 'failed') {
        // Look up projectCode from task store by taskId
        const allTasks = usePipelineTaskStore.getState().getAllTasks();
        const stored = allTasks.find((t) => t.taskId === event.taskId);
        const projectCode = stored
          ? (() => {
              const [type, ...rest] = stored.key.split(':');
              return usePipelineTaskStore.getState().getProjectCode(
                type as 'eval' | 'slides' | 'video',
                rest.join(':')
              );
            })()
          : null;
        const type: 'evaluation' | 'slides' | 'video' =
          event.step?.includes('video') ? 'video'
          : (event.step?.includes('slide') || event.step?.includes('generating') || event.step?.includes('planning') || event.step?.includes('assembling')) ? 'slides'
          : 'evaluation';
        setGlobalProgress(event, type, projectCode);
      }
      if (event.status === 'completed' || event.status === 'failed') {
        clearGlobalProgress();
        setTimeout(() => setPipelineProgress(null), 3000);
      }
    },
  });

  const { data: projects = [], isLoading, isError, error } = useProjects();
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const { data: grades = [], isLoading: gradesLoading } = useGrades();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const updateProject = useUpdateProject();

  const highSchoolGrades = useMemo(() => {
    const hs = grades.filter((g) => /(10|11|12)/.test(`${g.gradeName} ${g.gradeCode}`));
    return hs.length > 0 ? hs : grades;
  }, [grades]);

  const selectedSubject = subjects.find((s) => s.subjectCode === selectedSubjectCode);
  const selectedGrade = highSchoolGrades.find((g) => g.gradeCode === selectedGradeCode);
  const selectedSubjectForPicker = subjects.find((s) => s.subjectCode === gradePickerSubjectCode);

  const level: 'subject' | 'project' = selectedSubjectCode && selectedGradeCode ? 'project' : 'subject';

  const buildProjectsPath = (subjectCode?: string, gradeCode?: string, create?: string) => {
    const params = new URLSearchParams();
    if (subjectCode) params.set('subjectCode', subjectCode);
    if (gradeCode) params.set('gradeCode', gradeCode);
    if (create) params.set('create', create);
    const query = params.toString();
    return query ? `/teacher/projects?${query}` : '/teacher/projects';
  };

  // Auto-open create modal only when subject+grade are already selected
  useEffect(() => {
    if (searchParams.get('create') === '1' && selectedSubjectCode && selectedGradeCode) {
      setShowCreateModal(true);
      router.replace(buildProjectsPath(selectedSubjectCode, selectedGradeCode), { scroll: false });
    }
  }, [searchParams, selectedSubjectCode, selectedGradeCode, router]);

  useEffect(() => {
    setSearchQuery('');
  }, [selectedSubjectCode, selectedGradeCode]);

  useEffect(() => {
    setShowEmptySubjects(false);
  }, [searchQuery]);

  // ── Filter by each navigation level ───────────────────────────────────────
  const filteredSubjects = subjects.filter((s) =>
    s.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const scopedProjects = projects.filter((p) =>
    p.subjectCode === selectedSubjectCode && p.gradeCode === selectedGradeCode,
  );

  const filteredProjects = scopedProjects.filter((p) =>
    p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.projectCode.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredProjects.length / PAGE_SIZE);
  const pagedProjects = filteredProjects.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const subjectStats = useMemo(() => {
    const stats: Record<string, { total: number; active: number }> = {};
    for (const p of projects) {
      if (!p.subjectCode) continue;
      if (!stats[p.subjectCode]) stats[p.subjectCode] = { total: 0, active: 0 };
      stats[p.subjectCode].total += 1;
      if (p.status === 0) stats[p.subjectCode].active += 1;
    }
    return stats;
  }, [projects]);

  const sortedSubjects = useMemo(() => {
    return [...filteredSubjects].sort((a, b) => {
      const aStats = subjectStats[a.subjectCode] ?? { total: 0, active: 0 };
      const bStats = subjectStats[b.subjectCode] ?? { total: 0, active: 0 };
      if (bStats.total !== aStats.total) return bStats.total - aStats.total;
      if (bStats.active !== aStats.active) return bStats.active - aStats.active;
      return a.subjectName.localeCompare(b.subjectName, 'vi');
    });
  }, [filteredSubjects, subjectStats]);

  const activeSubjects = sortedSubjects.filter((subject) => {
    const stats = subjectStats[subject.subjectCode] ?? { total: 0, active: 0 };
    return stats.total > 0;
  });

  const emptySubjects = sortedSubjects.filter((subject) => {
    const stats = subjectStats[subject.subjectCode] ?? { total: 0, active: 0 };
    return stats.total === 0;
  });

  const subjectGradeProjectCount = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const p of projects) {
      if (!p.subjectCode || !p.gradeCode) continue;
      const key = `${p.subjectCode}:${p.gradeCode}`;
      stats[key] = (stats[key] ?? 0) + 1;
    }
    return stats;
  }, [projects]);

  // If a deep link contains only subjectCode, always open grade picker.
  useEffect(() => {
    if (!selectedSubjectCode || selectedGradeCode) return;
    setGradePickerSubjectCode(selectedSubjectCode);
  }, [selectedSubjectCode, selectedGradeCode]);

  const gradePickerRows = useMemo(() => {
    if (!gradePickerSubjectCode) return [] as Array<{ gradeCode: string; gradeName: string; count: number }>;

    return highSchoolGrades
      .map((grade) => ({
        gradeCode: grade.gradeCode,
        gradeName: grade.gradeName,
        count: subjectGradeProjectCount[`${gradePickerSubjectCode}:${grade.gradeCode}`] ?? 0,
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.gradeName.localeCompare(b.gradeName, 'vi');
      });
  }, [gradePickerSubjectCode, highSchoolGrades, subjectGradeProjectCount]);

  const subjectPickerColorIndex = useMemo(() => {
    if (!gradePickerSubjectCode) return 0;
    const idx = sortedSubjects.findIndex((s) => s.subjectCode === gradePickerSubjectCode);
    return idx < 0 ? 0 : idx;
  }, [gradePickerSubjectCode, sortedSubjects]);

  useEffect(() => { setPage(1); }, [searchQuery, level]);

  const openGradePicker = (subjectCode: string) => {
    setGradePickerSubjectCode(subjectCode);
  };

  const closeGradePicker = () => {
    setGradePickerSubjectCode(null);
    if (selectedSubjectCode && !selectedGradeCode) {
      router.replace('/teacher/projects', { scroll: false });
    }
  };

  const handleSelectGrade = (gradeCode: string) => {
    if (!gradePickerSubjectCode) return;
    const subjectCode = gradePickerSubjectCode;
    setGradePickerSubjectCode(null);
    router.push(buildProjectsPath(subjectCode, gradeCode));
  };

  const handleCreate = (data: { projectName: string; subjectCode: string; gradeCode: string }) => {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
    const projectCode = `P-${ts}${rand}`;
    createProject.mutate({
      projectCode,
      projectName: data.projectName,
      subjectCode: data.subjectCode,
      gradeCode: data.gradeCode,
    }, {
      onSuccess: () => { setShowCreateModal(false); notify.success(`Dự án "${data.projectName}" đã được tạo thành công!`); },
      onError: () => notify.error('Tạo dự án thất bại. Vui lòng thử lại.'),
    });
  };

  const handleDelete = (projectCode: string) => {
    deleteProject.mutate(projectCode, {
      onSuccess: () => notify.success('Đã xóa dự án thành công'),
    });
    setMenuOpen(null);
  };

  const handleEdit = (project: ProjectDto) => {
    setEditTarget(project);
    setMenuOpen(null);
  };

  const handleUpdateProject = (projectCode: string, input: UpdateProjectInput) => {
    updateProject.mutate(
      { projectCode, input },
      { onSuccess: () => { setEditTarget(null); notify.success('Cập nhật dự án thành công!'); } },
    );
  };

  const breadcrumbItems = [
    { label: 'Dự án', href: level === 'project' ? '/teacher/projects' : undefined },
    ...(level === 'project' && selectedSubject ? [{ label: selectedSubject.subjectName }] : []),
    ...(level === 'project' && selectedGrade ? [{ label: selectedGrade.gradeName }] : []),
  ];

  const searchPlaceholder =
    level === 'subject'
      ? 'Tìm môn học...'
      : 'Tìm kiếm dự án theo tên hoặc mã...';

  const projectCountLabel = level === 'subject'
    ? `${sortedSubjects.length}/${subjects.length} môn học`
    : `${scopedProjects.length} dự án`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Breadcrumb items={breadcrumbItems} />

        {/* ── Filters Bar ── */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>

          {level === 'project' ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.97] transition-all shadow-lg shadow-blue-600/25 font-medium text-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Tạo dự án mới
            </button>
          ) : (
            <div className="flex items-center px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-500 whitespace-nowrap">
              {projectCountLabel}
            </div>
          )}

          {level === 'project' && (
            <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden flex-shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2.5 transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Lưới"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2.5 transition-colors ${
                  viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'
                }`}
                title="Danh sách"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── Project context row ── */}
        {level === 'project' && (
          <div className="mb-5 flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
              {scopedProjects.length} dự án
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
              {scopedProjects.filter((p) => p.status === 0).length} hoạt động
            </span>
            <span className="text-xs text-slate-500">
              {selectedSubject?.subjectName} • {selectedGrade?.gradeName}
            </span>
          </div>
        )}

        {/* ── Loading ── */}
        {(isLoading || (level === 'subject' && subjectsLoading)) && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
            <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
          </div>
        )}

        {/* ── Error ── */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Không thể tải dữ liệu</h3>
            <p className="text-sm text-gray-500">
              {(error as Error)?.message || 'Đã xảy ra lỗi khi kết nối đến server.'}
            </p>
          </div>
        )}

        {/* ── Empty ── */}
        {!isLoading && !isError && level === 'project' && filteredProjects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FolderOpen className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">
              {searchQuery ? 'Không tìm thấy dự án' : 'Chưa có dự án nào'}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {searchQuery ? 'Thử thay đổi từ khóa tìm kiếm' : 'Hãy tạo dự án đầu tiên để bắt đầu!'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Tạo dự án mới
              </button>
            )}
          </div>
        )}

        {/* ── Subject folders (level 1) ── */}
        {!isLoading && !isError && level === 'subject' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">
                Đang hoạt động ({activeSubjects.length})
              </p>
              {activeSubjects.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                  {activeSubjects.map((subject, idx) => {
                    const stats = subjectStats[subject.subjectCode] ?? { total: 0, active: 0 };
                    return (
                      <FolderTile
                        key={subject.subjectCode}
                        label={subject.subjectName}
                        index={idx}
                        subtitle={`${stats.active} đang hoạt động`}
                        badge={`${stats.total} dự án`}
                        variant="compact"
                        tone="color"
                        colorKey={subject.subjectCode}
                        onClick={() => openGradePicker(subject.subjectCode)}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center">
                  <p className="text-sm text-slate-600">Không có môn nào có dự án trong bộ lọc hiện tại.</p>
                </div>
              )}
            </div>

            {emptySubjects.length > 0 && (
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmptySubjects((v) => !v)}
                  className="text-sm font-semibold text-slate-700 hover:text-slate-900"
                >
                  {showEmptySubjects
                    ? 'Thu gọn danh sách môn chưa có dự án'
                    : `Hiển thị ${emptySubjects.length} môn chưa có dự án`}
                </button>

                {!showEmptySubjects && (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3.5">
                    <p className="text-sm text-slate-700 font-medium">Bạn đang dạy thêm môn khác?</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {emptySubjects.slice(0, 3).map((subject) => (
                        <button
                          key={subject.subjectCode}
                          type="button"
                          onClick={() => openGradePicker(subject.subjectCode)}
                          className="px-2.5 py-1 rounded-full text-xs border border-slate-300 text-slate-700 hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                        >
                          {subject.subjectName}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {showEmptySubjects && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                    {emptySubjects.map((subject, idx) => {
                      const colorShift = idx + activeSubjects.length;
                      return (
                        <FolderTile
                          key={subject.subjectCode}
                          label={subject.subjectName}
                          index={colorShift}
                          subtitle="Chưa có hoạt động"
                          badge="0 dự án"
                          variant="compact"
                          tone="neutral"
                          onClick={() => openGradePicker(subject.subjectCode)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Grid View ── */}
        {!isLoading && !isError && level === 'project' && filteredProjects.length > 0 && viewMode === 'grid' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-3">
              <AnimatePresence mode="popLayout">
                {pagedProjects.map((project, idx) => (
                  <ProjectCard
                    key={project.projectCode}
                    project={project}
                    index={idx}
                    menuOpen={menuOpen !== null && menuOpen === project.projectCode}
                    onMenuToggle={() =>
                      setMenuOpen(menuOpen === project.projectCode ? null : project.projectCode)
                    }
                    onClick={() =>
                      router.push(
                        `/teacher/${project.projectCode}?subjectCode=${encodeURIComponent(selectedSubjectCode)}&gradeCode=${encodeURIComponent(selectedGradeCode)}`,
                      )
                    }
                    onEdit={() => handleEdit(project)}
                    onDelete={() => handleDelete(project.projectCode)}
                  />
                ))}
              </AnimatePresence>
            </div>
            <p className="text-center text-xs text-slate-500 mt-4">Trang {page}/{totalPages}</p>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}

        {/* ── List View ── */}
        {!isLoading && !isError && level === 'project' && filteredProjects.length > 0 && viewMode === 'list' && (
          <>
            <ProjectListTable
              projects={pagedProjects}
              onClickProject={(code) => router.push(`/teacher/${code}?subjectCode=${encodeURIComponent(selectedSubjectCode)}&gradeCode=${encodeURIComponent(selectedGradeCode)}`)}
              onDelete={handleDelete}
              isDeleting={deleteProject.isPending ? (deleteProject.variables as string) : null}
            />
            <p className="text-center text-xs text-slate-500 mt-4">Trang {page}/{totalPages}</p>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </main>

      <CreateProjectModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreate}
        subjects={subjects}
        grades={highSchoolGrades}
        subjectsLoading={subjectsLoading}
        gradesLoading={gradesLoading}
        presetSubjectCode={selectedSubjectCode || undefined}
        presetSubjectName={selectedSubject?.subjectName}
        presetGradeCode={selectedGradeCode || undefined}
        presetGradeName={selectedGrade?.gradeName}
        isLoading={createProject.isPending}
      />

      <EditProjectModal
        open={!!editTarget}
        project={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleUpdateProject}
        isLoading={updateProject.isPending}
      />

      <Modal
        isOpen={!!gradePickerSubjectCode}
        onClose={closeGradePicker}
        title={`Chọn lớp cho môn ${selectedSubjectForPicker?.subjectName ?? ''}`}
        size="full"
        className="max-w-4xl"
        bodyClassName="px-6 py-5"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
              <FolderKanban
                className={`w-4 h-4 ${
                  subjectPickerColorIndex % 3 === 0
                    ? 'text-blue-600'
                    : subjectPickerColorIndex % 3 === 1
                      ? 'text-indigo-600'
                      : 'text-emerald-600'
                }`}
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {selectedSubjectForPicker?.subjectName ?? 'Môn học'}
              </p>
              <p className="text-xs text-slate-500">Bạn có thể chọn mọi lớp để tiếp tục hoặc tạo dự án mới.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {gradePickerRows.map((grade, idx) => {
              const tone = GRADE_PICKER_TONE[idx % GRADE_PICKER_TONE.length];
              const hasData = grade.count > 0;

              return (
                <button
                  key={grade.gradeCode}
                  type="button"
                  onClick={() => handleSelectGrade(grade.gradeCode)}
                  className={`text-left px-4 py-3.5 rounded-xl border transition-all hover:shadow-sm ${
                    hasData
                      ? `${tone.border} ${tone.bg} hover:translate-y-[-1px]`
                      : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <p className={`text-sm font-semibold ${hasData ? 'text-slate-800' : 'text-slate-500'}`}>{grade.gradeName}</p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <p className="text-xs text-slate-500 whitespace-nowrap">{grade.count} dự án</p>
                    {hasData ? (
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap ${tone.chip}`}>
                        Ưu tiên
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap bg-slate-200 text-slate-600">
                        Tạo mới
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Modal>

      {menuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
      )}
    </div>
  );
}
