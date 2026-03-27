'use client';

import { useState } from 'react';
import AppHeader from '@/components/sidebar/AppHeader';
import { usePendingMaterials, useReviewMaterial } from '@/hooks/useStaffApi';
import { getMaterialReviewDetail } from '@/services/staffServices';

export default function StaffMaterialsPage() {
  const { data = [], isLoading, isError } = usePendingMaterials();
  const reviewMaterial = useReviewMaterial();

  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [openingCode, setOpeningCode] = useState<string | null>(null);

  const handleOpenPreview = async (materialCode: string, previewUrl?: string | null, resourceUrl?: string | null) => {
    if (previewUrl || resourceUrl) {
      window.open(previewUrl || resourceUrl || '', '_blank', 'noopener,noreferrer');
      return;
    }

    try {
      setOpeningCode(materialCode);
      const detail = await getMaterialReviewDetail(materialCode);
      const url = detail.previewUrl || detail.resourceUrl;
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    } finally {
      setOpeningCode(null);
    }
  };

  const handleReview = (materialCode: string, approved: boolean) => {
    reviewMaterial.mutate({
      materialCode,
      input: {
        approved,
        rejectionReason: approved ? undefined : (reasons[materialCode] || '').trim() || undefined,
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Duyệt học liệu</h1>
        <p className="text-sm text-gray-500 mt-1">Danh sách material đang chờ phê duyệt.</p>

        {isLoading && <p className="text-sm text-gray-500 mt-6">Đang tải dữ liệu...</p>}
        {isError && <p className="text-sm text-red-600 mt-6">Không thể tải danh sách học liệu.</p>}

        {!isLoading && !isError && (
          <div className="space-y-4 mt-6">
            {data.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
                Không có học liệu chờ duyệt.
              </div>
            ) : (
              data.map((item) => (
                <div key={item.materialCode} className="rounded-xl border border-gray-200 bg-white p-5">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                      <p className="text-xs text-gray-500 mt-1">Mã material: {item.materialCode}</p>
                      <p className="text-sm text-gray-600 mt-2">Loại: {item.type} | Giá: {(item.price ?? 0).toLocaleString('vi-VN')}</p>
                      <p className="text-sm text-gray-600">Môn: {item.subjectName || item.subjectCode || '-'} | Khối: {item.gradeName || item.gradeCode || '-'}</p>
                      <p className="text-sm text-gray-600">Expert: {item.expertName || item.expertCode || '-'}</p>
                    </div>

                    <button
                      onClick={() => handleOpenPreview(item.materialCode, item.previewUrl, item.resourceUrl)}
                      disabled={openingCode === item.materialCode}
                      className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {openingCode === item.materialCode ? 'Đang mở...' : 'Xem nội dung'}
                    </button>
                  </div>

                  <div className="mt-4">
                    <label className="block text-xs text-gray-500 mb-1">Lý do từ chối (nếu có)</label>
                    <input
                      type="text"
                      value={reasons[item.materialCode] || ''}
                      onChange={(e) => setReasons((prev) => ({ ...prev, [item.materialCode]: e.target.value }))}
                      placeholder="Nhập lý do khi từ chối"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => handleReview(item.materialCode, true)}
                      disabled={reviewMaterial.isPending}
                      className="px-3 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Duyệt
                    </button>
                    <button
                      onClick={() => handleReview(item.materialCode, false)}
                      disabled={reviewMaterial.isPending}
                      className="px-3 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
