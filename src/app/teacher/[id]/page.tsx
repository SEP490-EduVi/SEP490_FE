'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Layers, AlertCircle, Loader2, ChevronRight,
} from 'lucide-react';
import { useProject } from '@/hooks/useProjectApi';
import { useProductsByProject, useDeleteProduct } from '@/hooks/useProductApi';
import { useLessonAnalysis, useGenerateSlides, useGenerateVideo, useLatestVideoByProject, useCurricula, useDeleteVideo } from '@/hooks/usePipelineApi';
import { useInputDocumentsByProject } from '@/hooks/useInputDocumentApi';
import { usePipelineHub } from '@/hooks/usePipelineHub';
import DocumentTree from '@/components/projects/DocumentTree';
import ProductTreeItem from '@/components/projects/ProductTreeItem';
import EvaluationModal from '@/components/projects/EvaluationModal';
import PipelineProgressModal from '@/components/projects/PipelineProgressModal';
import VideoPlayerModal from '@/components/projects/VideoPlayerModal';
import AnalysisFormModal from '@/components/projects/AnalysisFormModal';
import VideoConfirmModal from '@/components/projects/VideoConfirmModal';
import { useDocumentStore } from '@/store/useDocumentStore';
import * as productService from '@/services/productServices';
import { getEditedSlideGcsUrl } from '@/services/productServices';
import type { PipelineProgress, VideoProductDto } from '@/types/api';

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectCode = params.id as string;

  const { data: project, isLoading: isProjectLoading, isError: isProjectError } = useProject(projectCode);
  const { data: products = [], isLoading: isProductsLoading, refetch: refetchProducts } = useProductsByProject(projectCode);
  const { data: inputDocuments = [] } = useInputDocumentsByProject(projectCode);
  const deleteProduct = useDeleteProduct();
  const lessonAnalysis = useLessonAnalysis();
  const generateSlides = useGenerateSlides();
  const generateVideo = useGenerateVideo();
  const { data: latestVideo = null } = useLatestVideoByProject(projectCode);
  const deleteVideo = useDeleteVideo(projectCode);
  const { data: curricula = [] } = useCurricula();
  const setDocument = useDocumentStore((state) => state.setDocument);
  const startGeneration = useDocumentStore((state) => state.startGeneration);
  const queryClient = useQueryClient();

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [pipelineProgress, setPipelineProgress] = useState<PipelineProgress | null>(null);
  const [pipelineType, setPipelineType] = useState<'evaluation' | 'slides' | 'video'>('evaluation');
  const [showPipelineModal, setShowPipelineModal] = useState(false);

  useEffect(() => { setAccessToken(localStorage.getItem('accessToken')); }, []);

  const handlePipelineProgress = useCallback((event: PipelineProgress) => {
    setPipelineProgress(event);
    if (event.status === 'completed' || event.status === 'failed') {
      refetchProducts();
      if (event.step === 'video_completed') {
        queryClient.invalidateQueries({ queryKey: ['video', 'latest', projectCode] });
      }
    }
  }, [refetchProducts, queryClient, projectCode]);

  usePipelineHub({ accessToken, onProgress: handlePipelineProgress });

  const [expandedDocCodes, setExpandedDocCodes] = useState<Set<string>>(new Set());
  const [expandedProductCodes, setExpandedProductCodes] = useState<Set<string>>(new Set());
  const [docProductMap, setDocProductMap] = useState<Record<string, string[]>>(() => {
    try {
      const saved = sessionStorage.getItem(`dpm-${projectCode}`);
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const [evalProductCode, setEvalProductCode] = useState<string | null>(null);
  const [evalProductName, setEvalProductName] = useState<string | undefined>(undefined);
  const [viewSlideLoading, setViewSlideLoading] = useState<string | null>(null);
  const [videoLoadingCode, setVideoLoadingCode] = useState<string | null>(null);
  const [showVideoConfirm, setShowVideoConfirm] = useState(false);
  const [pendingVideoProductCode, setPendingVideoProductCode] = useState<string | null>(null);
  const [viewingVideo, setViewingVideo] = useState<VideoProductDto | null>(null);
  const [confirmDeleteProductCode, setConfirmDeleteProductCode] = useState<string | null>(null);
  const [showAnalysisForm, setShowAnalysisForm] = useState(false);
  const [analysisDocCode, setAnalysisDocCode] = useState<string | null>(null);

  const prevProductCodesRef = useRef<Set<string>>(new Set());

  // Auto-assign unlinked products to their document when only 1 document exists
  useEffect(() => {
    if (products.length === 0 || inputDocuments.length !== 1) return;
    const doc = inputDocuments[0];
    const allLinked = new Set(Object.values(docProductMap).flat());
    const unlinked = products.filter(p => !allLinked.has(p.productCode));
    if (unlinked.length === 0) return;
    setDocProductMap(prev => {
      const next = {
        ...prev,
        [doc.documentCode]: [
          ...(prev[doc.documentCode] ?? []),
          ...unlinked.map(p => p.productCode).filter(c => !(prev[doc.documentCode] ?? []).includes(c)),
        ],
      };
      try { sessionStorage.setItem(`dpm-${projectCode}`, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, inputDocuments]);

  const toggleDoc = (docCode: string) =>
    setExpandedDocCodes(prev => { const n = new Set(prev); n.has(docCode) ? n.delete(docCode) : n.add(docCode); return n; });

  const toggleProduct = (productCode: string) =>
    setExpandedProductCodes(prev => { const n = new Set(prev); n.has(productCode) ? n.delete(productCode) : n.add(productCode); return n; });

  const handleStartAnalysis = (docCode: string) => {
    router.push(`/pipeline?projectCode=${encodeURIComponent(projectCode)}&documentCode=${encodeURIComponent(docCode)}`);
  };

  const handleConfirmAnalysis = async (productName: string, year: number) => {
    if (!analysisDocCode) return;
    prevProductCodesRef.current = new Set(products.map(p => p.productCode));
    const docCode = analysisDocCode;
    setShowAnalysisForm(false); setAnalysisDocCode(null);
    lessonAnalysis.mutate(
      { documentCode: docCode, projectCode, productName, curriculumYear: year },
      {
        onSuccess: async () => {
          setPipelineType('evaluation'); setShowPipelineModal(true);
          try {
            const result = await refetchProducts();
            const newProds = (result.data ?? []).filter(p => !prevProductCodesRef.current.has(p.productCode));
            if (newProds.length > 0) {
              const newMap = { ...docProductMap, [docCode]: [...(docProductMap[docCode] ?? []), ...newProds.map(p => p.productCode)] };
              setDocProductMap(newMap);
              sessionStorage.setItem(`dpm-${projectCode}`, JSON.stringify(newMap));
              setExpandedDocCodes(prev => { const n = new Set(prev); n.add(docCode); return n; });
            }
          } catch { /* ignore */ }
        },
      },
    );
  };

  const handleGenerateSlides = (productCode: string) => {
    generateSlides.mutate(
      { productCode, slideRange: 'short' },
      { onSuccess: () => { startGeneration(productCode, projectCode); router.push('/teacher/editor'); } },
    );
  };

  const handleGenerateVideo = (productCode: string) => { setPendingVideoProductCode(productCode); setShowVideoConfirm(true); };

  const handleConfirmGenerateVideo = async () => {
    if (!pendingVideoProductCode) return;
    const productCode = pendingVideoProductCode;
    setShowVideoConfirm(false); setPendingVideoProductCode(null);
    try {
      setVideoLoadingCode(productCode);
      const url = await getEditedSlideGcsUrl(productCode);
      if (!url) { setVideoLoadingCode(null); return; }
      generateVideo.mutate(
        { productCode, slideEditedDocumentUrl: url },
        { onSuccess: () => { setPipelineType('video'); setShowPipelineModal(true); }, onSettled: () => setVideoLoadingCode(null) },
      );
    } catch { setVideoLoadingCode(null); }
  };

  const handleViewEvaluation = (productCode: string) => {
    const product = products.find(p => p.productCode === productCode);
    setEvalProductCode(productCode); setEvalProductName(product?.productName);
  };

  const handleViewSlide = async (productCode: string) => {
    try {
      setViewSlideLoading(productCode);
      const product = products.find(p => p.productCode === productCode);
      let slideDoc;
      if (product?.hasEditedSlide) {
        const result = await productService.getProductEditedSlide(productCode);
        slideDoc = result.slideEditedDocument;
      } else {
        const result = await productService.getProductSlide(productCode);
        slideDoc = result.slideDocument;
      }
      setDocument(slideDoc, productCode, projectCode, product?.hasEditedSlide ?? false);
      router.push('/teacher/editor');
    } finally { setViewSlideLoading(null); }
  };

  if (isProjectLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <p className="text-sm text-gray-500">Đang tải dự án...</p>
      </div>
    );
  }

  if (isProjectError || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-700 mb-1">Không tìm thấy dự án</h2>
        <p className="text-sm text-gray-500 mb-6">Dự án không tồn tại hoặc đã bị xóa.</p>
        <button onClick={() => router.push('/teacher')} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Quay về danh sách
        </button>
      </div>
    );
  }

  const allLinkedProductCodes = new Set(Object.values(docProductMap).flat());
  const unlinkedProducts = products.filter(p => !allLinkedProductCodes.has(p.productCode));

  const sharedProductProps = {
    latestVideo, viewSlideLoading, videoLoadingCode,
    confirmDeleteCode: confirmDeleteProductCode,
    onViewSlide: handleViewSlide,
    onViewEvaluation: handleViewEvaluation,
    onGenerateSlides: handleGenerateSlides,
    onGenerateVideo: handleGenerateVideo,
    onDeleteProduct: (code: string) => { deleteProduct.mutate(code); setConfirmDeleteProductCode(null); },
    onSetConfirmDelete: setConfirmDeleteProductCode,
    onWatchVideo: setViewingVideo,
    onDeleteVideo: (productVideoCode: string) => deleteVideo.mutate(productVideoCode),
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <button onClick={() => router.push('/teacher')} className="hover:text-blue-600 transition-colors">Dự án</button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">{project.projectName}</span>
          </div>
          <div className="flex items-start gap-4">
            <button onClick={() => router.push('/teacher')} className="mt-1 p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-2xl font-bold text-gray-900">{project.projectName}</h1>
              <span className="text-xs text-gray-400 font-mono">{project.projectCode}</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium ${project.status === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                {project.status === 0 ? 'Hoạt động' : 'Lưu trữ'}
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-4">
        <DocumentTree
          projectCode={projectCode}
          products={products}
          latestVideo={latestVideo}
          docProductMap={docProductMap}
          expandedDocCodes={expandedDocCodes}
          expandedProductCodes={expandedProductCodes}
          viewSlideLoading={viewSlideLoading}
          videoLoadingCode={videoLoadingCode}
          confirmDeleteProductCode={confirmDeleteProductCode}
          onToggleDoc={toggleDoc}
          onToggleProduct={toggleProduct}
          onAnalyze={handleStartAnalysis}
          onViewSlide={handleViewSlide}
          onViewEvaluation={handleViewEvaluation}
          onGenerateSlides={handleGenerateSlides}
          onGenerateVideo={handleGenerateVideo}
          onDeleteProduct={(code) => { deleteProduct.mutate(code); setConfirmDeleteProductCode(null); }}
          onSetConfirmDeleteProduct={setConfirmDeleteProductCode}
          onWatchVideo={setViewingVideo}
          onDeleteVideo={(productVideoCode) => deleteVideo.mutate(productVideoCode)}
        />


      </main>

      {viewingVideo && <VideoPlayerModal video={viewingVideo} projectCode={projectCode} onClose={() => setViewingVideo(null)} />}

      <EvaluationModal
        open={!!evalProductCode}
        productCode={evalProductCode}
        productName={evalProductName}
        onClose={() => { setEvalProductCode(null); setEvalProductName(undefined); }}
      />

      {viewSlideLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl px-8 py-6 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <p className="text-sm font-medium text-gray-700">Đang mở slide...</p>
          </div>
        </div>
      )}

      <PipelineProgressModal
        open={showPipelineModal}
        progress={pipelineProgress}
        pipelineType={pipelineType}
        onClose={() => { setShowPipelineModal(false); setPipelineProgress(null); }}
      />

      <AnalysisFormModal
        open={showAnalysisForm}
        curricula={curricula}
        isPending={lessonAnalysis.isPending}
        onClose={() => { setShowAnalysisForm(false); setAnalysisDocCode(null); }}
        onConfirm={handleConfirmAnalysis}
      />

      <VideoConfirmModal
        open={showVideoConfirm}
        onClose={() => { setShowVideoConfirm(false); setPendingVideoProductCode(null); }}
        onConfirm={handleConfirmGenerateVideo}
      />
    </div>
  );
}