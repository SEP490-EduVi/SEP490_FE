/**
 * Card Templates & Freeform Templates
 * =====================================
 * 
 * Defines all card template previews used in the Quick Layouts modal.
 * 
 * BASIC TEMPLATES (with templateId):
 *   Layout-based cards with column structures.
 * 
 * FREEFORM TEMPLATES (no templateId):
 *   Special-purpose cards: title, bullet, section divider, quiz, flashcard,
 *   fill-in-blank, summary.
 */

'use client';

import React from 'react';
import * as LucideIcons from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface CardTemplateItem {
  id: string;
  type: string;
  label: string;
  preview: React.ReactNode;
}

// ============================================================================
// BASIC TEMPLATES (6 layout-based templates)
// ============================================================================

export const basicCardTemplates: CardTemplateItem[] = [
  {
    id: 'template-001',
    type: 'image-text-left',
    label: 'Hình ảnh và văn bản',
    preview: (
      <div className="w-full h-full flex gap-1 p-2 bg-white border border-gray-200 rounded">
        <div className="w-1/3 bg-gray-200 rounded flex items-center justify-center">
          <LucideIcons.ImagePlus className="text-gray-400" />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <div className="h-5 bg-gray-300 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
        </div>
      </div>
    ),
  },
  {
    id: 'template-002',
    type: 'text-image-right',
    label: 'Văn bản và hình ảnh',
    preview: (
      <div className="w-full h-full flex gap-1 p-2 bg-white border border-gray-200 rounded">
        <div className="flex-1 flex flex-col gap-1">
          <div className="h-5 bg-gray-300 rounded w-3/4" />
          <div className="h-3 bg-gray-200 rounded" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
        </div>
        <div className="w-1/3 bg-gray-200 rounded flex items-center justify-center">
          <LucideIcons.ImagePlus className="text-gray-400" />
        </div>
      </div>
    ),
  },
  {
    id: 'template-003',
    type: 'two-columns',
    label: 'Bố cục hai cột (Nội dung)',
    preview: (
      <div className="w-full h-full flex flex-col gap-1 p-2 bg-white border border-gray-200 rounded">
        <div className="h-5 bg-gray-300 rounded w-2/3 mx-auto" />
        <div className="flex-1 flex gap-1.5">
          <div className="flex-1 flex flex-col gap-0.5 bg-gray-100 rounded p-1.5">
            <div className="h-2.5 bg-gray-400 rounded w-2/3" />
            <div className="h-2 bg-gray-200 rounded" />
            <div className="h-2 bg-gray-200 rounded w-4/5" />
          </div>
          <div className="flex-1 flex flex-col gap-0.5 bg-gray-100 rounded p-1.5">
            <div className="h-2.5 bg-gray-400 rounded w-2/3" />
            <div className="h-2 bg-gray-200 rounded" />
            <div className="h-2 bg-gray-200 rounded w-4/5" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'template-004',
    type: 'two-columns-alt',
    label: 'Bố cục hai cột (Chữ)',
    preview: (
      <div className="w-full h-full flex flex-col gap-1 p-2 bg-white border border-gray-200 rounded">
        <div className="h-5 bg-gray-300 rounded w-2/3 mx-auto" />
        <div className="flex-1 flex gap-1.5">
          <div className="flex-1 flex flex-col gap-0.5 bg-gray-100 rounded p-1.5">
            <div className="h-2.5 bg-gray-400 rounded w-2/3" />
            <div className="h-2 bg-gray-200 rounded" />
            <div className="h-2 bg-gray-200 rounded" />
            <div className="h-2 bg-gray-200 rounded w-3/4" />
          </div>
          <div className="flex-1 flex flex-col gap-0.5 bg-gray-100 rounded p-1.5">
            <div className="h-2.5 bg-gray-400 rounded w-2/3" />
            <div className="h-2 bg-gray-200 rounded" />
            <div className="h-2 bg-gray-200 rounded" />
            <div className="h-2 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'template-005',
    type: 'three-columns',
    label: 'Bố cục ba cột (Nội dung)',
    preview: (
      <div className="w-full h-full flex flex-col gap-1 p-2 bg-white border border-gray-200 rounded">
        <div className="h-5 bg-gray-300 rounded w-2/3 mx-auto" />
        <div className="flex-1 flex gap-1">
          <div className="flex-1 flex flex-col gap-0.5 bg-gray-100 rounded p-1">
            <div className="h-2 bg-gray-400 rounded w-3/4" />
            <div className="h-1.5 bg-gray-200 rounded" />
            <div className="h-1.5 bg-gray-200 rounded w-4/5" />
          </div>
          <div className="flex-1 flex flex-col gap-0.5 bg-gray-100 rounded p-1">
            <div className="h-2 bg-gray-400 rounded w-3/4" />
            <div className="h-1.5 bg-gray-200 rounded" />
            <div className="h-1.5 bg-gray-200 rounded w-4/5" />
          </div>
          <div className="flex-1 flex flex-col gap-0.5 bg-gray-100 rounded p-1">
            <div className="h-2 bg-gray-400 rounded w-3/4" />
            <div className="h-1.5 bg-gray-200 rounded" />
            <div className="h-1.5 bg-gray-200 rounded w-4/5" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'template-006',
    type: 'three-columns-alt',
    label: 'Bố cục ba cột (Chữ)',
    preview: (
      <div className="w-full h-full flex flex-col gap-1 p-2 bg-white border border-gray-200 rounded">
        <div className="h-5 bg-gray-300 rounded w-2/3 mx-auto" />
        <div className="flex-1 flex gap-1">
          <div className="flex-1 flex flex-col gap-0.5 bg-gray-100 rounded p-1">
            <div className="h-2 bg-gray-400 rounded w-3/4" />
            <div className="h-1.5 bg-gray-200 rounded" />
            <div className="h-1.5 bg-gray-200 rounded" />
            <div className="h-1.5 bg-gray-200 rounded w-3/4" />
          </div>
          <div className="flex-1 flex flex-col gap-0.5 bg-gray-100 rounded p-1">
            <div className="h-2 bg-gray-400 rounded w-3/4" />
            <div className="h-1.5 bg-gray-200 rounded" />
            <div className="h-1.5 bg-gray-200 rounded" />
            <div className="h-1.5 bg-gray-200 rounded w-3/4" />
          </div>
          <div className="flex-1 flex flex-col gap-0.5 bg-gray-100 rounded p-1">
            <div className="h-2 bg-gray-400 rounded w-3/4" />
            <div className="h-1.5 bg-gray-200 rounded" />
            <div className="h-1.5 bg-gray-200 rounded" />
            <div className="h-1.5 bg-gray-200 rounded w-3/4" />
          </div>
        </div>
      </div>
    ),
  },
];

// ============================================================================
// FREEFORM TEMPLATES (no templateId, special-purpose cards)
// ============================================================================

export const freeformCardTemplates: CardTemplateItem[] = [
  {
    id: 'freeform-title',
    type: 'title-card',
    label: 'Thẻ tiêu đề',
    preview: (
      <div className="w-full h-32 flex flex-col justify-between p-3 bg-indigo-600 rounded">
        <div className="flex items-center gap-1">
          <LucideIcons.BookOpen className="w-2.5 h-2.5 text-indigo-200 flex-shrink-0" />
          <div className="h-2 bg-indigo-400/60 rounded w-1/3" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="h-4 bg-white/80 rounded w-4/5" />
          <div className="h-2.5 bg-indigo-300/70 rounded w-3/5" />
          <div className="h-2 bg-indigo-400/50 rounded w-2/5" />
        </div>
        <div className="flex justify-center gap-1">
          <div className="h-1 w-6 bg-indigo-300/60 rounded-full" />
          <div className="h-1 w-2 bg-indigo-400/40 rounded-full" />
          <div className="h-1 w-2 bg-indigo-400/40 rounded-full" />
        </div>
      </div>
    ),
  },
  {
    id: 'freeform-bullet',
    type: 'bullet-card',
    label: 'Thẻ danh sách gạch đầu dòng',
    preview: (
      <div className="w-full h-32 flex flex-col gap-1.5 p-3 bg-white border border-gray-200 rounded">
        <div className="flex items-center gap-1.5">
          <LucideIcons.AlignLeft className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <div className="h-3.5 bg-gray-300 rounded flex-1 w-2/3" />
        </div>
        <div className="flex items-center gap-1.5 pl-1">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" />
          <div className="h-2.5 bg-gray-200 rounded flex-1" />
        </div>
        <div className="flex items-center gap-1.5 pl-1">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" />
          <div className="h-2.5 bg-gray-200 rounded flex-1 w-5/6" />
        </div>
        <div className="flex items-center gap-1.5 pl-1">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" />
          <div className="h-2.5 bg-gray-200 rounded flex-1 w-4/5" />
        </div>
        <div className="flex items-center gap-1.5 pl-1">
          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full flex-shrink-0" />
          <div className="h-2.5 bg-gray-200 rounded flex-1 w-3/4" />
        </div>
      </div>
    ),
  },
  {
    id: 'freeform-section',
    type: 'section-divider',
    label: 'Thẻ chuyển tiếp',
    preview: (
      <div className="w-full h-32 flex flex-col justify-center items-center gap-2 p-3 bg-white border border-gray-200 rounded">
        <div className="h-1 w-8 bg-indigo-400 rounded-full" />
        <div className="h-4 bg-gray-300 rounded w-3/4" />
        <div className="h-2.5 bg-gray-200 rounded w-1/2" />
        <div className="h-1 w-8 bg-indigo-400 rounded-full" />
      </div>
    ),
  },
  {
    id: 'freeform-quiz',
    type: 'quiz-card',
    label: 'Thẻ câu hỏi',
    preview: (
      <div className="w-full h-32 flex flex-col gap-1.5 p-3 bg-amber-50 border border-amber-200 rounded">
        <div className="flex items-center gap-1.5">
          <LucideIcons.HelpCircle className="w-3 h-3 text-amber-400 flex-shrink-0" />
          <div className="h-3.5 bg-amber-200 rounded flex-1 w-2/3" />
        </div>
        <div className="flex items-center gap-1.5 pl-1">
          <div className="w-3 h-3 border border-gray-300 rounded-full flex-shrink-0" />
          <div className="h-2.5 bg-gray-200 rounded flex-1" />
        </div>
        <div className="flex items-center gap-1.5 pl-1">
          <div className="w-3 h-3 border-2 border-green-400 rounded-full flex-shrink-0 bg-green-100" />
          <div className="h-2.5 bg-green-100 rounded flex-1 w-5/6" />
        </div>
        <div className="flex items-center gap-1.5 pl-1">
          <div className="w-3 h-3 border border-gray-300 rounded-full flex-shrink-0" />
          <div className="h-2.5 bg-gray-200 rounded flex-1 w-4/5" />
        </div>
        <div className="flex items-center gap-1.5 pl-1">
          <div className="w-3 h-3 border border-gray-300 rounded-full flex-shrink-0" />
          <div className="h-2.5 bg-gray-200 rounded flex-1 w-3/4" />
        </div>
      </div>
    ),
  },
  {
    id: 'freeform-flashcard',
    type: 'flashcard-card',
    label: 'Thẻ ghi nhớ',
    preview: (
      <div className="w-full h-32 flex flex-col gap-1.5 p-3 bg-violet-50 border border-violet-200 rounded">
        <div className="flex items-center gap-1.5">
          <LucideIcons.RotateCcw className="w-3 h-3 text-violet-400 flex-shrink-0" />
          <div className="h-3.5 bg-violet-200 rounded flex-1 w-2/3" />
        </div>
        <div className="flex-1 flex flex-col gap-1 bg-white border border-violet-200 rounded p-1.5">
          <div className="h-2.5 bg-violet-200 rounded w-3/4" />
          <div className="h-2 bg-violet-100 rounded w-full" />
        </div>
        <div className="h-px bg-violet-200 mx-1" />
        <div className="flex-1 flex flex-col gap-1 bg-violet-100/50 border border-violet-200 rounded p-1.5">
          <div className="h-2.5 bg-violet-200 rounded w-4/5" />
          <div className="h-2 bg-violet-100 rounded w-3/5" />
        </div>
      </div>
    ),
  },
  {
    id: 'freeform-fillblank',
    type: 'fill-blank-card',
    label: 'Thẻ điền từ',
    preview: (
      <div className="w-full h-32 flex flex-col gap-1.5 p-3 bg-emerald-50 border border-emerald-200 rounded">
        <div className="flex items-center gap-1.5">
          <LucideIcons.PenLine className="w-3 h-3 text-emerald-400 flex-shrink-0" />
          <div className="h-3.5 bg-emerald-200 rounded flex-1 w-2/3" />
        </div>
        <div className="flex items-center gap-1 pl-1 flex-wrap">
          <div className="h-2.5 bg-gray-200 rounded w-1/5" />
          <div className="h-2.5 rounded w-1/5 border-b-2 border-emerald-400 bg-emerald-100" />
          <div className="h-2.5 bg-gray-200 rounded w-2/5" />
        </div>
        <div className="flex items-center gap-1 pl-1 flex-wrap">
          <div className="h-2.5 bg-gray-200 rounded w-2/5" />
          <div className="h-2.5 rounded w-1/6 border-b-2 border-emerald-400 bg-emerald-100" />
          <div className="h-2.5 bg-gray-200 rounded w-1/4" />
        </div>
        <div className="flex items-center gap-1 pl-1 flex-wrap">
          <div className="h-2.5 bg-gray-200 rounded w-1/4" />
          <div className="h-2.5 rounded w-1/5 border-b-2 border-emerald-400 bg-emerald-100" />
          <div className="h-2.5 bg-gray-200 rounded w-1/3" />
        </div>
      </div>
    ),
  },
  {
    id: 'freeform-summary',
    type: 'summary-card',
    label: 'Thẻ tóm tắt',
    preview: (
      <div className="w-full h-32 flex flex-col gap-1.5 p-3 bg-sky-50 border border-sky-200 rounded">
        <div className="flex items-center gap-1.5">
          <LucideIcons.ListChecks className="w-3 h-3 text-sky-400 flex-shrink-0" />
          <div className="h-3.5 bg-sky-200 rounded flex-1 w-2/3" />
        </div>
        <div className="flex items-center gap-1.5 pl-1">
          <div className="w-3 h-3 border-2 border-sky-400 rounded-sm flex-shrink-0 bg-sky-200 flex items-center justify-center" />
          <div className="h-2.5 bg-sky-100 rounded flex-1" />
        </div>
        <div className="flex items-center gap-1.5 pl-1">
          <div className="w-3 h-3 border-2 border-sky-400 rounded-sm flex-shrink-0 bg-sky-200" />
          <div className="h-2.5 bg-sky-100 rounded flex-1 w-5/6" />
        </div>
        <div className="flex items-center gap-1.5 pl-1">
          <div className="w-3 h-3 border-2 border-sky-400 rounded-sm flex-shrink-0 bg-sky-200" />
          <div className="h-2.5 bg-sky-100 rounded flex-1 w-4/5" />
        </div>
        <div className="flex items-center gap-1.5 pl-1">
          <div className="w-3 h-3 border border-sky-300 rounded-sm flex-shrink-0" />
          <div className="h-2.5 bg-gray-100 rounded flex-1 w-3/4" />
        </div>
      </div>
    ),
  },
];
