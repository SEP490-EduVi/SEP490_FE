'use client';

/**
 * FillInBlankBlock Component
 * ==========================
 * 
 * Refactored Fill-in-the-Blank block using Editor/Player pattern.
 * - FillInBlankEditor: Edit mode with [bracket] syntax
 * - FillInBlankPlayer: Interactive fill-in-the-blank exercise
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useDocumentStore, AppMode } from '@/store';
import {
  PenLine,
  Eye,
  Pencil,
  AlertCircle,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import { FillInBlankBlockEdit } from './FillInBlankBlockEdit';

// ============================================================================
// TYPES
// ============================================================================

interface FillBlankData {
  sentence: string;
  blanks: string[];
}

interface FillInBlankBlockProps {
  id: string;
  data: FillBlankData;
  isSelected?: boolean;
  onUpdate: (data: Partial<FillBlankData>) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function extractBlanks(sentence: string): string[] {
  const regex = /\[([^\]]+)\]/g;
  const blanks: string[] = [];
  let match;
  while ((match = regex.exec(sentence)) !== null) {
    blanks.push(match[1]);
  }
  return blanks;
}

function validateSentence(sentence: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  let openCount = 0;
  for (const char of sentence) {
    if (char === '[') openCount++;
    if (char === ']') openCount--;
    if (openCount < 0) {
      errors.push('Found closing bracket ] without opening bracket [');
      break;
    }
  }
  if (openCount > 0) {
    errors.push('Found opening bracket [ without closing bracket ]');
  }
  if (/\[[^\]]*\[/.test(sentence)) {
    errors.push('Nested brackets are not supported');
  }
  if (/\[\s*\]/.test(sentence)) {
    errors.push('Empty brackets [] are not allowed');
  }
  return { valid: errors.length === 0, errors };
}



// ============================================================================
// FILL IN BLANK PLAYER
// ============================================================================

interface FillInBlankPlayerProps {
  data: FillBlankData;
}

function FillInBlankPlayer({ data }: FillInBlankPlayerProps) {
  const sentence = data.sentence || '';
  const blanks = data.blanks || [];
  
  const [userAnswers, setUserAnswers] = useState<string[]>(blanks.map(() => ''));
  const [showResults, setShowResults] = useState(false);

  // Parse sentence into parts
  const parts = useMemo(() => {
    const result: { type: 'text' | 'blank'; content: string; index: number }[] = [];
    let lastIndex = 0;
    let blankIndex = 0;
    const regex = /\[([^\]]+)\]/g;
    let match;

    while ((match = regex.exec(sentence)) !== null) {
      if (match.index > lastIndex) {
        result.push({
          type: 'text',
          content: sentence.slice(lastIndex, match.index),
          index: -1,
        });
      }
      result.push({
        type: 'blank',
        content: match[1],
        index: blankIndex++,
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < sentence.length) {
      result.push({
        type: 'text',
        content: sentence.slice(lastIndex),
        index: -1,
      });
    }

    return result;
  }, [sentence]);

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[index] = value;
    setUserAnswers(newAnswers);
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  const handleReset = () => {
    setUserAnswers(blanks.map(() => ''));
    setShowResults(false);
  };

  const correctCount = userAnswers.filter(
    (answer, idx) => answer.toLowerCase().trim() === blanks[idx]?.toLowerCase().trim()
  ).length;

  if (blanks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <PenLine className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p>No blanks added yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sentence with Inputs */}
      <div className="text-lg leading-loose text-gray-800 p-4 bg-gray-50 rounded-lg">
        {parts.map((part, idx) => {
          if (part.type === 'text') {
            return <span key={idx}>{part.content}</span>;
          }

          const isCorrect = userAnswers[part.index]?.toLowerCase().trim() === blanks[part.index]?.toLowerCase().trim();

          return (
            <span key={idx} className="inline-block mx-1 align-middle">
              <input
                type="text"
                value={userAnswers[part.index] || ''}
                onChange={(e) => handleAnswerChange(part.index, e.target.value)}
                disabled={showResults}
                placeholder={`blank ${part.index + 1}`}
                className={cn(
                  'w-32 px-2 py-1 border-b-2 text-center font-medium',
                  'focus:outline-none transition-colors bg-transparent',
                  !showResults && 'border-emerald-400 focus:border-emerald-600',
                  showResults && isCorrect && 'border-green-500 text-green-700 bg-green-50',
                  showResults && !isCorrect && 'border-red-500 text-red-700 bg-red-50'
                )}
              />
              {showResults && !isCorrect && (
                <span className="ml-1 text-sm text-green-600">({blanks[part.index]})</span>
              )}
            </span>
          );
        })}
      </div>

      {/* Results */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              'flex items-center justify-between p-4 rounded-lg',
              correctCount === blanks.length
                ? 'bg-green-50 border border-green-200'
                : 'bg-yellow-50 border border-yellow-200'
            )}
          >
            <div className="flex items-center gap-3">
              {correctCount === blanks.length ? (
                <Trophy className="w-6 h-6 text-green-500" />
              ) : (
                <AlertCircle className="w-6 h-6 text-yellow-500" />
              )}
              <div>
                <p className="font-medium text-gray-800">
                  {correctCount === blanks.length
                    ? 'Perfect! All answers correct!'
                    : `${correctCount} of ${blanks.length} correct`}
                </p>
                <p className="text-sm text-gray-500">
                  {correctCount === blanks.length
                    ? 'Great job!'
                    : 'Check the green text for correct answers'}
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      {!showResults && (
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={userAnswers.some((a) => !a.trim())}
            className={cn(
              'px-6 py-2 rounded-lg font-medium transition-colors',
              userAnswers.some((a) => !a.trim())
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-emerald-500 text-white hover:bg-emerald-600'
            )}
          >
            Check Answers
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN FILL IN BLANK BLOCK
// ============================================================================

export function FillInBlankBlock({ id, data, isSelected, onUpdate }: FillInBlankBlockProps) {
  const appMode = useDocumentStore((state) => state.appMode);
  const [localMode, setLocalMode] = useState<'edit' | 'preview'>('edit');

  // In presentation mode, always show player
  const effectiveMode = appMode === 'PRESENT' ? 'preview' : localMode;

  if (effectiveMode === 'edit') {
    return (
      <div className="relative">
        <FillInBlankBlockEdit
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
        isSelected ? 'border-emerald-400 ring-2 ring-emerald-100' : 'border-gray-200'
      )}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenLine className="w-5 h-5 text-white/80" />
            <span className="text-lg font-medium text-white/80 uppercase tracking-wide">
              Fill in the Blank
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
        <FillInBlankPlayer data={data} />
      </div>
    </div>
  );
}

export default FillInBlankBlock;
