'use client';

/**
 * SkeletonPreview
 * ===============
 *
 * Auto-generates a visual gray-box preview of a template skeleton,
 * matching the style of the hardcoded previews in cardTemplates.tsx.
 *
 * Usage:
 *   <SkeletonPreview skeleton={template.skeleton} className="w-full h-32" />
 */

import React from 'react';
import { ImagePlus, Play, HelpCircle, RotateCcw, PenLine } from 'lucide-react';
import { BlockType, LayoutVariant } from '@/types';
import type { ITemplateSkeleton, ISkeletonLayout, ISkeletonBlock } from '@/types';
import { cn } from '@/lib/utils';

// ────────────────────────────────────────────────────────────────────────────
// Block preview atoms
// ────────────────────────────────────────────────────────────────────────────

function BlockPreview({ block }: { block: ISkeletonBlock }) {
  switch (block.blockType) {
    case BlockType.HEADING:
      return <div className="h-3.5 bg-gray-300 rounded w-2/3 flex-shrink-0" />;

    case BlockType.TEXT:
      return (
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <div className="h-2 bg-gray-200 rounded" />
          <div className="h-2 bg-gray-200 rounded w-5/6" />
          <div className="h-2 bg-gray-200 rounded w-4/5" />
        </div>
      );

    case BlockType.IMAGE:
      return (
        <div className="flex-1 bg-gray-200 rounded flex items-center justify-center min-h-[2rem]">
          <ImagePlus className="w-4 h-4 text-gray-400" />
        </div>
      );

    case BlockType.VIDEO:
      return (
        <div className="flex-1 bg-gray-200 rounded flex items-center justify-center min-h-[2rem]">
          <Play className="w-4 h-4 text-gray-400" />
        </div>
      );

    case BlockType.QUIZ:
      return (
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <div className="flex items-center gap-1">
            <HelpCircle className="w-2.5 h-2.5 text-amber-400 flex-shrink-0" />
            <div className="h-2 bg-gray-300 rounded flex-1" />
          </div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-1 pl-1">
              <div className="w-2 h-2 border border-gray-300 rounded-full flex-shrink-0" />
              <div className="h-1.5 bg-gray-200 rounded flex-1" />
            </div>
          ))}
        </div>
      );

    case BlockType.FLASHCARD:
      return (
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <div className="flex items-center gap-1">
            <RotateCcw className="w-2.5 h-2.5 text-violet-400 flex-shrink-0" />
            <div className="h-2 bg-gray-300 rounded flex-1" />
          </div>
          <div className="flex-1 bg-gray-100 border border-gray-200 rounded p-1">
            <div className="h-1.5 bg-violet-200 rounded w-3/4" />
          </div>
          <div className="h-px bg-gray-200" />
          <div className="flex-1 bg-gray-100 border border-gray-200 rounded p-1">
            <div className="h-1.5 bg-violet-200 rounded w-4/5" />
          </div>
        </div>
      );

    case BlockType.FILL_BLANK:
      return (
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          <div className="flex items-center gap-1">
            <PenLine className="w-2.5 h-2.5 text-emerald-400 flex-shrink-0" />
            <div className="h-2 bg-gray-300 rounded flex-1" />
          </div>
          <div className="flex items-center gap-0.5 flex-wrap">
            <div className="h-2 bg-gray-200 rounded w-1/5" />
            <div className="h-2 rounded w-1/5 border-b-2 border-emerald-400 bg-emerald-50" />
            <div className="h-2 bg-gray-200 rounded w-2/5" />
          </div>
        </div>
      );

    default:
      return <div className="h-2 bg-gray-200 rounded w-3/4 flex-shrink-0" />;
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Layout preview
// ────────────────────────────────────────────────────────────────────────────

function LayoutPreview({ layout }: { layout: ISkeletonLayout }) {
  const isMultiColumn =
    layout.variant === LayoutVariant.TWO_COLUMN ||
    layout.variant === LayoutVariant.THREE_COLUMN ||
    layout.variant === LayoutVariant.SIDEBAR_LEFT ||
    layout.variant === LayoutVariant.SIDEBAR_RIGHT;

  // Determine column widths for sidebar variants
  const getSidebarWidths = () => {
    if (layout.variant === LayoutVariant.SIDEBAR_LEFT) return ['w-1/3', 'flex-1'];
    if (layout.variant === LayoutVariant.SIDEBAR_RIGHT) return ['flex-1', 'w-1/3'];
    return null;
  };
  const sidebarWidths = getSidebarWidths();

  if (isMultiColumn) {
    return (
      <div className="flex gap-1 flex-1 min-h-0">
        {layout.children.map((child, i) => {
          const widthClass = sidebarWidths ? sidebarWidths[i] ?? 'flex-1' : 'flex-1';
          return (
            <div
              key={i}
              className={cn(
                widthClass,
                'flex flex-col gap-0.5 bg-gray-50 border border-gray-100 rounded p-1',
              )}
            >
              <NodePreview node={child} />
            </div>
          );
        })}
      </div>
    );
  }

  // SINGLE / MASONRY — stack vertically
  return (
    <div className="flex flex-col gap-0.5 flex-1 min-h-0">
      {layout.children.map((child, i) => (
        <NodePreview key={i} node={child} />
      ))}
    </div>
  );
}

function NodePreview({ node }: { node: ISkeletonLayout | ISkeletonBlock }) {
  if ('type' in node && node.type === 'LAYOUT') {
    return <LayoutPreview layout={node as ISkeletonLayout} />;
  }
  return <BlockPreview block={node as ISkeletonBlock} />;
}

// ────────────────────────────────────────────────────────────────────────────
// Root component
// ────────────────────────────────────────────────────────────────────────────

interface SkeletonPreviewProps {
  skeleton: ITemplateSkeleton;
  className?: string;
}

export default function SkeletonPreview({ skeleton, className }: SkeletonPreviewProps) {
  return (
    <div
      className={cn(
        'w-full h-full flex flex-col gap-1 p-2 bg-white border border-gray-200 rounded overflow-hidden',
        className,
      )}
      style={skeleton.backgroundColor ? { backgroundColor: skeleton.backgroundColor } : undefined}
    >
      {skeleton.children.map((child, i) => (
        <NodePreview key={i} node={child} />
      ))}
    </div>
  );
}
