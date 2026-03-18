/**
 * Expert Certificate Page
 * =======================
 * Upload & quản lý chứng chỉ xác minh chuyên gia.
 */

'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ShieldCheck,
  Upload,
  Trash2,
  FileText,
  BookOpen,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Home,
} from 'lucide-react';

import { useVerifications, useSubmitVerification, useDeleteVerification } from '@/hooks/useExpertApi';
import type { VerificationDto } from '@/types/api';

// ── Status helpers ─────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending:  { label: 'Chờ duyệt', color: 'bg-amber-50 text-amber-700', icon: Clock },
  approved: { label: 'Đã duyệt',  color: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'Từ chối',   color: 'bg-red-50 text-red-700', icon: XCircle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['pending'];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${cfg.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {cfg.label}
    </span>
  );
}

// ── File type options ──────────────────────────────────────────────────────

const FILE_TYPE_OPTIONS = [
  { value: 'degree',        label: 'Bằng cấp' },
  { value: 'certificate',   label: 'Chứng chỉ' },
  { value: 'work_experience', label: 'Kinh nghiệm làm việc' },
  { value: 'other',         label: 'Khác' },
];

// ── Component ──────────────────────────────────────────────────────────────

export default function CertificatePage() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // API hooks
  const { data: verifications = [], isLoading, isError, error } = useVerifications();
  const submitVerification = useSubmitVerification();
  const deleteVerification = useDeleteVerification();

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState('degree');
  const [description, setDescription] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) setFile(selected);
  };

  const handleSubmit = () => {
    if (!file) return;
    submitVerification.mutate(
      { file, fileType, description: description || undefined },
      {
        onSuccess: () => {
          setFile(null);
          setDescription('');
          setFileType('degree');
          setShowForm(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        },
      },
    );
  };

  const handleDelete = (code: string) => {
    deleteVerification.mutate(code, {
      onSuccess: () => setConfirmDelete(null),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Trang chủ"
            >
              <Home className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="h-6 w-px bg-gray-200" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Chứng chỉ xác minh</h1>
            </div>
          </div>

          {/* Nav links */}
          <div className="flex items-center gap-4">
            <Link
              href="/expert/material"
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Tài liệu
            </Link>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-[0.97] transition-all shadow-lg shadow-blue-600/25 font-medium text-sm"
            >
              <Upload className="w-4 h-4" />
              Nộp chứng chỉ
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ── Upload Form ── */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-8"
            >
              <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Nộp chứng chỉ mới</h2>

                {/* File input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tệp chứng chỉ <span className="text-red-500">*</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileSelect}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {file && (
                    <p className="mt-1 text-xs text-gray-400">{file.name} ({(file.size / 1024).toFixed(0)} KB)</p>
                  )}
                </div>

                {/* File type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại chứng chỉ <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={fileType}
                    onChange={(e) => setFileType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  >
                    {FILE_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    placeholder="Mô tả ngắn về chứng chỉ..."
                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSubmit}
                    disabled={!file || submitVerification.isPending}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                  >
                    {submitVerification.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {submitVerification.isPending ? 'Đang tải lên...' : 'Nộp chứng chỉ'}
                  </button>
                  <button
                    onClick={() => { setShowForm(false); setFile(null); setDescription(''); }}
                    className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-sm"
                  >
                    Huỷ
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Tổng', value: verifications.length, color: 'text-blue-600 bg-blue-50' },
            { label: 'Chờ duyệt', value: verifications.filter((v) => v.status === 'Pending').length, color: 'text-amber-600 bg-amber-50' },
            { label: 'Đã duyệt', value: verifications.filter((v) => v.status === 'Approved').length, color: 'text-emerald-600 bg-emerald-50' },
            { label: 'Từ chối', value: verifications.filter((v) => v.status === 'Rejected').length, color: 'text-red-600 bg-red-50' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Loading ── */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
            <p className="text-sm text-gray-500">Đang tải danh sách chứng chỉ...</p>
          </div>
        )}

        {/* ── Error ── */}
        {isError && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Không thể tải dữ liệu</h3>
            <p className="text-sm text-gray-500">{(error as Error)?.message || 'Đã xảy ra lỗi.'}</p>
          </div>
        )}

        {/* ── Empty ── */}
        {!isLoading && !isError && verifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <FileText className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">Chưa có chứng chỉ</h3>
            <p className="text-sm text-gray-500 mb-6">Hãy nộp chứng chỉ đầu tiên để xác minh tài khoản chuyên gia!</p>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Upload className="w-4 h-4" />
              Nộp chứng chỉ
            </button>
          </div>
        )}

        {/* ── Verification List ── */}
        {!isLoading && !isError && verifications.length > 0 && (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {verifications.map((v: VerificationDto) => (
                <motion.div
                  key={v.verificationCode}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-gray-900">
                            {FILE_TYPE_OPTIONS.find((o) => o.value === v.fileType)?.label ?? v.fileType}
                          </p>
                          <StatusBadge status={v.status} />
                        </div>
                        {v.description && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{v.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1.5">
                          Nộp lúc: {new Date(v.uploadedAt).toLocaleDateString('vi-VN')}
                          {v.reviewedAt && ` · Duyệt lúc: ${new Date(v.reviewedAt).toLocaleDateString('vi-VN')}`}
                        </p>
                        {v.rejectionReason && (
                          <p className="text-xs text-red-500 mt-1">Lý do từ chối: {v.rejectionReason}</p>
                        )}
                      </div>
                    </div>

                    {/* Delete button */}
                    {confirmDelete === v.verificationCode ? (
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                        <button
                          onClick={() => handleDelete(v.verificationCode)}
                          disabled={deleteVerification.isPending}
                          className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 disabled:opacity-50"
                        >
                          {deleteVerification.isPending ? 'Đang xoá...' : 'Xác nhận'}
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg"
                        >
                          Huỷ
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(v.verificationCode)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0 ml-4"
                        title="Xoá chứng chỉ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
