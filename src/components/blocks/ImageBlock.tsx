'use client';

/**
 * ImageBlock Component
 * ====================
 *
 * Displays an image with optional caption.
 * When src is empty (new block), shows an upload placeholder:
 *   - Click → opens file explorer → reads as data URL → saves to store
 */

import React, { useRef } from 'react';
import { cn } from '@/lib/utils';
import { IImageContent, BlockType } from '@/types';
import { useDocumentStore } from '@/store';
import { ImagePlus } from 'lucide-react';

interface ImageBlockProps {
  id: string;
  content: IImageContent;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function ImageBlock({
  id,
  content,
  isSelected = false,
  onSelect,
}: ImageBlockProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateBlockContent = useDocumentStore((state) => state.updateBlockContent);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const src = evt.target?.result as string;
      updateBlockContent(id, {
        type: BlockType.IMAGE,
        src,
        alt: file.name,
        caption: content.caption,
      });
    };
    reader.readAsDataURL(file);
    // reset so the same file can be re-selected if needed
    e.target.value = '';
  };

  const handlePlaceholderClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.();
    fileInputRef.current?.click();
  };

  // ── Placeholder (no image yet) ──────────────────────────────────────────
  if (!content.src) {
    return (
      <figure
        className={cn(
          'relative rounded-lg overflow-hidden transition-all duration-200',
          isSelected && 'ring-2 ring-primary-500 ring-offset-2'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={handlePlaceholderClick}
          className={cn(
            'w-full h-96 flex items-center justify-center gap-4',
            'bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg',
            'hover:bg-primary-50 hover:border-primary-400 transition-all duration-200',
            'cursor-pointer group'
          )}
        >
          <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
            <ImagePlus className="w-7 h-7 text-gray-400 group-hover:text-primary-500 transition-colors" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-600 group-hover:text-primary-600 transition-colors">
              Chọn hình ảnh
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              Nhấn để mở thư mục
            </p>
          </div>
        </button>
      </figure>
    );
  }

  // ── Image with replace-on-click ─────────────────────────────────────────
  return (
    <figure
      className={cn(
        'relative group rounded-lg overflow-hidden',
        'transition-all duration-200',
        isSelected && 'ring-2 ring-primary-500 ring-offset-2'
      )}
      onClick={onSelect}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="relative w-full aspect-video bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={content.src}
          alt={content.alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />

        {/* Hover overlay with replace button */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 px-4 py-2 bg-white/90 rounded-lg shadow text-sm font-semibold text-gray-800 hover:bg-white"
          >
            <ImagePlus className="w-4 h-4" />
            Thay ảnh
          </button>
        </div>
      </div>

      {content.caption && (
        <figcaption className="text-sm text-gray-600 text-center bg-gray-50 px-3 py-1.5">
          {content.caption}
        </figcaption>
      )}
    </figure>
  );
}

export default ImageBlock;
