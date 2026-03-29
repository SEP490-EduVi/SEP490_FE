'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, CheckCircle, AlertCircle, BarChart3, Layers, Film } from 'lucide-react';
import { useLessonAnalysis, useGenerateSlides, useGenerateVideo, useCurricula } from '@/hooks/usePipelineApi';
import { useProductEvaluation } from '@/hooks/useProductApi';
import { usePipelineHub } from '@/hooks/usePipelineHub';
import { useDocumentStore } from '@/store/useDocumentStore';
import { usePipelineTaskStore, PipelineTaskType } from '@/store/usePipelineTaskStore';
import { useProject } from '@/hooks/useProjectApi';
import PipelineProgressModal from '@/components/projects/PipelineProgressModal';
import AnalysisStep from './evulate/AnalysisStep';
import VideoStep from './video/VideoStep';
import * as productService from '@/services/productServices';
import { getEditedSlideGcsUrl } from '@/services/productServices';
import * as videoService from '@/services/videoServices';
import { notify } from '@/components/common';
import type { PipelineProgress, VideoProductDto } from '@/types/api';

// ─── Types ─────────────────────────────────────────────────────────────────

type PipelineStep = 'analysis' | 'slides' | 'video';

const STEPS: { key: PipelineStep; label: string; icon: React.ElementType }[] = [
  { key: 'analysis', label: 'Phân tích', icon: BarChart3 },
  { key: 'slides', label: 'Tạo slide', icon: Layers },
  { key: 'video', label: 'Tạo video', icon: Film },
];

// ─── Main Component ────────────────────────────────────────────────────────

export default function PipelinePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const projectCode = searchParams.get('projectCode') ?? '';
  const documentCode = searchParams.get('documentCode') ?? '';
  const stepParam = searchParams.get('step');
  const productCodeParam = searchParams.get('productCode');

  const { data: project } = useProject(projectCode);

  // ── State ──
  const [currentStep, setCurrentStep] = useState<PipelineStep>(
    stepParam === 'video' ? 'video' : 'analysis'
  );
  const [productCode, setProductCode] = useState<string | null>(
    stepParam === 'video' && productCodeParam ? productCodeParam : null
  );
  const [productName, setProductName] = useState('');
  const [curriculumYear, setCurriculumYear] = useState<string>('');

  // Pipeline progress
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [pipelineProgress, setPipelineProgress] = useState<PipelineProgress | null>(null);
  const [pipelineType, setPipelineType] = useState<'evaluation' | 'slides' | 'video'>(
    stepParam === 'video' ? 'video' : 'evaluation'
  );
  const [showPipelineModal, setShowPipelineModal] = useState(false);

  // ── Step sub-states ──
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);
  const [videoCompleted, setVideoCompleted] = useState(false);
  const [videoData, setVideoData] = useState<VideoProductDto | null>(null);

  // ── Hooks ──
  const lessonAnalysis = useLessonAnalysis();
  const generateSlides = useGenerateSlides();
  const generateVideo = useGenerateVideo();
  const { data: curricula = [] } = useCurricula();
  const { data: evalData, isLoading: evalLoading } = useProductEvaluation(
    analysisCompleted && productCode ? productCode : undefined
  );
  const startGeneration = useDocumentStore((s) => s.startGeneration);

  const hydrateTaskStore = usePipelineTaskStore((s) => s.hydrate);
  const saveTask = usePipelineTaskStore((s) => s.saveTask);
  const clearTask = usePipelineTaskStore((s) => s.clearTask);
  const getTaskId = usePipelineTaskStore((s) => s.getTaskId);

  /** Pending {type, productCode} set just before a mutation fires — paired with taskId on first SignalR event */
  const pendingTaskRef = useRef<{ type: PipelineTaskType; productCode: string } | null>(null);

  // ── Effects ──
  useEffect(() => { setAccessToken(localStorage.getItem('accessToken')); }, []);

  // Hydrate task store + restore UI state after page reload
  useEffect(() => {
    hydrateTaskStore();
    const allTasks = usePipelineTaskStore.getState().getAllTasks();

    const evalTask   = allTasks.find((t) => t.key.startsWith('eval:'));
    const slidesTask = allTasks.find((t) => t.key.startsWith('slides:'));
    const videoTask  = allTasks.find((t) => t.key.startsWith('video:'));

    if (evalTask) {
      // Analysis was running — show the waiting modal
      setPipelineType('evaluation');
      setShowPipelineModal(true);
    } else if (slidesTask) {
      // Slides were being generated — restore productCode and show modal
      const pCode = slidesTask.key.split(':').slice(1).join(':');
      if (!pCode.startsWith('doc-')) setProductCode(pCode);
      setPipelineType('slides');
      setShowPipelineModal(true);
      setAnalysisCompleted(true);
    } else if (videoTask && stepParam !== 'video') {
      // Video was generating (pipeline flow, not direct ?step=video navigation)
      const pCode = videoTask.key.split(':').slice(1).join(':');
      if (!pCode.startsWith('doc-')) setProductCode(pCode);
      setPipelineType('video');
      setShowPipelineModal(true);
      setVideoStarted(true);
      setAnalysisCompleted(true); // analysis must have been done before video
      setCurrentStep('video');     // make sure the correct step is shown when modal closes
    }

    // Restore analysis-completion state from sessionStorage
    if (!evalTask && !slidesTask && !videoTask && documentCode) {
      try {
        const saved = sessionStorage.getItem(`ppl-${projectCode}-${documentCode}`);
        if (saved) {
          const data = JSON.parse(saved) as { productCode?: string };
          if (data.productCode) {
            setProductCode(data.productCode);
            setAnalysisCompleted(true);
          }
        }
      } catch { /* ignore */ }
    }
  }, [hydrateTaskStore]); // eslint-disable-line

  // Persist document→product link so [id] page can group products under their source document
  useEffect(() => {
    if (!productCode || !documentCode || !projectCode || stepParam === 'video') return;
    try {
      const key = `dpm-${projectCode}`;
      const map: Record<string, string[]> = JSON.parse(sessionStorage.getItem(key) ?? '{}');
      if (!(map[documentCode] ?? []).includes(productCode)) {
        map[documentCode] = [...(map[documentCode] ?? []), productCode];
        sessionStorage.setItem(key, JSON.stringify(map));
      }
    } catch { /* ignore */ }
  }, [productCode, documentCode, projectCode, stepParam]);

  // Load or generate video when landing on step=video
  useEffect(() => {
    if (stepParam !== 'video' || !productCodeParam || videoStarted || !accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const existing = await videoService.getLatestVideoByProject(projectCode);
        if (cancelled) return;
        if (existing?.status === 'completed') {
          setVideoData(existing); setVideoCompleted(true); setCurrentStep('video'); return;
        }
      } catch { /* no existing video */ }
      if (!cancelled) startVideoGeneration(productCodeParam);
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  // ── SignalR ──
  const handlePipelineProgress = useCallback((event: PipelineProgress) => {
    // Determine task type from step
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
      // Pair incoming taskId with the pending mutation we just fired
      if (
        pendingTaskRef.current &&
        (event.status === 'queued' || event.status === 'processing')
      ) {
        const { type, productCode: pCode } = pendingTaskRef.current;
        saveTask(type, pCode, event.taskId);
        pendingTaskRef.current = null;
      } else if (event.status === 'queued' || event.status === 'processing') {
        // Eval task started from this page: productCode is not known yet.
        // Save with a temporary "doc-" key so checkStoredTasks can resume it on reconnect.
        const alreadyStored = usePipelineTaskStore.getState().getAllTasks()
          .some((t) => t.taskId === event.taskId);
        if (!alreadyStored && documentCode) {
          saveTask('eval', `doc-${documentCode}`, event.taskId);
        }
      }

      // Auto-show the modal when SignalR reconnect brings back a live status
      if (event.status === 'queued' || event.status === 'processing') {
        const allTasks = usePipelineTaskStore.getState().getAllTasks();
        const storedTask = allTasks.find((t) => t.taskId === event.taskId);
        if (storedTask) {
          if (storedTask.key.startsWith('video:')) setPipelineType('video');
          else if (storedTask.key.startsWith('slides:')) setPipelineType('slides');
          else setPipelineType('evaluation');
        }
        setShowPipelineModal(true);
      }

      // Clear on completion / failure (look up by taskId in the store)
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
    if (event.status !== 'completed') return;

    if (event.step === 'completed') {
      setAnalysisCompleted(true);
      setShowPipelineModal(false);
      notify.success('Phân tích tài liệu hoàn thành!');

      const codeFromResult =
        event.result && typeof event.result === 'object' && 'productCode' in event.result
          ? (event.result.productCode as string)
          : null;

      // Resolve productCode then poll until evaluation data is available in DB
      (async () => {
        let resolvedCode = codeFromResult;

        // Fallback: fetch the products list to find the newest product
        if (!resolvedCode) {
          try {
            const prods = await queryClient.fetchQuery({
              queryKey: ['products', 'project', projectCode],
              queryFn: () => productService.getProductsByProject(projectCode),
              staleTime: 0,
            });
            if (prods?.length) resolvedCode = prods[prods.length - 1].productCode;
          } catch { /* ignore */ }
        }

        if (!resolvedCode) return;

        setProductCode(resolvedCode);
        try {
          sessionStorage.setItem(
            `ppl-${projectCode}-${documentCode}`,
            JSON.stringify({ productCode: resolvedCode }),
          );
        } catch { /* ignore */ }

        // Poll the eval endpoint — backend may have a brief write lag after SignalR fires
        for (let i = 0; i < 8; i++) {
          if (i > 0) await new Promise<void>((r) => setTimeout(r, 2500));
          try {
            const evalResult = await queryClient.fetchQuery({
              queryKey: ['products', resolvedCode, 'evaluation'],
              queryFn: () => productService.getProductEvaluation(resolvedCode!),
              staleTime: 0,
            });
            if (evalResult?.evaluationResult?.evaluation) break;
          } catch { /* retry */ }
        }
      })();

      queryClient.invalidateQueries({ queryKey: ['products'] });
    }

    if (event.step === 'video_completed') {
      setVideoCompleted(true);
      setVideoStarted(true);
      setCurrentStep('video');
      setShowPipelineModal(false);
      notify.success('Video đã tạo xong!');
      // Retry polling until backend writes videoUrl
      (async () => {
        for (let i = 0; i < 8; i++) {
          try {
            const v = await videoService.getLatestVideoByProject(projectCode);
            if (v) { setVideoData(v); if (v.videoUrl) return; }
          } catch { /* retry */ }
          await new Promise(r => setTimeout(r, 3000));
        }
      })();
      queryClient.invalidateQueries({ queryKey: ['video', 'products'] });
    }
  }, [saveTask, clearTask, queryClient, projectCode, documentCode]);

  usePipelineHub({ accessToken, onProgress: handlePipelineProgress });

  // ── Handlers ──
  const handleStartAnalysis = () => {
    if (!productName.trim() || !curriculumYear) return;

    // Check if an eval task is already running
    // On the pipeline page, we don't yet know the productCode before analysis starts,
    // so we check all stored eval keys that match this projectCode.
    // (keys are formatted as "eval:{productCode}" — we look at the entire store)
    const allTasks = usePipelineTaskStore.getState().getAllTasks();
    const runningEval = allTasks.find(({ key }) => key.startsWith('eval:'));
    if (runningEval) {
      setPipelineType('evaluation');
      setShowPipelineModal(true);
      return;
    }

    setPipelineType('evaluation');
    setShowPipelineModal(true);
    setPipelineProgress(null);
    lessonAnalysis.mutate(
      { documentCode, projectCode, productName: productName.trim(), curriculumYear: Number(curriculumYear) },
      {
        onSuccess: async () => {
          const result = await queryClient.fetchQuery({
            queryKey: ['products', 'project', projectCode],
            queryFn: () => productService.getProductsByProject(projectCode),
          });
          if (result?.length > 0) setProductCode(result[result.length - 1].productCode);
        },
        onError: () => { setShowPipelineModal(false); notify.error('Không thể bắt đầu phân tích. Vui lòng thử lại.'); },
      }
    );
  };

  const handleStartSlides = () => {
    if (!productCode) return;
    if (getTaskId('slides', productCode)) {
      setPipelineType('slides');
      setShowPipelineModal(true);
      return;
    }
    pendingTaskRef.current = { type: 'slides', productCode };
    generateSlides.mutate(
      { productCode, slideRange: 'short' },
      { onSuccess: () => { notify.success('Đang tạo slide...'); startGeneration(productCode, projectCode); router.push('/teacher/editor'); } }
    );
  };

  const startVideoGeneration = async (code: string) => {
    if (getTaskId('video', code)) {
      // Task already running — just show the modal
      setPipelineType('video');
      setShowPipelineModal(true);
      setVideoStarted(true);
      return;
    }
    setVideoStarted(true);
    setPipelineType('video');
    setShowPipelineModal(true);
    setPipelineProgress(null);
    try {
      const url = await getEditedSlideGcsUrl(code);
      if (!url) { setShowPipelineModal(false); setVideoStarted(false); notify.error('Không thể lấy đường dẫn slide. Vui lòng thử lại.'); return; }
      pendingTaskRef.current = { type: 'video', productCode: code };
      generateVideo.mutate(
        { productCode: code, slideEditedDocumentUrl: url },
        { onError: () => { setShowPipelineModal(false); setVideoStarted(false); } }
      );
    } catch {
      setShowPipelineModal(false);
      setVideoStarted(false);
      notify.error('Đã xảy ra lỗi khi tạo video. Vui lòng thử lại.');
    }
  };

  // ── Redirect if missing params ──
  const isMissingParams = stepParam === 'video'
    ? !projectCode || !productCodeParam
    : !projectCode || !documentCode;
  if (isMissingParams) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600">Thiếu thông tin dự án.</p>
          <button
            onClick={() => router.push('/teacher/projects')}
            className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  // ── Stepper ──
  const stepIndex = STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header with stepper */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <button
              onClick={() => router.push('/teacher/projects')}
              className="hover:text-blue-600 transition-colors"
            >
              Dự án
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <button
              onClick={() => router.push(`/teacher/${projectCode}`)}
              className="hover:text-blue-600 transition-colors"
            >
              {project?.projectName ?? projectCode}
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900 font-medium">Pipeline</span>
          </div>

          {/* Stepper */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/teacher/${projectCode}`)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>

            <div className="flex items-center gap-2">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isActive = idx === stepIndex;
                const isDone = idx < stepIndex;

                return (
                  <React.Fragment key={step.key}>
                    {idx > 0 && (
                      <div
                        className={`w-8 h-0.5 rounded-full ${
                          isDone ? 'bg-emerald-400' : 'bg-gray-200'
                        }`}
                      />
                    )}
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700'
                          : isDone
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'text-gray-400'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                      {step.label}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Content area */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {currentStep === 'analysis' && (
            <AnalysisStep
              key="analysis"
              curricula={curricula}
              curriculumYear={curriculumYear}
              productName={productName}
              isPending={lessonAnalysis.isPending}
              analysisDone={analysisCompleted}
              evalData={evalData}
              evalLoading={evalLoading}
              slidePending={generateSlides.isPending}
              onCurriculumChange={setCurriculumYear}
              onProductNameChange={setProductName}
              onStartAnalysis={handleStartAnalysis}
              onStartSlides={handleStartSlides}
              onCancel={() => router.push(`/teacher/${projectCode}`)}
            />
          )}

          {currentStep === 'video' && (
            <VideoStep
              key="video"
              projectCode={projectCode}
              videoCompleted={videoCompleted}
              videoData={videoData}
              onBackToProject={() => router.push(`/teacher/${projectCode}`)}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Pipeline Progress Modal (overlay) */}
      <PipelineProgressModal
        open={showPipelineModal}
        progress={pipelineProgress}
        pipelineType={pipelineType}
        onClose={() => {
          setShowPipelineModal(false);
          setPipelineProgress(null);
        }}
      />
    </div>
  );
}
