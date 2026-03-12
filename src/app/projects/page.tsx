'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  FolderOpen,
  Search,
  MoreVertical,
  Calendar,
  FileText,
  Package,
  Trash2,
  Edit3,
  ChevronDown,
  Home,
  BookOpen,
  Clock,
  Grid3X3,
  List,
  SortAsc,
  X,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

interface Project {
  projectCode: string;
  name: string;
  description: string;
  subject: string;
  grade: string;
  inputDocumentCount: number;
  productCount: number;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'archived';
}

// ── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_PROJECTS: Project[] = [
  {
    projectCode: 'PRJ-001',
    name: 'Toán Đại số lớp 10',
    description: 'Bài giảng về phương trình bậc hai, hệ phương trình và bất phương trình.',
    subject: 'Toán học',
    grade: 'Lớp 10',
    inputDocumentCount: 3,
    productCount: 2,
    createdAt: '2026-03-01',
    updatedAt: '2026-03-10',
    status: 'active',
  },
  {
    projectCode: 'PRJ-002',
    name: 'Vật lý - Động lực học',
    description: 'Chương động lực học chất điểm: Ba định luật Newton và các bài tập ứng dụng.',
    subject: 'Vật lý',
    grade: 'Lớp 10',
    inputDocumentCount: 5,
    productCount: 3,
    createdAt: '2026-02-15',
    updatedAt: '2026-03-08',
    status: 'active',
  },
  {
    projectCode: 'PRJ-003',
    name: 'Ngữ văn - Truyện Kiều',
    description: 'Phân tích các đoạn trích tiêu biểu trong Truyện Kiều của Nguyễn Du.',
    subject: 'Ngữ văn',
    grade: 'Lớp 10',
    inputDocumentCount: 2,
    productCount: 1,
    createdAt: '2026-02-20',
    updatedAt: '2026-03-05',
    status: 'active',
  },
  {
    projectCode: 'PRJ-004',
    name: 'Hóa học - Bảng tuần hoàn',
    description: 'Giới thiệu bảng tuần hoàn các nguyên tố hóa học, cấu hình electron và tính chất tuần hoàn.',
    subject: 'Hóa học',
    grade: 'Lớp 10',
    inputDocumentCount: 4,
    productCount: 0,
    createdAt: '2026-01-10',
    updatedAt: '2026-02-28',
    status: 'active',
  },
  {
    projectCode: 'PRJ-005',
    name: 'Sinh học - Di truyền học',
    description: 'Các quy luật di truyền của Mendel, bài tập lai một tính trạng và hai tính trạng.',
    subject: 'Sinh học',
    grade: 'Lớp 12',
    inputDocumentCount: 6,
    productCount: 4,
    createdAt: '2026-01-05',
    updatedAt: '2026-03-11',
    status: 'active',
  },
  {
    projectCode: 'PRJ-006',
    name: 'Lịch sử - Cách mạng tháng Tám',
    description: 'Hoàn cảnh, diễn biến và ý nghĩa của Cách mạng tháng Tám năm 1945.',
    subject: 'Lịch sử',
    grade: 'Lớp 12',
    inputDocumentCount: 1,
    productCount: 0,
    createdAt: '2026-03-05',
    updatedAt: '2026-03-05',
    status: 'archived',
  },
];

const SUBJECTS = ['Tất cả', 'Toán học', 'Vật lý', 'Hóa học', 'Sinh học', 'Ngữ văn', 'Lịch sử', 'Tiếng Anh'];
const GRADES = ['Tất cả', 'Lớp 10', 'Lớp 11', 'Lớp 12'];

const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Toán học':   { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200' },
  'Vật lý':    { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
  'Hóa học':   { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  'Sinh học':  { bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
  'Ngữ văn':   { bg: 'bg-rose-50',   text: 'text-rose-700',   border: 'border-rose-200' },
  'Lịch sử':  { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'Tiếng Anh': { bg: 'bg-cyan-50',   text: 'text-cyan-700',   border: 'border-cyan-200' },
};

// ── Component ──────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('Tất cả');
  const [selectedGrade, setSelectedGrade] = useState('Tất cả');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  // Filter logic
  const filteredProjects = projects.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSubject = selectedSubject === 'Tất cả' || p.subject === selectedSubject;
    const matchGrade = selectedGrade === 'Tất cả' || p.grade === selectedGrade;
    return matchSearch && matchSubject && matchGrade;
  });

  const handleDelete = (projectCode: string) => {
    setProjects((prev) => prev.filter((p) => p.projectCode !== projectCode));
    setMenuOpen(null);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getSubjectColor = (subject: string) =>
    SUBJECT_COLORS[subject] ?? { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };

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
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm dự án..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>

          {/* Subject Filter */}
          <div className="relative">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all cursor-pointer"
            >
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s === 'Tất cả' ? 'Môn học' : s}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Grade Filter */}
          <div className="relative">
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all cursor-pointer"
            >
              {GRADES.map((g) => (
                <option key={g} value={g}>{g === 'Tất cả' ? 'Khối lớp' : g}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          {/* View Toggle */}
          <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Lưới"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              title="Danh sách"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Stats Summary ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Tổng dự án', value: projects.length, icon: FolderOpen, color: 'blue' },
            { label: 'Tài liệu', value: projects.reduce((s, p) => s + p.inputDocumentCount, 0), icon: FileText, color: 'emerald' },
            { label: 'Sản phẩm AI', value: projects.reduce((s, p) => s + p.productCount, 0), icon: Package, color: 'purple' },
            { label: 'Cập nhật gần đây', value: projects.filter((p) => {
              const diff = Date.now() - new Date(p.updatedAt).getTime();
              return diff < 7 * 24 * 60 * 60 * 1000;
            }).length, icon: Clock, color: 'amber' },
          ].map((stat) => {
            const Icon = stat.icon;
            const colorMap: Record<string, string> = {
              blue: 'bg-blue-50 text-blue-600',
              emerald: 'bg-emerald-50 text-emerald-600',
              purple: 'bg-purple-50 text-purple-600',
              amber: 'bg-amber-50 text-amber-600',
            };
            return (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[stat.color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Projects Grid / List ── */}
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FolderOpen className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Không tìm thấy dự án</h3>
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
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project, idx) => {
                const subjectColor = getSubjectColor(project.subject);
                return (
                  <motion.div
                    key={project.projectCode}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => router.push(`/projects/${project.projectCode}`)}
                    className="group relative bg-white rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-600/5 transition-all cursor-pointer overflow-hidden"
                  >
                    {/* Color accent top bar */}
                    <div className={`h-1.5 ${subjectColor.bg.replace('50', '400')}`} />

                    <div className="p-5">
                      {/* Header row */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {project.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${subjectColor.bg} ${subjectColor.text}`}>
                              {project.subject}
                            </span>
                            <span className="text-xs text-gray-400">{project.grade}</span>
                          </div>
                        </div>

                        {/* Context menu */}
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpen(menuOpen === project.projectCode ? null : project.projectCode);
                            }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>

                          {menuOpen === project.projectCode && (
                            <div className="absolute right-0 top-8 w-40 bg-white border border-gray-200 rounded-xl shadow-xl z-20 py-1 animate-fade-in">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/projects/${project.projectCode}`);
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                Chỉnh sửa
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(project.projectCode);
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Xóa dự án
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed">
                        {project.description}
                      </p>

                      {/* Counts */}
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <FileText className="w-3.5 h-3.5" />
                          <span>{project.inputDocumentCount} tài liệu</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Package className="w-3.5 h-3.5" />
                          <span>{project.productCount} sản phẩm</span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span>Cập nhật {formatDate(project.updatedAt)}</span>
                        </div>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          project.status === 'active'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {project.status === 'active' ? 'Hoạt động' : 'Lưu trữ'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          /* ── List View ── */
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Tên dự án</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Môn học</th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Tài liệu</th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Sản phẩm</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Cập nhật</th>
                  <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.map((project) => {
                  const subjectColor = getSubjectColor(project.subject);
                  return (
                    <tr
                      key={project.projectCode}
                      onClick={() => router.push(`/projects/${project.projectCode}`)}
                      className="border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-900">{project.name}</p>
                        <p className="text-xs text-gray-500 truncate max-w-xs mt-0.5">{project.description}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${subjectColor.bg} ${subjectColor.text}`}>
                          {project.subject}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center text-sm text-gray-600">{project.inputDocumentCount}</td>
                      <td className="px-5 py-4 text-center text-sm text-gray-600">{project.productCount}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">{formatDate(project.updatedAt)}</td>
                      <td className="px-5 py-4 text-center">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          project.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {project.status === 'active' ? 'Hoạt động' : 'Lưu trữ'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(project.projectCode);
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* ── Create Project Modal ── */}
      <CreateProjectModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={(newProject) => {
          setProjects((prev) => [newProject, ...prev]);
          setShowCreateModal(false);
        }}
      />

      {/* Close menu on outside click */}
      {menuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
      )}
    </div>
  );
}

// ── Create Project Modal ───────────────────────────────────────────────────

function CreateProjectModal({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (project: Project) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('Toán học');
  const [grade, setGrade] = useState('Lớp 10');

  const handleSubmit = () => {
    if (!name.trim()) return;
    const now = new Date().toISOString().slice(0, 10);
    onCreate({
      projectCode: `PRJ-${String(Date.now()).slice(-4)}`,
      name: name.trim(),
      description: description.trim(),
      subject,
      grade,
      inputDocumentCount: 0,
      productCount: 0,
      createdAt: now,
      updatedAt: now,
      status: 'active',
    });
    setName('');
    setDescription('');
    setSubject('Toán học');
    setGrade('Lớp 10');
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Tạo dự án mới</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tên dự án <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Toán Đại số lớp 10"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mô tả
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả ngắn gọn nội dung dự án..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Môn học</label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all cursor-pointer"
                  >
                    {SUBJECTS.filter((s) => s !== 'Tất cả').map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Khối lớp</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all cursor-pointer"
                  >
                    {GRADES.filter((g) => g !== 'Tất cả').map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={!name.trim()}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
              >
                Tạo dự án
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
