'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Search, Loader2, Eye, BarChart3, FolderOpen } from 'lucide-react';

import AppHeader from '@/components/sidebar/AppHeader';
import { Breadcrumb, notify } from '@/components/common';
import { Pagination } from '@/components/paging';
import { useAllProducts } from '@/hooks/useProductApi';
import { useDocumentStore } from '@/store/useDocumentStore';
import * as productService from '@/services/productServices';

const PAGE_SIZE = 9;

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  SLIDES_GENERATED: { label: 'Bản gốc',  color: 'bg-emerald-50 text-emerald-600' },
  VIDEO_GENERATED:  { label: 'Có video', color: 'bg-violet-50  text-violet-600'  },
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function TeacherSlidesPage() {
  const router = useRouter();
  const { data: allProducts = [], isLoading } = useAllProducts();
  const setDocument = useDocumentStore((s) => s.setDocument);

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage]               = useState(1);
  const [viewLoading, setViewLoading] = useState<string | null>(null);

  const allSlides = allProducts.filter((p) => p.hasSlide);

  const filtered = allSlides.filter(
    (s) => s.productName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => { setPage(1); }, [searchQuery]);

  const handleViewSlide = async (productCode: string, hasEditedSlide: boolean) => {
    setViewLoading(productCode);
    try {
      let slideDoc;
      if (hasEditedSlide) {
        const r = await productService.getProductEditedSlide(productCode);
        slideDoc = r.slideEditedDocument;
      } else {
        const r = await productService.getProductSlide(productCode);
        slideDoc = r.slideDocument;
      }
      setDocument(slideDoc, productCode, '', hasEditedSlide);
      router.push('/teacher/editor');
    } catch { notify.error('Không thể mở slide. Vui lòng thử lại.'); }
    finally {
      setViewLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <AppHeader />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Breadcrumb items={[{ label: 'Slide' }]} />

        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Slide của tôi</h1>
            <p className="text-sm text-gray-500">
              {isLoading ? '…' : `${allSlides.length} bộ slide đã tạo`}
            </p>
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          className="relative mb-6"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm theo tên slide..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          />
        </motion.div>

        {/* Loading */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-24"
            >
              <Loader2 className="w-7 h-7 animate-spin text-violet-500 mr-2" />
              <span className="text-sm text-gray-500">Đang tải slide...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty */}
        <AnimatePresence>
          {!isLoading && filtered.length === 0 && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <FolderOpen className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-1">
                {searchQuery ? 'Không tìm thấy slide' : 'Chưa có slide nào'}
              </h3>
              <p className="text-sm text-gray-500">
                {searchQuery ? 'Thử thay đổi từ khóa tìm kiếm' : 'Tạo slide từ trang Dự án của bạn'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Slides grid */}
        {!isLoading && paged.length > 0 && (
          <>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.07 } },
              }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {paged.map((slide) => {
                const statusInfo =
                  STATUS_LABEL[slide.statusName] ??
                  { label: slide.statusName, color: 'bg-gray-100 text-gray-600' };

                return (
                  <motion.div
                    key={slide.productCode}
                    variants={{
                      hidden:  { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
                    }}
                    className="bg-white rounded-2xl border border-gray-100 hover:border-violet-200 hover:shadow-lg transition-all overflow-hidden"
                  >
                    <div className="h-28 bg-gradient-to-br from-violet-50 to-purple-50 flex items-center justify-center border-b border-gray-100">
                      <Layers className="w-10 h-10 text-violet-200" />
                    </div>

                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-gray-900 truncate mb-1.5">
                        {slide.productName}
                      </h3>

                      <div className="flex flex-wrap items-center gap-1.5 mb-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        {slide.hasEditedSlide && (
                          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                            Đã sửa
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-400">
                          {formatDate(slide.slideGeneratedAt)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleViewSlide(slide.productCode, slide.hasEditedSlide)}
                            disabled={viewLoading === slide.productCode}
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {viewLoading === slide.productCode
                              ? <Loader2 className="w-3 h-3 animate-spin" />
                              : <Eye className="w-3 h-3" />}
                            Xem
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </main>

      {viewLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl px-8 py-6 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-violet-500" />
            <p className="text-sm font-medium text-gray-700">Đang mở slide...</p>
          </div>
        </div>
      )}
    </div>
  );
}
