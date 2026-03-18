'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AnimatePresence } from 'framer-motion';
import { BookOpen, Upload, Search, ShieldCheck, Loader2, AlertCircle, FolderOpen, Home, Grid3X3, List, DollarSign } from 'lucide-react';

import { useMyMaterials, useUploadMaterial, useUpdateMaterial, useDeleteMaterial } from '@/hooks/useExpertApi';
import { useSubjects, useGrades } from '@/hooks/useMetadataApi';
import type { MaterialDto, UpdateMaterialInput } from '@/types/api';
import { MaterialCard, MaterialListItem, EditMaterialModal, UploadMaterialForm } from '@/components/expert';

export default function MaterialPage() {
  const { data: materials = [], isLoading, isError, error } = useMyMaterials();
  const uploadMaterial = useUploadMaterial();
  const updateMaterial = useUpdateMaterial();
  const deleteMaterial = useDeleteMaterial();
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const { data: grades = [], isLoading: gradesLoading } = useGrades();

  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<MaterialDto | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = materials.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.materialCode.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleUpdate = (code: string, input: UpdateMaterialInput) => {
    updateMaterial.mutate({ materialCode: code, input }, { onSuccess: () => setEditTarget(null) });
  };

  const handleDelete = (code: string) => {
    deleteMaterial.mutate(code, { onSuccess: () => setConfirmDelete(null) });
  };

  const cardProps = (m: MaterialDto) => ({
    material: m,
    confirmDelete,
    isDeleting: deleteMaterial.isPending,
    onEdit: () => setEditTarget(m),
    onDeleteStart: () => setConfirmDelete(m.materialCode),
    onDeleteConfirm: () => handleDelete(m.materialCode),
    onDeleteCancel: () => setConfirmDelete(null),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Trang chủ">
              <Home className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Tài liệu của tôi</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/expert/certificate" className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors">
              <ShieldCheck className="w-4 h-4" /> Chứng chỉ
            </Link>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.97] transition-all shadow-lg shadow-blue-600/25 font-medium text-sm"
            >
              <Upload className="w-4 h-4" /> Tải lên tài liệu
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {showForm && (
          <UploadMaterialForm
            subjects={subjects}
            grades={grades}
            subjectsLoading={subjectsLoading}
            gradesLoading={gradesLoading}
            isUploading={uploadMaterial.isPending}
            onUpload={(data) => uploadMaterial.mutate(data, { onSuccess: () => setShowForm(false) })}
            onCancel={() => setShowForm(false)}
          />
        )}

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm tài liệu theo tên hoặc mã..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>
          <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
            {(['grid', 'list'] as const).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)} className={`p-2.5 transition-colors ${viewMode === mode ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}>
                {mode === 'grid' ? <Grid3X3 className="w-4 h-4" /> : <List className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Tổng tài liệu', value: materials.length, color: 'text-blue-600 bg-blue-50', icon: BookOpen },
            { label: 'Chờ duyệt', value: materials.filter((m) => m.approvalStatus === 0).length, color: 'text-amber-600 bg-amber-50', icon: BookOpen },
            { label: 'Đã duyệt', value: materials.filter((m) => m.approvalStatus === 1).length, color: 'text-emerald-600 bg-emerald-50', icon: BookOpen },
            { label: 'Có phí', value: materials.filter((m) => m.price > 0).length, color: 'text-purple-600 bg-purple-50', icon: DollarSign },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></div>
              <div><p className="text-lg font-bold text-gray-900">{value}</p><p className="text-xs text-gray-500">{label}</p></div>
            </div>
          ))}
        </div>

        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
            <p className="text-sm text-gray-500">Đang tải danh sách tài liệu...</p>
          </div>
        )}
        {isError && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4"><AlertCircle className="w-8 h-8 text-red-400" /></div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Không thể tải dữ liệu</h3>
            <p className="text-sm text-gray-500">{(error as Error)?.message || 'Đã xảy ra lỗi.'}</p>
          </div>
        )}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4"><FolderOpen className="w-10 h-10 text-gray-300" /></div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">{searchQuery ? 'Không tìm thấy tài liệu' : 'Chưa có tài liệu nào'}</h3>
            <p className="text-sm text-gray-500 mb-6">{searchQuery ? 'Thử thay đổi từ khóa tìm kiếm' : 'Hãy tải lên tài liệu đầu tiên!'}</p>
            {!searchQuery && (
              <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium">
                <Upload className="w-4 h-4" /> Tải lên tài liệu
              </button>
            )}
          </div>
        )}

        {!isLoading && !isError && filtered.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence mode="popLayout">
              {filtered.map((m) => <MaterialCard key={m.materialCode} {...cardProps(m)} />)}
            </AnimatePresence>
          </div>
        )}
        {!isLoading && !isError && filtered.length > 0 && viewMode === 'list' && (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((m) => <MaterialListItem key={m.materialCode} {...cardProps(m)} />)}
            </AnimatePresence>
          </div>
        )}
      </main>

      <AnimatePresence>
        {editTarget && (
          <EditMaterialModal
            material={editTarget}
            onClose={() => setEditTarget(null)}
            onSave={handleUpdate}
            isLoading={updateMaterial.isPending}
            subjects={subjects.map((s) => ({ code: s.subjectCode, name: s.subjectName }))}
            grades={grades.map((g) => ({ code: g.gradeCode, name: g.gradeName }))}
            subjectsLoading={subjectsLoading}
            gradesLoading={gradesLoading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}