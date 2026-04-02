'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Search,
  Filter,
  BookOpen,
  X,
  ShoppingCart,
  Loader2,
  CheckCircle2,
  ChevronDown,
  Coins,
  User,
  Tag,
  Layers,
  Grid3X3,
  List,
  AlertCircle,
} from 'lucide-react';

import AppHeader from '@/components/sidebar/AppHeader';
import { useBrowseMaterials, usePurchaseMaterial, usePurchasedMaterials } from '@/hooks/useMaterialShopApi';
import { useSubjects, useGrades } from '@/hooks/useMetadataApi';
import type { MaterialDto } from '@/types/api';
import { notify, GcsImage } from '@/components/common';

const MATERIAL_TYPES = [
  { value: '', label: 'Tất cả loại' },
  { value: 'image', label: 'Hình ảnh' },
  { value: 'video', label: 'Video' },
  { value: 'other', label: 'Khác' },
];

const TYPE_BADGE: Record<string, { label: string; color: string }> = {
  image: { label: 'Hình ảnh', color: 'bg-sky-50 text-sky-700' },
  video: { label: 'Video', color: 'bg-purple-50 text-purple-700' },
  other: { label: 'Khác', color: 'bg-gray-100 text-gray-600' },
};

// ─── Purchase Confirm Modal ────────────────────────────────────────────────

function PurchaseModal({
  material,
  onConfirm,
  onCancel,
  isPending,
}: {
  material: MaterialDto;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Xác nhận mua tài liệu</h3>
            <p className="text-sm text-gray-500 mt-0.5">Tài liệu sẽ được thêm vào thư viện của bạn</p>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          <p className="text-sm font-semibold text-gray-800 line-clamp-2">{material.title}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <User className="w-3.5 h-3.5" />
            <span>{material.expertName}</span>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-gray-500">Chi phí</span>
            <span className={`text-base font-bold ${material.price > 0 ? 'text-blue-600' : 'text-emerald-600'}`}>
              {material.price > 0 ? `${material.price.toLocaleString('vi-VN')} ₫` : 'Miễn phí'}
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...
              </>
            ) : material.price > 0 ? (
              <>
                <Coins className="w-4 h-4" /> Mua ngay
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Nhận miễn phí
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Material Card ─────────────────────────────────────────────────────────

function ShopMaterialCard({
  material,
  owned,
  onBuy,
}: {
  material: MaterialDto;
  owned: boolean;
  onBuy: () => void;
}) {
  const typeBadge = TYPE_BADGE[material.type] ?? TYPE_BADGE['other'];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
    >
      {/* Thumbnail */}
      <div className="relative h-40 bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden flex-shrink-0">
        {material.previewUrl ? (
          <GcsImage src={material.previewUrl} alt={material.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-12 h-12 text-blue-200" />
          </div>
        )}
        {/* Type badge */}
        <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeBadge.color}`}>
          {typeBadge.label}
        </span>
        {owned && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-500/90 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> Đã sở hữu
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <h3 className="text-sm font-bold text-gray-900 line-clamp-2 leading-snug">{material.title}</h3>

        {material.description && (
          <p className="text-xs text-gray-500 line-clamp-2 flex-1">{material.description}</p>
        )}

        {/* Tags */}
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

        {/* Expert + Price row */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100">
          <span className="flex items-center gap-1 truncate max-w-[55%]">
            <User className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{material.expertName}</span>
          </span>
          <span className={`font-bold text-sm ${material.price > 0 ? 'text-blue-600' : 'text-emerald-600'}`}>
            {material.price > 0 ? `${material.price.toLocaleString('vi-VN')} ₫` : 'Miễn phí'}
          </span>
        </div>

        {/* CTA */}
        <button
          onClick={onBuy}
          disabled={owned}
          className={`w-full py-2 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-1.5 mt-1 ${
            owned
              ? 'bg-emerald-50 text-emerald-600 cursor-default'
              : material.price > 0
              ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-sm shadow-blue-200'
              : 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95'
          }`}
        >
          {owned ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" /> Đã sở hữu
            </>
          ) : material.price > 0 ? (
            <>
              <ShoppingCart className="w-3.5 h-3.5" /> Mua ngay
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" /> Nhận miễn phí
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function MaterialShopPage() {
  const [keyword, setKeyword] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [gradeCode, setGradeCode] = useState('');
  const [type, setType] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [purchaseTarget, setPurchaseTarget] = useState<MaterialDto | null>(null);

  // Debounce keyword for API params by using local state separately
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleKeywordChange = (v: string) => {
    setKeyword(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedKeyword(v), 400);
  };

  const browseParams = useMemo(
    () => ({
      ...(subjectCode && { subjectCode }),
      ...(gradeCode && { gradeCode }),
      ...(type && { type }),
      ...(debouncedKeyword && { keyword: debouncedKeyword }),
    }),
    [subjectCode, gradeCode, type, debouncedKeyword],
  );

  const { data: materials = [], isLoading, isError } = useBrowseMaterials(browseParams);
  const { data: purchased = [] } = usePurchasedMaterials();
  const purchaseMutation = usePurchaseMaterial();

  const { data: subjects = [] } = useSubjects();
  const { data: grades = [] } = useGrades();

  const ownedCodes = useMemo(() => new Set(purchased.map((p) => p.materialCode)), [purchased]);

  const handleConfirmPurchase = () => {
    if (!purchaseTarget) return;
    purchaseMutation.mutate(purchaseTarget.materialCode, {
      onSuccess: () => {
        setPurchaseTarget(null);
        notify.success(`Đã thêm "${purchaseTarget.title}" vào thư viện!`);
      },
      onError: () => {
        setPurchaseTarget(null);
        notify.error('Mua tài liệu thất bại. Vui lòng thử lại.');
      },
    });
  };

  const hasFilters = subjectCode || gradeCode || type || debouncedKeyword;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* ── Hero Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-600/20"
        >
          <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
          <div className="absolute right-16 bottom-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShoppingBag className="w-5 h-5 text-blue-200" />
                <p className="text-blue-200 text-sm font-medium">Cửa hàng học liệu</p>
              </div>
              <h1 className="text-2xl font-bold">Kho học liệu chất lượng cao</h1>
              <p className="text-blue-200 text-sm mt-1">
                Khám phá tài liệu được tuyển chọn từ các chuyên gia giáo dục
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{materials.length}</p>
              <p className="text-blue-200 text-sm">tài liệu khả dụng</p>
            </div>
          </div>
        </motion.div>

        {/* ── Search + Filters ── */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => handleKeywordChange(e.target.value)}
              placeholder="Tìm kiếm tài liệu..."
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
            />
            {keyword && (
              <button
                onClick={() => { setKeyword(''); setDebouncedKeyword(''); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter row */}
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />

            {/* Subject */}
            <div className="relative">
              <select
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
                className="appearance-none pl-3 pr-7 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 cursor-pointer transition-all"
              >
                <option value="">Tất cả môn học</option>
                {subjects.map((s) => (
                  <option key={s.subjectCode} value={s.subjectCode}>{s.subjectName}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Grade */}
            <div className="relative">
              <select
                value={gradeCode}
                onChange={(e) => setGradeCode(e.target.value)}
                className="appearance-none pl-3 pr-7 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 cursor-pointer transition-all"
              >
                <option value="">Tất cả khối lớp</option>
                {grades.map((g) => (
                  <option key={g.gradeCode} value={g.gradeCode}>{g.gradeName}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Type */}
            <div className="relative">
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="appearance-none pl-3 pr-7 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 cursor-pointer transition-all"
              >
                {MATERIAL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            </div>

            {/* Clear filters */}
            {hasFilters && (
              <button
                onClick={() => { setSubjectCode(''); setGradeCode(''); setType(''); setKeyword(''); setDebouncedKeyword(''); }}
                className="px-3 py-1.5 text-xs font-medium text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Xoá bộ lọc
              </button>
            )}

            {/* View mode — push right */}
            <div className="ml-auto flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Result Count ── */}
        {!isLoading && !isError && (
          <p className="text-sm text-gray-500">
            {hasFilters ? (
              <>Tìm thấy <span className="font-semibold text-gray-800">{materials.length}</span> tài liệu phù hợp</>
            ) : (
              <><span className="font-semibold text-gray-800">{materials.length}</span> tài liệu đang có</>
            )}
          </p>
        )}

        {/* ── Content ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
                <div className="h-40 bg-gray-100" />
                <div className="p-4 space-y-2">
                  <div className="h-3.5 bg-gray-100 rounded w-4/5" />
                  <div className="h-3 bg-gray-100 rounded w-3/5" />
                  <div className="h-8 bg-gray-100 rounded-xl mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <AlertCircle className="w-10 h-10 text-red-300" />
            <p className="text-gray-500 font-medium">Không thể tải danh sách tài liệu</p>
            <p className="text-gray-400 text-sm">Vui lòng thử lại sau</p>
          </div>
        ) : materials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <ShoppingBag className="w-12 h-12 text-gray-200" />
            <p className="text-gray-500 font-medium">Không tìm thấy tài liệu phù hợp</p>
            {hasFilters && (
              <button
                onClick={() => { setSubjectCode(''); setGradeCode(''); setType(''); setKeyword(''); setDebouncedKeyword(''); }}
                className="text-sm text-blue-600 hover:underline"
              >
                Xoá bộ lọc
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            <AnimatePresence mode="popLayout">
              {materials.map((m) => (
                <ShopMaterialCard
                  key={m.materialCode}
                  material={m}
                  owned={ownedCodes.has(m.materialCode)}
                  onBuy={() => setPurchaseTarget(m)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {materials.map((m) => {
                const owned = ownedCodes.has(m.materialCode);
                const typeBadge = TYPE_BADGE[m.type] ?? TYPE_BADGE['other'];
                return (
                  <motion.div
                    key={m.materialCode}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    className="bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-md transition-shadow flex items-center gap-4"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {m.previewUrl ? (
                        <GcsImage src={m.previewUrl} alt={m.title} className="w-full h-full object-cover" />
                      ) : (
                        <BookOpen className="w-7 h-7 text-blue-200" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <h3 className="text-sm font-bold text-gray-900 truncate">{m.title}</h3>
                      {m.description && <p className="text-xs text-gray-500 line-clamp-1">{m.description}</p>}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeBadge.color}`}>{typeBadge.label}</span>
                        {m.subjectName && <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700">{m.subjectName}</span>}
                        {m.gradeName && <span className="text-[10px] font-medium px-2 py-0.5 rounded-lg bg-amber-50 text-amber-700">{m.gradeName}</span>}
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                          <User className="w-2.5 h-2.5" /> {m.expertName}
                        </span>
                      </div>
                    </div>

                    {/* Price + CTA */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-2">
                      <span className={`text-base font-bold ${m.price > 0 ? 'text-blue-600' : 'text-emerald-600'}`}>
                        {m.price > 0 ? `${m.price.toLocaleString('vi-VN')} ₫` : 'Miễn phí'}
                      </span>
                      <button
                        onClick={() => setPurchaseTarget(m)}
                        disabled={owned}
                        className={`px-4 py-1.5 text-xs font-bold rounded-xl transition-all ${
                          owned
                            ? 'bg-emerald-50 text-emerald-600 cursor-default'
                            : m.price > 0
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-emerald-500 text-white hover:bg-emerald-600'
                        }`}
                      >
                        {owned ? 'Đã sở hữu' : m.price > 0 ? 'Mua ngay' : 'Nhận miễn phí'}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* ── Purchase Modal ── */}
      <AnimatePresence>
        {purchaseTarget && (
          <PurchaseModal
            material={purchaseTarget}
            onConfirm={handleConfirmPurchase}
            onCancel={() => !purchaseMutation.isPending && setPurchaseTarget(null)}
            isPending={purchaseMutation.isPending}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
