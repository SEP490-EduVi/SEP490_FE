'use client';

import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Upload, Loader2, ChevronRight, Sparkles, Trash2,
  File, Image as ImageIcon, FileVideo,
} from 'lucide-react';
import { useInputDocumentsByProject, useUploadInputDocument, useDeleteInputDocument } from '@/hooks/useInputDocumentApi';
import { useSubjects, useGrades, useLessons } from '@/hooks/useMetadataApi';
import ProductTreeItem from './ProductTreeItem';
import { formatDate } from './ProductTreeItem';
import type { ProductDto, VideoProductDto } from '@/types/api';
import { notify } from '@/components/common';

// ─── File-type helpers ────────────────────────────────────────────────────────

const FILE_TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  pdf:   { icon: FileText,  color: 'text-red-500 bg-red-50' },
  docx:  { icon: File,      color: 'text-blue-500 bg-blue-50' },
  pptx:  { icon: FileText,  color: 'text-orange-500 bg-orange-50' },
  image: { icon: ImageIcon, color: 'text-emerald-500 bg-emerald-50' },
  video: { icon: FileVideo, color: 'text-purple-500 bg-purple-50' },
};

function getFileType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx' || ext === 'doc') return 'docx';
  if (ext === 'pptx' || ext === 'ppt') return 'pptx';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext ?? '')) return 'image';
  if (['mp4', 'mov', 'avi', 'webm'].includes(ext ?? '')) return 'video';
  return 'docx';
}

const SELECT_CLS = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-white disabled:bg-gray-50 disabled:text-gray-400';

// ─── Props ────────────────────────────────────────────────────────────────────

interface DocumentTreeProps {
  projectCode: string;
  products: ProductDto[];
  latestVideo: VideoProductDto | null;
  docProductMap: Record<string, string[]>;
  expandedDocCodes: Set<string>;
  expandedProductCodes: Set<string>;
  viewSlideLoading: string | null;
  videoLoadingCode: string | null;
  confirmDeleteProductCode: string | null;
  onToggleDoc: (code: string) => void;
  onToggleProduct: (code: string) => void;
  onAnalyze: (docCode: string) => void;
  onViewSlide: (code: string) => void;
  onViewEvaluation: (code: string) => void;
  onGenerateSlides: (code: string) => void;
  onGenerateVideo: (code: string) => void;
  onDeleteProduct: (code: string) => void;
  onSetConfirmDeleteProduct: (code: string | null) => void;
  onWatchVideo: (video: VideoProductDto) => void;
  onDeleteVideo: (productVideoCode: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DocumentTree({
  projectCode, products, latestVideo, docProductMap,
  expandedDocCodes, expandedProductCodes,
  viewSlideLoading, videoLoadingCode, confirmDeleteProductCode,
  onToggleDoc, onToggleProduct, onAnalyze,
  onViewSlide, onViewEvaluation, onGenerateSlides, onGenerateVideo,
  onDeleteProduct, onSetConfirmDeleteProduct, onWatchVideo, onDeleteVideo,
}: DocumentTreeProps) {
  // ─ Data hooks ─
  const { data: inputDocuments = [], isLoading: isDocsLoading } = useInputDocumentsByProject(projectCode);
  const deleteDoc = useDeleteInputDocument();
  const uploadDoc = useUploadInputDocument();

  // ─ Metadata hooks (for upload form) ─
  const [uploadSubjectCode, setUploadSubjectCode] = useState('');
  const { data: subjects = [], isLoading: isSubjectsLoading } = useSubjects();
  const [uploadGradeCode, setUploadGradeCode] = useState('');
  const { data: grades = [], isLoading: isGradesLoading } = useGrades();
  const [uploadLessonCode, setUploadLessonCode] = useState('');
  const { data: lessons = [], isLoading: isLessonsLoading } = useLessons(uploadSubjectCode || undefined);

  // ─ Upload form state ─
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // ─ Delete confirmation ─
  const [confirmDeleteDocCode, setConfirmDeleteDocCode] = useState<string | null>(null);

  // ─ Upload handlers ─
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setUploadFile(file); if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^.]+$/, '')); }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) { setUploadFile(file); if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^.]+$/, '')); }
  };

  const handleUpload = () => {
    if (!uploadFile || !uploadTitle || !uploadSubjectCode || !uploadGradeCode || !uploadLessonCode) return;
    uploadDoc.mutate(
      { File: uploadFile, Title: uploadTitle, ProjectCode: projectCode, SubjectCode: uploadSubjectCode, GradeCode: uploadGradeCode, LessonCode: uploadLessonCode },
      {
        onSuccess: () => {
          notify.success(`Tải lên “${uploadTitle}” thành công!`);
          setUploadFile(null); setUploadTitle('');
          setUploadSubjectCode(''); setUploadGradeCode(''); setUploadLessonCode('');
          setShowUploadArea(false);
        },
        onError: () => notify.error('Tải lên tài liệu thất bại. Vui lòng thử lại.'),
      },
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.ppt,.pptx" onChange={handleFileSelect} className="hidden" />

      {/* Section header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
            <FileText className="w-4 h-4 text-blue-500" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Tài liệu đầu vào</h2>
            <p className="text-xs text-gray-400">{inputDocuments.length} tài liệu</p>
          </div>
        </div>
        <button
          onClick={() => setShowUploadArea(!showUploadArea)}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Upload className="w-3.5 h-3.5" /> Tải lên
        </button>
      </div>

      {/* Upload form */}
      <AnimatePresence>
        {showUploadArea && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-gray-100"
          >
            <div className="px-5 py-5 bg-gray-50/50">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all mb-4 ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30'}`}
              >
                <Upload className={`w-6 h-6 mx-auto mb-2 ${dragOver ? 'text-blue-500' : 'text-gray-400'}`} />
                {uploadFile
                  ? <p className="text-sm font-medium text-blue-600">{uploadFile.name}</p>
                  : (<><p className="text-sm text-gray-600">{dragOver ? 'Thả file vào đây!' : 'Kéo & thả hoặc click để chọn file'}</p><p className="text-xs text-gray-400 mt-0.5">PDF, Word, PowerPoint</p></>)
                }
              </div>
              {uploadFile && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tiêu đề *</label>
                    <input type="text" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} placeholder="VD: Giáo Án Địa Lí Bài 1"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400" />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Môn học *</label>
                      <select value={uploadSubjectCode} onChange={(e) => { setUploadSubjectCode(e.target.value); setUploadLessonCode(''); }} disabled={isSubjectsLoading} className={SELECT_CLS}>
                        <option value="">{isSubjectsLoading ? 'Đang tải...' : '-- Chọn môn --'}</option>
                        {subjects.map(s => <option key={s.subjectCode} value={s.subjectCode}>{s.subjectName}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Lớp *</label>
                      <select value={uploadGradeCode} onChange={(e) => setUploadGradeCode(e.target.value)} disabled={isGradesLoading} className={SELECT_CLS}>
                        <option value="">{isGradesLoading ? 'Đang tải...' : '-- Chọn lớp --'}</option>
                        {grades.map(g => <option key={g.gradeCode} value={g.gradeCode}>{g.gradeName}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Bài học *</label>
                      <select value={uploadLessonCode} onChange={(e) => setUploadLessonCode(e.target.value)} disabled={!uploadSubjectCode || isLessonsLoading} className={SELECT_CLS}>
                        <option value="">{!uploadSubjectCode ? 'Chọn môn trước' : isLessonsLoading ? 'Đang tải...' : '-- Chọn bài --'}</option>
                        {lessons.map(l => <option key={l.lessonCode} value={l.lessonCode}>{l.lessonName}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button onClick={handleUpload} disabled={uploadDoc.isPending || !uploadTitle || !uploadSubjectCode || !uploadGradeCode || !uploadLessonCode}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors">
                      {uploadDoc.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploadDoc.isPending ? 'Đang tải...' : 'Tải lên'}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document rows */}
      {isDocsLoading ? (
        <div className="flex items-center justify-center py-12 border-t border-gray-100">
          <Loader2 className="w-5 h-5 animate-spin text-blue-500 mr-2" /><span className="text-sm text-gray-500">Đang tải...</span>
        </div>
      ) : inputDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border-t border-gray-100">
          <FileText className="w-8 h-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">Chưa có tài liệu nào. Hãy tải lên để bắt đầu!</p>
        </div>
      ) : (
        <div className="border-t border-gray-100 divide-y divide-gray-50">
          {inputDocuments.map((doc) => {
            const isDocExpanded = expandedDocCodes.has(doc.documentCode);
            const linkedProdCodes = docProductMap[doc.documentCode] ?? [];
            const linkedProducts = products.filter(p => linkedProdCodes.includes(p.productCode));
            const ftConfig = FILE_TYPE_CONFIG[getFileType(doc.filePath)] ?? FILE_TYPE_CONFIG.docx;
            const Icon = ftConfig.icon;
            return (
              <div key={doc.documentCode} className={isDocExpanded ? 'bg-blue-50/20' : ''}>
                {/* Document row */}
                <div className="flex items-center gap-2 px-5 py-3.5">
                  <button onClick={() => onToggleDoc(doc.documentCode)} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
                    <ChevronRight className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform duration-200 ${isDocExpanded ? 'rotate-90' : ''}`} />
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${ftConfig.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                      <p className="text-xs text-gray-400">{doc.subjectName} • {doc.gradeName}{doc.lessonName ? ` • ${doc.lessonName}` : ''}</p>
                    </div>
                    {linkedProducts.length > 0 && (
                      <span className="flex-shrink-0 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                        {linkedProducts.length} sản phẩm
                      </span>
                    )}
                    <span className="flex-shrink-0 text-xs text-gray-400 hidden sm:block">{formatDate(doc.uploadDate)}</span>
                  </button>
                  {/* Row actions */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => onAnalyze(doc.documentCode)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg hover:shadow-sm transition-all"
                    >
                      <Sparkles className="w-3 h-3" /> Phân tích
                    </button>
                    {confirmDeleteDocCode === doc.documentCode ? (
                      <>
                        <button onClick={() => { deleteDoc.mutate(doc.documentCode, { onSuccess: () => notify.success('Đã xóa tài liệu thành công'), onError: () => notify.error('Không thể xóa tài liệu. Vui lòng thử lại.') }); setConfirmDeleteDocCode(null); }} className="px-2 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg">Xóa</button>
                        <button onClick={() => setConfirmDeleteDocCode(null)} className="px-2 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Hủy</button>
                      </>
                    ) : (
                      <button onClick={() => setConfirmDeleteDocCode(doc.documentCode)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded: linked products */}
                <AnimatePresence>
                  {isDocExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-14 pr-5 pb-4 space-y-2">
                        {linkedProducts.length === 0 ? (
                          <div className="flex items-center gap-2 py-3 text-xs text-gray-400">
                            <Sparkles className="w-3.5 h-3.5" />
                            Nhấn <strong className="text-gray-600">Phân tích</strong> để AI tạo sản phẩm từ tài liệu này.
                          </div>
                        ) : (
                          linkedProducts.map(product => (
                            <ProductTreeItem
                              key={product.productCode}
                              product={product}
                              latestVideo={latestVideo?.productCode === product.productCode ? latestVideo : null}
                              isExpanded={expandedProductCodes.has(product.productCode)}
                              onToggle={() => onToggleProduct(product.productCode)}
                              viewSlideLoading={viewSlideLoading}
                              videoLoadingCode={videoLoadingCode}
                              confirmDeleteCode={confirmDeleteProductCode}
                              onViewSlide={onViewSlide}
                              onViewEvaluation={onViewEvaluation}
                              onGenerateSlides={onGenerateSlides}
                              onGenerateVideo={onGenerateVideo}
                              onDeleteProduct={onDeleteProduct}
                              onSetConfirmDelete={onSetConfirmDeleteProduct}
                              onWatchVideo={onWatchVideo}
                              onDeleteVideo={onDeleteVideo}
                            />
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
