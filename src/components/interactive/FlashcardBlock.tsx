'use client';

/**
 * FlashcardBlock Component
 * ========================
 * 
 * Refactored Flashcard block using Editor/Player pattern.
 * - FlashcardEditor: Edit mode for front/back content
 * - FlashcardPlayer: Interactive flip card with animation
 * 
 * Uses framer-motion for smooth 3D flip animation.
 */

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useDocumentStore, AppMode } from '@/store';
import {
  Layers,
  Eye,
  Pencil,
  RotateCcw,
} from 'lucide-react';
import { FlashcardBlockEdit } from './FlashcardBlockEdit';

// ============================================================================
// TYPES
// ============================================================================

interface FlashcardData {
  front: string;
  back: string;
}

interface FlashcardBlockProps {
  id: string;
  data: FlashcardData;
  isSelected?: boolean;
  onUpdate: (data: Partial<FlashcardData>) => void;
}



// ============================================================================
// FLASHCARD PLAYER
// ============================================================================

interface FlashcardPlayerProps {
  data: FlashcardData;
}

function FlashcardPlayer({ data }: FlashcardPlayerProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const front = data.front || 'No front content';
  const back = data.back || 'No back content';

  const handleFlip = () => setIsFlipped(!isFlipped);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Card Container with perspective */}
      <div
        className="relative w-full cursor-pointer"
        style={{ perspective: '1000px' }}
        onClick={handleFlip}
      >
        <motion.div
          className="relative w-full"
          initial={false}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front Face */}
          <motion.div
            className={cn(
              'w-full min-h-[200px] rounded-xl p-6',
              'bg-gradient-to-br from-amber-50 to-orange-50',
              'border-2 border-amber-200',
              'flex flex-col items-center justify-center text-center',
              'shadow-lg'
            )}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full mb-3">
              FRONT
            </span>
            <p className="text-xl font-medium text-gray-800 leading-relaxed">
              {front}
            </p>
            <p className="text-xs text-gray-400 mt-4">Click to flip</p>
          </motion.div>

          {/* Back Face */}
          <motion.div
            className={cn(
              'absolute inset-0 w-full min-h-[200px] rounded-xl p-6',
              'bg-gradient-to-br from-orange-50 to-red-50',
              'border-2 border-orange-200',
              'flex flex-col items-center justify-center text-center',
              'shadow-lg'
            )}
            style={{ 
              backfaceVisibility: 'hidden',
              rotateY: '180deg',
              transform: 'rotateY(180deg)'
            }}
          >
            <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full mb-3">
              BACK
            </span>
            <p className="text-xl font-medium text-gray-800 leading-relaxed">
              {back}
            </p>
            <p className="text-xs text-gray-400 mt-4">Click to flip back</p>
          </motion.div>
        </motion.div>
      </div>

      {/* Reset Button */}
      <button
        onClick={() => setIsFlipped(false)}
        className={cn(
          'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
          'bg-gray-100 hover:bg-gray-200 text-gray-600',
          'transition-colors text-sm font-medium'
        )}
      >
        <RotateCcw className="w-4 h-4" />
        Reset Card
      </button>
    </div>
  );
}

// ============================================================================
// MAIN FLASHCARD BLOCK
// ============================================================================

export function FlashcardBlock({ id, data, isSelected, onUpdate }: FlashcardBlockProps) {
  const appMode = useDocumentStore((state) => state.appMode);
  const [localMode, setLocalMode] = useState<'edit' | 'preview'>('edit');

  // In presentation mode, always show player
  const effectiveMode = appMode === 'PRESENT' ? 'preview' : localMode;

  if (effectiveMode === 'edit') {
    return (
      <div className="relative">
        <FlashcardBlockEdit
          id={id}
          data={data as unknown as Record<string, unknown>}
          isSelected={isSelected}
          onUpdate={onUpdate as (data: Record<string, unknown>) => void}
        />
        {appMode === 'EDITOR' && (
          <button
            onClick={() => setLocalMode('preview')}
            className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl border-2 overflow-hidden bg-white',
        'transition-all duration-200',
        isSelected ? 'border-amber-400 ring-2 ring-amber-100' : 'border-gray-200'
      )}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-white/80" />
            <span className="text-xs font-medium text-white/80 uppercase tracking-wide">
              Flashcard Block
            </span>
          </div>
          {appMode === 'EDITOR' && (
            <button
              onClick={() => setLocalMode('edit')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
      </div>
      {/* Content */}
      <div className="p-4">
        <FlashcardPlayer data={data} />
      </div>
    </div>
  );
}

export default FlashcardBlock;
