'use client';

/**
 * VideoBlock Component
 * ====================
 *
 * Embeds video content from YouTube, Vimeo, or direct (local file) sources.
 *
 * When src is empty (new block), shows a dual-option placeholder:
 *  - "Tải video lên"  → opens file explorer, creates object URL
 *  - "Nhập link YouTube / Vimeo" → inline text input
 */

import React, { useRef, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { IVideoContent, BlockType } from '@/types';
import { useDocumentStore } from '@/store';
import { VideoIcon as VideoPlus, Loader2 } from 'lucide-react';

interface VideoBlockProps {
  id: string;
  content: IVideoContent;
  isSelected?: boolean;
  onSelect?: () => void;
  isActiveSlide?: boolean;
}

function getYouTubeId(url: string): string | null {
  const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function getVimeoId(url: string): string | null {
  const regex = /vimeo\.com\/(?:video\/)?(\d+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

function getEmbedUrl(content: IVideoContent, autoplay = false): string | null {
  if (!content.src) return null;
  if (content.provider === 'youtube') {
    const id = getYouTubeId(content.src);
    if (!id) return null;
    return autoplay
      ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`
      : `https://www.youtube.com/embed/${id}`;
  }
  if (content.provider === 'vimeo') {
    const id = getVimeoId(content.src);
    if (!id) return null;
    return autoplay
      ? `https://player.vimeo.com/video/${id}?autoplay=1`
      : `https://player.vimeo.com/video/${id}`;
  }
  return content.src; // direct / object URL
}



export function VideoBlock({
  id,
  content,
  isSelected = false,
  onSelect,
  isActiveSlide = false,
}: VideoBlockProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateBlockContent = useDocumentStore((state) => state.updateBlockContent);
  const appMode = useDocumentStore((state) => state.appMode);
  const isPresenting = appMode === 'PRESENT';
  // Only autoplay when this block's slide is the currently active presentation slide
  const shouldAutoplay = isPresenting && isActiveSlide;


  // Resolve gs:// URLs to signed download URLs (only for direct provider)
  const needsResolve = !!content.src && content.src.startsWith('gs://');
  const [resolvedSrc, setResolvedSrc] = useState<string | null>(
    content.src && !needsResolve ? content.src : null
  );
  const [gcsLoading, setGcsLoading] = useState(needsResolve);

  useEffect(() => {
    if (!content.src) return;
    if (!content.src.startsWith('gs://')) {
      setResolvedSrc(content.src);
      setGcsLoading(false);
      return;
    }
    let cancelled = false;
    setGcsLoading(true);
    fetch('/api/gcs/download-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gcsUrl: content.src }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data.signedUrl) setResolvedSrc(data.signedUrl);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setGcsLoading(false); });
    return () => { cancelled = true; };
  }, [content.src]);

  // ── Handle local file upload ──────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const src = URL.createObjectURL(file);
    updateBlockContent(id, { type: BlockType.VIDEO, src, provider: 'direct' });
    e.target.value = '';
  };

  // ── Handle URL submit ─────────────────────────────────────────────────────
  // (URL input removed — only local file upload is supported)

  // ── Placeholder (no video yet) ────────────────────────────────────────────
  if (!content.src) {
    return (
      <div
        className={cn(
          'relative rounded-lg overflow-hidden transition-all duration-200',
          isSelected && 'ring-2 ring-primary-500 ring-offset-2'
        )}
        onClick={onSelect}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="w-full h-96 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
            <VideoPlus className="w-5 h-5 text-gray-400" />
          </div>

          <div className="flex flex-col items-start gap-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-colors shadow-sm"
            >
              <VideoPlus className="w-4 h-4" />
              Tải video lên
            </button>
            <p className="text-xs text-gray-400">Hỗ trợ: MP4, WebM, OGV</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading state (resolving gs:// URL) ────────────────────────────────
  if (content.src && gcsLoading) {
    return (
      <div
        className={cn(
          'relative rounded-lg overflow-hidden transition-all duration-200',
          isSelected && 'ring-2 ring-primary-500 ring-offset-2'
        )}
      >
        <div className="w-full aspect-video flex items-center justify-center bg-gray-900 rounded-lg">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          <span className="ml-2 text-sm text-gray-400">Đang tải video…</span>
        </div>
      </div>
    );
  }

  // ── Video player ──────────────────────────────────────────────────────────
  // Use resolvedSrc for direct/gs:// videos, original content for youtube/vimeo embeds
  const effectiveContent: IVideoContent = resolvedSrc && content.provider === 'direct'
    ? { ...content, src: resolvedSrc }
    : content;
  const embedUrl = getEmbedUrl(effectiveContent, shouldAutoplay);

  return (
    <div
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
        accept="video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="relative w-full aspect-video bg-gray-900">
        {embedUrl && (content.provider === 'youtube' || content.provider === 'vimeo') ? (
          <iframe
            key={isPresenting ? 'present' : 'edit'}
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Video embed"
          />
        ) : embedUrl ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            key={isPresenting ? 'present' : 'edit'}
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            controls
            autoPlay={shouldAutoplay}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <p className="text-sm opacity-75">URL video không hợp lệ</p>
          </div>
        )}

        {/* Hover overlay with replace button — hidden in presentation mode */}
        {!isPresenting && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center pointer-events-none">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="flex items-center gap-2 px-3 py-2 bg-white/90 rounded-lg shadow text-sm font-semibold text-gray-800 hover:bg-white"
              >
                <VideoPlus className="w-4 h-4" />
                Thay video
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VideoBlock;
