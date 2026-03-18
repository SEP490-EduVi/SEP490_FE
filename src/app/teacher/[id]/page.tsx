'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, FileText, Layers, Film, CheckCircle, AlertCircle, Loader2, Sparkles, ChevronRight } from 'lucide-react';

import { useProject } from '@/hooks/useProjectApi';
import { useProductsByProject, useDeleteProduct } from '@/hooks/useProductApi';
import { useLessonAnalysis, useGenerateSlides, useGenerateVideo, useLatestVideoByProject } from '@/hooks/usePipelineApi';
import { useInputDocumentsByProject, useUploadInputDocument, useDeleteInputDocument } from '@/hooks/useInputDocumentApi';
import { usePipelineHub } from '@/hooks/usePipelineHub';
import DocumentsTab from '@/components/projects/DocumentsTab';
import ProductsTab from '@/components/projects/ProductsTab';
import VideosTab from '@/components/projects/VideosTab';
import EvaluationModal from '@/components/projects/EvaluationModal';
import PipelineProgressModal from '@/components/projects/PipelineProgressModal';
import { useDocumentStore } from '@/store/useDocumentStore';
import * as productService from '@/services/productServices';
import { getEditedSlideGcsUrl } from '@/services/productServices';
import type { PipelineProgress } from '@/types/api';

type TabKey = 'documents' | 'slides' | 'videos';

// ─ Component ─

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectCode = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─ API hooks ─
  const { data: project, isLoading: isProjectLoading, isError: isProjectError } = useProject(projectCode);
  const { data: products = [], isLoading: isProductsLoading, refetch: refetchProducts } = useProductsByProject(projectCode);
  const { data: inputDocuments = [], isLoading: isDocsLoading } = useInputDocumentsByProject(projectCode);
  const deleteProduct = useDeleteProduct();
  const deleteDoc = useDeleteInputDocument();
  const uploadDoc = useUploadInputDocument();
  const lessonAnalysis = useLessonAnalysis();
  const generateSlides = useGenerateSlides();
  const generateVideo = useGenerateVideo();
  const { data: latestVideo = null } = useLatestVideoByProject(projectCode);
  const setDocument = useDocumentStore((state) => state.setDocument);
  const startGeneration = useDocumentStore((state) => state.startGeneration);

  // ─ SignalR pipeline progress ─
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

  // ─ Local state ─
  const [activeTab, setActiveTab] = useState<TabKey>('documents');
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [evalProductCode, setEvalProductCode] = useState<string | null>(null);
  const [evalProductName, setEvalProductName] = useState<string | undefined>(undefined);
  const [viewSlideLoading, setViewSlideLoading] = useState<string | null>(null);
  const [videoLoadingCode, setVideoLoadingCode] = useState<string | null>(null);
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
          startGeneration(productCode);
          router.push('/teacher/editor');
        },
      },
    );
  };

  const handleClosePipelineModal = () => {
    setShowPipelineModal(false);
    setPipelineProgress(null);
  };

  const handleGenerateVideo = async (productCode: string) => {
    try {
      setVideoLoadingCode(productCode);
      const url = await getEditedSlideGcsUrl(productCode);
      if (!url) {
      console.error('[generateVideo] Không tìm thấy URL slide đã chỉnh sửa');
        return;
      }
      generateVideo.mutate(
        { productCode, slideEditedDocumentUrl: url },
        { onSettled: () => setVideoLoadingCode(null) },
      );
    } catch {
      setVideoLoadingCode(null);
    }
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
    { key: 'slides', label: 'Slide', icon: Layers, count: products.length },
    { key: 'videos', label: 'Video', icon: Film, count: latestVideo?.status === 'completed' ? 1 : 0 },
  ];

  // ─ Loading state ─
  if (isProjectLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <p className="text-sm text-gray-500">Đang tải dự án...</p>
      </div>
    );
  }

  // ─ Error / Not found state ─
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
      {/* ─ Header ─ */}
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
        {/* ─ Quick Stats ─ */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Tài liệu', value: inputDocuments.length, icon: FileText, color: 'text-blue-600 bg-blue-50' },
            { label: 'Slide', value: products.length, icon: Layers, color: 'text-purple-600 bg-purple-50' },
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

        {/* ─ Tabs ─ */}
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

        {/* ─ Tab Content ─ */}
        <AnimatePresence mode="wait">
          {activeTab === 'documents' && (
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
                onDeleteDocument={(code) => deleteDoc.mutate(code)}
              />
            </motion.div>
          )}
          {activeTab === 'slides' && (
            <motion.div
              key="slides"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ProductsTab
                products={products}
                isLoading={isProductsLoading}
                onDeleteProduct={(code) => deleteProduct.mutate(code)}
                onViewSlide={handleViewSlide}
                onViewEvaluation={handleViewEvaluation}
                onGenerateSlides={handleGenerateSlides}
                onGenerateVideo={handleGenerateVideo}
                videoLoadingCode={videoLoadingCode}
              />
            </motion.div>
          )}
          {activeTab === 'videos' && (
            <motion.div
              key="videos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <VideosTab latestVideo={latestVideo} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ─ Evaluation Modal ─ */}
      <EvaluationModal
        open={!!evalProductCode}
        productCode={evalProductCode}
        productName={evalProductName}
        onClose={() => { setEvalProductCode(null); setEvalProductName(undefined); }}
      />

      {/* ─ View Slide Loading Overlay ─ */}
      {viewSlideLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl px-8 py-6 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <p className="text-sm font-medium text-gray-700">Đang mở slide...</p>
          </div>
        </div>
      )}

      {/* ─ Pipeline Progress Modal ─ */}
      <PipelineProgressModal
        open={showPipelineModal}
        progress={pipelineProgress}
        pipelineType={pipelineType}
        onClose={handleClosePipelineModal}
      />

      {/* ─ Analysis Form Modal ─ */}
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

