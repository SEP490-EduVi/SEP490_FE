'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { BookOpen, Upload, Search, Loader2, AlertCircle, FolderOpen, Grid3X3, List, DollarSign, X, Sparkles, ArrowRight } from 'lucide-react';

import { useMyMaterials, useUploadMaterial, useUpdateMaterial, useDeleteMaterial } from '@/hooks/useExpertApi';
import { useSubjects, useGrades } from '@/hooks/useMetadataApi';
import type { MaterialDto, UpdateMaterialInput } from '@/types/api';
import { MaterialCard, MaterialListItem, EditMaterialModal, UploadMaterialForm } from '@/components/expert';
import { AppHeader } from '@/components';
import { notify, GcsImage } from '@/components/common';
import { resolveGcsUrl } from '@/components/common/GcsImage';
import { motion } from 'framer-motion';

function MaterialDetailModal({ material, onClose }: { material: MaterialDto; onClose: () => void }) {
  const [resolvedResourceUrl, setResolvedResourceUrl] = useState<string>('');
  const [resolvingResource, setResolvingResource] = useState(false);
  const [resourceError, setResourceError] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    const resolve = async () => {
      if (!material.resourceUrl) {
        setResolvedResourceUrl('');
        setResourceError('');
        return;
      }

      setResolvingResource(true);
      setResolvedResourceUrl('');
      setResourceError('');
      try {
        const resolved = await resolveGcsUrl(material.resourceUrl);
        if (!mounted) return;
        setResolvedResourceUrl(resolved);
      } catch {
        if (!mounted) return;
        setResourceError('Không thể tải Resource URL để xem trước.');
      } finally {
        if (mounted) setResolvingResource(false);
      }
    };

    void resolve();
    return () => {
      mounted = false;
    };
  }, [material.resourceUrl]);

  const getPreviewKind = () => {
    const source = (resolvedResourceUrl || material.resourceUrl || '').toLowerCase();
    if (material.type === 'video' || /\.(mp4|webm|ogg|mov)(\?|$)/.test(source)) return 'video';
    if (material.type === 'image' || /\.(png|jpg|jpeg|gif|webp|bmp|svg)(\?|$)/.test(source)) return 'image';
    return 'other';
  };

  const previewKind = getPreviewKind();

  const handleOpenResolvedUrl = () => {
    if (!resolvedResourceUrl) return;
    setResourceError('');
    window.open(resolvedResourceUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden"
      >
        <div className="relative h-52 bg-gradient-to-br from-blue-50 to-indigo-100">
          {material.previewUrl ? (
            <GcsImage src={material.previewUrl} alt={material.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-blue-300" />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/55"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">{material.title}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {material.subjectName || '-'} · {material.gradeName || '-'}
              </p>
            </div>
            <p className="text-base font-bold text-blue-700">
              {material.price > 0 ? `${material.price.toLocaleString('vi-VN')} ₫` : 'Miễn phí'}
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm text-gray-700 leading-relaxed">
            {material.description && material.description.trim().toLowerCase() !== 'string'
              ? material.description
              : 'Chưa có mô tả cho tài liệu này.'}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-gray-100 p-3">
              <p className="text-xs text-gray-500 mb-1">Mã tài liệu</p>
              <p className="font-medium text-gray-800 break-all">{material.materialCode}</p>
            </div>
            <div className="rounded-lg border border-gray-100 p-3">
              <p className="text-xs text-gray-500 mb-1">Ngày tạo</p>
              <p className="font-medium text-gray-800">{new Date(material.createdAt).toLocaleString('vi-VN')}</p>
            </div>
            {/* <div className="rounded-lg border border-gray-100 p-3 sm:col-span-2">
              <p className="text-xs text-gray-500 mb-1">Resource URL</p>
              <p className="font-medium text-gray-800 break-all">{material.resourceUrl || '-'}</p>
              {resolvingResource && (
                <p className="mt-2 text-xs text-slate-500 inline-flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Đang tải preview resource...
                </p>
              )}
              {resourceError && <p className="mt-2 text-xs text-red-600">{resourceError}</p>}
            </div> */}
          </div>

          {!!resolvedResourceUrl && (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="text-xs text-gray-500 mb-2">Xem trước resource</p>

              {previewKind === 'image' && (
                <img src={resolvedResourceUrl} alt={material.title} className="w-full max-h-[320px] object-contain rounded-lg bg-white" />
              )}

              {previewKind === 'video' && (
                <video controls className="w-full max-h-[320px] rounded-lg bg-black" src={resolvedResourceUrl} />
              )}

              {previewKind === 'other' && (
                <button
                  type="button"
                  onClick={handleOpenResolvedUrl}
                  className="inline-flex items-center rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Mở file resource
                </button>
              )}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
            >
              Đóng
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

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
  const [detailTarget, setDetailTarget] = useState<MaterialDto | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const filtered = materials.filter(
    (m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.materialCode.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleUpdate = (code: string, input: UpdateMaterialInput) => {
    updateMaterial.mutate(
      { materialCode: code, input },
      {
        onSuccess: () => { setEditTarget(null); notify.success('Cập nhật tài liệu thành công!'); },
        onError: () => notify.error('Không thể cập nhật tài liệu. Vui lòng thử lại.'),
      },
    );
  };

  const handleDelete = (code: string) => {
    deleteMaterial.mutate(code, {
      onSuccess: () => { setConfirmDelete(null); notify.success('Đã xóa tài liệu thành công'); },
      onError: () => notify.error('Không thể xóa tài liệu. Vui lòng thử lại.'),
    });
  };

  const cardProps = (m: MaterialDto) => ({
    material: m,
    confirmDelete,
    isDeleting: deleteMaterial.isPending,
    onViewDetail: () => setDetailTarget(m),
    onEdit: () => setEditTarget(m),
    onDeleteStart: () => setConfirmDelete(m.materialCode),
    onDeleteConfirm: () => handleDelete(m.materialCode),
    onDeleteCancel: () => setConfirmDelete(null),
  });

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_0%,#dbeafe_0%,#f8fafc_42%,#eef2ff_100%)]">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 sm:p-8 text-white shadow-xl shadow-blue-900/20 mb-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(255,255,255,0.24),transparent_42%)]" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Expert Material Studio
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Không gian quản lý học liệu</h1>
            <p className="text-blue-100 mt-2 max-w-2xl text-sm sm:text-base">
              Tải lên, theo dõi trạng thái duyệt và tối ưu chất lượng tài liệu của bạn trong một giao diện trực quan, nhất quán.
            </p>
          </div>
          <div className="absolute -right-10 -top-12 w-44 h-44 bg-white/10 rounded-full" />
          <div className="absolute -right-8 -bottom-14 w-64 h-64 bg-white/10 rounded-full" />
        </div>

        {showForm && (
          <UploadMaterialForm
            subjects={subjects}
            grades={grades}
            subjectsLoading={subjectsLoading}
            gradesLoading={gradesLoading}
            isUploading={uploadMaterial.isPending}
            onUpload={(data) => uploadMaterial.mutate(data, {
              onSuccess: () => { setShowForm(false); notify.success('Tải lên tài liệu thành công!'); },
              onError: () => notify.error('Tải lên thất bại. Vui lòng thử lại.'),
            })}
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
              className="w-full pl-10 pr-4 py-2.5 bg-white/90 border border-blue-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-colors text-sm font-semibold whitespace-nowrap"
          >
            <Upload className="w-4 h-4" /> Tải lên tài liệu
          </button>
          <div className="flex items-center bg-white/90 border border-blue-100 rounded-xl overflow-hidden">
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
            <div key={label} className="bg-white/85 backdrop-blur rounded-2xl border border-blue-100 p-4 flex items-center gap-3 shadow-sm">
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
              <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold shadow-md shadow-blue-600/20">
                <Upload className="w-4 h-4" /> Tải lên tài liệu <ArrowRight className="w-4 h-4" />
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
        {detailTarget && (
          <MaterialDetailModal
            material={detailTarget}
            onClose={() => setDetailTarget(null)}
          />
        )}
      </AnimatePresence>

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