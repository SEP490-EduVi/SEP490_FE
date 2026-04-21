// src/components/projects/ProductMaterialsSection.tsx
'use client';

import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Upload, ShoppingBag, Loader2, Trash2, FileText, ImageIcon, Film, Music,
  Check, Plus, X, ChevronDown,
} from 'lucide-react';
import { useProductMaterials, useAddProductMaterial, useDeleteProductMaterial } from '@/hooks/useProductMaterialApi';
import { usePurchasedMaterials } from '@/hooks/useMaterialShopApi';
import { uploadMaterialFilesToGcs } from '@/services/gcsServices';
import { useAuthStore } from '@/store/useAuthStore';
import { notify, MSGS } from '@/components/common';
import { GcsImage } from '@/components/common/GcsImage';
import type { ProductDto } from '@/types/api';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function detectType(file: File): string {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'document';
}

function MaterialIcon({ type, className }: { type: string; className?: string }) {
  if (type === 'image') return <ImageIcon className={className} />;
  if (type === 'video') return <Film className={className} />;
  if (type === 'audio') return <Music className={className} />;
  return <FileText className={className} />;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface ProductMaterialsSectionProps {
  productCode?: string;
  products?: ProductDto[];
  selectedProductCode?: string;
  onSelectProduct?: (code: string) => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProductMaterialsSection({
  productCode,
  products,
  selectedProductCode,
  onSelectProduct,
}: ProductMaterialsSectionProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Upload modal state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const user = useAuthStore((s) => s.user);
  const { data: materials = [], isLoading } = useProductMaterials(productCode);
  const addMaterial = useAddProductMaterial(productCode ?? '');
  const deleteMaterial = useDeleteProductMaterial(productCode ?? '');
  const { data: purchased = [] } = usePurchasedMaterials();

  const uploadedItems = materials.filter((m) => m.sourceType === 'Upload');
  const marketplaceItems = materials.filter((m) => m.sourceType === 'Marketplace');
  const addedCodes = new Set(materials.filter((m) => m.materialCode).map((m) => m.materialCode!));

  // ─── Upload handlers ──────────────────────────────────────────────────────
  const pickFile = (file: File) => {
    setUploadFile(file);
    if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^.]+$/, ''));
  };

  const resetUpload = () => {
    setUploadFile(null);
    setUploadTitle('');
    setDragOver(false);
    setShowUploadModal(false);
  };

  const handleUploadSubmit = async () => {
    if (!uploadFile || !uploadTitle.trim()) return;
    setIsUploading(true);
    try {
      const { resourceUrl, previewUrl } = await uploadMaterialFilesToGcs({
        file: uploadFile,
        userId: user?.userId,
      });
      await addMaterial.mutateAsync({
        sourceType: 'Upload',
        title: uploadTitle.trim(),
        type: detectType(uploadFile),
        resourceUrl,
        previewUrl: previewUrl ?? undefined,
      });
      notify.success(MSGS.material.productMaterial.uploadSuccess(uploadTitle));
      resetUpload();
    } catch {
      notify.error(MSGS.material.productMaterial.uploadError);
    } finally {
      setIsUploading(false);
    }
  };

  // ─── Delete handler ───────────────────────────────────────────────────────
  const handleDelete = (code: string) => {
    deleteMaterial.mutate(code, {
      onSuccess: () => { notify.success(MSGS.material.productMaterial.deleteSuccess); setDeleteConfirm(null); },
      onError: () => notify.error(MSGS.material.productMaterial.deleteError),
    });
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 pt-4 border-t border-gray-200">

      {/* ── Section title + product picker ─────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Học liệu</h2>
        {products && products.length > 1 && onSelectProduct && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProductPicker((v) => !v)}
              className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:text-blue-700"
            >
              <span className="max-w-[120px] truncate">
                {products.find((p) => p.productCode === selectedProductCode)?.productName ?? 'Chọn bài'}
              </span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showProductPicker ? 'rotate-180' : ''}`} />
            </button>
            {showProductPicker && (
              <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden min-w-[160px]">
                {products.map((p) => (
                  <button
                    key={p.productCode}
                    type="button"
                    onClick={() => { onSelectProduct(p.productCode); setShowProductPicker(false); }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-blue-50 transition-colors ${
                      p.productCode === selectedProductCode ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700'
                    }`}
                  >
                    {p.productName}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {!productCode ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center mb-2">
            <ShoppingBag className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">Phân tích giáo án để<br />bắt đầu thêm học liệu</p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* ── Sub-section 1: Từ máy tính ────────────────────── */}
          <div className="flex flex-col min-h-0 flex-1 mb-3">
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Từ máy tính</h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-sm"
              >
                <Plus className="w-3 h-3" /> Thêm
              </button>
            </div>

            {uploadedItems.length === 0 ? (
              <p className="text-xs text-gray-400 py-2 text-center flex-shrink-0">Chưa có học liệu nào</p>
            ) : (
              <div className="space-y-1.5 flex-1 overflow-y-auto min-h-0 pr-0.5">
                <AnimatePresence initial={false}>
                  {uploadedItems.map((m) => (
                    <MaterialItem
                      key={m.productMaterialCode}
                      code={m.productMaterialCode}
                      title={m.title}
                      type={m.type}
                      previewUrl={m.previewUrl}
                      resourceUrl={m.resourceUrl}
                      iconColor="text-blue-500"
                      deleteConfirm={deleteConfirm}
                      onDeleteConfirm={setDeleteConfirm}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* ── Sub-section 2: Đã mua ─────────────────────────── */}
          <div className="flex flex-col min-h-0 flex-1">
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Đã mua</h3>
              <button
                type="button"
                onClick={() => setShowMarketplaceModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium transition-colors shadow-sm"
              >
                <Plus className="w-3 h-3" /> Chọn
              </button>
            </div>

            {marketplaceItems.length === 0 ? (
              <p className="text-xs text-gray-400 py-2 text-center flex-shrink-0">Chưa có học liệu nào</p>
            ) : (
              <div className="space-y-1.5 flex-1 overflow-y-auto min-h-0 pr-0.5">
                <AnimatePresence initial={false}>
                  {marketplaceItems.map((m) => (
                    <MaterialItem
                      key={m.productMaterialCode}
                      code={m.productMaterialCode}
                      title={m.title}
                      type={m.type}
                      previewUrl={m.previewUrl}
                      resourceUrl={m.resourceUrl}
                      iconColor="text-purple-500"
                      deleteConfirm={deleteConfirm}
                      onDeleteConfirm={setDeleteConfirm}
                      onDelete={handleDelete}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Upload Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showUploadModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={resetUpload}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', damping: 28, stiffness: 400 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={resetUpload}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md px-7 pt-6 pb-7"
              >
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = ''; }}
                />

                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-base font-semibold text-gray-900">Thêm học liệu từ máy</h3>
                  <button type="button" onClick={resetUpload} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Drop zone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) pickFile(f); }}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all mb-4 ${
                    dragOver ? 'border-blue-400 bg-blue-50'
                    : uploadFile ? 'border-blue-300 bg-blue-50/50'
                    : 'border-gray-200 bg-gray-50/50 hover:border-blue-300 hover:bg-blue-50/30'
                  }`}
                >
                  {uploadFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-blue-700 truncate max-w-xs">{uploadFile.name}</span>
                    </div>
                  ) : (
                    <>
                      <Upload className={`w-7 h-7 mx-auto mb-2 ${dragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                      <p className="text-sm text-gray-600">{dragOver ? 'Thả file vào đây!' : 'Kéo & thả hoặc click để chọn file'}</p>
                      <p className="text-xs text-gray-400 mt-1">Hình ảnh, Video, Tài liệu</p>
                    </>
                  )}
                </div>

                {uploadFile && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Tiêu đề <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        placeholder="VD: Bản đồ Địa lí Châu Á"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={resetUpload}
                        className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        onClick={handleUploadSubmit}
                        disabled={!uploadTitle.trim() || isUploading}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {isUploading
                          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải...</>
                          : <><Upload className="w-3.5 h-3.5" /> Tải lên</>}
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Marketplace Picker Modal ─────────────────────────────── */}
      <AnimatePresence>
        {showMarketplaceModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={() => setShowMarketplaceModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', damping: 28, stiffness: 400 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={() => setShowMarketplaceModal(false)}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col"
                style={{ maxHeight: 'calc(100vh - 2rem)' }}
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 flex-shrink-0">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">Chọn học liệu đã mua</h3>
                    {purchased.length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5">{purchased.length} học liệu trong thư viện</p>
                    )}
                  </div>
                  <button type="button" onClick={() => setShowMarketplaceModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Grid */}
                <div className="overflow-y-auto flex-1 p-5">
                  {purchased.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <ShoppingBag className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-sm font-medium text-gray-500">Chưa có học liệu nào được mua</p>
                      <p className="text-xs text-gray-400 mt-1">Ghé thăm Cửa hàng để mua học liệu</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {purchased.map((m) => {
                        const alreadyAdded = addedCodes.has(m.materialCode);
                        const typeLabel = m.type === 'video' ? 'Video' : m.type === 'image' ? 'Hình ảnh' : m.type === 'audio' ? 'Âm thanh' : 'Tài liệu';
                        const typeColor = m.type === 'video' ? 'bg-rose-50 text-rose-600' : m.type === 'image' ? 'bg-blue-50 text-blue-600' : m.type === 'audio' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-600';
                        const purchasedDate = m.purchasedDate ? new Date(m.purchasedDate).toLocaleDateString('vi-VN') : '';
                        return (
                          <div
                            key={m.materialCode}
                            className={`group relative flex flex-col rounded-2xl border transition-all overflow-hidden ${alreadyAdded ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 bg-white hover:border-purple-300 hover:shadow-md'}`}
                          >
                            {/* Thumbnail */}
                            <div className="relative aspect-video bg-gray-100 overflow-hidden flex-shrink-0">
                              {m.previewUrl ? (
                                <GcsImage
                                  src={m.previewUrl}
                                  alt={m.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <MaterialIcon type={m.type} className="w-8 h-8 text-gray-300" />
                                </div>
                              )}
                              {/* Type badge */}
                              <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColor}`}>
                                {typeLabel}
                              </span>
                              {/* Added overlay */}
                              {alreadyAdded && (
                                <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center">
                                  <div className="bg-emerald-500 text-white rounded-full p-1.5">
                                    <Check className="w-4 h-4" />
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Info */}
                            <div className="p-3 flex flex-col flex-1">
                              <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-2">{m.title}</p>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {m.subjectName && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                    {m.subjectName}
                                  </span>
                                )}
                                {m.gradeName && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                                    {m.gradeName}
                                  </span>
                                )}
                              </div>
                              <div className="mt-auto space-y-1">
                                <p className="text-[11px] text-gray-400 truncate">👤 {m.expertName}</p>
                                {purchasedDate && <p className="text-[11px] text-gray-400">🕒 {purchasedDate}</p>}
                              </div>
                            </div>

                            {/* Action button */}
                            <div className="px-3 pb-3">
                              {alreadyAdded ? (
                                <div className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-semibold border border-emerald-200">
                                  <Check className="w-3.5 h-3.5" /> Đã thêm
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    addMaterial.mutate(
                                      { sourceType: 'Marketplace', materialCode: m.materialCode },
                                      {
                                        onSuccess: () => notify.success(MSGS.material.productMaterial.addSuccess(m.title)),
                                        onError: () => notify.error(MSGS.material.productMaterial.addError),
                                      },
                                    );
                                  }}
                                  disabled={addMaterial.isPending}
                                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Thêm vào dự án
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowMarketplaceModal(false)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Shared list item ─────────────────────────────────────────────────────────
function MaterialItem({
  code, title, type, previewUrl, resourceUrl, iconColor, deleteConfirm, onDeleteConfirm, onDelete,
}: {
  code: string;
  title: string;
  type: string;
  previewUrl?: string | null;
  resourceUrl?: string | null;
  iconColor: string;
  deleteConfirm: string | null;
  onDeleteConfirm: (code: string | null) => void;
  onDelete: (code: string) => void;
}) {
  // Use previewUrl if available, otherwise fall back to resourceUrl for images
  const thumbnailUrl = previewUrl || (type === 'image' ? resourceUrl : null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.18 }}
      className="group relative flex items-center gap-3 p-2 rounded-2xl border border-transparent bg-gray-50 hover:bg-blue-50/50 hover:border-blue-100 transition-all"
    >
      {/* Thumbnail or icon */}
      {thumbnailUrl ? (
        <div className="w-10 h-10 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
          <GcsImage src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-10 h-10 flex-shrink-0 rounded-xl border border-gray-100 bg-white flex items-center justify-center">
          <MaterialIcon type={type} className={`w-4 h-4 ${iconColor}`} />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">{title}</p>
      </div>

      {/* Delete */}
      {deleteConfirm === code ? (
        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => onDelete(code)}
            className="text-xs px-2 py-1 bg-red-500 text-white rounded-lg"
          >
            Xóa
          </button>
          <button
            type="button"
            onClick={() => onDeleteConfirm(null)}
            className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg"
          >
            Hủy
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDeleteConfirm(code); }}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </motion.div>
  );
}
