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

import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { IVideoContent, BlockType } from '@/types';
import { useDocumentStore } from '@/store';
import { VideoIcon as VideoPlus, Link2 } from 'lucide-react';

interface VideoBlockProps {
  id: string;
  content: IVideoContent;
  isSelected?: boolean;
  onSelect?: () => void;
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

function getEmbedUrl(content: IVideoContent): string | null {
  if (!content.src) return null;
  if (content.provider === 'youtube') {
    const id = getYouTubeId(content.src);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }
  if (content.provider === 'vimeo') {
    const id = getVimeoId(content.src);
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }
  return content.src; // direct / object URL
}

/** Detect provider from URL string */
function detectProvider(url: string): 'youtube' | 'vimeo' | 'direct' {
  if (/youtube\.com|youtu\.be/.test(url)) return 'youtube';
  if (/vimeo\.com/.test(url)) return 'vimeo';
  return 'direct';
}

export function VideoBlock({
  id,
  content,
  isSelected = false,
  onSelect,
}: VideoBlockProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const updateBlockContent = useDocumentStore((state) => state.updateBlockContent);
  const [urlMode, setUrlMode] = useState(false);
  const [urlValue, setUrlValue] = useState('');

  // ── Handle local file upload ──────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const src = URL.createObjectURL(file);
    updateBlockContent(id, { type: BlockType.VIDEO, src, provider: 'direct' });
    e.target.value = '';
  };

  // ── Handle URL submit ─────────────────────────────────────────────────────
  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlValue.trim();
    if (!trimmed) return;
    const provider = detectProvider(trimmed);
    updateBlockContent(id, { type: BlockType.VIDEO, src: trimmed, provider });
    setUrlMode(false);
    setUrlValue('');
  };

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

        <div className="w-full h-96 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center gap-6">
          <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm flex-shrink-0">
            <VideoPlus className="w-5 h-5 text-gray-400" />
          </div>

          {!urlMode ? (
            <div className="flex items-center gap-2 flex-wrap">
              {/* Upload local file */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm transition-colors shadow-sm"
              >
                <VideoPlus className="w-4 h-4" />
                Tải video lên
              </button>

              <span className="text-xs text-gray-400 font-medium">hoặc</span>

              {/* Enter URL */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setUrlMode(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:border-primary-400 hover:bg-primary-50 text-gray-700 hover:text-primary-700 font-semibold text-sm transition-colors"
              >
                <Link2 className="w-4 h-4" />
                Dán link YouTube / Vimeo
              </button>

              <p className="w-full text-xs text-gray-400 mt-0.5">Hỗ trợ: MP4, WebM · YouTube · Vimeo</p>
            </div>
          ) : (
            <form
              onSubmit={handleUrlSubmit}
              onClick={(e) => e.stopPropagation()}
              className="flex flex-1 gap-2"
            >
              <input
                autoFocus
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Xác nhận
              </button>
              <button
                type="button"
                onClick={() => { setUrlMode(false); setUrlValue(''); }}
                className="px-3 py-2 text-gray-500 hover:text-gray-700 text-sm rounded-lg hover:bg-gray-100 transition-colors"
              >
                Huỷ
              </button>
            </form>
          )}

          {/* remove old "Hỗ trợ" line — moved inside the !urlMode block above */}
        </div>
      </div>
    );
  }

  // ── Video player ──────────────────────────────────────────────────────────
  const embedUrl = getEmbedUrl(content);

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
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title="Video embed"
          />
        ) : embedUrl ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption
          <video
            src={embedUrl}
            className="absolute inset-0 w-full h-full"
            controls
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <p className="text-sm opacity-75">URL video không hợp lệ</p>
          </div>
        )}

        {/* Hover overlay with replace button */}
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
      </div>
    </div>
  );
}

export default VideoBlock;
