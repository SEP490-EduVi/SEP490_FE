'use client';

import { useState } from 'react';
import AppHeader from '@/components/sidebar/AppHeader';
import { usePendingVerifications, useReviewVerification } from '@/hooks/useStaffApi';
import { downloadVerificationFile } from '@/services/staffServices';
import { notify } from '@/components/common';

export default function StaffVerificationsPage() {
  const { data = [], isLoading, isError } = usePendingVerifications();
  const reviewVerification = useReviewVerification();

  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [downloadingCode, setDownloadingCode] = useState<string | null>(null);

  const handleDecision = (verificationCode: string, approved: boolean) => {
    reviewVerification.mutate(
      {
        verificationCode,
        input: {
          approved,
          rejectionReason: approved ? undefined : (reasons[verificationCode] || '').trim() || undefined,
        },
      },
      {
        onSuccess: () => notify.success(approved ? 'Dạyật hồ sơ xác minh thành công' : 'Đã từ chối hồ sơ xác minh'),
        onError: () => notify.error('Thao tác thất bại. Vui lòng thử lại.'),
      },
    );
  };

  const handleDownloadFile = async (verificationCode: string) => {
    try {
      setDownloadingCode(verificationCode);
      const { blob, fileName } = await downloadVerificationFile(verificationCode);

      const objectUrl = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = objectUrl;
      link.download = fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch {
      notify.error('Không thể tải file lúc này. Vui lòng thử lại.');
    } finally {
      setDownloadingCode(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900">Duyệt hồ sơ xác minh Expert</h1>
        <p className="text-sm text-gray-500 mt-1">Hồ sơ đang chờ duyệt từ chuyên gia.</p>

        {isLoading && <p className="text-sm text-gray-500 mt-6">Đang tải dữ liệu...</p>}
        {isError && <p className="text-sm text-red-600 mt-6">Không thể tải danh sách hồ sơ.</p>}

        {!isLoading && !isError && (
          <div className="space-y-4 mt-6">
            {data.length === 0 ? (
              <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
                Không có hồ sơ chờ duyệt.
              </div>
            ) : (
              data.map((item) => (
                <div key={item.verificationCode} className="rounded-xl border border-gray-200 bg-white p-5">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{item.expertName} ({item.expertEmail})</p>
                      <p className="text-xs text-gray-500 mt-1">Mã hồ sơ: {item.verificationCode}</p>
                      <p className="text-sm text-gray-600 mt-2">Loại hồ sơ: {item.fileType}</p>
                      <p className="text-sm text-gray-600">Mô tả: {item.description || '-'}</p>
                      <p className="text-xs text-gray-400 mt-1">Nộp lúc: {new Date(item.uploadedAt).toLocaleString('vi-VN')}</p>
                    </div>

                    <button
                      onClick={() => handleDownloadFile(item.verificationCode)}
                      disabled={downloadingCode === item.verificationCode}
                      className="px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      {downloadingCode === item.verificationCode ? 'Đang tải...' : 'Tải file'}
                    </button>
                  </div>

                  <div className="mt-4">
                    <label className="block text-xs text-gray-500 mb-1">Lý do từ chối (nếu có)</label>
                    <input
                      type="text"
                      value={reasons[item.verificationCode] || ''}
                      onChange={(e) => setReasons((prev) => ({ ...prev, [item.verificationCode]: e.target.value }))}
                      placeholder="Nhập lý do khi từ chối"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>

                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => handleDecision(item.verificationCode, true)}
                      disabled={reviewVerification.isPending}
                      className="px-3 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Duyệt
                    </button>
                    <button
                      onClick={() => handleDecision(item.verificationCode, false)}
                      disabled={reviewVerification.isPending}
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
