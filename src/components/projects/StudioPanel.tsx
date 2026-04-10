// src/components/projects/StudioPanel.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Sparkles,
  GalleryVerticalEnd,
  Video,
  Gamepad2,
  ChevronRight,
  Loader2,
  Lock,
  FileText,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';
import { useInputDocumentsByProject } from '@/hooks/useInputDocumentApi';
import type { ProductDto, InputDocumentDto } from '@/types/api';

interface StudioPanelProps {
  projectCode: string;
  products: ProductDto[];
  isPipelineRunning: boolean;
  onOpenPipelineModal: () => void;
  onAnalyze: (doc: InputDocumentDto) => void;
  onGenerateSlides: (productCode: string) => void;
  onGenerateVideo: (productCode: string) => void;
  onGenerateGame: (productCode: string) => void;
  videoLoadingCode: string | null;
  activePipelineType?: 'evaluation' | 'slides' | 'video' | null;
  activeDocCode?: string | null;
}

export default function StudioPanel({
  projectCode,
  products,
  isPipelineRunning,
  onOpenPipelineModal,
  onAnalyze,
  onGenerateSlides,
  onGenerateVideo,
  onGenerateGame,
  videoLoadingCode,
  activePipelineType,
  activeDocCode,
}: StudioPanelProps) {
  const { data: docs = [] } = useInputDocumentsByProject(projectCode);

  // ── Active document selector ───────────────────────────────────────────────
  const [activeDoc, setActiveDoc] = useState<InputDocumentDto | null>(null);
  const [showDocPicker, setShowDocPicker] = useState(false);

  useEffect(() => {
    if (docs.length === 0) { setActiveDoc(null); return; }
    // If external activeDocCode is provided, sync to it
    if (activeDocCode) {
      const target = docs.find((d) => d.documentCode === activeDocCode);
      if (target) { setActiveDoc(target); return; }
    }
    setActiveDoc((prev) => {
      // keep current if still in list
      if (prev && docs.find((d) => d.documentCode === prev.documentCode)) return prev;
      return docs[0];
    });
  }, [docs, activeDocCode]);

  // ── Per-document progressive state ────────────────────────────────────────
  const docProducts = activeDoc
    ? products.filter((p) => p.documentCode === activeDoc.documentCode)
    : [];

  const hasDocuments  = docs.length > 0;
  const hasEvaluation = docProducts.some((p) => p.hasEvaluation);
  const hasSlide      = docProducts.some((p) => p.hasSlide || p.hasEditedSlide);

  const latestEval  = docProducts.filter((p) => p.hasEvaluation).at(-1) ?? null;
  const latestSlide = docProducts.filter((p) => p.hasSlide || p.hasEditedSlide).at(-1) ?? null;

  // ── Confirm modal state ────────────────────────────────────────────────────
  type ConfirmType = 'analyze' | 'slides' | 'video' | 'game';
  const [confirmAction, setConfirmAction] = useState<{
    type: ConfirmType;
    doc?: InputDocumentDto;
    productCode?: string;
  } | null>(null);

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'analyze' && confirmAction.doc) onAnalyze(confirmAction.doc);
    if (confirmAction.type === 'slides' && confirmAction.productCode) onGenerateSlides(confirmAction.productCode);
    if (confirmAction.type === 'video' && confirmAction.productCode) onGenerateVideo(confirmAction.productCode);
    if (confirmAction.type === 'game' && confirmAction.productCode) onGenerateGame(confirmAction.productCode);
    setConfirmAction(null);
  };

  // ── Click handlers (open confirm first) ───────────────────────────────────
  const handleAnalyzeClick = () => {
    if (isPipelineRunning) { onOpenPipelineModal(); return; }
    if (!activeDoc) return;
    setConfirmAction({ type: 'analyze', doc: activeDoc });
  };

  const handleSlideClick = () => {
    if (!hasEvaluation || !latestEval) return;
    setConfirmAction({ type: 'slides', productCode: latestEval.productCode });
  };

  const handleVideoClick = () => {
    if (!hasSlide || !latestSlide) return;
    setConfirmAction({ type: 'video', productCode: latestSlide.productCode });
  };

  const handleGameClick = () => {
    if (!hasSlide || !latestSlide) return;
    setConfirmAction({ type: 'game', productCode: latestSlide.productCode });
  };

  // ── Confirm labels ─────────────────────────────────────────────────────────
  const CONFIRM_LABELS: Record<ConfirmType, { title: string; body: string; cta: string }> = {
    analyze: {
      title: 'Phân tích tài liệu?',
      body: `AI sẽ phân tích tài liệu "${activeDoc?.title ?? ''}" và tạo kế hoạch bài giảng. Quá trình này có thể mất vài phút.`,
      cta: 'Phân tích',
    },
    slides: {
      title: 'Tạo slide bài giảng?',
      body: `Hệ thống sẽ tự động tạo slide từ kết quả phân tích của "${latestEval?.productName ?? ''}".`,
      cta: 'Tạo slide',
    },
    video: {
      title: 'Tạo video bài giảng?',
      body: `Hệ thống sẽ tạo video từ slide đã có của "${latestSlide?.productName ?? ''}". Quá trình này có thể mất vài phút.`,
      cta: 'Tạo video',
    },
    game: {
      title: 'Tạo trò chơi học tập?',
      body: `Hệ thống sẽ tạo minigame tương tác từ slide của "${latestSlide?.productName ?? ''}". Bạn sẽ chọn kiểu game ở bước tiếp theo.`,
      cta: 'Tiếp tục',
    },
  };

  return (
    <aside className="flex flex-col h-full">
      {/* ─── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">Các nút hành động</h2>
        {isPipelineRunning && (
          <button
            type="button"
            onClick={onOpenPipelineModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            {activePipelineType === 'video'
              ? 'Đang tạo video'
              : activePipelineType === 'slides'
              ? 'Đang tạo slide'
              : 'Đang phân tích'}
          </button>
        )}
      </div>

      {/* ─── Document selector ────────────────────────────────────────── */}
      {docs.length > 1 && (
        <div className="mb-4">
          <p className="text-xs text-gray-400 mb-1.5">Tài liệu đang làm việc:</p>
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDocPicker((v) => !v)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:border-blue-300 transition-colors text-left"
            >
              <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span className="flex-1 text-xs font-medium text-gray-700 truncate">
                {activeDoc?.title ?? 'Chọn tài liệu'}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${showDocPicker ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {showDocPicker && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 z-10 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
                >
                  {docs.map((doc) => (
                    <button
                      key={doc.documentCode}
                      type="button"
                      onClick={() => { setActiveDoc(doc); setShowDocPicker(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-blue-50 ${
                        activeDoc?.documentCode === doc.documentCode ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{doc.title}</p>
                        <p className="text-[11px] text-gray-400">{doc.lessonName || doc.lessonCode}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ─── Step 1: Phân tích ─────────────────────────────────────────── */}
      <StepSection
        step={1}
        active={!hasEvaluation}
        label="Phân tích tài liệu"
        sublabel={
          isPipelineRunning && activePipelineType === 'evaluation'
            ? 'Đang xử lý...'
            : hasEvaluation
            ? `${docProducts.filter((p) => p.hasEvaluation).length} kết quả`
            : hasDocuments
            ? 'AI phân tích & lập kế hoạch bài giảng'
            : 'Cần thêm tài liệu nguồn trước'
        }
      >
        <motion.button
          type="button"
          whileHover={{ scale: hasDocuments ? 1.01 : 1 }}
          whileTap={{ scale: hasDocuments ? 0.98 : 1 }}
          onClick={handleAnalyzeClick}
          disabled={!hasDocuments}
          className={`w-full flex items-center justify-between gap-3 p-4 rounded-2xl text-white shadow-sm transition-all ${
            !hasDocuments
              ? 'bg-blue-200 cursor-not-allowed'
              : isPipelineRunning
              ? 'bg-blue-400 hover:bg-blue-500'
              : 'bg-gradient-to-br from-blue-600 to-blue-500 hover:shadow-md'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              {isPipelineRunning && activePipelineType === 'evaluation'
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Sparkles className="w-4 h-4" />
              }
            </div>
            <span className="text-sm font-semibold">
              {isPipelineRunning && activePipelineType === 'evaluation'
                ? 'Đang phân tích...'
                : hasEvaluation
                ? 'Phân tích thêm'
                : 'Phân tích tài liệu'}
            </span>
          </div>
          <ChevronRight className="w-4 h-4 flex-shrink-0 opacity-70" />
        </motion.button>
      </StepSection>

      {/* ─── Step 2: Slide ─────────────────────────────────────────────── */}
      <StepSection
        step={2}
        active={hasEvaluation && !hasSlide}
        locked={!hasEvaluation}
        label="Tạo slide bài giảng"
        sublabel={
          hasSlide
            ? `Slide sẵn sàng — ${latestSlide?.productName}`
            : hasEvaluation
            ? 'Tạo slide từ kết quả phân tích'
            : 'Cần phân tích tài liệu trước'
        }
      >
        <ActionCard
          icon={<GalleryVerticalEnd className="w-5 h-5" />}
          label="Tạo slide bài giảng"
          description={hasEvaluation ? 'Tạo slide từ kết quả phân tích' : 'Cần phân tích tài liệu trước'}
          accent="text-indigo-600"
          accentBg="bg-indigo-50"
          locked={!hasEvaluation}
          loading={false}
          onClick={handleSlideClick}
        />
      </StepSection>

      {/* ─── Step 3: Video + Game ───────────────────────────────────────── */}
      <StepSection
        step={3}
        active={hasSlide}
        locked={!hasSlide}
        label="Tạo video & trò chơi"
        sublabel={hasSlide ? 'Sử dụng slide để tạo nội dung' : 'Cần có slide trước'}
      >
        <div className="space-y-2">
          <ActionCard
            icon={<Video className="w-5 h-5" />}
            label="Tạo video bài giảng"
            description={hasSlide ? 'Tạo video từ slide đã có' : 'Cần có slide trước'}
            accent="text-rose-600"
            accentBg="bg-rose-50"
            locked={!hasSlide}
            loading={videoLoadingCode !== null}
            onClick={handleVideoClick}
          />
          <ActionCard
            icon={<Gamepad2 className="w-5 h-5" />}
            label="Tạo trò chơi học tập"
            description={hasSlide ? 'Minigame tương tác từ bài giảng' : 'Cần có slide trước'}
            accent="text-amber-600"
            accentBg="bg-amber-50"
            locked={!hasSlide}
            loading={false}
            onClick={handleGameClick}
          />
        </div>
      </StepSection>

      {/* ─── Confirm modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
            onClick={() => setConfirmAction(null)}
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{CONFIRM_LABELS[confirmAction.type].title}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{CONFIRM_LABELS[confirmAction.type].body}</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmAction(null)}
                  className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  {CONFIRM_LABELS[confirmAction.type].cta}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface StepSectionProps {
  step: number;
  active: boolean;
  locked?: boolean;
  label: string;
  sublabel: string;
  children: React.ReactNode;
}

function StepSection({ step, active, locked, label, sublabel, children }: StepSectionProps) {
  return (
    <div className={`mb-5 ${locked ? 'opacity-50' : ''}`}>
      {/* Step header */}
      <div className="flex items-center gap-2 mb-2.5">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
          active ? 'bg-blue-600' : locked ? 'bg-gray-200' : 'bg-gray-400'
        }`}>
          {locked
            ? <Lock className="w-2.5 h-2.5 text-gray-400" />
            : <span className="text-white text-[10px] font-bold leading-none">{step}</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold leading-tight ${active ? 'text-gray-800' : locked ? 'text-gray-500' : 'text-gray-700'}`}>
            {label}
          </p>
          <p className="text-[11px] text-gray-400 truncate">{sublabel}</p>
        </div>
        {locked && <Lock className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />}
      </div>

      {/* Step content */}
      <div className={locked ? 'pointer-events-none select-none' : ''}>{children}</div>
    </div>
  );
}

interface ActionCardProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  accent: string;
  accentBg: string;
  locked: boolean;
  loading: boolean;
  onClick: () => void;
}

function ActionCard({ icon, label, description, accent, accentBg, locked, loading, onClick }: ActionCardProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: locked ? 1 : 1.01 }}
      whileTap={{ scale: locked ? 1 : 0.98 }}
      onClick={locked ? undefined : onClick}
      disabled={locked}
      className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-2xl border text-left transition-all ${
        locked
          ? 'border-gray-100 bg-gray-50/60 cursor-not-allowed'
          : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm cursor-pointer'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${accentBg} ${accent}`}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800 leading-tight">{label}</p>
          <p className="text-xs text-gray-400 mt-0.5">{description}</p>
        </div>
      </div>
      {locked
        ? <Lock className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
        : <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
      }
    </motion.button>
  );
}