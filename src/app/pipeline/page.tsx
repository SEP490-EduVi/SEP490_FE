'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, CheckCircle, AlertCircle, BarChart3, Layers, Film } from 'lucide-react';
import { useLessonAnalysis, useGenerateSlides, useGenerateVideo, useCurricula } from '@/hooks/usePipelineApi';
import { useProductEvaluation } from '@/hooks/useProductApi';
import { usePipelineHub } from '@/hooks/usePipelineHub';
import { useDocumentStore } from '@/store/useDocumentStore';
import { useProject } from '@/hooks/useProjectApi';
import PipelineProgressModal from '@/components/projects/PipelineProgressModal';
import AnalysisStep from './evulate/AnalysisStep';
import VideoStep from './video/VideoStep';
import * as productService from '@/services/productServices';
import { getEditedSlideGcsUrl } from '@/services/productServices';
import * as videoService from '@/services/videoServices';
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
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  // ── Hooks ──
  const lessonAnalysis = useLessonAnalysis();
  const generateSlides = useGenerateSlides();
  const generateVideo = useGenerateVideo();
  const { data: curricula = [] } = useCurricula();
  const { data: evalData, isLoading: evalLoading } = useProductEvaluation(
    analysisCompleted && productCode ? productCode : undefined
  );
  const startGeneration = useDocumentStore((s) => s.startGeneration);

  // ── Effects ──
  useEffect(() => { setAccessToken(localStorage.getItem('accessToken')); }, []);

  useEffect(() => { if (videoData) setShowVideoPlayer(true); }, [videoData]);

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
    setPipelineProgress(event);
    if (event.status !== 'completed') return;

    if (event.step === 'completed') {
      setAnalysisCompleted(true);
      setShowPipelineModal(false);
      if (event.result && typeof event.result === 'object' && 'productCode' in event.result) {
        setProductCode(event.result.productCode as string);
      }
      queryClient.invalidateQueries({ queryKey: ['products'] });
    }

    if (event.step === 'video_completed') {
      setVideoCompleted(true);
      setShowPipelineModal(false);
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
  }, [queryClient, projectCode]);

  usePipelineHub({ accessToken, onProgress: handlePipelineProgress });

  // ── Handlers ──
  const handleStartAnalysis = () => {
    if (!productName.trim() || !curriculumYear) return;
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
        onError: () => setShowPipelineModal(false),
      }
    );
  };

  const handleStartSlides = () => {
    if (!productCode) return;
    generateSlides.mutate(
      { productCode, slideRange: 'short' },
      { onSuccess: () => { startGeneration(productCode, projectCode); router.push('/teacher/editor'); } }
    );
  };

  const startVideoGeneration = async (code: string) => {
    setVideoStarted(true);
    setPipelineType('video');
    setShowPipelineModal(true);
    setPipelineProgress(null);
    try {
      const url = await getEditedSlideGcsUrl(code);
      if (!url) { setShowPipelineModal(false); setVideoStarted(false); return; }
      generateVideo.mutate(
        { productCode: code, slideEditedDocumentUrl: url },
        { onError: () => { setShowPipelineModal(false); setVideoStarted(false); } }
      );
    } catch {
      setShowPipelineModal(false);
      setVideoStarted(false);
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
            onClick={() => router.push('/teacher')}
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
              onClick={() => router.push('/teacher')}
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
              showPlayer={showVideoPlayer}
              onShowPlayer={() => setShowVideoPlayer(true)}
              onClosePlayer={() => setShowVideoPlayer(false)}
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
