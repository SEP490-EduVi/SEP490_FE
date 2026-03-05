'use client';

/**
 * QuizBlockEdit Component
 * =======================
 * 
 * Edit mode component for creating/editing quiz questions.
 * Used in the Creator Tool (Web App).
 * 
 * Features:
 * - Add/remove questions
 * - Edit question text
 * - Add/remove options (A, B, C, D)
 * - Mark correct answer
 * - Add explanation for each question
 * 
 * Data Structure exported to .eduvi:
 * {
 *   type: 'QUIZ',
 *   title: string,
 *   questions: [{
 *     id: string,
 *     question: string,
 *     options: [{ id: string, text: string }],
 *     correctIndex: number,
 *     explanation?: string
 *   }]
 * }
 */

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { InteractiveWidgetProps } from './InteractiveWidgetRegistry';
import { IQuizQuestion, IQuizOption } from '@/types';
import { 
  CheckCircle, 
  Circle,
  GripVertical,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES
// ============================================================================

interface QuizData {
  title: string;
  questions: IQuizQuestion[];
}

// ============================================================================
// OPTION LABELS
// ============================================================================

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

// ============================================================================
// SINGLE QUESTION EDITOR
// ============================================================================

interface QuestionEditorProps {
  question: IQuizQuestion;
  index: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (question: IQuizQuestion) => void;
}

function QuestionEditor({
  question,
  index,
  isExpanded,
  onToggleExpand,
  onUpdate,
}: QuestionEditorProps) {
  
  const handleQuestionTextChange = (text: string) => {
    onUpdate({ ...question, question: text });
  };

  const handleOptionChange = (optionIndex: number, text: string) => {
    const newOptions = [...question.options];
    newOptions[optionIndex] = { ...newOptions[optionIndex], text };
    onUpdate({ ...question, options: newOptions });
  };

  const handleCorrectIndexChange = (index: number) => {
    onUpdate({ ...question, correctIndex: index });
  };

  const handleExplanationChange = (explanation: string) => {
    onUpdate({ ...question, explanation: explanation || undefined });
  };

  return (
    <div className={cn(
      'border rounded-lg overflow-hidden transition-all duration-200',
      isExpanded ? 'border-indigo-300 bg-white' : 'border-gray-200 bg-gray-50'
    )}>

      {/* Question Body (Expanded) */}
      {isExpanded && (
        <div className="p-4 pt-2 space-y-4">
          {/* Question Text */}
          <div>
            <label className="block text-lg font-medium text-gray-600 mb-1">
              Question
            </label>
            <textarea
              value={question.question}
              onChange={(e) => handleQuestionTextChange(e.target.value)}
              placeholder="Enter your question here..."
              className={cn(
                'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                'resize-none'
              )}
              rows={2}
            />
          </div>

          {/* Options */}
          <div>
            <label className="block text-lg font-medium text-gray-600 mb-2">
              Options (click to mark correct answer)
            </label>
            <div className="space-y-2">
              {question.options.map((option, optIndex) => (
                <div key={option.id} className="flex items-center gap-2">
                  {/* Correct Answer Radio */}
                  <button
                    onClick={() => handleCorrectIndexChange(optIndex)}
                    className={cn(
                      'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                      'transition-all duration-150',
                      question.correctIndex === optIndex
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    )}
                    title={question.correctIndex === optIndex ? 'Correct answer' : 'Mark as correct'}
                  >
                    {question.correctIndex === optIndex ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>

                  {/* Option Label */}
                  <span className="flex-shrink-0 w-6 text-sm font-medium text-gray-500">
                    {OPTION_LABELS[optIndex]}.
                  </span>

                  {/* Option Input */}
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => handleOptionChange(optIndex, e.target.value)}
                    placeholder={`Option ${OPTION_LABELS[optIndex]}`}
                    className={cn(
                      'flex-1 px-3 py-2 text-sm border rounded-lg',
                      'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                      question.correctIndex === optIndex
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-200'
                    )}
                  />


                </div>
              ))}
            </div>


          </div>

          {/* Explanation (Optional) */}
          <div>
            <label className="flex items-center gap-1 text-lg font-medium text-gray-600 mb-1">
              <Lightbulb className="w-3 h-3" />
              Explanation (optional)
            </label>
            <textarea
              value={question.explanation || ''}
              onChange={(e) => handleExplanationChange(e.target.value)}
              placeholder="Explain why this answer is correct..."
              className={cn(
                'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg',
                'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
                'resize-none'
              )}
              rows={2}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function QuizBlockEdit({ id, data, isSelected, onUpdate }: InteractiveWidgetProps) {
  const quizData = data as unknown as QuizData;
  const [expandedQuestionIndex, setExpandedQuestionIndex] = useState<number | null>(0);

  // Initialize with default data if empty
  const questions: IQuizQuestion[] = quizData?.questions || [
    {
      id: uuidv4(),
      question: '',
      options: [
        { id: uuidv4(), text: '' },
        { id: uuidv4(), text: '' },
        { id: uuidv4(), text: '' },
        { id: uuidv4(), text: '' },
      ],
      correctIndex: 0,
    }
  ];

  const handleQuestionUpdate = useCallback((index: number, updatedQuestion: IQuizQuestion) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    onUpdate({ ...quizData, questions: newQuestions });
  }, [quizData, questions, onUpdate]);


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
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-white/80" />
          <span className="text-lg font-medium text-white/80 uppercase tracking-wide">
            Quiz Block
          </span>
        </div>

      </div>

      {/* Questions List */}
      <div className="p-4 space-y-3">
        {questions.map((question, index) => (
          <QuestionEditor
            key={question.id}
            question={question}
            index={index}
            isExpanded={expandedQuestionIndex === index}
            onToggleExpand={() => setExpandedQuestionIndex(
              expandedQuestionIndex === index ? null : index
            )}
            onUpdate={(q) => handleQuestionUpdate(index, q)}
          />
        ))}
      </div>
    </div>
  );
}

export default QuizBlockEdit;
