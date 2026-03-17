'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  Package,
  Upload,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  Sparkles,
  File,
  Image as ImageIcon,
  FileVideo,
  ChevronRight,
  Layers,
} from 'lucide-react';

import { useProject } from '@/hooks/useProjectApi';
import { useProductsByProject, useDeleteProduct } from '@/hooks/useProductApi';
import { useLessonAnalysis, useGenerateSlides } from '@/hooks/usePipelineApi';
import { useInputDocumentsByProject, useUploadInputDocument, useDeleteInputDocument } from '@/hooks/useInputDocumentApi';
import { usePipelineHub } from '@/hooks/usePipelineHub';
import ProductsTab from '@/components/projects/ProductsTab';
import EvaluationModal from '@/components/projects/EvaluationModal';
import PipelineProgressModal from '@/components/projects/PipelineProgressModal';
import { useDocumentStore } from '@/store/useDocumentStore';
import * as productService from '@/services/productServices';
import type { IDocument } from '@/types/nodes';
import type { PipelineProgress, InputDocumentDto } from '@/types/api';

// ── Local types ────────────────────────────────────────────────────────────

type TabKey = 'documents' | 'products';

// ── Helpers ────────────────────────────────────────────────────────────────

const FILE_TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> = {
  pdf:   { icon: FileText,  color: 'text-red-500 bg-red-50' },
  docx:  { icon: File,      color: 'text-blue-500 bg-blue-50' },
  pptx:  { icon: Layers,    color: 'text-orange-500 bg-orange-50' },
  image: { icon: ImageIcon, color: 'text-emerald-500 bg-emerald-50' },
  video: { icon: FileVideo, color: 'text-purple-500 bg-purple-50' },
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function getFileTypeFromPath(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx' || ext === 'doc') return 'docx';
  if (ext === 'pptx' || ext === 'ppt') return 'pptx';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext ?? '')) return 'image';
  if (['mp4', 'mov', 'avi', 'webm'].includes(ext ?? '')) return 'video';
  return 'docx';
}

// ── Component ──────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectCode = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── API hooks ──────────────────────────────────────────────────────────
  const { data: project, isLoading: isProjectLoading, isError: isProjectError } = useProject(projectCode);
  const { data: products = [], isLoading: isProductsLoading, refetch: refetchProducts } = useProductsByProject(projectCode);
  const { data: inputDocuments = [], isLoading: isDocsLoading } = useInputDocumentsByProject(projectCode);
  const deleteProduct = useDeleteProduct();
  const deleteDoc = useDeleteInputDocument();
  const uploadDoc = useUploadInputDocument();
  const lessonAnalysis = useLessonAnalysis();
  const generateSlides = useGenerateSlides();
  const setDocument = useDocumentStore((state) => state.setDocument);

  // ── SignalR pipeline progress ──────────────────────────────────────────
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [pipelineProgress, setPipelineProgress] = useState<PipelineProgress | null>(null);
  const [pipelineType, setPipelineType] = useState<'evaluation' | 'slides'>('evaluation');
  const [showPipelineModal, setShowPipelineModal] = useState(false);

  useEffect(() => {
    setAccessToken(localStorage.getItem('accessToken'));
  }, []);

  const handlePipelineProgress = useCallback((event: PipelineProgress) => {
    setPipelineProgress(event);
    if (event.status === 'completed' || event.status === 'failed') {
      // Refresh products list when pipeline finishes
      refetchProducts();
    }
  }, [refetchProducts]);

  usePipelineHub({ accessToken, onProgress: handlePipelineProgress });

  // ── Local state ────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabKey>('documents');
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [evalProductCode, setEvalProductCode] = useState<string | null>(null);
  const [evalProductName, setEvalProductName] = useState<string | undefined>(undefined);
  const [viewSlideLoading, setViewSlideLoading] = useState<string | null>(null);
  // Upload form state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubjectCode, setUploadSubjectCode] = useState('');
  const [uploadGradeCode, setUploadGradeCode] = useState('');
  const [uploadLessonCode, setUploadLessonCode] = useState('');
  // Analysis form state
  const [analysisDocCode, setAnalysisDocCode] = useState<string | null>(null);
  const [analysisProductName, setAnalysisProductName] = useState('');
  const [showAnalysisForm, setShowAnalysisForm] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploadFile(file);
      if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleUpload = () => {
    if (!uploadFile || !uploadTitle || !uploadSubjectCode || !uploadGradeCode || !uploadLessonCode) return;
    uploadDoc.mutate(
      {
        File: uploadFile,
        Title: uploadTitle,
        ProjectCode: projectCode,
        SubjectCode: uploadSubjectCode,
        GradeCode: uploadGradeCode,
        LessonCode: uploadLessonCode,
      },
      {
        onSuccess: () => {
          setUploadFile(null);
          setUploadTitle('');
          setUploadSubjectCode('');
          setUploadGradeCode('');
          setUploadLessonCode('');
          setShowUploadArea(false);
        },
      },
    );
  };

  const handleStartAnalysis = (docCode: string) => {
    setAnalysisDocCode(docCode);
    setShowAnalysisForm(true);
  };

  const handleConfirmAnalysis = () => {
    if (!analysisDocCode || !analysisProductName) return;
    lessonAnalysis.mutate(
      {
        documentCode: analysisDocCode,
        projectCode,
        productName: analysisProductName,
      },
      {
        onSuccess: () => {
          setPipelineType('evaluation');
          setShowPipelineModal(true);
          setShowAnalysisForm(false);
          setAnalysisDocCode(null);
          setAnalysisProductName('');
        },
      },
    );
  };

  const handleGenerateSlides = (productCode: string) => {
    generateSlides.mutate(
      { productCode, slideRange: 'short' },
      {
        onSuccess: () => {
          setPipelineType('slides');
          setShowPipelineModal(true);
        },
      },
    );
  };

  const handleDeleteDocument = (documentCode: string) => {
    deleteDoc.mutate(documentCode);
  };

  const handleClosePipelineModal = () => {
    setShowPipelineModal(false);
    setPipelineProgress(null);
  };

  const handleDeleteProduct = (productCode: string) => {
    deleteProduct.mutate(productCode);
  };

  const handleViewEvaluation = (productCode: string) => {
    const product = products.find((p) => p.productCode === productCode);
    setEvalProductCode(productCode);
    setEvalProductName(product?.productName);
  };

  const handleViewSlide = async (productCode: string) => {
    try {
      setViewSlideLoading(productCode);
      const product = products.find((p) => p.productCode === productCode);
      let slideDoc;
      if (product?.hasEditedSlide) {
        const result = await productService.getProductEditedSlide(productCode);
        slideDoc = result.slideEditedDocument;
      } else {
        const result = await productService.getProductSlide(productCode);
        slideDoc = result.slideDocument;
      }
      setDocument(slideDoc, productCode);
      router.push('/teacher/editor');
    } finally {
      setViewSlideLoading(null);
    }
  };

  const tabs: { key: TabKey; label: string; icon: React.ElementType; count: number }[] = [
    { key: 'documents', label: 'Tài liệu đầu vào', icon: FileText, count: inputDocuments.length },
    { key: 'products', label: 'Sản phẩm AI', icon: Package, count: products.length },
  ];

  // ── Loading state ───────────────────────────────────────────────────────
  if (isProjectLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <p className="text-sm text-gray-500">Đang tải dự án...</p>
      </div>
    );
  }

  // ── Error / Not found state ────────────────────────────────────────────
  if (isProjectError || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-700 mb-1">Không tìm thấy dự án</h2>
        <p className="text-sm text-gray-500 mb-6">Dự án không tồn tại hoặc đã bị xóa.</p>
        <button
          onClick={() => router.push('/teacher')}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay về danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* ── Header ── */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <button
              onClick={() => router.push('/teacher')}
              className="hover:text-blue-600 transition-colors"
            >
              Dự án
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">{project.projectName}</span>
          </div>

          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <button
                onClick={() => router.push('/teacher')}
                className="mt-1 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{project.projectName}</h1>
                  <span className="text-xs text-gray-400 font-mono">{project.projectCode}</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium ${
                    project.status === 0
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {project.status === 0 ? 'Hoạt động' : 'Lưu trữ'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ── Quick Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Tài liệu', value: inputDocuments.length, icon: FileText, color: 'text-blue-600 bg-blue-50' },
            { label: 'Sản phẩm', value: products.length, icon: Package, color: 'text-purple-600 bg-purple-50' },
            { label: 'Hoàn thành', value: products.filter((p) => p.statusName === 'SLIDES_GENERATED').length, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Tabs ── */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                  isActive ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'documents' ? (
            <motion.div
              key="documents"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <DocumentsTab
                documents={inputDocuments}
                isLoading={isDocsLoading}
                showUploadArea={showUploadArea}
                dragOver={dragOver}
                fileInputRef={fileInputRef}
                uploadFile={uploadFile}
                uploadTitle={uploadTitle}
                uploadSubjectCode={uploadSubjectCode}
                uploadGradeCode={uploadGradeCode}
                uploadLessonCode={uploadLessonCode}
                isUploading={uploadDoc.isPending}
                onToggleUpload={() => setShowUploadArea(!showUploadArea)}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleFileDrop}
                onFileSelect={handleFileSelect}
                onUpload={handleUpload}
                onTitleChange={setUploadTitle}
                onSubjectCodeChange={setUploadSubjectCode}
                onGradeCodeChange={setUploadGradeCode}
                onLessonCodeChange={setUploadLessonCode}
                onClickUpload={() => fileInputRef.current?.click()}
                onAnalyze={handleStartAnalysis}
                onDeleteDocument={handleDeleteDocument}
              />
            </motion.div>
          ) : (
            <motion.div
              key="products"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ProductsTab
                products={products}
                isLoading={isProductsLoading}
                onDeleteProduct={handleDeleteProduct}
                onViewSlide={handleViewSlide}
                onViewEvaluation={handleViewEvaluation}
                onGenerateSlides={handleGenerateSlides}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Evaluation Modal ── */}
      <EvaluationModal
        open={!!evalProductCode}
        productCode={evalProductCode}
        productName={evalProductName}
        onClose={() => { setEvalProductCode(null); setEvalProductName(undefined); }}
      />

      {/* ── View Slide Loading Overlay ── */}
      {viewSlideLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl px-8 py-6 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <p className="text-sm font-medium text-gray-700">Đang mở slide...</p>
          </div>
        </div>
      )}

      {/* ── Pipeline Progress Modal ── */}
      <PipelineProgressModal
        open={showPipelineModal}
        progress={pipelineProgress}
        pipelineType={pipelineType}
        onClose={handleClosePipelineModal}
      />

      {/* ── Analysis Form Modal ── */}
      <AnimatePresence>
        {showAnalysisForm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-1">Phân tích bài giảng</h3>
              <p className="text-sm text-gray-500 mb-4">Đặt tên cho sản phẩm AI sẽ được tạo từ tài liệu này.</p>

              <label className="block text-sm font-medium text-gray-700 mb-1">Tên sản phẩm</label>
              <input
                type="text"
                value={analysisProductName}
                onChange={(e) => setAnalysisProductName(e.target.value)}
                placeholder="VD: Bài giảng Địa lí Bài 1"
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 mb-4"
              />

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowAnalysisForm(false); setAnalysisDocCode(null); setAnalysisProductName(''); }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmAnalysis}
                  disabled={!analysisProductName || lessonAnalysis.isPending}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {lessonAnalysis.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  Bắt đầu phân tích
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Documents Tab (connected to Pipeline API) ─────────────────────────────

function DocumentsTab({
  documents,
  isLoading,
  showUploadArea,
  dragOver,
  fileInputRef,
  uploadFile,
  uploadTitle,
  uploadSubjectCode,
  uploadGradeCode,
  uploadLessonCode,
  isUploading,
  onToggleUpload,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  onUpload,
  onTitleChange,
  onSubjectCodeChange,
  onGradeCodeChange,
  onLessonCodeChange,
  onClickUpload,
  onAnalyze,
  onDeleteDocument,
}: {
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
}) {
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
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.ppt,.pptx"
        onChange={onFileSelect}
        className="hidden"
      />

      {/* Upload Drop Zone + Form */}
      <AnimatePresence>
        {showUploadArea && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-5"
          >
            {/* Drop zone */}
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
                <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-3 ${
                  dragOver ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
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

            {/* Upload form fields */}
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
                    <label className="block text-xs font-medium text-gray-600 mb-1">Mã môn học *</label>
                    <input
                      type="text"
                      value={uploadSubjectCode}
                      onChange={(e) => onSubjectCodeChange(e.target.value)}
                      placeholder="VD: dia_li"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Mã lớp *</label>
                    <input
                      type="text"
                      value={uploadGradeCode}
                      onChange={(e) => onGradeCodeChange(e.target.value)}
                      placeholder="VD: lop_10"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Mã bài học *</label>
                    <input
                      type="text"
                      value={uploadLessonCode}
                      onChange={(e) => onLessonCodeChange(e.target.value)}
                      placeholder="VD: bai_1"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    onClick={onUpload}
                    disabled={isUploading || !uploadTitle || !uploadSubjectCode || !uploadGradeCode || !uploadLessonCode}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
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
                {/* File icon */}
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${ftConfig.color}`}>
                  <Icon className="w-5 h-5" />
                </div>

                {/* Info */}
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

                {/* Date */}
                <span className="text-xs text-gray-400 hidden sm:block">
                  {formatDate(doc.uploadDate)}
                </span>

                {/* Actions */}
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
                    title="Phân tích với AI"
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
