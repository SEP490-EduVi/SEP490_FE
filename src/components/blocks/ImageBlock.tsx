'use client';

/**
 * ImageBlock Component
 * ====================
 * 
 * Displays an image with optional caption.
 * Supports responsive sizing and lazy loading.
 */

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { IImageContent } from '@/types';

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
  return (
    <figure
      className={cn(
        'relative group rounded-lg overflow-hidden',
        'transition-all duration-200',
        isSelected && 'ring-2 ring-primary-500 ring-offset-2'
      )}
      onClick={onSelect}
    >
      <div className="relative w-full aspect-video bg-gray-100">
        {/* Using standard img tag for external URLs */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={content.src}
          alt={content.alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
      </div>
      
      {content.caption && (
        <figcaption className=" text-sm text-gray-600 text-center bg-gray-50">
          {content.caption}
        </figcaption>
      )}
    </figure>
  );
}

export default ImageBlock;
