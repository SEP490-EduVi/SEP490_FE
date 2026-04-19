// src/components/projects/StudioCenter.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  BookOpen,
  BarChart3,
  GalleryVerticalEnd,
  Video,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Gamepad2,
  Sparkles,
  FileText,
  Lock,
  X,
  Eye,
} from 'lucide-react';
import { useProductEvaluation } from '@/hooks/useProductApi';
import { useInputDocumentsByProject } from '@/hooks/useInputDocumentApi';
import type { ProductDto, VideoProductDto, GameDto, InputDocumentDto } from '@/types/api';
import type { IDocument, ICard, ILayout, IBlock } from '@/types';
import { BlockType, LayoutVariant, isBlock, isLayout } from '@/types';
import { QuizPlayer } from '@/components/interactive/QuizBlock';
import { FlashcardPlayer } from '@/components/interactive/FlashcardBlock';
import { FillInBlankPlayer } from '@/components/interactive/FillInBlankBlock';

// ── Props ─────────────────────────────────────────────────────────────────────
interface StudioCenterProps {
  projectCode: string;
  projectName: string;
  products: ProductDto[];
  videos: VideoProductDto[];
  games: GameDto[];
  activeDocCode?: string | null;
  detailProductCode?: string | null;
  onCloseDetail?: () => void;
  onDocChange?: (docCode: string) => void;
  slidePreviewDoc?: IDocument | null;
  slidePreviewLoading?: string | null;
  onWatchVideo: (video: VideoProductDto) => void;
  isPipelineRunning: boolean;
  onOpenPipelineModal: () => void;
  onAnalyze: (doc: InputDocumentDto) => void;
  onGenerateSlides: (productCode: string, slideRange: 'short' | 'medium') => void;
  onGenerateVideo: (productCode: string) => void;
  onGenerateGame: (productCode: string) => void;
  videoLoadingCode: string | null;
  activePipelineType?: 'evaluation' | 'slides' | 'video' | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(value?: string | null) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('vi-VN');
}

function VideoStatusChip({ status }: { status: VideoProductDto['status'] }) {
  if (status === 'completed')
    return <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-600 font-medium">Hoàn thành</span>;
  if (status === 'processing' || status === 'pending')
    return (
      <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 font-medium flex items-center gap-1">
        <Loader2 className="w-3 h-3 animate-spin" /> Đang tạo
      </span>
    );
  return <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-red-50 text-red-500 font-medium">Lỗi</span>;
}

// ── Inline evaluation panel ───────────────────────────────────────────────────
function EvaluationInline({ productCode }: { productCode: string }) {
  const { data: evalData, isLoading } = useProductEvaluation(productCode);
  const evaluation = evalData?.evaluationResult?.evaluation;
  const score = evaluation?.coverage_score ?? 0;
  const scoreColor = score >= 80 ? 'text-emerald-600' : score >= 60 ? 'text-amber-600' : 'text-red-500';
  const barColor   = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500'   : 'bg-red-500';

  if (isLoading) return (
    <div className="flex items-center justify-center py-6 gap-2">
      <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
      <span className="text-xs text-gray-400">Đang tải kết quả...</span>
    </div>
  );

  if (!evaluation) return (
    <div className="py-6 text-center text-xs text-gray-400">Không có dữ liệu đánh giá.</div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22 }}
      className="overflow-hidden"
    >
      <div className="px-4 pb-4 space-y-3">
        {evaluation.detected_lesson_name && (
          <div className="flex items-start gap-2.5 bg-gray-50 rounded-xl px-3 py-2.5">
            <BookOpen className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">Bài học được phát hiện</p>
              <p className="text-xs font-semibold text-gray-800 mt-0.5">{evaluation.detected_lesson_name}</p>
            </div>
          </div>
        )}
        <div className="bg-gray-50 rounded-xl px-3 py-2.5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-gray-600">Độ bao phủ nội dung</p>
            <span className={`text-xl font-bold ${scoreColor}`}>{score.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className={`h-1.5 rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${Math.min(score, 100)}%` }} />
          </div>
        </div>
        {evaluation.comment && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wider text-blue-500 font-semibold mb-1">Nhận xét tổng quan</p>
            <p className="text-xs text-gray-700 leading-relaxed">{evaluation.comment}</p>
          </div>
        )}
        {(evaluation.suggestions?.length ?? 0) > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-2">
              <Lightbulb className="w-3.5 h-3.5 text-yellow-500" />
              <p className="text-xs font-semibold text-gray-700">Gợi ý cải thiện ({evaluation.suggestions!.length})</p>
            </div>
            <ul className="space-y-1.5">
              {evaluation.suggestions!.map((s, i) => (
                <li key={i} className="flex gap-2 text-xs text-gray-600 leading-relaxed">
                  <span className="text-yellow-500 font-bold flex-shrink-0 mt-0.5">•</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {(evaluation.covered_concepts?.length ?? 0) > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <p className="text-xs font-semibold text-gray-700">Khái niệm đã bao phủ ({evaluation.covered_concepts!.length})</p>
            </div>
            <div className="space-y-1.5">
              {evaluation.covered_concepts!.map((item, i) => (
                <div key={i} className="bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1.5">
                  {item.concept && <p className="text-xs font-medium text-emerald-700">{item.concept}</p>}
                  {item.explanation && <p className="text-[11px] text-gray-500 mt-0.5">{item.explanation}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
        {(evaluation.missing_concepts?.length ?? 0) > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <p className="text-xs font-semibold text-gray-700">Khái niệm còn thiếu ({evaluation.missing_concepts!.length})</p>
            </div>
            <div className="space-y-1.5">
              {evaluation.missing_concepts!.map((item, i) => {
                const isHigh = item.importance === 'high';
                return (
                  <div key={i} className={`rounded-lg px-2.5 py-1.5 border ${isHigh ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'}`}>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {item.concept && <p className={`text-xs font-medium ${isHigh ? 'text-red-700' : 'text-amber-700'}`}>{item.concept}</p>}
                      {item.importance && (
                        <span className={`text-[10px] px-1 py-0.5 rounded font-medium ${isHigh ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                          {isHigh ? 'Quan trọng' : 'Trung bình'}
                        </span>
                      )}
                    </div>
                    {item.explanation && <p className="text-[11px] text-gray-500 leading-relaxed">{item.explanation}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Read-only slide renderer (for inline preview) ────────────────────────────

/** Resolves gs:// URLs to signed download URLs, like ImageBlock does in the editor */
function ReadonlyImage({ src, alt, caption }: { src: string; alt?: string; caption?: string }) {
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(
    src && !src.startsWith('gs://') ? src : null
  );
  const [loading, setLoading] = useState(!!src && src.startsWith('gs://'));

  useEffect(() => {
    if (!src || !src.startsWith('gs://')) {
      setResolvedSrc(src || null);
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    fetch('/api/gcs/download-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gcsUrl: src }),
    })
      .then((r) => r.json())
      .then((d) => { if (!cancelled && d.signedUrl) setResolvedSrc(d.signedUrl); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [src]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-lg bg-gray-100 min-h-[80px]">
        <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
      </div>
    );
  }
  if (!resolvedSrc) {
    return (
      <div className="flex items-center justify-center rounded-lg bg-gray-100 min-h-[60px]">
        <span className="text-xs text-gray-400">Không tải được ảnh</span>
      </div>
    );
  }
  return (
    <figure className="w-full">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={resolvedSrc} alt={alt || ''} className="rounded-lg object-contain w-full" />
      {caption && <figcaption className="text-center text-[11px] text-gray-400 mt-1">{caption}</figcaption>}
    </figure>
  );
}

function RenderBlock({ block }: { block: IBlock }) {
  const { content } = block;

  if (content.type === BlockType.HEADING) {
    const sz =
      content.level === 1 ? 'text-3xl font-bold' :
      content.level === 2 ? 'text-2xl font-bold' :
      content.level === 3 ? 'text-xl font-semibold' :
      content.level === 4 ? 'text-lg font-semibold' :
      'text-base font-medium';
    return (
      <div
        className={`${sz} text-gray-900 leading-tight`}
        dangerouslySetInnerHTML={{ __html: content.html }}
      />
    );
  }

  if (content.type === BlockType.TEXT) {
    return (
      <div
        className="prose prose-sm max-w-none text-gray-800 [&_strong]:font-bold [&_em]:italic [&_ul]:pl-4 [&_ol]:pl-4 [&_li]:my-0.5"
        dangerouslySetInnerHTML={{ __html: content.html }}
      />
    );
  }

  if (content.type === BlockType.IMAGE) {
    return <ReadonlyImage src={content.src} alt={content.alt} caption={content.caption} />;
  }

  if (content.type === BlockType.VIDEO) {
    return (
      <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-lg px-3 py-2.5">
        <Video className="w-4 h-4 text-rose-400 flex-shrink-0" />
        <span className="text-xs text-rose-600 truncate">Video: {content.src}</span>
      </div>
    );
  }

  if (content.type === BlockType.QUIZ) {
    return <QuizPlayer data={{ title: content.title, questions: content.questions }} />;
  }

  if (content.type === BlockType.FLASHCARD) {
    return <FlashcardPlayer data={{ front: content.front, back: content.back }} />;
  }

  if (content.type === BlockType.FILL_BLANK) {
    return <FillInBlankPlayer data={{ sentence: content.sentence, blanks: content.blanks }} />;
  }

  return null;
}

function RenderNode({ node }: { node: ILayout | IBlock }) {
  if (isBlock(node)) return <RenderBlock block={node} />;
  if (isLayout(node)) {
    const isMultiCol =
      node.variant === LayoutVariant.TWO_COLUMN ||
      node.variant === LayoutVariant.SIDEBAR_LEFT ||
      node.variant === LayoutVariant.SIDEBAR_RIGHT ||
      node.variant === LayoutVariant.THREE_COLUMN;

    if (isMultiCol) {
      const colCount = node.variant === LayoutVariant.THREE_COLUMN ? 3 : 2;
      const defaultWidths =
        node.variant === LayoutVariant.SIDEBAR_LEFT  ? [33, 67] :
        node.variant === LayoutVariant.SIDEBAR_RIGHT ? [67, 33] :
        node.variant === LayoutVariant.THREE_COLUMN  ? [33.33, 33.33, 33.34] :
        [50, 50];
      const widths = node.columnWidths ?? defaultWidths;
      return (
        <div className="flex flex-row gap-3 w-full">
          {node.children.map((child, i) => (
            <div
              key={child.id}
              className="min-w-0 flex flex-col gap-2"
              style={{ flexGrow: widths[i] ?? (100 / colCount), flexShrink: 1, flexBasis: '0%' }}
            >
              <RenderNode node={child} />
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3">
        {node.children.map((child) => <RenderNode key={child.id} node={child} />)}
      </div>
    );
  }
  return null;
}

function SlidePreviewInline({ doc }: { doc: IDocument }) {
  const cards = doc.cards;
  const [idx, setIdx] = useState(0);
  const card = cards[Math.min(idx, cards.length - 1)];

  useEffect(() => { setIdx(0); }, [doc.id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(i + 1, cards.length - 1));
      if (e.key === 'ArrowLeft')  setIdx((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cards.length]);

  if (!card) return null;

  // Match the editor's CardRenderer: override dark default bg (#1e293b) to white
  const bgColor =
    card.backgroundColor === '#1e293b' ? '#ffffff' : (card.backgroundColor || '#ffffff');

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full"
    >
      {/* Navigation bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 flex-shrink-0">
        <button
          type="button"
          onClick={() => setIdx((i) => Math.max(0, i - 1))}
          disabled={idx === 0}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-gray-500 font-medium">
          Trang <span className="text-gray-800 font-bold">{idx + 1}</span> / {cards.length}
        </span>
        <button
          type="button"
          onClick={() => setIdx((i) => Math.min(cards.length - 1, i + 1))}
          disabled={idx === cards.length - 1}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        {/* Thumbnail strip */}
        <div className="flex-1 flex gap-1 overflow-x-auto scrollbar-none ml-1">
          {cards.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setIdx(i)}
              className={`flex-shrink-0 w-8 h-5 rounded border text-[9px] font-semibold transition-colors ${
                i === idx
                  ? 'border-blue-400 bg-blue-50 text-blue-600'
                  : 'border-gray-200 bg-gray-50 text-gray-400 hover:border-blue-300'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Slide content — scrollable so tall cards don't clip */}
      <div className="flex-1 overflow-y-auto px-4 py-4 min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={card.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="rounded-2xl shadow-sm overflow-hidden"
            style={{
              backgroundColor: bgColor,
              backgroundImage: card.backgroundImage ? `url(${card.backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <div className="px-6 py-6 flex flex-col gap-3">
              {card.children.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-sm text-gray-400">Trang trống</p>
                </div>
              ) : (
                card.children.map((child) => <RenderNode key={child.id} node={child} />)
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── Studio Toolbar ────────────────────────────────────────────────────────────
interface StudioToolbarProps {
  projectCode: string;
  products: ProductDto[];
  isPipelineRunning: boolean;
  onOpenPipelineModal: () => void;
  onAnalyze: (doc: InputDocumentDto) => void;
  onGenerateSlides: (productCode: string, slideRange: 'short' | 'medium') => void;
  onGenerateVideo: (productCode: string) => void;
  onGenerateGame: (productCode: string) => void;
  videoLoadingCode: string | null;
  activePipelineType?: 'evaluation' | 'slides' | 'video' | null;
  activeDocCode?: string | null;
  onDocChange?: (docCode: string) => void;
}

function StudioToolbar({
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
  onDocChange,
}: StudioToolbarProps) {
  const { data: docs = [] } = useInputDocumentsByProject(projectCode);
  const [activeDoc, setActiveDoc] = useState<InputDocumentDto | null>(null);
  const [showDocPicker, setShowDocPicker] = useState(false);
  const [showSlideRangePicker, setShowSlideRangePicker] = useState(false);
  const [pendingSlideProductCode, setPendingSlideProductCode] = useState<string | null>(null);
  const [selectedSlideRange, setSelectedSlideRange] = useState<'short' | 'medium'>('medium');

  useEffect(() => {
    if (docs.length === 0) { setActiveDoc(null); return; }
    if (activeDocCode) {
      const target = docs.find((d) => d.documentCode === activeDocCode);
      if (target) { setActiveDoc(target); return; }
    }
    setActiveDoc((prev) => {
      if (prev && docs.find((d) => d.documentCode === prev.documentCode)) return prev;
      return docs[0];
    });
  }, [docs, activeDocCode]);

  const docProducts = activeDoc
    ? products.filter((p) => p.documentCode === activeDoc.documentCode)
    : [];

  const hasDocuments  = docs.length > 0;
  const hasEvaluation = docProducts.some((p) => p.hasEvaluation);
  const hasSlide      = docProducts.some((p) => p.hasSlide || p.hasEditedSlide);
  const latestEval    = docProducts.filter((p) => p.hasEvaluation).at(-1) ?? null;
  const latestSlide   = docProducts.filter((p) => p.hasSlide || p.hasEditedSlide).at(-1) ?? null;

  const handleAnalyzeClick = () => {
    if (isPipelineRunning) { onOpenPipelineModal(); return; }
    if (!activeDoc) return;
    onAnalyze(activeDoc);
  };

  const handleSlideClick = () => {
    if (!hasEvaluation || !latestEval) return;
    setPendingSlideProductCode(latestEval.productCode);
    setSelectedSlideRange('medium');
    setShowSlideRangePicker(true);
  };

  const handleSlideConfirm = () => {
    if (!pendingSlideProductCode) return;
    onGenerateSlides(pendingSlideProductCode, selectedSlideRange);
    setShowSlideRangePicker(false);
    setPendingSlideProductCode(null);
  };

  const handleVideoClick = () => {
    if (!hasSlide || !latestSlide) return;
    onGenerateVideo(latestSlide.productCode);
  };

  const handleGameClick = () => {
    if (!hasSlide || !latestSlide) return;
    onGenerateGame(latestSlide.productCode);
  };

  return (
    <>
      <div className="flex-shrink-0 border-b border-gray-100 bg-white px-4 py-2.5">
        <div className="flex items-center gap-3">

          {/* Document selector */}
          {docs.length > 0 && (
            <div className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowDocPicker((v) => !v)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                  showDocPicker ? 'border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'
                }`}
              >
                <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="max-w-[140px] truncate">{activeDoc?.title ?? 'Chọn tài liệu'}</span>
                <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${showDocPicker ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {showDocPicker && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.13 }}
                    className="absolute top-full left-0 z-30 mt-1 min-w-[200px] bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
                  >
                    {docs.map((doc) => (
                      <button
                        key={doc.documentCode}
                        type="button"
                        onClick={() => { setActiveDoc(doc); setShowDocPicker(false); onDocChange?.(doc.documentCode); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-blue-50 ${
                          activeDoc?.documentCode === doc.documentCode ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'
                        }`}
                      >
                        <FileText className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{doc.title}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Divider */}
          {docs.length > 0 && <div className="w-px h-5 bg-gray-200 flex-shrink-0" />}

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-1 min-w-0 overflow-x-auto scrollbar-none">
            {/* Phân tích */}
            <ToolbarButton
              icon={
                isPipelineRunning && activePipelineType === 'evaluation'
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Sparkles className="w-3.5 h-3.5" />
              }
              label={isPipelineRunning && activePipelineType === 'evaluation' ? 'Đang phân tích' : 'Phân tích'}
              disabled={!hasDocuments}
              accent="blue"
              onClick={handleAnalyzeClick}
            />

            {/* Tạo slide */}
            <ToolbarButton
              icon={<GalleryVerticalEnd className="w-3.5 h-3.5" />}
              label="Tạo slide"
              disabled={!hasEvaluation}
              locked={!hasEvaluation}
              accent="indigo"
              onClick={handleSlideClick}
            />

            {/* Tạo video */}
            <ToolbarButton
              icon={
                videoLoadingCode !== null
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : isPipelineRunning && activePipelineType === 'video'
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Video className="w-3.5 h-3.5" />
              }
              label={isPipelineRunning && activePipelineType === 'video' ? 'Đang tạo video' : 'Tạo video'}
              disabled={!hasSlide}
              locked={!hasSlide}
              accent="rose"
              onClick={handleVideoClick}
            />

            {/* Tạo trò chơi */}
            <ToolbarButton
              icon={<Gamepad2 className="w-3.5 h-3.5" />}
              label="Tạo trò chơi"
              disabled={!hasSlide}
              locked={!hasSlide}
              accent="amber"
              onClick={handleGameClick}
            />
          </div>

          {/* Pipeline indicator */}
          {isPipelineRunning && (
            <button
              type="button"
              onClick={onOpenPipelineModal}
              className="flex-shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors"
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="hidden sm:inline">
                {activePipelineType === 'video' ? 'Đang tạo video'
                  : activePipelineType === 'slides' ? 'Đang tạo slide'
                  : 'Đang phân tích'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Slide range picker modal */}
      <AnimatePresence>
        {showSlideRangePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
            onClick={() => setShowSlideRangePicker(false)}
          >
            <motion.div
              initial={{ scale: 0.93, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.93, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-5">
                <p className="text-base font-bold text-gray-900 mb-1">Mức độ chi tiết của slide</p>
                <p className="text-xs text-gray-500">Chọn mức độ chi tiết cho nội dung được tạo.</p>
              </div>
              <div className="space-y-2.5 mb-6">
                {([
                  { value: 'short',  label: 'Ngắn gọn',   desc: 'Ý chính, súc tích, ít chữ trên mỗi slide' },
                  { value: 'medium', label: 'Trung bình',  desc: 'Cân bằng giữa nội dung và trình bày' },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedSlideRange(opt.value)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
                      selectedSlideRange === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-white hover:border-gray-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                      selectedSlideRange === opt.value ? 'border-blue-500' : 'border-gray-300'
                    }`}>
                      {selectedSlideRange === opt.value && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${selectedSlideRange === opt.value ? 'text-blue-700' : 'text-gray-800'}`}>{opt.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={() => setShowSlideRangePicker(false)} className="px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors">Hủy</button>
                <button type="button" onClick={handleSlideConfirm} className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors">Tạo slide</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Compact toolbar button
function ToolbarButton({
  icon, label, disabled, locked, accent, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  locked?: boolean;
  accent: 'blue' | 'indigo' | 'rose' | 'amber';
  onClick: () => void;
}) {
  const colors = {
    blue:   { active: 'bg-blue-600 hover:bg-blue-700 text-white',   muted: 'bg-gray-100 text-gray-400' },
    indigo: { active: 'bg-indigo-600 hover:bg-indigo-700 text-white', muted: 'bg-gray-100 text-gray-400' },
    rose:   { active: 'bg-rose-600 hover:bg-rose-700 text-white',   muted: 'bg-gray-100 text-gray-400' },
    amber:  { active: 'bg-amber-600 hover:bg-amber-700 text-white', muted: 'bg-gray-100 text-gray-400' },
  };
  const cls = disabled ? colors[accent].muted : colors[accent].active;
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={label}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0 ${cls} ${disabled ? 'cursor-not-allowed' : ''}`}
    >
      {locked && !disabled ? <Lock className="w-3 h-3" /> : icon}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function StudioCenter({
  projectCode,
  projectName,
  products,
  videos,
  games,
  activeDocCode,
  detailProductCode,
  onCloseDetail,
  onDocChange,
  slidePreviewDoc,
  slidePreviewLoading,
  onWatchVideo,
  isPipelineRunning,
  onOpenPipelineModal,
  onAnalyze,
  onGenerateSlides,
  onGenerateVideo,
  onGenerateGame,
  videoLoadingCode,
  activePipelineType,
}: StudioCenterProps) {
  const detailProduct = detailProductCode
    ? products.find((p) => p.productCode === detailProductCode) ?? null
    : null;
  const detailVideos = detailProductCode
    ? videos.filter((v) => v.productCode === detailProductCode)
    : [];
  const detailDate = detailProduct
    ? (detailProduct.evaluatedAt ?? detailProduct.slideGeneratedAt ?? detailProduct.slideEditedAt)
    : null;

  // Auto-switch tab when slidePreviewDoc changes
  const [detailTab, setDetailTab] = useState<'eval' | 'slide'>('eval');
  useEffect(() => {
    if (slidePreviewDoc) setDetailTab('slide');
    else setDetailTab('eval');
  }, [slidePreviewDoc]);

  return (
    <div className="flex flex-col h-full">

      {/* ── Studio Toolbar ── */}
      <StudioToolbar
        projectCode={projectCode}
        products={products}
        isPipelineRunning={isPipelineRunning}
        onOpenPipelineModal={onOpenPipelineModal}
        onAnalyze={onAnalyze}
        onGenerateSlides={onGenerateSlides}
        onGenerateVideo={onGenerateVideo}
        onGenerateGame={onGenerateGame}
        videoLoadingCode={videoLoadingCode}
        activePipelineType={activePipelineType}
        activeDocCode={activeDocCode}
        onDocChange={onDocChange}
      />

      {/* ── Detail view ── */}
      {!detailProduct ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center max-w-xs">
            <div className="w-14 h-14 rounded-3xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-7 h-7 text-blue-400" />
            </div>
            {products.length === 0 ? (
              <>
                <h2 className="text-base font-semibold text-gray-600 mb-2">{projectName}</h2>
                <p className="text-sm text-gray-400">Bắt đầu bằng cách phân tích tài liệu giáo án của bạn.</p>
              </>
            ) : (
              <>
                <h2 className="text-sm font-semibold text-gray-500 mb-1">Chọn sản phẩm để xem chi tiết</h2>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">

          {/* Product header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
              <BarChart3 className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{detailProduct.productName}</p>
              {detailDate && <p className="text-xs text-gray-400 mt-0.5">{formatDate(detailDate)}</p>}
            </div>
            {onCloseDetail && (
              <button
                type="button"
                onClick={onCloseDetail}
                title="Đóng chi tiết"
                className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Tab toggle */}
          <div className="flex items-center gap-1 px-6 pt-3 pb-1">
            <button
              type="button"
              onClick={() => setDetailTab('eval')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                detailTab === 'eval'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Phân tích
            </button>
            <button
              type="button"
              onClick={() => setDetailTab('slide')}
              disabled={!slidePreviewDoc && !slidePreviewLoading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                detailTab === 'slide'
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {slidePreviewLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
              Xem slide
            </button>
          </div>
          {detailTab === 'eval' && (
            detailProduct.hasEvaluation ? (
              <div>
                <div className="px-6 pt-4 pb-1">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Kết quả phân tích
                  </p>
                </div>
                <EvaluationInline productCode={detailProductCode!} />
              </div>
            ) : (
              <div className="px-6 py-8 text-center">
                <p className="text-sm text-gray-400">Chưa có kết quả phân tích.</p>
              </div>
            )
          )}

          {/* Slide preview */}
          {detailTab === 'slide' && (
            slidePreviewDoc
              ? <SlidePreviewInline doc={slidePreviewDoc} />
              : <div className="px-6 py-8 text-center">
                  <p className="text-sm text-gray-400">Đang tải slide...</p>
                </div>
          )}
        </div>
      )}
    </div>
  );
}
