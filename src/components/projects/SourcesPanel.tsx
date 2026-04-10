// src/components/projects/SourcesPanel.tsx
'use client';

import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, FileText, Loader2, Trash2, X, Upload, ChevronDown } from 'lucide-react';
import { useInputDocumentsByProject, useUploadInputDocument, useDeleteInputDocument } from '@/hooks/useInputDocumentApi';
import { useLessons } from '@/hooks/useMetadataApi';
import { notify } from '@/components/common';

interface SourcesPanelProps {
  projectCode: string;
  subjectCode?: string;
  subjectName?: string;
  gradeCode?: string;
  gradeName?: string;
  activeDocCode?: string | null;
  onDocumentClick?: (docCode: string) => void;
}

// Supported file extensions
const ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx';

export default function SourcesPanel({
  projectCode,
  subjectCode,
  subjectName,
  gradeCode,
  activeDocCode,
  onDocumentClick,
}: SourcesPanelProps) {
  const { data: docs = [], isLoading } = useInputDocumentsByProject(projectCode);
  const uploadDoc = useUploadInputDocument();
  const deleteDoc = useDeleteInputDocument();
  const { data: lessons = [] } = useLessons(subjectCode);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [lessonCode, setLessonCode] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const resetForm = () => {
    setUploadFile(null);
    setUploadTitle('');
    setLessonCode('');
    setShowForm(false);
    setDragOver(false);
  };

  const pickFile = (file: File) => {
    setUploadFile(file);
    if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^.]+$/, ''));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) pickFile(f);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  };

  const canUpload =
    !!uploadFile && !!uploadTitle.trim() && !!subjectCode && !!gradeCode && !!lessonCode;

  const handleUpload = () => {
    if (!canUpload) return;
    uploadDoc.mutate(
      {
        File: uploadFile!,
        Title: uploadTitle.trim(),
        ProjectCode: projectCode,
        SubjectCode: subjectCode!,
        GradeCode: gradeCode!,
        LessonCode: lessonCode,
      },
      {
        onSuccess: () => {
          notify.success(`Đã tải lên "${uploadTitle}"`);
          resetForm();
        },
        onError: () => notify.error('Tải lên thất bại. Vui lòng thử lại.'),
      },
    );
  };

  return (
    <aside className="flex flex-col h-full">
      {/* ─── Header ─────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Giáo án</h2>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          Thêm giáo án
        </button>
      </div>

      {/* ─── Upload modal ────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
              onClick={resetForm}
            />

            {/* Centered dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ type: 'spring', damping: 28, stiffness: 400 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              onClick={resetForm}
            >
              <motion.div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-xl px-7 pt-6 pb-7"
              >
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT}
                onChange={handleFileInput}
                className="hidden"
              />

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold text-gray-900">Thêm giáo án</h3>
                <button
                  type="button"
                  onClick={resetForm}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all mb-4 ${
                  dragOver
                    ? 'border-blue-400 bg-blue-50'
                    : uploadFile
                    ? 'border-blue-300 bg-blue-50/50'
                    : 'border-gray-200 bg-gray-50/50 hover:border-blue-300 hover:bg-blue-50/30'
                }`}
              >
                {uploadFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    <span className="text-sm font-medium text-blue-700 truncate max-w-xs">
                      {uploadFile.name}
                    </span>
                  </div>
                ) : (
                  <>
                    <Upload className={`w-7 h-7 mx-auto mb-2 ${dragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                    <p className="text-sm text-gray-600">
                      {dragOver ? 'Thả file vào đây!' : 'Kéo & thả hoặc click để chọn file'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">PDF, Word, PowerPoint</p>
                  </>
                )}
              </div>

              {uploadFile && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Tiêu đề <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="VD: Giáo án Địa Lí Bài 1"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                  </div>

                  {/* Subject (readonly from project) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Môn học</label>
                      <input
                        value={subjectName || subjectCode || '—'}
                        disabled
                        className="w-full px-3 py-2 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Bài học <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={lessonCode}
                          onChange={(e) => setLessonCode(e.target.value)}
                          className="w-full appearance-none px-3 py-2 pr-8 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white"
                        >
                          <option value="">Chọn bài...</option>
                          {lessons.map((l) => (
                            <option key={l.lessonCode} value={l.lessonCode}>
                              {l.lessonName}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleUpload}
                      disabled={!canUpload || uploadDoc.isPending}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {uploadDoc.isPending ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tải...</>
                      ) : (
                        <><Upload className="w-3.5 h-3.5" /> Tải lên</>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Document list ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
          </div>
        )}

        {!isLoading && docs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">Chưa có tài liệu nào</p>
            <p className="text-xs text-gray-400 mt-1">Nhấn &ldquo;Thêm nguồn&rdquo; để bắt đầu</p>
          </div>
        )}

        <AnimatePresence initial={false}> 
          {docs.map((doc) => {
            const isActive = activeDocCode === doc.documentCode;
            return (
            <motion.div
              key={doc.documentCode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
              onClick={() => onDocumentClick?.(doc.documentCode)}
              className={`group relative flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-transparent hover:bg-blue-50/50 hover:border-blue-100'
              }`}
            >
              {/* Active indicator */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-500 rounded-r-full" />
              )}

              {/* Icon */}
              <div className={`w-8 h-8 flex-shrink-0 rounded-xl border flex items-center justify-center ${isActive ? 'bg-blue-100 border-blue-200' : 'bg-white border-gray-100'}`}>
                <FileText className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-blue-500'}`} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium leading-snug line-clamp-2 ${isActive ? 'text-blue-800' : 'text-gray-800'}`}>
                  {doc.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {doc.lessonName || doc.lessonCode}
                </p>
              </div>

              {/* Delete */}
              {deleteConfirm === doc.documentCode ? (
                <div
                  className="flex items-center gap-1 flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => {
                      deleteDoc.mutate(doc.documentCode, {
                        onSuccess: () => notify.success('Đã xóa tài liệu'),
                        onError: () => notify.error('Không thể xóa'),
                      });
                      setDeleteConfirm(null);
                    }}
                    className="text-xs px-2 py-1 bg-red-500 text-white rounded-lg"
                  >
                    Xóa
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirm(null)}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setDeleteConfirm(doc.documentCode); }}
                  className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </aside>
  );
}
