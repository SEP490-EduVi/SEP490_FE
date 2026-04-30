'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, AlertCircle, Loader2, ChevronRight, Sparkles, BookOpen,
} from 'lucide-react';
import { useProject } from '@/hooks/useProjectApi';
import { useProductsByProject, useDeleteProduct } from '@/hooks/useProductApi';
import { useLessonAnalysis, useGenerateSlides, useGenerateVideo, useVideosByProject, useCurricula, useDeleteVideo } from '@/hooks/usePipelineApi';
import { useInputDocumentsByProject } from '@/hooks/useInputDocumentApi';
import { usePipelineHub } from '@/hooks/usePipelineHub';
import SourcesPanel from '@/components/projects/SourcesPanel';
import StudioCenter from '@/components/projects/StudioCenter';
import ProductResultPanel from '@/components/projects/ProductResultPanel';
import PipelineProgressModal from '@/components/projects/PipelineProgressModal';
import VideoPlayerModal from '@/components/projects/VideoPlayerModal';
import AnalysisFormModal from '@/components/projects/AnalysisFormModal';
import CreateVideoModal from '@/components/projects/CreateVideoModal';
import { useGames } from '@/hooks/useGamesApi';
import { useGameHub } from '@/hooks/useGameHub';
import { getGameResultJson } from '@/services/gamesServices';
import GameConfigModal from '@/components/teacher/project/GameConfigModal';
import { useDocumentStore } from '@/store/useDocumentStore';
import { usePipelineTaskStore, PipelineTaskType } from '@/store/usePipelineTaskStore';
import { usePipelineProgressStore } from '@/store/usePipelineProgressStore';
import * as productService from '@/services/productServices';
import { getEditedSlideGcsUrl, getProductEvaluation } from '@/services/productServices';
import { notify, MSGS } from '@/components/common';
import { exportToEduvi } from '@/lib/exportToEduvi';
import type { EduViGame, EduViVideo } from '@/lib/exportToEduvi';
import type { PipelineProgress, VideoProductDto, GameDto, InputDocumentDto, ProductEvaluationResponse } from '@/types/api';
import type { IDocument } from '@/types';

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectCode = params.id as string;

  const { data: project, isLoading: isProjectLoading, isError: isProjectError } = useProject(projectCode);
  const { data: products = [], refetch: refetchProducts } = useProductsByProject(projectCode);
  const { data: inputDocs = [] } = useInputDocumentsByProject(projectCode);
  const deleteProduct = useDeleteProduct();
  const lessonAnalysis = useLessonAnalysis();
  const generateSlides = useGenerateSlides();
  const generateVideo = useGenerateVideo();
  const { data: projectVideos = [] } = useVideosByProject(projectCode);
  const deleteVideo = useDeleteVideo(projectCode);
  const { data: curricula = [] } = useCurricula();
  const { data: games = [] } = useGames();
  const setDocument = useDocumentStore((state) => state.setDocument);
  const startGeneration = useDocumentStore((state) => state.startGeneration);
  const queryClient = useQueryClient();

  const hydrateTaskStore = usePipelineTaskStore((s) => s.hydrate);
  const saveTask = usePipelineTaskStore((s) => s.saveTask);
  const saveTaskWithProject = usePipelineTaskStore((s) => s.saveTaskWithProject);
  const clearTask = usePipelineTaskStore((s) => s.clearTask);
  const getTaskId = usePipelineTaskStore((s) => s.getTaskId);
  const setGlobalProgress = usePipelineProgressStore((s) => s.setProgress);
  const clearGlobalProgress = usePipelineProgressStore((s) => s.clear);

  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Invalidate games cache when a game finishes via SignalR
  useGameHub({
    accessToken,
    onProgress: (progress) => {
      if (progress.status === 'completed' || progress.status === 'failed') {
        queryClient.invalidateQueries({ queryKey: ['games'] });
      }
    },
  });
  const [pipelineProgress, setPipelineProgress] = useState<PipelineProgress | null>(null);
  const [pipelineType, setPipelineType] = useState<'evaluation' | 'slides' | 'video'>('evaluation');
  const [showPipelineModal, setShowPipelineModal] = useState(false);

  const [evalProductCode, setEvalProductCode] = useState<string | null>(null);
  const [evalProductName, setEvalProductName] = useState<string | undefined>(undefined);
  const [activeDocCode, setActiveDocCode] = useState<string | null>(null);

  // Auto-select first inputDoc on load
  useEffect(() => {
    if (activeDocCode === null && inputDocs.length > 0) {
      setActiveDocCode(inputDocs[0].documentCode);
    }
  }, [inputDocs, activeDocCode]);
  const [viewSlideLoading, setViewSlideLoading] = useState<string | null>(null);
  const [videoLoadingCode, setVideoLoadingCode] = useState<string | null>(null);
  const [deletingSlide, setDeletingSlide] = useState<string | null>(null);
  const [deletingVideo, setDeletingVideo] = useState<string | null>(null);
  const [showVideoConfirm, setShowVideoConfirm] = useState(false);
  const [pendingVideoProductCode, setPendingVideoProductCode] = useState<string | null>(null);
  const [viewingVideo, setViewingVideo] = useState<VideoProductDto | null>(null);
  const [showAnalysisForm, setShowAnalysisForm] = useState(false);
  const [analysisDocCode, setAnalysisDocCode] = useState<string | null>(null);
  const [pendingGameProductCode, setPendingGameProductCode] = useState<string | null>(null);
  const [pendingGameProductName, setPendingGameProductName] = useState<string>('');
  const [showGameConfigModal, setShowGameConfigModal] = useState(false);
  const [detailProductCode, setDetailProductCode] = useState<string | null>(null);
  const [slidePreviewDoc, setSlidePreviewDoc] = useState<IDocument | null>(null);
  const [previewSlideLoading, setPreviewSlideLoading] = useState<string | null>(null);
  const [slideWarnProductCode, setSlideWarnProductCode] = useState<string | null>(null);
  const [slideWarnSlideRange, setSlideWarnSlideRange] = useState<'short' | 'medium'>('medium');

  const prevProductCodesRef = useRef<Set<string>>(new Set());

  const searchParams = useSearchParams();

  useEffect(() => { setAccessToken(localStorage.getItem('accessToken')); }, []);
  useEffect(() => {
    hydrateTaskStore();
    const allTasks = usePipelineTaskStore.getState().getAllTasks();
    if (allTasks.length > 0) {
      const videoTask = allTasks.find((t) => t.key.startsWith('video:'));
      const evalTask = allTasks.find((t) => t.key.startsWith('eval:'));
      // Slide generation progress is shown in the editor overlay — no modal needed here
      if (videoTask) { setPipelineType('video'); setShowPipelineModal(true); }
      else if (evalTask) { setPipelineType('evaluation'); setShowPipelineModal(true); }
    }
  }, [hydrateTaskStore]); // eslint-disable-line

  // Auto-trigger video generation when coming from the editor
  const autoVideoTriggeredRef = useRef(false);
  useEffect(() => {
    if (autoVideoTriggeredRef.current) return;
    const action = searchParams.get('action');
    const productCode = searchParams.get('productCode');
    if (action === 'generate-video' && productCode) {
      autoVideoTriggeredRef.current = true;
      // Wait for products to be loaded before triggering
      if (products.length > 0) {
        handleGenerateVideo(productCode);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, products]);

  const pendingTaskRef = useRef<{ type: PipelineTaskType; productCode: string } | null>(null);

  const handlePipelineProgress = useCallback((event: PipelineProgress) => {
    const resolveType = (e: PipelineProgress): PipelineTaskType | null => {
      if (e.step === 'video_completed') return 'video';
      if (e.step === 'completed') return 'eval';
      if (
        e.step?.includes('slide') ||
        e.step?.includes('generating') ||
        e.detail?.toLowerCase().includes('slide')
      ) return 'slides';
      return null;
    };

    if (event.taskId) {
      if (
        pendingTaskRef.current &&
        (event.status === 'queued' || event.status === 'processing')
      ) {
        const { type, productCode: pCode } = pendingTaskRef.current;
        saveTaskWithProject(type, pCode, event.taskId, projectCode);
        pendingTaskRef.current = null;
      }

      if (event.status === 'queued' || event.status === 'processing') {
        const allTasks = usePipelineTaskStore.getState().getAllTasks();
        const storedTask = allTasks.find((t) => t.taskId === event.taskId);
        let resolvedType: 'evaluation' | 'slides' | 'video' = 'evaluation';
        if (storedTask) {
          if (storedTask.key.startsWith('video:')) { setPipelineType('video'); resolvedType = 'video'; }
          else if (storedTask.key.startsWith('slides:')) { setPipelineType('slides'); resolvedType = 'slides'; }
          else { setPipelineType('evaluation'); resolvedType = 'evaluation'; }
        }
        setGlobalProgress(event, resolvedType, projectCode);
        // Slide progress is shown in the editor overlay — skip modal for slides
        if (resolvedType !== 'slides') setShowPipelineModal(true);
      }

      if (event.status === 'completed' || event.status === 'failed') {
        const taskType = resolveType(event);
        const allTasks = usePipelineTaskStore.getState().getAllTasks();
        const stored = allTasks.find(({ taskId }) => taskId === event.taskId);
        if (stored) {
          const pCode = stored.key.split(':').slice(1).join(':');
          if (taskType) clearTask(taskType, pCode);
          else (['eval', 'slides', 'video'] as PipelineTaskType[]).forEach((t) => clearTask(t, pCode));
        }
      }
    }

    setPipelineProgress(event);
    if (event.status === 'completed' || event.status === 'failed') {
      clearGlobalProgress();
      refetchProducts();
      if (event.step === 'video_completed') {
        queryClient.invalidateQueries({ queryKey: ['video', 'project', projectCode] });
      }
    }
  }, [saveTask, saveTaskWithProject, clearTask, clearGlobalProgress, setGlobalProgress, refetchProducts, queryClient, projectCode]);

  usePipelineHub({ accessToken, onProgress: handlePipelineProgress });

  const handleGenerateGame = (productCode: string) => {
    const product = products.find((p) => p.productCode === productCode);
    setPendingGameProductCode(productCode);
    setPendingGameProductName(product?.productName ?? '');
    setShowGameConfigModal(true);
  };


  const handleStartAnalysis = (doc: InputDocumentDto) => {
    setAnalysisDocCode(doc.documentCode);
    setShowAnalysisForm(true);
  };

  const handleConfirmAnalysis = async (productName: string, year: number) => {
    if (!analysisDocCode) return;

    // Check if any eval task is already running for this project's products
    const runningEval = products.find((p) => !!getTaskId('eval', p.productCode));
    if (runningEval) {
      setPipelineType('evaluation');
      setShowPipelineModal(true);
      setShowAnalysisForm(false); setAnalysisDocCode(null);
      return;
    }

    prevProductCodesRef.current = new Set(products.map(p => p.productCode));
    const docCode = analysisDocCode;
    setShowAnalysisForm(false); setAnalysisDocCode(null);
    lessonAnalysis.mutate(
      { documentCode: docCode, projectCode, productName, curriculumYear: year },
      {
        onSuccess: async () => {
          notify.info(MSGS.analysis.startInfo);
          setPipelineType('evaluation'); setShowPipelineModal(true);
          await refetchProducts().catch(() => {/* ignore */});
        },
        onError: () => notify.error(MSGS.analysis.error),
      },
    );
  };

  const doGenerateSlides = (productCode: string, slideRange: 'short' | 'medium') => {
    if (getTaskId('slides', productCode)) {
      router.push('/teacher/editor');
      return;
    }
    pendingTaskRef.current = { type: 'slides', productCode };
    generateSlides.mutate(
      { productCode, slideRange },
      {
        onSuccess: () => {
          notify.success(MSGS.slide.generateStart);
          startGeneration(productCode, projectCode);
          router.push('/teacher/editor');
        },
        onError: () => notify.error(MSGS.slide.generateError),
      },
    );
  };

  const handleGenerateSlides = async (productCode: string, slideRange: 'short' | 'medium' = 'medium') => {
    const product = products.find((p) => p.productCode === productCode);
    if (product?.hasEvaluation) {
      // Try cache first, then fetch from API
      let evalData = queryClient.getQueryData<ProductEvaluationResponse>(
        ['product', 'evaluation', productCode],
      );
      if (!evalData) {
        try {
          evalData = await getProductEvaluation(productCode);
          queryClient.setQueryData(['product', 'evaluation', productCode], evalData);
        } catch {
          /* ignore — proceed without warning */
        }
      }
      const score = evalData?.evaluationResult?.evaluation?.coverage_score ?? null;
      if (score !== null && score < 50) {
        setSlideWarnProductCode(productCode);
        setSlideWarnSlideRange(slideRange);
        return;
      }
    }
    doGenerateSlides(productCode, slideRange);
  };

  const handleGenerateVideo = (productCode: string) => { setPendingVideoProductCode(productCode); setShowVideoConfirm(true); };

  const handleConfirmGenerateVideo = async (videoName: string) => {
    if (!pendingVideoProductCode) return;
    const productCode = pendingVideoProductCode;
    setShowVideoConfirm(false); setPendingVideoProductCode(null);

    if (getTaskId('video', productCode)) {
      setPipelineType('video');
      setShowPipelineModal(true);
      return;
    }

    try {
      setVideoLoadingCode(productCode);
      const url = await getEditedSlideGcsUrl(productCode);
      if (!url) { setVideoLoadingCode(null); notify.error(MSGS.slide.noSlideError); return; }
      pendingTaskRef.current = { type: 'video', productCode };
      generateVideo.mutate(
        { productCode, slideEditedDocumentUrl: url, videoName: videoName || undefined },
        { onSuccess: () => { notify.info(MSGS.video.requestInfo); setPipelineType('video'); setShowPipelineModal(true); }, onSettled: () => setVideoLoadingCode(null) },
      );
    } catch { setVideoLoadingCode(null); notify.error(MSGS.video.generateError); }
  };

  const handleViewEvaluation = (productCode: string) => {
    const product = products.find(p => p.productCode === productCode);
    setEvalProductCode(productCode); setEvalProductName(product?.productName);
  };

  const openProductInEditor = async (
    productCode: string,
    options?: { openEduviExport?: boolean },
  ) => {
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

      setDocument(
        slideDoc,
        productCode,
        projectCode,
        product?.hasEditedSlide ?? false,
        product?.productName,
      );

      const target = options?.openEduviExport
        ? '/teacher/editor?openEduviExport=1'
        : '/teacher/editor';
      router.push(target);
    } catch {
      notify.error(options?.openEduviExport ? 'Không thể mở slide để xuất .eduvi.' : MSGS.slide.openError);
    } finally {
      setViewSlideLoading(null);
    }
  };

  const handleViewSlide = async (productCode: string) => {
    await openProductInEditor(productCode);
  };

  const handleExportSlide = async (productCode: string) => {
    try {
      notify.info('Đang xuất file slide .eduvi...');
      const product = products.find((p) => p.productCode === productCode);
      let slideDoc: IDocument;
      if (product?.hasEditedSlide) {
        const result = await productService.getProductEditedSlide(productCode);
        slideDoc = result.slideEditedDocument;
      } else {
        const result = await productService.getProductSlide(productCode);
        slideDoc = result.slideDocument;
      }
      const academicContext = project ? {
        projectCode: project.projectCode,
        projectName: project.projectName,
        subjectCode: project.subjectCode,
        subjectName: project.subjectName,
        gradeCode: project.gradeCode,
        gradeName: project.gradeName,
      } : undefined;
      const folderName = ((project?.projectName ?? slideDoc.title ?? '').trim()) || 'eduvi-folder';
      await exportToEduvi(slideDoc, {
        requireOfflineReady: false,
        academicContext,
        projectName: project?.projectName || undefined,
        folderName,
        packageType: 'slide',
        fileNameSuffix: 'slide',
      });
      notify.success('Đã xuất file slide .eduvi thành công.');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Xuất file slide .eduvi thất bại';
      notify.error(msg);
    }
  };

  const handleExportVideo = async (video: VideoProductDto) => {
    if (!video.videoUrl) {
      notify.error('Video chưa hoàn thành hoặc không có URL.');
      return;
    }
    try {
      notify.info('Đang xuất file video .eduvi...');
      const academicContext = project ? {
        projectCode: project.projectCode,
        projectName: project.projectName,
        subjectCode: project.subjectCode,
        subjectName: project.subjectName,
        gradeCode: project.gradeCode,
        gradeName: project.gradeName,
      } : undefined;
      const folderName = ((project?.projectName ?? '').trim()) || 'eduvi-folder';
      const minimalDoc: IDocument = {
        id: projectCode,
        title: project?.projectName ?? 'EduVi',
        cards: [],
        activeCardId: '',
        createdAt: new Date().toISOString(),
        updatedAt: video.completedAt ?? video.updatedAt ?? video.createdAt ?? new Date().toISOString(),
      };
      const videosForExport: EduViVideo[] = [{
        productVideoCode: video.productVideoCode,
        productCode: video.productCode,
        productName: video.productName,
        status: video.status,
        duration: video.duration,
        videoUrl: video.videoUrl,
        createdAt: video.createdAt,
        updatedAt: video.updatedAt,
        completedAt: video.completedAt,
        interactions: video.interactions,
      }];
      await exportToEduvi(minimalDoc, {
        requireOfflineReady: true,
        academicContext,
        projectName: project?.projectName || undefined,
        folderName,
        packageType: 'video',
        fileNameSuffix: 'video',
        videos: videosForExport,
        mediaFetchTimeoutMs: 120000,
      });
      notify.success('Đã xuất file video .eduvi thành công.');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Xuất file video .eduvi thất bại';
      notify.error(msg);
    }
  };

  const handleExportGame = async (game: GameDto) => {
    try {
      notify.info('Đang xuất file game .eduvi...');
      const resultJson = await getGameResultJson(game.productGameCode);
      const gamePayload: EduViGame = {
        gameCode: game.gameCode,
        productGameCode: game.productGameCode,
        productCode: game.productCode,
        productGameName: game.productGameName,
        templateCode: game.templateCode || 'UNKNOWN',
        roundCount: game.roundCount,
        status: game.status || 'completed',
        resultJson,
      };
      const academicContext = project ? {
        projectCode: project.projectCode,
        projectName: project.projectName,
        subjectCode: project.subjectCode,
        subjectName: project.subjectName,
        gradeCode: project.gradeCode,
        gradeName: project.gradeName,
      } : undefined;
      const folderName = ((project?.projectName ?? '').trim()) || 'eduvi-folder';
      const minimalDoc: IDocument = {
        id: projectCode,
        title: project?.projectName ?? 'EduVi',
        cards: [],
        activeCardId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await exportToEduvi(minimalDoc, {
        requireOfflineReady: false,
        academicContext,
        projectName: project?.projectName || undefined,
        games: [gamePayload],
        folderName,
        packageType: 'game',
        fileNameSuffix: 'game',
        embedAssets: false,
      });
      notify.success('Đã xuất file game .eduvi thành công.');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Xuất file game .eduvi thất bại';
      notify.error(msg);
    }
  };

  const handlePreviewSlide = async (productCode: string) => {
    try {
      setPreviewSlideLoading(productCode);
      setDetailProductCode(productCode);
      const product = products.find((p) => p.productCode === productCode);
      let slideDoc: IDocument;
      if (product?.hasEditedSlide) {
        const result = await productService.getProductEditedSlide(productCode);
        slideDoc = result.slideEditedDocument;
      } else {
        const result = await productService.getProductSlide(productCode);
        slideDoc = result.slideDocument;
      }
      setSlidePreviewDoc(slideDoc);
    } catch {
      notify.error(MSGS.slide.loadError);
    } finally {
      setPreviewSlideLoading(null);
    }
  };

  const handleDeleteSlide = (productCode: string) => {
    setDeletingSlide(productCode);
    deleteProduct.mutate(productCode, {
      onSuccess: () => {
        notify.success(MSGS.slide.deleteSuccess);
        void refetchProducts();
      },
      onError: () => notify.error(MSGS.slide.deleteError),
      onSettled: () => setDeletingSlide(null),
    });
  };

  const handleDeleteVideo = (productVideoCode: string) => {
    setDeletingVideo(productVideoCode);
    deleteVideo.mutate(productVideoCode, {
      onSuccess: () => {
        notify.success(MSGS.video.deleteSuccess);
        queryClient.invalidateQueries({ queryKey: ['video', 'project', projectCode] });
      },
      onError: () => notify.error(MSGS.video.deleteError),
      onSettled: () => setDeletingVideo(null),
    });
  };

  if (isProjectLoading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <p className="text-sm text-gray-500">Đang tải dự án...</p>
      </div>
    );
  }

  if (isProjectError || !project) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-700 mb-1">Không tìm thấy dự án</h2>
        <p className="text-sm text-gray-500 mb-6">Dự án không tồn tại hoặc đã bị xóa.</p>
        <button onClick={() => router.push('/teacher/projects')} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Quay về danh sách
        </button>
      </div>
    );
  }

  const isPipelineRunning =
    !!pipelineProgress &&
    pipelineProgress.status !== 'completed' &&
    pipelineProgress.status !== 'failed';

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 px-5 py-3">
          {/* Back */}
          <button
            onClick={() => {
              const sp = new URLSearchParams();
              if (project.subjectCode) sp.set('subjectCode', project.subjectCode);
              if (project.gradeCode) sp.set('gradeCode', project.gradeCode);
              router.push(`/teacher/projects${sp.toString() ? `?${sp}` : ''}`);
            }}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Project icon + name */}
          <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-4 h-4 text-blue-600" />
          </div>
          <h1 className="text-sm font-semibold text-gray-900 truncate max-w-xs sm:max-w-sm">
            {project.projectName}
          </h1>

          {/* Badges */}
          <div className="hidden sm:flex items-center gap-2 ml-1">
            {(project.subjectName || project.subjectCode) && (
              <span className="text-xs px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 font-medium">
                {project.subjectName || project.subjectCode}
              </span>
            )}
            {(project.gradeName || project.gradeCode) && (
              <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 font-medium">
                {project.gradeName || project.gradeCode}
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${project.status === 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
              {project.status === 0 ? 'Hoạt động' : 'Lưu trữ'}
            </span>
          </div>

          {/* Breadcrumb */}
          <div className="hidden md:flex items-center gap-1 ml-auto text-xs text-gray-400">
            <button onClick={() => router.push('/teacher/projects')} className="hover:text-blue-600 transition-colors">Dự án</button>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-600">{project.projectName}</span>
          </div>
        </div>
      </header>

      {/* ── 3-column body ────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden" style={{ height: 'calc(100vh - 57px)' }}>

        {/* ── Left: Sources ──────────────────────────── */}
        <aside className="w-96 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            <SourcesPanel
              projectCode={projectCode}
              subjectCode={project.subjectCode}
              subjectName={project.subjectName}
              gradeCode={project.gradeCode}
              gradeName={project.gradeName}
              activeDocCode={activeDocCode}
              onDocumentClick={setActiveDocCode}
              products={products}
            />
          </div>
        </aside>

        {/* ── Center: Studio ─────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <StudioCenter
            projectCode={projectCode}
            projectName={project.projectName}
            products={products}
            videos={projectVideos}
            games={games}
            activeDocCode={activeDocCode}
            detailProductCode={detailProductCode}
            onCloseDetail={() => { setDetailProductCode(null); setSlidePreviewDoc(null); }}
            onDocChange={setActiveDocCode}
            slidePreviewDoc={slidePreviewDoc}
            slidePreviewLoading={previewSlideLoading}
            onWatchVideo={setViewingVideo}
            isPipelineRunning={isPipelineRunning}
            onOpenPipelineModal={() => setShowPipelineModal(true)}
            onAnalyze={handleStartAnalysis}
            onGenerateSlides={handleGenerateSlides}
            onGenerateVideo={handleGenerateVideo}
            onGenerateGame={handleGenerateGame}
            onExportSlide={handleExportSlide}
            onExportVideo={handleExportVideo}
            onExportGame={handleExportGame}
            videoLoadingCode={videoLoadingCode}
            activePipelineType={isPipelineRunning ? pipelineType : null}
          />
        </main>

        {/* ── Right: Product Results ─────────────────── */}
        <aside className="w-80 flex-shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            <ProductResultPanel
              projectName={project.projectName}
              products={products}
              videos={projectVideos}
              games={games}
              activeDocCode={activeDocCode}
              activeDocTitle={inputDocs.find((d) => d.documentCode === activeDocCode)?.title ?? null}
              isPipelineRunning={isPipelineRunning}
              activePipelineType={isPipelineRunning ? pipelineType : null}
              onOpenPipelineModal={() => setShowPipelineModal(true)}
              selectedDetailCode={detailProductCode}
              onSelectDetail={setDetailProductCode}
              onViewSlide={handleViewSlide}
              viewSlideLoading={viewSlideLoading}
              onPreviewSlide={handlePreviewSlide}
              previewSlideLoading={previewSlideLoading}
              deletingSlide={deletingSlide}
              onDeleteSlide={handleDeleteSlide}
              onWatchVideo={setViewingVideo}
              deletingVideo={deletingVideo}
              onDeleteVideo={handleDeleteVideo}
            />
          </div>
        </aside>
      </div>

      {/* ── Modals & overlays ────────────────────────────────────────────── */}
      {viewingVideo && <VideoPlayerModal video={viewingVideo} onClose={() => setViewingVideo(null)} />}

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
        onMinimize={() => setShowPipelineModal(false)}
        onClose={() => { setShowPipelineModal(false); setPipelineProgress(null); }}
      />

      {/* Floating resume pill (pipeline minimized) — only for evaluation & video, not slides */}
      {!showPipelineModal && isPipelineRunning && pipelineType !== 'slides' && (
        <button
          onClick={() => setShowPipelineModal(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-2xl shadow-xl transition-all"
        >
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="text-sm font-medium">
            {pipelineType === 'evaluation' ? 'Đánh giá' : 'Tạo video'}
          </span>
          <span className="text-sm font-bold">{pipelineProgress?.progress ?? 0}%</span>
        </button>
      )}

      <AnalysisFormModal
        open={showAnalysisForm}
        curricula={curricula}
        isPending={lessonAnalysis.isPending}
        onClose={() => { setShowAnalysisForm(false); setAnalysisDocCode(null); }}
        onConfirm={handleConfirmAnalysis}
      />

      <CreateVideoModal
        open={showVideoConfirm}
        onClose={() => { setShowVideoConfirm(false); setPendingVideoProductCode(null); }}
        onConfirm={handleConfirmGenerateVideo}
      />

      {showGameConfigModal && pendingGameProductCode && (
        <GameConfigModal
          productCode={pendingGameProductCode}
          productName={pendingGameProductName}
          onClose={() => { setShowGameConfigModal(false); setPendingGameProductCode(null); }}
        />
      )}

      {/* ── Slide low-score warning ── */}
      {slideWarnProductCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full mx-4 p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Chất lượng phân tích thấp</h3>
                <p className="text-sm text-gray-600">Điểm phân tích nội dung tài liệu dưới 50%. Tạo slide từ tài liệu này có thể ảnh hưởng đến chất lượng bài giảng. Bạn có chắc chắn muốn tiếp tục?</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setSlideWarnProductCode(null)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  const pc = slideWarnProductCode;
                  const range = slideWarnSlideRange;
                  setSlideWarnProductCode(null);
                  doGenerateSlides(pc, range);
                }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 transition-colors"
              >
                Vẫn tạo slide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}