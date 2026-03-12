'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import {
  Plus,
  FolderOpen,
  Search,
  Home,
  BookOpen,
  Grid3X3,
  List,
  Loader2,
  AlertCircle,
} from 'lucide-react';

import { useProjects, useCreateProject, useDeleteProject, useUpdateProject } from '@/hooks/useProjectApi';
import { useProducts } from '@/hooks/useProductApi';
import { usePipelineHub } from '@/hooks/usePipelineHub';
import type { PipelineProgress } from '@/types/api';
import ProjectCard from '@/components/projects/ProjectCard';
import ProjectListTable from '@/components/projects/ProjectListTable';
import ProjectStatsBar from '@/components/projects/ProjectStatsBar';
import CreateProjectModal from '@/components/projects/CreateProjectModal';
import EditProjectModal from '@/components/projects/EditProjectModal';
import type { ProjectDto, UpdateProjectInput } from '@/types/api';

export default function ProjectsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [editTarget, setEditTarget] = useState<ProjectDto | null>(null);
  const [pipelineProgress, setPipelineProgress] = useState<PipelineProgress | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // ── Đọc token sau khi mount (tránh SSR hydration error) ────────────────────────
  useEffect(() => {
    setAccessToken(localStorage.getItem('accessToken'));
  }, []);

  usePipelineHub({
    accessToken,
    onProgress: (event) => {
      console.log('[Pipeline]', event.step, event.progress + '%', event.detail);
      setPipelineProgress(event);
      if (event.status === 'completed' || event.status === 'failed') {
        setTimeout(() => setPipelineProgress(null), 3000);
      }
    },
  });

  // ── API hooks ────────────────────────────────────────────────────────────
  const { data: projects = [], isLoading, isError, error } = useProjects();
  const { data: products = [] } = useProducts();
  const createProject = useCreateProject();
  const deleteProject = useDeleteProject();
  const updateProject = useUpdateProject();

  // ── Filter ───────────────────────────────────────────────────────────────
  const filteredProjects = projects.filter((p) =>
    p.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.projectCode.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreate = (data: { projectCode: string; projectName: string }) => {
    createProject.mutate(data, {
      onSuccess: () => setShowCreateModal(false),
    });
  };

  const handleDelete = (projectCode: string) => {
    deleteProject.mutate(projectCode);
    setMenuOpen(null);
  };

  const handleEdit = (project: ProjectDto) => {
    setEditTarget(project);
    setMenuOpen(null);
  };

  const handleUpdateProject = (projectCode: string, input: UpdateProjectInput) => {
    updateProject.mutate(
      { projectCode, input },
      { onSuccess: () => setEditTarget(null) },
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Trang chủ"
            >
              <Home className="w-5 h-5 text-gray-600" />
            </button>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Dự án của tôi</h1>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.97] transition-all shadow-lg shadow-blue-600/25 font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Tạo dự án mới
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ── Filters Bar ── */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm dự án theo tên hoặc mã..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>

          <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
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
        </div>

        {/* ── Stats ── */}
        <ProjectStatsBar projects={projects} products={products} />

        {/* ── Loading ── */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
            <p className="text-sm text-gray-500">Đang tải danh sách dự án...</p>
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
        {!isLoading && !isError && filteredProjects.length === 0 && (
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

        {/* ── Grid View ── */}
        {!isLoading && !isError && filteredProjects.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project, idx) => (
                <ProjectCard
                  key={project.projectCode}
                  project={project}
                  index={idx}
                  menuOpen={menuOpen === project.projectCode}
                  onMenuToggle={() =>
                    setMenuOpen(menuOpen === project.projectCode ? null : project.projectCode)
                  }
                  onClick={() => router.push(`/projects/${project.projectCode}`)}
                  onEdit={() => handleEdit(project)}
                  onDelete={() => handleDelete(project.projectCode)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* ── List View ── */}
        {!isLoading && !isError && filteredProjects.length > 0 && viewMode === 'list' && (
          <ProjectListTable
            projects={filteredProjects}
            onClickProject={(code) => router.push(`/projects/${code}`)}
            onDelete={handleDelete}
            isDeleting={deleteProject.isPending ? (deleteProject.variables as string) : null}
          />
        )}
      </main>

      {/* ── Modals ── */}
      <CreateProjectModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreate}
        isLoading={createProject.isPending}
      />

      <EditProjectModal
        open={!!editTarget}
        project={editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleUpdateProject}
        isLoading={updateProject.isPending}
      />

      {/* Close menu on outside click */}
      {menuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
      )}

      {/* ── Pipeline Progress Banner ── */}
      {pipelineProgress && (
        <div className="fixed bottom-6 right-6 z-50 w-80 bg-white border border-slate-200 rounded-xl shadow-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-800">
              {pipelineProgress.status === 'completed' && '✅ Hoàn thành!'}
              {pipelineProgress.status === 'failed' && '❌ Có lỗi xảy ra'}
              {(pipelineProgress.status === 'queued' || pipelineProgress.status === 'processing') && '⚙️ Đang xử lý...'}
            </p>
            <button
              onClick={() => setPipelineProgress(null)}
              className="text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                pipelineProgress.status === 'failed' ? 'bg-red-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${pipelineProgress.progress}%` }}
            />
          </div>

          {pipelineProgress.detail && (
            <p className="text-xs text-slate-500">{pipelineProgress.detail}</p>
          )}
          {pipelineProgress.status === 'failed' && pipelineProgress.error && (
            <p className="text-xs text-red-500">{pipelineProgress.error}</p>
          )}
          {pipelineProgress.status === 'completed' && (
            <p className="text-xs text-slate-400">
              Dữ liệu đã sẵn sàng, hãy mở sản phẩm để xem kết quả.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
