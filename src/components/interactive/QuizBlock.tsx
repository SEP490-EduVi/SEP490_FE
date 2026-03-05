'use client';

/**
 * QuizBlock Component
 * ===================
 * 
 * Refactored Quiz block using Editor/Player pattern.
 * - QuizEditor: Edit mode for creating/modifying quiz questions
 * - QuizPlayer: Interactive view for answering questions
 * 
 * The main component handles mode switching and provides
 * a Preview/Edit toggle button in Editor mode.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useDocumentStore } from '@/store';
import {
  HelpCircle,
  Check,
  X,
  Eye,
  Pencil,
  RotateCcw,
  Trophy,
  ChevronRight,
} from 'lucide-react';
import { QuizBlockEdit } from './QuizBlockEdit';

// ============================================================================
// TYPES
// ============================================================================

interface QuizQuestion {
  id: string;
  question: string;
  options: { id: string; text: string }[];
  correctIndex: number;
  explanation?: string;
}

interface QuizData {
  title: string;
  questions: QuizQuestion[];
}

interface QuizBlockProps {
  id: string;
  data: QuizData;
  isSelected?: boolean;
  onUpdate: (data: Partial<QuizData>) => void;
}

// ============================================================================
// QUIZ PLAYER
// ============================================================================

interface QuizPlayerProps {
  data: QuizData;
}

function QuizPlayer({ data }: QuizPlayerProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const questions = data.questions || [];
  const title = data.title || 'Quiz';
  const question = questions[currentQuestion];
  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  const handleSelectAnswer = (index: number) => {
    if (showResult) return;
    setSelectedAnswer(index);
  };

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    setShowResult(true);
    if (selectedAnswer === question.correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((c) => c + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setIsComplete(true);
    }
  };

  const handleRestart = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setIsComplete(false);
  };

  if (questions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p>No questions added yet</p>
      </div>
    );
  }

  if (isComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
        >
          <Trophy className={cn(
            'w-16 h-16 mx-auto mb-4',
            percentage >= 70 ? 'text-yellow-500' : 'text-gray-400'
          )} />
        </motion.div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Quiz Complete!</h3>
        <p className="text-lg text-gray-600 mb-4">
          You scored <span className="font-bold text-indigo-600">{score}</span> out of{' '}
          <span className="font-bold">{questions.length}</span>
        </p>
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4 max-w-xs mx-auto">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className={cn(
              'h-3 rounded-full',
              percentage >= 70 ? 'bg-green-500' : percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
            )}
          />
        </div>
        <button
          onClick={handleRestart}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Try Again
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <span className="text-sm text-gray-500">
          {currentQuestion + 1} / {questions.length}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-1.5">
        <div
          className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
        />
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <p className="text-lg font-medium text-gray-800 mb-4">{question.question}</p>

          {/* Options */}
          <div className="space-y-2">
            {question.options.map((option, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = index === question.correctIndex;
              const showCorrect = showResult && isCorrect;
              const showWrong = showResult && isSelected && !isCorrect;

              return (
                <motion.button
                  key={option.id}
                  whileHover={!showResult ? { scale: 1.01 } : {}}
                  whileTap={!showResult ? { scale: 0.99 } : {}}
                  onClick={() => handleSelectAnswer(index)}
                  disabled={showResult}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left transition-all',
                    !showResult && !isSelected && 'border-gray-200 hover:border-indigo-300 hover:bg-indigo-50',
                    !showResult && isSelected && 'border-indigo-500 bg-indigo-50',
                    showCorrect && 'border-green-500 bg-green-50',
                    showWrong && 'border-red-500 bg-red-50'
                  )}
                >
                  <span
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                      !showResult && !isSelected && 'bg-gray-100 text-gray-600',
                      !showResult && isSelected && 'bg-indigo-500 text-white',
                      showCorrect && 'bg-green-500 text-white',
                      showWrong && 'bg-red-500 text-white'
                    )}
                  >
                    {showCorrect ? (
                      <Check className="w-4 h-4" />
                    ) : showWrong ? (
                      <X className="w-4 h-4" />
                    ) : (
                      optionLabels[index]
                    )}
                  </span>
                  <span className="flex-1">{option.text}</span>
                </motion.button>
              );
            })}
          </div>

          {/* Explanation */}
          {showResult && question.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700"
            >
              <strong>Explanation:</strong> {question.explanation}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        {!showResult ? (
          <button
            onClick={handleSubmit}
            disabled={selectedAnswer === null}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors',
              selectedAnswer === null
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-indigo-500 text-white hover:bg-indigo-600'
            )}
          >
            Check Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            {currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN QUIZ BLOCK
// ============================================================================

export function QuizBlock({ id, data, isSelected, onUpdate }: QuizBlockProps) {
  const appMode = useDocumentStore((state) => state.appMode);
  const [localMode, setLocalMode] = useState<'edit' | 'preview'>('edit');

  // In presentation mode, always show player
  const effectiveMode = appMode === 'PRESENT' ? 'preview' : localMode;

  if (effectiveMode === 'edit') {
    return (
      <div className="relative">
        <QuizBlockEdit
          id={id}
          data={data as unknown as Record<string, unknown>}
          isSelected={isSelected}
          onUpdate={(d) => onUpdate(d as Partial<QuizData>)}
        />
        {appMode === 'EDITOR' && (
          <button
            onClick={() => setLocalMode('preview')}
            className={cn(
              'absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium',
              'bg-white/20 hover:bg-white/30 text-white transition-colors'
            )}
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
        isSelected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-gray-200'
      )}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-white/80" />
            <span className="text-xs font-medium text-white/80 uppercase tracking-wide">
              Quiz Block
            </span>
          </div>
          {appMode === 'EDITOR' && (
            <button
              onClick={() => setLocalMode('edit')}
              className={cn(
                'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium',
                'bg-white/20 hover:bg-white/30 text-white transition-colors'
              )}
            >
              <Pencil className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
      </div>
      {/* Content */}
      <div className="p-4">
        <QuizPlayer data={data} />
      </div>
    </div>
  );
}

export default QuizBlock;
