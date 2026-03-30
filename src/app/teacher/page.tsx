'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FolderKanban, Layers, Film, ArrowRight, Loader2, Plus } from 'lucide-react';

import AppHeader from '@/components/sidebar/AppHeader';
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

  const displayName =
    (user && 'fullName' in user && (user as any).fullName) ||
    (user && 'email' in user && (user as any).email) ||
    'Giáo viên';

  const isLoading = projectsLoading || productsLoading || videosLoading;

  const stats = {
    projects: projects.length,
    activeProjects: projects.filter((p) => p.status === 0).length,
    slides: allProducts.filter((p) => p.hasSlide).length,
    videos: allVideos.filter((v) => v.status === 'completed').length,
  };

  const sections = [
    {
      href: '/teacher/projects',
      icon: FolderKanban,
      label: 'Dự án',
      description: 'Quản lý dự án bài giảng. Tạo mới, upload tài liệu và bắt đầu tạo nội dung AI.',
      count: stats.projects,
      countLabel: 'dự án',
      gradient: 'from-blue-500 to-indigo-600',
    },
    {
      href: '/teacher/slides',
      icon: Layers,
      label: 'Slide',
      description: 'Xem và chỉnh sửa các bộ slide AI đã tạo từ tài liệu của bạn.',
      count: stats.slides,
      countLabel: 'bộ slide',
      gradient: 'from-violet-500 to-purple-600',
    },
    {
      href: '/teacher/videos',
      icon: Film,
      label: 'Video',
      description: 'Xem lại video bài giảng đã tạo, hoàn chỉnh với tương tác quiz.',
      count: stats.videos,
      countLabel: 'video',
      gradient: 'from-rose-500 to-orange-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* ── Welcome Banner ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-600/20"
        >
          <div className="relative z-10">
            <p className="text-blue-100 text-sm mb-1">Chào mừng trở lại</p>
            <h2 className="text-2xl font-bold">{displayName}</h2>
            <p className="text-blue-200 text-sm mt-1">
              Tạo bài giảng thông minh với AI — từ tài liệu đến video chỉ trong vài bước.
            </p>
            <button
              onClick={() => router.push('/teacher/projects?create=1')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-sm font-medium transition-colors backdrop-blur-sm"
            >
              <Plus className="w-4 h-4" />
              Tạo dự án mới
            </button>
          </div>
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
          <div className="absolute right-12 bottom-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />
        </motion.div>

        {/* ── Stat pills ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Tổng dự án',      value: stats.projects,       color: 'text-blue-600   bg-blue-50'   },
            { label: 'Đang hoạt động',  value: stats.activeProjects,  color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Bộ slide',         value: stats.slides,          color: 'text-violet-600 bg-violet-50' },
            { label: 'Video đã tạo',    value: stats.videos,          color: 'text-rose-600   bg-rose-50'   },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold ${s.color}`}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : s.value}
              </div>
              <p className="text-xs text-gray-500 leading-tight">{s.label}</p>
            </motion.div>
          ))}
        </div>

        {/* ── Section cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {sections.map((section, i) => {
            const Icon = section.icon;
            return (
              <motion.button
                key={section.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.08 }}
                onClick={() => router.push(section.href)}
                className="group text-left bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all overflow-hidden"
              >
                <div className={`h-1.5 bg-gradient-to-r ${section.gradient}`} />
                <div className="p-6">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${section.gradient} flex items-center justify-center mb-4 shadow-sm`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1.5 group-hover:text-blue-600 transition-colors">
                    {section.label}
                  </h3>
                  <p className="text-sm text-gray-500 mb-5 leading-relaxed">{section.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">
                      {isLoading ? '…' : section.count}
                      <span className="text-sm font-normal text-gray-400 ml-1">{section.countLabel}</span>
                    </span>
                    <span className="flex items-center gap-1 text-sm text-blue-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Xem ngay <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </main>
    </div>
  );
}

