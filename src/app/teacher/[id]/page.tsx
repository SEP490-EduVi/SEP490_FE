'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, AlertCircle, Loader2, ChevronRight, Sparkles, BookOpen, Gamepad2,
} from 'lucide-react';
import { useProject } from '@/hooks/useProjectApi';
import { useProductsByProject, useDeleteProduct } from '@/hooks/useProductApi';
import { useLessonAnalysis, useGenerateSlides, useGenerateVideo, useVideosByProject, useCurricula, useDeleteVideo } from '@/hooks/usePipelineApi';
import { usePipelineHub } from '@/hooks/usePipelineHub';
import SourcesPanel from '@/components/projects/SourcesPanel';
import ProductResultsCenter from '@/components/projects/ProductResultsCenter';
import StudioPanel from '@/components/projects/StudioPanel';
import EvaluationModal from '@/components/projects/EvaluationModal';
import PipelineProgressModal from '@/components/projects/PipelineProgressModal';
import VideoPlayerModal from '@/components/projects/VideoPlayerModal';
import AnalysisFormModal from '@/components/projects/AnalysisFormModal';
import VideoConfirmModal from '@/components/projects/VideoConfirmModal';
import { createPlayableGameTask } from '@/services/gamesServices';
import { GAME_BLUEPRINTS } from '@/mediapipe-game/api-contracts.js';
import type { GameTemplateId } from '@/types/api';
import { useDocumentStore } from '@/store/useDocumentStore';
import { usePipelineTaskStore, PipelineTaskType } from '@/store/usePipelineTaskStore';
import { usePipelineProgressStore } from '@/store/usePipelineProgressStore';
import * as productService from '@/services/productServices';
import { getEditedSlideGcsUrl } from '@/services/productServices'; // used for game creation
import { notify } from '@/components/common';
import type { PipelineProgress, VideoProductDto, InputDocumentDto } from '@/types/api';

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectCode = params.id as string;

  const { data: project, isLoading: isProjectLoading, isError: isProjectError } = useProject(projectCode);
  const { data: products = [], refetch: refetchProducts } = useProductsByProject(projectCode);
  const deleteProduct = useDeleteProduct();
  const lessonAnalysis = useLessonAnalysis();
  const generateSlides = useGenerateSlides();
  const generateVideo = useGenerateVideo();
  const { data: projectVideos = [] } = useVideosByProject(projectCode);
  const deleteVideo = useDeleteVideo(projectCode);
  const { data: curricula = [] } = useCurricula();
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
  const [pipelineProgress, setPipelineProgress] = useState<PipelineProgress | null>(null);
  const [pipelineType, setPipelineType] = useState<'evaluation' | 'slides' | 'video'>('evaluation');
  const [showPipelineModal, setShowPipelineModal] = useState(false);

  const [evalProductCode, setEvalProductCode] = useState<string | null>(null);
  const [evalProductName, setEvalProductName] = useState<string | undefined>(undefined);
  const [activeDocCode, setActiveDocCode] = useState<string | null>(null);
  const [viewSlideLoading, setViewSlideLoading] = useState<string | null>(null);
  const [videoLoadingCode, setVideoLoadingCode] = useState<string | null>(null);
  const [showVideoConfirm, setShowVideoConfirm] = useState(false);
  const [pendingVideoProductCode, setPendingVideoProductCode] = useState<string | null>(null);
  const [viewingVideo, setViewingVideo] = useState<VideoProductDto | null>(null);
  const [showAnalysisForm, setShowAnalysisForm] = useState(false);
  const [analysisDocCode, setAnalysisDocCode] = useState<string | null>(null);
  const [pendingGameProductCode, setPendingGameProductCode] = useState<string | null>(null);
  const [showGameConfigModal, setShowGameConfigModal] = useState(false);
  const [gameTemplateId, setGameTemplateId] = useState<GameTemplateId>(GAME_BLUEPRINTS.HOVER_SELECT as GameTemplateId);
  const [gameRoundCount, setGameRoundCount] = useState(1);
  const [gameCreating, setGameCreating] = useState(false);
  const [gameStatus, setGameStatus] = useState('');

  const prevProductCodesRef = useRef<Set<string>>(new Set());

  const searchParams = useSearchParams();

  useEffect(() => { setAccessToken(localStorage.getItem('accessToken')); }, []);
  useEffect(() => {
    hydrateTaskStore();
    const allTasks = usePipelineTaskStore.getState().getAllTasks();
    if (allTasks.length > 0) {
      const videoTask = allTasks.find((t) => t.key.startsWith('video:'));
      const slidesTask = allTasks.find((t) => t.key.startsWith('slides:'));
      const evalTask = allTasks.find((t) => t.key.startsWith('eval:'));
      if (videoTask) setPipelineType('video');
      else if (slidesTask) setPipelineType('slides');
      else if (evalTask) setPipelineType('evaluation');
      setShowPipelineModal(true);
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
        setShowPipelineModal(true);
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
    if (event.status !== 'completed' && event.status !== 'failed') {
      const t = event.step?.includes('video') ? 'video'
              : (event.step?.includes('slide') || event.step?.includes('generating') || event.step?.includes('planning') || event.step?.includes('assembling')) ? 'slides'
              : 'evaluation';
      setGlobalProgress(event, t, projectCode);
    }
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
    setPendingGameProductCode(productCode);
    setShowGameConfigModal(true);
  };

  const handleConfirmGenerateGame = async () => {
    if (!pendingGameProductCode) return;
    setGameStatus('Đang lấy dữ liệu slide...');
    setGameCreating(true);
    try {
      const url = await getEditedSlideGcsUrl(pendingGameProductCode);
      if (!url) { setGameStatus('Không tìm thấy dữ liệu slide. Vui lòng lưu slide trước.'); setGameCreating(false); return; }
      setGameStatus('Đang gửi yêu cầu tạo game...');
      const task = await createPlayableGameTask({
        templateId: gameTemplateId,
        slideEditedDocumentUrl: url,
        roundCount: gameRoundCount,
      });
      setShowGameConfigModal(false);
      setGameStatus('');
      setPendingGameProductCode(null);
      router.push(`/teacher/game-maker?taskId=${encodeURIComponent(task.taskId)}`);
    } catch (e) {
      setGameStatus(e instanceof Error ? e.message : 'Tạo game thất bại. Vui lòng thử lại.');
    } finally {
      setGameCreating(false);
    }
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
          notify.info('Đang phân tích tài liệu...');
          setPipelineType('evaluation'); setShowPipelineModal(true);
          await refetchProducts().catch(() => {/* ignore */});
        },
      },
    );
  };

  const handleGenerateSlides = (productCode: string) => {
    if (getTaskId('slides', productCode)) {
      setPipelineType('slides');
      setShowPipelineModal(true);
      return;
    }
    pendingTaskRef.current = { type: 'slides', productCode };
    generateSlides.mutate(
      { productCode, slideRange: 'short' },
      { onSuccess: () => { notify.success('Đang tạo slide...'); startGeneration(productCode, projectCode); setPipelineType('slides'); setShowPipelineModal(true); } },
    );
  };

  const handleGenerateVideo = (productCode: string) => { setPendingVideoProductCode(productCode); setShowVideoConfirm(true); };

  const handleConfirmGenerateVideo = async () => {
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
      if (!url) { setVideoLoadingCode(null); notify.error('Không thể lấy đường dẫn slide. Vui lòng thử lại.'); return; }
      pendingTaskRef.current = { type: 'video', productCode };
      generateVideo.mutate(
        { productCode, slideEditedDocumentUrl: url },
        { onSuccess: () => { notify.info('Yêu cầu tạo video đã được gửi'); setPipelineType('video'); setShowPipelineModal(true); }, onSettled: () => setVideoLoadingCode(null) },
      );
    } catch { setVideoLoadingCode(null); notify.error('Đã xảy ra lỗi khi tạo video. Vui lòng thử lại.'); }
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
    } catch { notify.error('Không thể mở slide. Vui lòng thử lại.'); }
    finally { setViewSlideLoading(null); }
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
            />
          </div>
        </aside>

        {/* ── Center: Results ────────────────────────── */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <ProductResultsCenter
            projectName={project.projectName}
            products={products}
            videos={projectVideos}
            viewSlideLoading={viewSlideLoading}
            activeDocCode={activeDocCode}
            onViewSlide={handleViewSlide}
            onWatchVideo={setViewingVideo}
          />
        </main>

        {/* ── Right: Studio ──────────────────────────── */}
        <aside className="w-96 flex-shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4">
            <StudioPanel
              projectCode={projectCode}
              products={products}
              isPipelineRunning={isPipelineRunning}
              onOpenPipelineModal={() => setShowPipelineModal(true)}
              onAnalyze={handleStartAnalysis}
              onGenerateSlides={handleGenerateSlides}
              onGenerateVideo={handleGenerateVideo}
              onGenerateGame={handleGenerateGame}
              videoLoadingCode={videoLoadingCode}
              activePipelineType={isPipelineRunning ? pipelineType : null}
              activeDocCode={activeDocCode}
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

      {/* Floating resume pill (pipeline minimized) */}
      {!showPipelineModal && isPipelineRunning && (
        <button
          onClick={() => setShowPipelineModal(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-2xl shadow-xl transition-all"
        >
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="text-sm font-medium">
            {pipelineType === 'evaluation' ? 'Đánh giá' : pipelineType === 'video' ? 'Tạo video' : 'Tạo slide'}
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

      <VideoConfirmModal
        open={showVideoConfirm}
        onClose={() => { setShowVideoConfirm(false); setPendingVideoProductCode(null); }}
        onConfirm={handleConfirmGenerateVideo}
      />

      {showGameConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                <Gamepad2 className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-1">Tạo trò chơi học tập</h3>
                <p className="text-sm text-gray-500">Chọn kiểu game và số round cho bài học.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dạng trò chơi</label>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { id: 'HOVER_SELECT', label: 'Hover & Chọn', desc: 'Giơ tay chọn đáp án', icon: '🖐️' },
                      { id: 'DRAG_DROP',    label: 'Drag & Drop',  desc: 'Kéo thả đáp án',     icon: '✋' },
                      { id: 'RUNNER_QUIZ',  label: 'Runner Quiz',  desc: 'Mario chạy (1 người)', icon: '🏃' },
                      { id: 'SNAKE_QUIZ',   label: 'Snake Quiz',   desc: 'Rắn quiz (1 người)',  icon: '🐍' },
                      { id: 'RUNNER_RACE',  label: 'Runner Race',  desc: 'Mario đua (2 người)',  icon: '🏁' },
                      { id: 'SNAKE_DUEL',   label: 'Snake Duel',   desc: 'Rắn đấu (2 người)',   icon: '⚔️' },
                    ] as { id: GameTemplateId; label: string; desc: string; icon: string }[]
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setGameTemplateId(opt.id)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                        gameTemplateId === opt.id
                          ? 'border-violet-400 bg-violet-50 text-violet-700'
                          : 'border-gray-200 bg-gray-50 hover:border-violet-300 hover:bg-violet-50/40 text-gray-700'
                      }`}
                    >
                      <span className="text-lg leading-none">{opt.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">{opt.label}</p>
                        <p className="text-[11px] text-gray-400 truncate">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Số round</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={gameRoundCount}
                  onChange={(e) => setGameRoundCount(Math.max(1, Number(e.target.value) || 1))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
              {gameStatus && (
                <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">{gameStatus}</p>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowGameConfigModal(false); setPendingGameProductCode(null); setGameStatus(''); }}
                disabled={gameCreating}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmGenerateGame}
                disabled={gameCreating}
                className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl disabled:opacity-60 flex items-center gap-2"
              >
                {gameCreating && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {gameCreating ? 'Đang tạo...' : 'Bắt đầu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}