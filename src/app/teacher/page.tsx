'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderKanban, Layers, Film, ArrowRight, Loader2, Plus, Clock3, ChevronRight, ChevronDown, BookOpen, GraduationCap } from 'lucide-react';

import AppHeader from '@/components/sidebar/AppHeader';
import Modal from '@/components/common/Modal';
import { useSubjects, useGrades } from '@/hooks/useMetadataApi';
import { useProjects } from '@/hooks/useProjectApi';
import { useAllProducts } from '@/hooks/useProductApi';
import { useAllVideos } from '@/hooks/usePipelineApi';
import { useAuthStore } from '@/store/useAuthStore';

export default function TeacherDashboard() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: allProducts = [], isLoading: productsLoading } = useAllProducts();
  const { data: allVideos = [], isLoading: videosLoading } = useAllVideos();
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const { data: grades = [], isLoading: gradesLoading } = useGrades();

  const [showCreatePicker, setShowCreatePicker] = useState(false);
  const [subjectCode, setSubjectCode] = useState('');
  const [gradeCode, setGradeCode] = useState('');
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showGradePicker, setShowGradePicker] = useState(false);

  const highSchoolGrades = useMemo(() => {
    const hs = grades.filter((g) => /(10|11|12)/.test(`${g.gradeName} ${g.gradeCode}`));
    return hs.length > 0 ? hs : grades;
  }, [grades]);

  const displayName =
    (user && 'fullName' in user && (user as any).fullName) ||
    (user && 'email' in user && (user as any).email) ||
    'Giáo viên';

  const isLoading = projectsLoading || productsLoading || videosLoading;

  const relativeTime = (iso?: string) => {
    if (!iso) return 'Cập nhật gần đây';
    const diff = Date.now() - new Date(iso).getTime();
    if (Number.isNaN(diff) || diff < 0) return 'Cập nhật gần đây';
    const min = Math.floor(diff / 60000);
    if (min < 1) return 'Vừa xong';
    if (min < 60) return `${min} phút trước`;
    const hour = Math.floor(min / 60);
    if (hour < 24) return `${hour} giờ trước`;
    const day = Math.floor(hour / 24);
    if (day < 30) return `${day} ngày trước`;
    return new Date(iso).toLocaleDateString('vi-VN');
  };

  const stats = {
    projects: projects.length,
    projectsThisMonth: projects.filter((p) => {
      if (!p.createdAt) return false;
      const d = new Date(p.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length,
    slides: allProducts.filter((p) => p.hasSlide).length,
    videos: allVideos.filter((v) => v.status === 'completed').length,
  };

  const statCards = [
    {
      label: 'Tổng dự án',
      value: stats.projects,
      color: 'text-blue-600 bg-blue-50',
      href: '/teacher/projects',
      hint: 'Toàn bộ dự án theo môn và lớp',
    },
    {
      label: 'Dự án tháng này',
      value: stats.projectsThisMonth,
      color: 'text-emerald-600 bg-emerald-50',
      href: '/teacher/projects',
      hint: 'Số dự án được tạo trong tháng hiện tại',
    },
    {
      label: 'Bộ slide',
      value: stats.slides,
      color: 'text-violet-600 bg-violet-50',
      href: '/teacher/slides',
      hint: 'Slide đã tạo để chỉnh sửa nhanh',
    },
    {
      label: 'Video đã tạo',
      value: stats.videos,
      color: 'text-rose-600 bg-rose-50',
      href: '/teacher/videos',
      hint: 'Video sẵn sàng để xem lại',
    },
  ] as const;

  const sections = [
    {
      href: '/teacher/material-lib',
      icon: FolderKanban,
      label: 'Thư viện học liệu',
      description: 'Quản lý môn, lớp và tiếp tục các dự án đang biên soạn.',
    },
    {
      href: '/teacher/slides',
      icon: Layers,
      label: 'Thư viện slide',
      description: 'Mở nhanh các bộ slide để chỉnh sửa và hoàn thiện nội dung.',
    },
    {
      href: '/teacher/videos',
      icon: Film,
      label: 'Danh sách video',
      description: 'Theo dõi video đã tạo và kiểm tra chất lượng bài giảng.',
    },
  ];

  const recentProjects = useMemo(() => {
    return [...projects]
      .sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      })
      .slice(0, 3);
  }, [projects]);

  const handleStartCreateProject = () => {
    if (!subjectCode || !gradeCode) return;
    const params = new URLSearchParams({
      subjectCode,
      gradeCode,
      create: '1',
    });
    setShowCreatePicker(false);
    router.push(`/teacher/projects?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* ── Welcome Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl px-5 py-3.5 sm:px-6 sm:py-4 text-white shadow-lg shadow-blue-600/20"
        >
          <div className="relative z-10 min-h-[84px] flex items-center gap-3">
            <div>
              <p className="text-blue-100 text-xs sm:text-sm mb-0.5">Chào mừng trở lại</p>
              <h2 className="text-[24px] leading-tight font-bold tracking-tight">{displayName}</h2>
              <p className="text-blue-200 text-xs sm:text-sm mt-1">
                Tiếp tục bài giảng đang dở hoặc tạo dự án mới trong 1 bước.
              </p>
            </div>
          </div>
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute right-12 bottom-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />
        </motion.div>

        {/* ── Stat pills ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all"
            >
              <button
                type="button"
                onClick={() => router.push(s.href)}
                className="w-full p-4 flex items-center gap-3 text-left"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold ${s.color}`}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : s.value}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-500 leading-tight">{s.label}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5 truncate">{s.hint}</p>
                </div>
              </button>
            </motion.div>
          ))}
        </div>

        {/* ── Recent activity + quick actions ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-900">Tiếp tục gần đây</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCreatePicker(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tạo dự án mới
                </button>
                <button
                  onClick={() => router.push('/teacher/projects')}
                  className="text-sm text-blue-600 font-medium hover:text-blue-700"
                >
                  Xem tất cả
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {recentProjects.length > 0 ? recentProjects.map((project) => (
                <button
                  key={project.projectCode}
                  type="button"
                  onClick={() => router.push(`/teacher/${project.projectCode}`)}
                  className="w-full text-left px-3.5 py-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[15px] font-semibold text-slate-900 truncate">{project.projectName}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {(project.subjectName ?? project.subjectCode ?? 'Chưa rõ môn')} • {(project.gradeName ?? project.gradeCode ?? 'Chưa rõ lớp')}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 whitespace-nowrap">
                      <Clock3 className="w-3.5 h-3.5" />
                      {relativeTime(project.createdAt)}
                    </span>
                  </div>
                </button>
              )) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
                  <p className="text-sm font-medium text-slate-700">Chưa có hoạt động gần đây</p>
                  <p className="text-xs text-slate-500 mt-1">Tạo dự án đầu tiên để bắt đầu luồng làm việc.</p>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="bg-white rounded-2xl border border-gray-100 p-5"
          >
            <h3 className="text-base font-semibold text-slate-900 mb-1">Đi nhanh tới</h3>
            <p className="text-xs text-slate-500 mb-3">Lối tắt tác vụ</p>
            <div className="space-y-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.href}
                    type="button"
                    onClick={() => router.push(section.href)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 transition-all text-left"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className="text-sm font-medium text-slate-800 truncate">{section.label}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      </main>

      <Modal
        isOpen={showCreatePicker}
        onClose={() => setShowCreatePicker(false)}
        title="Tạo dự án mới"
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setShowCreatePicker(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleStartCreateProject}
              disabled={!subjectCode || !gradeCode || subjectsLoading || gradesLoading}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Tiếp tục
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Chọn môn học và khối lớp trước, sau đó hệ thống sẽ chuyển tới đúng thư mục để bạn chỉ cần nhập tên dự án.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Môn học <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => { if (!subjectsLoading) setShowSubjectPicker((v) => !v); }}
                disabled={subjectsLoading}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${showSubjectPicker ? 'border-blue-400' : 'border-gray-200'} bg-white hover:border-blue-300 transition-colors text-left disabled:opacity-50`}
              >
                <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <span className="flex-1 text-sm font-medium text-gray-700 truncate">
                  {subjectsLoading
                    ? 'Đang tải...'
                    : subjectCode
                    ? subjects.find((s) => s.subjectCode === subjectCode)?.subjectName ?? subjectCode
                    : '-- Chọn môn học --'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${showSubjectPicker ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showSubjectPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 z-20 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-y-auto max-h-52"
                  >
                    {subjects.map((s) => (
                      <button
                        key={s.subjectCode}
                        type="button"
                        onClick={() => { setSubjectCode(s.subjectCode); setShowSubjectPicker(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-blue-50 ${
                          subjectCode === s.subjectCode ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="w-6 h-6 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-3 h-3 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${subjectCode === s.subjectCode ? 'text-blue-600' : 'text-gray-700'}`}>{s.subjectName}</p>
                          <p className="text-[11px] text-gray-400">{s.subjectCode}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Khối lớp <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => { if (!gradesLoading) setShowGradePicker((v) => !v); }}
                disabled={gradesLoading}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border ${showGradePicker ? 'border-blue-400' : 'border-gray-200'} bg-white hover:border-blue-300 transition-colors text-left disabled:opacity-50`}
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                </div>
                <span className="flex-1 text-sm font-medium text-gray-700 truncate">
                  {gradesLoading
                    ? 'Đang tải...'
                    : gradeCode
                    ? highSchoolGrades.find((g) => g.gradeCode === gradeCode)?.gradeName ?? gradeCode
                    : '-- Chọn khối lớp --'}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${showGradePicker ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showGradePicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full left-0 right-0 z-20 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-y-auto max-h-52"
                  >
                    {highSchoolGrades.map((g) => (
                      <button
                        key={g.gradeCode}
                        type="button"
                        onClick={() => { setGradeCode(g.gradeCode); setShowGradePicker(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-blue-50 ${
                          gradeCode === g.gradeCode ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center flex-shrink-0">
                          <GraduationCap className="w-3 h-3 text-indigo-400" />
                        </div>
                        <div className="min-w-0">
                          <p className={`text-sm font-medium truncate ${gradeCode === g.gradeCode ? 'text-blue-600' : 'text-gray-700'}`}>{g.gradeName}</p>
                          <p className="text-[11px] text-gray-400">{g.gradeCode}</p>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

