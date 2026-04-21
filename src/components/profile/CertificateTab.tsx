'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2, AlertCircle, Upload, Trash2, FileText,
  Clock, CheckCircle2, XCircle, BadgeCheck, ShieldCheck, Eye, X,
} from 'lucide-react';
import {
  useVerifications,
  useSubmitVerification,
  useDeleteVerification,
} from '@/hooks/useExpertApi';
import { getVerificationFile } from '@/services/expertServices';
import { notify, MSGS } from '@/components/common';

const CERT_STATUS_CONFIG: Record<number, { label: string; textColor: string; bgColor: string; borderColor: string; icon: React.ElementType }> = {
  0: { label: 'Chờ duyệt', textColor: 'text-amber-700',   bgColor: 'bg-amber-50',   borderColor: 'border-amber-200',   icon: Clock       },
  1: { label: 'Đã duyệt',  textColor: 'text-emerald-700', bgColor: 'bg-emerald-50', borderColor: 'border-emerald-200', icon: CheckCircle2 },
  2: { label: 'Từ chối',   textColor: 'text-red-700',     bgColor: 'bg-red-50',     borderColor: 'border-red-200',     icon: XCircle     },
};

function normalizeVerificationStatus(status: number | string | null | undefined): 0 | 1 | 2 {
  if (typeof status === 'number') {
    if (status === 1) return 1;
    if (status === 2) return 2;
    return 0;
  }
  const value = (status ?? '').toString().trim().toLowerCase();
  if (value === 'approved' || value === '1') return 1;
  if (value === 'rejected' || value === '2') return 2;
  return 0;
}

const FILE_TYPE_OPTIONS = [
  { value: 'degree',      label: 'Bằng cấp'  },
  { value: 'certificate', label: 'Chứng chỉ' },
  { value: 'cccd',        label: 'CCCD'      },
];

function CertStatusBadge({ status }: { status: number | string }) {
  const normalizedStatus = normalizeVerificationStatus(status);
  const cfg = CERT_STATUS_CONFIG[normalizedStatus] ?? CERT_STATUS_CONFIG[0];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bgColor} ${cfg.textColor} ${cfg.borderColor}`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

export default function CertificateTab({
  expertId,
}: {
  expertId: number | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: verifications = [], isLoading: certLoading, isError: certError } = useVerifications();
  const submitVerification = useSubmitVerification();
  const deleteVerification = useDeleteVerification();
  const [showCertForm,  setShowCertForm]  = useState(false);
  const [certFile,      setCertFile]      = useState<File | null>(null);
  const [certFileType,  setCertFileType]  = useState('degree');
  const [certDesc,      setCertDesc]      = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [openingCertFile, setOpeningCertFile] = useState(false);

  const cert = verifications[0] ?? null;
  const certStatus = normalizeVerificationStatus(cert?.status);

  const handleCertSubmit = () => {
    if (!certFile) return;
    if (!expertId) {
      notify.error(MSGS.cert.noExpertProfile);
      return;
    }
    submitVerification.mutate(
      { file: certFile, fileType: certFileType, description: certDesc || undefined },
      {
        onSuccess: () => {
          notify.success(MSGS.cert.submitSuccess);
          setCertFile(null); setCertDesc(''); setCertFileType('degree');
          setShowCertForm(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
        onError: (err: unknown) => {
          const responseData = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
          const msg = responseData?.message;
          const firstValidationError = responseData?.errors
            ? Object.values(responseData.errors).flat()[0]
            : undefined;
          const rawError = (firstValidationError ?? msg ?? '').toString().toLowerCase();
          if (rawError.includes('expert') && rawError.includes('không tồn tại')) {
            notify.error(MSGS.cert.noExpertProfile);
            return;
          }
          notify.error(MSGS.cert.uploadError);
        },
      },
    );
  };

  const handleCertDelete = (code: string) => {
    deleteVerification.mutate(code, {
      onSuccess: () => { setConfirmDelete(null); notify.success(MSGS.cert.deleteSuccess); },
      onError:   () => notify.error(MSGS.cert.deleteError),
    });
  };

  const handleOpenCertFile = async () => {
    if (!cert) return;
    try {
      setOpeningCertFile(true);
      const { blob } = await getVerificationFile(cert.verificationCode, cert.fileUrl);
      const url = URL.createObjectURL(blob);
      const opened = window.open(url, '_blank', 'noopener,noreferrer');
      if (!opened) {
        const fallbackLink = document.createElement('a');
        fallbackLink.href = url;
        fallbackLink.download = `${cert.verificationCode}`;
        document.body.appendChild(fallbackLink);
        fallbackLink.click();
        fallbackLink.remove();
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      notify.error(MSGS.cert.previewError);
    } finally {
      setOpeningCertFile(false);
    }
  };

  return (
    <motion.div key="certificate"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 sm:p-7 text-white shadow-xl shadow-blue-900/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(255,255,255,0.24),transparent_42%)]" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-medium mb-3">
            <BadgeCheck className="w-3.5 h-3.5" />
            Xác minh chuyên gia
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">Trung tâm Chứng chỉ</h2>
          <p className="text-sm sm:text-base text-blue-100 mt-1.5 max-w-2xl">
            Hồ sơ chứng chỉ giúp tăng độ tin cậy và mở quyền đăng học liệu lên nền tảng.
          </p>
        </div>
        <div className="absolute -right-12 -top-12 w-44 h-44 bg-white/10 rounded-full" />
        <div className="absolute -right-10 -bottom-16 w-64 h-64 bg-white/10 rounded-full" />
      </div>

      {certLoading && (
        <div className="bg-white/90 backdrop-blur rounded-2xl border border-blue-100 shadow-sm flex items-center justify-center py-16">
          <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
        </div>
      )}

      {certError && (
        <div className="bg-white/90 backdrop-blur rounded-2xl border border-red-100 shadow-sm flex flex-col items-center justify-center py-16">
          <AlertCircle className="w-10 h-10 text-red-300 mb-3" />
          <p className="text-sm text-gray-500">Không thể tải thông tin chứng chỉ.</p>
        </div>
      )}

      {!certLoading && !certError && !cert && (
        <>
          {!showCertForm ? (
            <div className="bg-white/90 backdrop-blur rounded-3xl border border-blue-100 shadow-sm p-8 sm:p-10 text-center">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 border border-blue-200 flex items-center justify-center mb-4">
                <ShieldCheck className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Bạn chưa nộp chứng chỉ</h3>
              <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                Nộp chứng chỉ để hoàn tất hồ sơ chuyên gia và tăng độ tin cậy khi chia sẻ học liệu trên hệ thống.
              </p>
              <button onClick={() => setShowCertForm(true)}
                className="mx-auto flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-semibold shadow-lg shadow-blue-600/20"
              >
                <Upload className="w-4 h-4" />
                Nộp chứng chỉ
              </button>
            </div>
          ) : (
            <div className="bg-white/90 backdrop-blur rounded-3xl border border-blue-100 shadow-sm p-6 sm:p-7">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Upload className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Nộp hồ sơ chứng chỉ</h3>
                  <p className="text-xs text-gray-500">Bạn chỉ có thể duy trì một hồ sơ chứng chỉ đang hoạt động</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-3">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Tệp chứng chỉ <span className="text-red-500">*</span>
                  </label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) setCertFile(f); }}
                    className={`border-2 border-dashed rounded-xl p-5 cursor-pointer transition-all ${
                      certFile ? 'border-blue-300 bg-blue-50' : 'border-blue-100 hover:border-blue-300 hover:bg-blue-50/40'
                    }`}
                  >
                    {certFile ? (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-blue-700 truncate">{certFile.name}</p>
                          <p className="text-xs text-blue-400">{(certFile.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <button type="button"
                          onClick={(e) => { e.stopPropagation(); setCertFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors flex-shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm font-medium text-gray-600">Kéo thả hoặc nhấn để chọn file</p>
                        <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG · Tối đa 10 MB</p>
                      </div>
                    )}
                    <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) setCertFile(f); }}
                      className="hidden" />
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    Loại chứng chỉ <span className="text-red-500">*</span>
                  </label>
                  <select value={certFileType} onChange={(e) => setCertFileType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-blue-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                  >
                    {FILE_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>

                  <div className="rounded-xl border border-blue-100 bg-blue-50/50 px-3.5 py-3">
                    <p className="text-xs font-medium text-blue-700 mb-1">Lưu ý</p>
                    <p className="text-xs text-blue-600">Hệ thống ưu tiên file PDF rõ nét. Ảnh chụp cần hiển thị đầy đủ thông tin và không bị cắt góc.</p>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Mô tả</label>
                  <textarea value={certDesc} onChange={(e) => setCertDesc(e.target.value)}
                    placeholder="Mô tả ngắn về chứng chỉ..." rows={3}
                    className="w-full px-3.5 py-2.5 bg-white border border-blue-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all resize-none" />
                </div>

                <div className="lg:col-span-5 flex items-center gap-3 pt-1">
                  <button onClick={handleCertSubmit} disabled={!certFile || submitVerification.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-semibold shadow-lg shadow-blue-600/20"
                  >
                    {submitVerification.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {submitVerification.isPending ? 'Đang tải lên...' : 'Nộp chứng chỉ'}
                  </button>
                  <button onClick={() => { setShowCertForm(false); setCertFile(null); setCertDesc(''); }}
                    className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Huỷ
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {!certLoading && !certError && cert && (
        <div className="bg-white/90 backdrop-blur rounded-3xl border border-blue-100 shadow-sm overflow-hidden">
          <div className="p-6 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${(CERT_STATUS_CONFIG[certStatus] ?? CERT_STATUS_CONFIG[0]).bgColor}`}>
                  <ShieldCheck className={`w-5 h-5 ${(CERT_STATUS_CONFIG[certStatus] ?? CERT_STATUS_CONFIG[0]).textColor}`} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Hồ sơ chứng chỉ hiện tại</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Nộp: {new Date(cert.uploadedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    {cert.reviewedAt && ` · Duyệt: ${new Date(cert.reviewedAt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`}
                  </p>
                </div>
              </div>
              <CertStatusBadge status={cert.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500 mb-1">Loại chứng chỉ</p>
                <p className="text-sm font-semibold text-gray-800">
                  {FILE_TYPE_OPTIONS.find(o => o.value === cert.fileType)?.label ?? cert.fileType}
                </p>
              </div>
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-500 mb-1">Trạng thái</p>
                <p className="text-sm font-semibold text-gray-800">{(CERT_STATUS_CONFIG[certStatus] ?? CERT_STATUS_CONFIG[0]).label}</p>
              </div>
              <div className="sm:col-span-2 rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-1">Mô tả</p>
                <p className="text-sm text-gray-700">{cert.description?.trim() || 'Không có mô tả bổ sung.'}</p>
              </div>
            </div>

            <div className="mb-4">
              <button onClick={handleOpenCertFile} disabled={openingCertFile}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {openingCertFile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                {openingCertFile ? 'Đang mở file...' : 'Xem file đã nộp'}
              </button>
            </div>

            {cert.rejectionReason && (
              <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-100 rounded-xl mb-4">
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-700 mb-0.5">Lý do từ chối</p>
                  <p className="text-xs text-red-600">{cert.rejectionReason}</p>
                </div>
              </div>
            )}

            {certStatus === 1 && (
              <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <p className="text-xs sm:text-sm font-medium text-emerald-700">Chứng chỉ đã được xác minh. Tài khoản của bạn đủ điều kiện đăng tải học liệu.</p>
              </div>
            )}

            {certStatus !== 1 && (
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {confirmDelete === cert.verificationCode ? (
                  <>
                    <span className="text-xs text-gray-500">Xác nhận rút lại chứng chỉ?</span>
                    <button onClick={() => handleCertDelete(cert.verificationCode)}
                      disabled={deleteVerification.isPending}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                      {deleteVerification.isPending ? 'Đang xoá...' : 'Xác nhận xóa'}
                    </button>
                    <button onClick={() => setConfirmDelete(null)}
                      className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      Huỷ
                    </button>
                  </>
                ) : (
                  <button onClick={() => setConfirmDelete(cert.verificationCode)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Rút lại chứng chỉ
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
