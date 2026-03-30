'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Library,
  Search,
  BookOpen,
  X,
  Loader2,
  Download,
  ExternalLink,
  User,
  Tag,
  Layers,
  Calendar,
  Grid3X3,
  List,
  AlertCircle,
  ShoppingBag,
  Image as ImageIcon,
  Film,
  FileText,
  Filter,
  ChevronDown,
  Clock,
  Eye,
} from 'lucide-react';
import Link from 'next/link';

import AppHeader from '@/components/sidebar/AppHeader';
import { usePurchasedMaterials, useMaterialDetail } from '@/hooks/useMaterialShopApi';
import { GcsImage, resolveGcsUrl } from '@/components/common';
import type { PurchasedMaterialDto } from '@/types/api';

const TYPE_BADGE: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  image: { label: 'Hình ảnh', color: 'bg-sky-50 text-sky-700', icon: ImageIcon },
  video: { label: 'Video', color: 'bg-purple-50 text-purple-700', icon: Film },
  other: { label: 'Tài liệu', color: 'bg-gray-100 text-gray-600', icon: FileText },
};

const MATERIAL_TYPES = [
  { value: '', label: 'Tất cả loại' },
  { value: 'image', label: 'Hình ảnh' },
  { value: 'video', label: 'Video' },
  { value: 'other', label: 'Khác' },
];

// ─── Detail Modal ──────────────────────────────────────────────────────────

function MaterialDetailModal({
  materialCode,
  onClose,
}: {
  materialCode: string;
  onClose: () => void;
}) {
  const { data: material, isLoading, isError } = useMaterialDetail(materialCode);
  const typeBadge = material ? (TYPE_BADGE[material.type] ?? TYPE_BADGE['other']) : TYPE_BADGE['other'];
  const TypeIcon = typeBadge.icon;

  const handleDownload = async () => {
    if (!material?.resourceUrl) return;
    try {
      const url = await resolveGcsUrl(material.resourceUrl);
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      window.open(material.resourceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {isLoading ? (
          <div className="flex items-center justify-center p-16">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : isError || !material ? (
          <div className="flex flex-col items-center justify-center p-12 gap-3 text-center">
            <AlertCircle className="w-10 h-10 text-red-300" />
            <p className="text-gray-500 font-medium">Không thể tải chi tiết tài liệu</p>
          </div>
        ) : (
          <>
            {/* Preview */}
            <div className="relative h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex-shrink-0 overflow-hidden">
              {material.previewUrl ? (
                <GcsImage src={material.previewUrl} alt={material.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <TypeIcon className="w-16 h-16 text-blue-200" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
              <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-0.5 rounded-full ${typeBadge.color}`}>
                {typeBadge.label}
              </span>
            </div>

            {/* Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <h2 className="text-lg font-bold text-gray-900 leading-tight">{material.title}</h2>

              {material.description && (
                <p className="text-sm text-gray-600 leading-relaxed">{material.description}</p>
              )}

              {/* Meta grid */}
              <div className="grid grid-cols-2 gap-3">
                {material.subjectName && (
                  <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-blue-400 font-medium">Môn học</p>
                      <p className="text-xs font-semibold text-blue-800">{material.subjectName}</p>
                    </div>
                  </div>
                )}
                {material.gradeName && (
                  <div className="bg-amber-50 rounded-xl p-3 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-amber-400 font-medium">Khối lớp</p>
                      <p className="text-xs font-semibold text-amber-800">{material.gradeName}</p>
                    </div>
                  </div>
                )}
                <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium">Chuyên gia</p>
                    <p className="text-xs font-semibold text-gray-700 truncate">{material.expertName}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium">Loại</p>
                    <p className="text-xs font-semibold text-gray-700">{typeBadge.label}</p>
                  </div>
                </div>
              </div>

              {/* Action */}
              {material.resourceUrl ? (
                <button
                  onClick={handleDownload}
                  className="w-full py-3 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm shadow-blue-200"
                >
                  <Download className="w-4 h-4" />
                  Tải về / Xem tài liệu
                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                </button>
              ) : (
                <div className="w-full py-3 bg-gray-100 text-gray-400 text-sm font-medium rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                  <AlertCircle className="w-4 h-4" />
                  Tài liệu chưa sẵn sàng
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

// ─── Library Card ──────────────────────────────────────────────────────────

function LibraryCard({
  material,
  onView,
}: {
  material: PurchasedMaterialDto;
  onView: () => void;
}) {
  const typeBadge = TYPE_BADGE[material.type] ?? TYPE_BADGE['other'];
  const TypeIcon = typeBadge.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col cursor-pointer group"
      onClick={onView}
    >
      {/* Thumbnail */}
      <div className="relative h-40 bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden flex-shrink-0">
        {material.previewUrl ? (
          <GcsImage
            src={material.previewUrl}
            alt={material.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <TypeIcon className="w-12 h-12 text-blue-200" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 flex items-center justify-center">
          <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 drop-shadow-md" />
        </div>
        <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeBadge.color}`}>
          {typeBadge.label}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
          {material.title}
        </h3>

        {material.description && (
          <p className="text-xs text-gray-500 line-clamp-2 flex-1">{material.description}</p>
        )}

        <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
          {material.subjectName && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700">
              <Layers className="w-2.5 h-2.5" /> {material.subjectName}
            </span>
          )}
          {material.gradeName && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700">
              <Tag className="w-2.5 h-2.5" /> {material.gradeName}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400 pt-1 border-t border-gray-100">
          <span className="flex items-center gap-1 truncate">
            <User className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{material.expertName}</span>
          </span>
          <span className="flex items-center gap-1 flex-shrink-0 ml-2">
            <Clock className="w-3 h-3" />
            {new Date(material.purchasedDate).toLocaleDateString('vi-VN')}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function MaterialLibPage() {
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  const { data: purchased = [], isLoading, isError } = usePurchasedMaterials();

  const filtered = useMemo(() => {
    let list = purchased;
    if (typeFilter) list = list.filter((m) => m.type === typeFilter);
    if (keyword.trim()) {
      const kw = keyword.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(kw) ||
          m.description?.toLowerCase().includes(kw) ||
          m.subjectName?.toLowerCase().includes(kw) ||
          m.expertName?.toLowerCase().includes(kw),
      );
    }
    return list;
  }, [purchased, keyword, typeFilter]);

  const hasFilters = !!keyword.trim() || !!typeFilter;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* ── Hero Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-violet-600/20"
        >
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute right-16 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Library className="w-5 h-5 text-violet-200" />
                <p className="text-violet-200 text-sm font-medium">Thư viện cá nhân</p>
              </div>
              <h1 className="text-2xl font-bold">Học liệu của tôi</h1>
              <p className="text-violet-200 text-sm mt-1">
                Tất cả tài liệu bạn đã sở hữu tập trung tại đây
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{purchased.length}</p>
              <p className="text-violet-200 text-sm">tài liệu đã sở hữu</p>
            </div>
          </div>

          {/* Go to shop */}
          <Link
            href="/material-shop"
            className="absolute bottom-4 right-4 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-200 hover:text-white transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Khám phá thêm
            <ExternalLink className="w-3 h-3 opacity-60" />
          </Link>
        </motion.div>

        {/* ── Search + Filters ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm trong thư viện..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
            />
            {keyword && (
              <button
                onClick={() => setKeyword('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />

            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="appearance-none pl-3 pr-7 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 cursor-pointer transition-all"
              >
                {MATERIAL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {hasFilters && (
              <button
                onClick={() => { setKeyword(''); setTypeFilter(''); }}
                className="px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Xoá lọc
              </button>
            )}

            <div className="ml-auto flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-violet-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-violet-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Result meta ── */}
        {!isLoading && !isError && purchased.length > 0 && (
          <p className="text-sm text-gray-500">
            {hasFilters ? (
              <>Hiển thị <span className="font-semibold text-gray-800">{filtered.length}</span> / {purchased.length} tài liệu</>
            ) : (
              <><span className="font-semibold text-gray-800">{purchased.length}</span> tài liệu đang trong thư viện</>
            )}
          </p>
        )}

        {/* ── Content ── */}
        {isLoading ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-3'}>
            {Array.from({ length: 6 }).map((_, i) => (
              viewMode === 'grid' ? (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
                  <div className="h-40 bg-gray-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-3.5 bg-gray-100 rounded w-4/5" />
                    <div className="h-3 bg-gray-100 rounded w-3/5" />
                  </div>
                </div>
              ) : (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 animate-pulse flex gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gray-100 flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3.5 bg-gray-100 rounded w-3/5" />
                    <div className="h-3 bg-gray-100 rounded w-2/5" />
                  </div>
                </div>
              )
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <AlertCircle className="w-10 h-10 text-red-300" />
            <p className="text-gray-500 font-medium">Không thể tải thư viện</p>
          </div>
        ) : purchased.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center gap-4"
          >
            <div className="w-20 h-20 bg-violet-50 rounded-2xl flex items-center justify-center">
              <Library className="w-10 h-10 text-violet-200" />
            </div>
            <div>
              <p className="text-gray-700 font-semibold text-base">Thư viện còn trống</p>
              <p className="text-gray-400 text-sm mt-1">Hãy ghé cửa hàng để thêm tài liệu đầu tiên</p>
            </div>
            <Link
              href="/material-shop"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors shadow-sm shadow-violet-200"
            >
              <ShoppingBag className="w-4 h-4" />
              Khám phá cửa hàng
            </Link>
          </motion.div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <Search className="w-10 h-10 text-gray-200" />
            <p className="text-gray-500 font-medium">Không tìm thấy tài liệu phù hợp</p>
            <button onClick={() => { setKeyword(''); setTypeFilter(''); }} className="text-sm text-violet-600 hover:underline">
              Xoá bộ lọc
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <motion.div layout className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filtered.map((m) => (
                <LibraryCard
                  key={m.materialCode}
                  material={m}
                  onView={() => setSelectedCode(m.materialCode)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((m) => {
                const typeBadge = TYPE_BADGE[m.type] ?? TYPE_BADGE['other'];
                const TypeIcon = typeBadge.icon;
                return (
                  <motion.div
                    key={m.materialCode}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition-shadow flex items-center gap-4 cursor-pointer group"
                    onClick={() => setSelectedCode(m.materialCode)}
                  >
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-violet-50 to-purple-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {m.previewUrl ? (
                        <GcsImage src={m.previewUrl} alt={m.title} className="w-full h-full object-cover" />
                      ) : (
                        <TypeIcon className="w-7 h-7 text-violet-300" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-violet-600 transition-colors">
                        {m.title}
                      </h3>
                      {m.description && <p className="text-xs text-gray-500 line-clamp-1">{m.description}</p>}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeBadge.color}`}>{typeBadge.label}</span>
                        {m.subjectName && <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700">{m.subjectName}</span>}
                        {m.gradeName && <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700">{m.gradeName}</span>}
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Calendar className="w-3 h-3" />
                        {new Date(m.purchasedDate).toLocaleDateString('vi-VN')}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-blue-500 font-medium group-hover:underline">
                        <Eye className="w-3.5 h-3.5" /> Xem chi tiết
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* ── Detail Modal ── */}
      <AnimatePresence>
        {selectedCode && (
          <MaterialDetailModal
            materialCode={selectedCode}
            onClose={() => setSelectedCode(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
