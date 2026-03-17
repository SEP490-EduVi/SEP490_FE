'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, Trash2, Loader2, FileText, File,
  Image as ImageIcon, FileVideo, Layers, Sparkles,
} from 'lucide-react';
import { useSubjects, useGrades, useLessons } from '@/hooks/useMetadataApi';
import type { InputDocumentDto } from '@/types/api';

// ── Helpers ────────────────────────────────────────────────────────────────

const FILE_TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  pdf:   { icon: FileText,  color: 'text-red-500 bg-red-50' },
  docx:  { icon: File,      color: 'text-blue-500 bg-blue-50' },
  pptx:  { icon: Layers,    color: 'text-orange-500 bg-orange-50' },
  image: { icon: ImageIcon, color: 'text-emerald-500 bg-emerald-50' },
  video: { icon: FileVideo, color: 'text-purple-500 bg-purple-50' },
};

function getFileTypeFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx' || ext === 'doc') return 'docx';
  if (ext === 'pptx' || ext === 'ppt') return 'pptx';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext ?? '')) return 'image';
  if (['mp4', 'mov', 'avi', 'webm'].includes(ext ?? '')) return 'video';
  return 'docx';
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// ── Select sub-components ──────────────────────────────────────────────────

const SELECT_CLS = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white disabled:bg-gray-50 disabled:text-gray-400';

function SubjectSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data: subjects = [], isLoading } = useSubjects();
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} disabled={isLoading} className={SELECT_CLS}>
      <option value="">{isLoading ? 'Đang tải...' : '-- Chọn môn học --'}</option>
      {subjects.map((s) => <option key={s.subjectCode} value={s.subjectCode}>{s.subjectName}</option>)}
    </select>
  );
}

function GradeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data: grades = [], isLoading } = useGrades();
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} disabled={isLoading} className={SELECT_CLS}>
      <option value="">{isLoading ? 'Đang tải...' : '-- Chọn lớp --'}</option>
      {grades.map((g) => <option key={g.gradeCode} value={g.gradeCode}>{g.gradeName}</option>)}
    </select>
  );
}

function LessonSelect({ subjectCode, value, onChange }: { subjectCode: string; value: string; onChange: (v: string) => void }) {
  const { data: lessons = [], isLoading } = useLessons(subjectCode || undefined);
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} disabled={!subjectCode || isLoading} className={SELECT_CLS}>
      <option value="">{!subjectCode ? 'Chọn môn trước' : isLoading ? 'Đang tải...' : '-- Chọn bài học --'}</option>
      {lessons.map((l) => <option key={l.lessonCode} value={l.lessonCode}>{l.lessonName}</option>)}
    </select>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────

export interface DocumentsTabProps {
  documents: InputDocumentDto[];
  isLoading: boolean;
  showUploadArea: boolean;
  dragOver: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  uploadFile: File | null;
  uploadTitle: string;
  uploadSubjectCode: string;
  uploadGradeCode: string;
  uploadLessonCode: string;
  isUploading: boolean;
  onToggleUpload: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  onTitleChange: (v: string) => void;
  onSubjectCodeChange: (v: string) => void;
  onGradeCodeChange: (v: string) => void;
  onLessonCodeChange: (v: string) => void;
  onClickUpload: () => void;
  onAnalyze: (documentCode: string) => void;
  onDeleteDocument: (documentCode: string) => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function DocumentsTab({
  documents, isLoading, showUploadArea, dragOver, fileInputRef,
  uploadFile, uploadTitle, uploadSubjectCode, uploadGradeCode, uploadLessonCode,
  isUploading, onToggleUpload, onDragOver, onDragLeave, onDrop, onFileSelect,
  onUpload, onTitleChange, onSubjectCodeChange, onGradeCodeChange, onLessonCodeChange,
  onClickUpload, onAnalyze, onDeleteDocument,
}: DocumentsTabProps) {
  const [deletingDocCode, setDeletingDocCode] = useState<string | null>(null);

  return (
    <div>
      {/* Upload Controls */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">
          Tải lên tài liệu bài giảng để AI phân tích và tạo slide tự động.
        </p>
        <button
          onClick={onToggleUpload}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          <Upload className="w-4 h-4" />
          Tải tài liệu
        </button>
      </div>

      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={onFileSelect} className="hidden" />

      {/* Upload Drop Zone + Form */}
      <AnimatePresence>
        {showUploadArea && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-5"
          >
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={onClickUpload}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all mb-4 ${
                dragOver
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 bg-gray-50/50 hover:border-blue-300 hover:bg-blue-50/30'
              }`}
            >
              <div className="flex flex-col items-center">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${dragOver ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  <Upload className={`w-6 h-6 ${dragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                </div>
                {uploadFile ? (
                  <p className="text-sm font-medium text-blue-600">{uploadFile.name}</p>
                ) : (
                  <>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      {dragOver ? 'Thả file vào đây!' : 'Kéo & thả file vào đây'}
                    </p>
                    <p className="text-xs text-gray-400">Hỗ trợ PDF, Word, PowerPoint</p>
                  </>
                )}
              </div>
            </div>

            {uploadFile && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3"
              >
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tiêu đề tài liệu *</label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => onTitleChange(e.target.value)}
                    placeholder="VD: Giáo Án Địa Lí Bài 1"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Môn học *</label>
                    <SubjectSelect value={uploadSubjectCode} onChange={(code) => { onSubjectCodeChange(code); onLessonCodeChange(''); }} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Lớp *</label>
                    <GradeSelect value={uploadGradeCode} onChange={onGradeCodeChange} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Bài học *</label>
                    <LessonSelect subjectCode={uploadSubjectCode} value={uploadLessonCode} onChange={onLessonCodeChange} />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={onUpload}
                    disabled={isUploading || !uploadTitle || !uploadSubjectCode || !uploadGradeCode || !uploadLessonCode}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {isUploading ? 'Đang tải...' : 'Tải lên'}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-gray-500">Đang tải tài liệu...</span>
        </div>
      )}

      {/* Document List */}
      {!isLoading && documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <FileText className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-base font-semibold text-gray-700 mb-1">Chưa có tài liệu nào</h3>
          <p className="text-sm text-gray-500 mb-4">Hãy tải lên tài liệu bài giảng để bắt đầu!</p>
        </div>
      ) : !isLoading && (
        <div className="space-y-3">
          {documents.map((doc, idx) => {
            const fileType = getFileTypeFromPath(doc.filePath);
            const ftConfig = FILE_TYPE_CONFIG[fileType] ?? FILE_TYPE_CONFIG.docx;
            const Icon = ftConfig.icon;
            return (
              <motion.div
                key={doc.documentCode}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group flex items-center gap-4 bg-white border border-gray-100 hover:border-blue-200 hover:shadow-md rounded-xl px-5 py-4 transition-all"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${ftConfig.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-gray-400">{doc.subjectName}</span>
                    <span className="text-xs text-gray-300">•</span>
                    <span className="text-xs text-gray-400">{doc.gradeName}</span>
                    {doc.lessonName && (
                      <>
                        <span className="text-xs text-gray-300">•</span>
                        <span className="text-xs text-gray-400">{doc.lessonName}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-400 hidden sm:block">{formatDate(doc.uploadDate)}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {deletingDocCode === doc.documentCode ? (
                    <>
                      <span className="text-xs text-red-500 font-medium">Xóa?</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteDocument(doc.documentCode); setDeletingDocCode(null); }}
                        className="px-2 py-1 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                      >
                        Xác nhận
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeletingDocCode(null); }}
                        className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        Hủy
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingDocCode(doc.documentCode); }}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                      title="Xóa tài liệu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => onAnalyze(doc.documentCode)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-md rounded-lg transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Phân tích
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
