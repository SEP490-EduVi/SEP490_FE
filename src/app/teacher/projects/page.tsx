'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Plus,
  FolderOpen,
  Search,
  Grid3X3,
  List,
  Loader2,
  AlertCircle,
} from 'lucide-react';

import { useProjects, useCreateProject, useDeleteProject, useUpdateProject } from '@/hooks/useProjectApi';
import { useSubjects, useGrades } from '@/hooks/useMetadataApi';
import AppHeader from '@/components/sidebar/AppHeader';
import { Breadcrumb, notify, MSGS } from '@/components/common';
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
import type { ProjectDto, UpdateProjectInput } from '@/types/api';

export default function TeacherProjectsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedSubjectCode = searchParams.get('subjectCode') ?? '';
  const selectedGradeCode = searchParams.get('gradeCode') ?? '';

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 5;
  const [showCreateModal, setShowCreateModal] = useState(false);
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
        const type: 'evaluation' | 'slides' | 'video' = stored
          ? (stored.key.startsWith('video:') ? 'video' : stored.key.startsWith('slides:') ? 'slides' : 'evaluation')
          : (event.step?.includes('video') ? 'video'
            : (event.step?.includes('slide') || event.step?.includes('generating') || event.step?.includes('planning') || event.step?.includes('assembling')) ? 'slides'
            : 'evaluation');
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

  const level: 'subject' | 'project' = selectedSubjectCode && selectedGradeCode ? 'project' : 'subject';

  // Active grade tab: use URL gradeCode, or fall back to first loaded grade
  const activeGradeTabCode = useMemo(
    () => selectedGradeCode || (highSchoolGrades[0]?.gradeCode ?? ''),
    [selectedGradeCode, highSchoolGrades],
  );

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

  const subjectGradeProjectCount = useMemo(() => {
    const stats: Record<string, number> = {};
    for (const p of projects) {
      if (!p.subjectCode || !p.gradeCode) continue;
      const key = `${p.subjectCode}:${p.gradeCode}`;
      stats[key] = (stats[key] ?? 0) + 1;
    }
    return stats;
  }, [projects]);

  // Subjects visible under the active grade tab, sorted by project count desc
  const gradeTabSubjects = useMemo(() => {
    return filteredSubjects
      .map((s) => ({
        ...s,
        count: subjectGradeProjectCount[`${s.subjectCode}:${activeGradeTabCode}`] ?? 0,
      }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.subjectName.localeCompare(b.subjectName, 'vi');
      });
  }, [filteredSubjects, subjectGradeProjectCount, activeGradeTabCode]);

  useEffect(() => { setPage(1); }, [searchQuery, level]);

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
      onSuccess: () => { setShowCreateModal(false); notify.success(MSGS.project.createSuccess(data.projectName)); },
      onError: () => notify.error(MSGS.project.createError),
    });
  };

  const handleDelete = (projectCode: string) => {
    deleteProject.mutate(projectCode, {
      onSuccess: () => notify.success(MSGS.project.deleteSuccess),
      onError:   () => notify.error(MSGS.project.deleteError),
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
      { onSuccess: () => { setEditTarget(null); notify.success(MSGS.project.updateSuccess); }, onError: () => notify.error(MSGS.project.updateError) },
    );
  };

  const breadcrumbItems = [
    { label: 'Dự án', href: level === 'project' ? '/teacher/projects' : undefined },
    ...(level === 'project' && selectedGrade ? [{ label: selectedGrade.gradeName, href: `/teacher/projects?gradeCode=${encodeURIComponent(selectedGradeCode)}` }] : []),
    ...(level === 'project' && selectedSubject ? [{ label: selectedSubject.subjectName }] : []),
  ];

  const searchPlaceholder =
    level === 'subject'
      ? 'Tìm môn học...'
      : 'Tìm kiếm dự án theo tên hoặc mã...';

  const projectCountLabel = `${scopedProjects.length} dự án`;

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
              {gradeTabSubjects.length}/{subjects.length} môn học
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

        {/* ── Grade tabs + Subject grid (level 1) ── */}
        {!isLoading && !isError && level === 'subject' && (
          <div className="space-y-5">
            {/* Grade tabs */}
            {(gradesLoading || highSchoolGrades.length > 0) && (
              <div className="flex items-center gap-1 border-b border-gray-200">
                {gradesLoading
                  ? [1, 2, 3].map((n) => (
                      <div key={n} className="h-9 w-20 mx-1 mb-[-1px] rounded-t-lg bg-gray-100 animate-pulse" />
                    ))
                  : highSchoolGrades.map((grade) => {
                      const isActive = grade.gradeCode === activeGradeTabCode;
                      // Count total projects across all subjects for this grade
                      const gradeTotal = projects.filter((p) => p.gradeCode === grade.gradeCode).length;
                      return (
                        <button
                          key={grade.gradeCode}
                          type="button"
                          onClick={() =>
                            router.push(
                              grade.gradeCode !== selectedGradeCode
                                ? `/teacher/projects?gradeCode=${encodeURIComponent(grade.gradeCode)}`
                                : '/teacher/projects',
                            )
                          }
                          className={`relative flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium border-b-2 mb-[-1px] transition-all ${
                            isActive
                              ? 'border-blue-600 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {grade.gradeName}
                          {gradeTotal > 0 && (
                            <span
                              className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold ${
                                isActive
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {gradeTotal}
                            </span>
                          )}
                        </button>
                      );
                    })}
              </div>
            )}

            {/* Subject list for active grade */}
            {subjectsLoading ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : gradeTabSubjects.length === 0 ? (
              <div className="text-center py-16">
                <FolderOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Không tìm thấy môn học nào</p>
              </div>
            ) : (
              <>
                {gradeTabSubjects.some((s) => s.count > 0) && (
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                    {gradeTabSubjects.filter((s) => s.count > 0).length} môn có dự án
                  </p>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                  {gradeTabSubjects.map((subject, idx) => (
                    <FolderTile
                      key={subject.subjectCode}
                      label={subject.subjectName}
                      index={idx}
                      subtitle={
                        subject.count > 0
                          ? `${subject.count} dự án`
                          : 'Chưa có dự án'
                      }
                      badge={subject.count > 0 ? `${subject.count} dự án` : undefined}
                      variant="compact"
                      tone={subject.count > 0 ? 'color' : 'neutral'}
                      colorKey={subject.subjectCode}
                      onClick={() =>
                        router.push(buildProjectsPath(subject.subjectCode, activeGradeTabCode))
                      }
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Grid View ── */}
        {!isLoading && !isError && level === 'project' && filteredProjects.length > 0 && viewMode === 'grid' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Create new card — always first */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0 }}
              >
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="group w-full bg-white border-2 border-dashed border-slate-200 rounded-2xl overflow-hidden hover:border-blue-400 hover:bg-blue-50/20 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-center h-28">
                    <div className="w-12 h-12 rounded-full bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                      <Plus className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                  </div>
                  <div className="px-4 py-3 border-t border-slate-100">
                    <p className="text-sm font-medium text-slate-500 group-hover:text-blue-600 transition-colors">
                      Tạo dự án mới
                    </p>
                  </div>
                </button>
              </motion.div>

              <AnimatePresence mode="popLayout">
                {pagedProjects.map((project, idx) => (
                  <ProjectCard
                    key={project.projectCode}
                    project={project}
                    index={idx + 1}
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
            {totalPages > 1 && (
              <>
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
              </>
            )}
          </>
        )}

        {/* ── List View ── */}
        {!isLoading && !isError && level === 'project' && filteredProjects.length > 0 && viewMode === 'list' && (
          <>
            <ProjectListTable
              projects={pagedProjects}
              onClickProject={(code) => router.push(`/teacher/${code}?subjectCode=${encodeURIComponent(selectedSubjectCode)}&gradeCode=${encodeURIComponent(selectedGradeCode)}`)}
              onDelete={handleDelete}
              onEdit={handleEdit}
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

      {menuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
      )}
    </div>
  );
}
