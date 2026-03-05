'use client';

/**
 * FillInBlankBlockEdit Component
 * ==============================
 * 
 * Edit mode component for creating fill-in-the-blank exercises.
 * Users write a sentence with [bracketed] words that become blanks.
 * 
 * Features:
 * - Input sentence with [bracket] syntax
 * - Auto-parse brackets to extract blanks
 * - Live preview showing blanks as underscores
 * - Hint text support for each blank
 * 
 * Example:
 * Input: "Java is a [programming] language used for [web] development."
 * Preview: "Java is a _________ language used for _____ development."
 * Blanks: ["programming", "web"]
 * 
 * Data Structure exported to .eduvi:
 * {
 *   type: 'FILL_BLANK',
 *   sentence: string,     // Original with brackets
 *   blanks: string[]      // Correct answers extracted
 * }
 */

import React, { useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { InteractiveWidgetProps } from './InteractiveWidgetRegistry';
import { 
  PenLine,
  Eye,
  AlertCircle,
  CheckCircle,
  Info,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface FillBlankData {
  sentence: string;
  blanks: string[];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extract bracketed words from a sentence
 * "[programming]" -> "programming"
 */
function extractBlanks(sentence: string): string[] {
  const regex = /\[([^\]]+)\]/g;
  const blanks: string[] = [];
  let match;
  while ((match = regex.exec(sentence)) !== null) {
    blanks.push(match[1]);
  }
  return blanks;
}

/**
 * Convert sentence to preview format with underscores
 * "[programming]" -> "_________"
 */
function sentenceToPreview(sentence: string): string {
  return sentence.replace(/\[([^\]]+)\]/g, (_, word) => {
    // Create underscores matching word length (min 5 chars)
    const length = Math.max(word.length, 5);
    return '_'.repeat(length);
  });
}

/**
 * Check if sentence has valid bracket syntax
 */
function validateSentence(sentence: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for unclosed brackets
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

  // Check for nested brackets
  if (/\[[^\]]*\[/.test(sentence)) {
    errors.push('Nested brackets are not supported');
  }

  // Check for empty brackets
  if (/\[\s*\]/.test(sentence)) {
    errors.push('Empty brackets [] are not allowed');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FillInBlankBlockEdit({ id, data, isSelected, onUpdate }: InteractiveWidgetProps) {
  const fillBlankData = data as unknown as FillBlankData;
  const sentence = fillBlankData?.sentence || '';

  // Extract blanks and create preview
  const blanks = useMemo(() => extractBlanks(sentence), [sentence]);
  const preview = useMemo(() => sentenceToPreview(sentence), [sentence]);
  const validation = useMemo(() => validateSentence(sentence), [sentence]);

  const handleSentenceChange = useCallback((value: string) => {
    const newBlanks = extractBlanks(value);
    onUpdate({ sentence: value, blanks: newBlanks });
  }, [onUpdate]);

  return (
    <div
      className={cn(
        'rounded-xl border-2 overflow-hidden bg-white',
        'transition-all duration-200',
        isSelected ? 'border-indigo-400 ring-2 ring-indigo-100' : 'border-gray-200'
      )}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-4">
        <div className="flex items-center gap-2">
          <PenLine className="w-5 h-5 text-white/80" />
          <span className="text-lg font-medium text-white/80 uppercase tracking-wide">
            Fill in the Blank
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Instructions */}
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-xm text-blue-700">
            Wrap words in <code className="px-1 py-0.5 bg-blue-100 rounded text-xs font-mono">[brackets]</code> to 
            create blanks. Students will need to fill in those words.
          </p>
        </div>

        {/* Input Area */}
        <div>
          <label className="block text-lg font-medium text-gray-700 mb-2">
            Sentence with Blanks
          </label>
          <textarea
            value={sentence}
            onChange={(e) => handleSentenceChange(e.target.value)}
            placeholder="Example: The [capital] of France is [Paris]."
            className={cn(
              'w-full px-4 py-3 text-base border rounded-lg',
              'focus:outline-none focus:ring-2',
              'resize-none font-mono',
              'placeholder:text-gray-400',
              validation.valid
                ? 'border-gray-200 focus:ring-emerald-500 focus:border-transparent'
                : 'border-red-300 focus:ring-red-500 focus:border-transparent bg-red-50'
            )}
            rows={3}
          />
          
          {/* Character count and bracket count */}
          <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
            <span>{sentence.length} characters</span>
            <span>{blanks.length} blank{blanks.length !== 1 ? 's' : ''} detected</span>
          </div>
        </div>

        {/* Validation Errors */}
        {!validation.valid && (
          <div className="p-3 bg-red-50 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 text-red-600 font-medium text-sm mb-1">
              <AlertCircle className="w-4 h-4" />
              Syntax Error
            </div>
            <ul className="list-disc list-inside text-xs text-red-600 space-y-0.5">
              {validation.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Preview Section */}
        {sentence && validation.valid && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-lg font-medium text-gray-700">
              <Eye className="w-4 h-4 text-gray-500" />
              Student Preview
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-lg leading-relaxed text-gray-700 whitespace-pre-wrap">
                {preview || 'Your preview will appear here...'}
              </p>
            </div>
          </div>
        )}

        {/* Extracted Blanks (Answers) */}
        {blanks.length > 0 && validation.valid && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-lg font-medium text-gray-700">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Correct Answers (Hidden from Students)
            </div>
            
            <div className="flex flex-wrap gap-2">
              {blanks.map((blank, idx) => (
                <div
                  key={idx}
                  className={cn(
                    'inline-flex items-center gap-1 px-3 py-1.5 rounded-lg',
                    'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  )}
                >
                  <span className="text-xs text-emerald-500 font-medium">
                    #{idx + 1}
                  </span>
                  <span className="font-medium">{blank}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!sentence && (
          <div className="text-center py-6 text-gray-400">
            <PenLine className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Start typing a sentence with [bracketed] words</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FillInBlankBlockEdit;
