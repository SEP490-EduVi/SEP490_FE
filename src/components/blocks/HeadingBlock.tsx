'use client';

/**
 * HeadingBlock Component
 * ======================
 * 
 * Rich text heading editor using Tiptap.
 * Supports formatting (bold, italic, color, etc.) via FloatingTextToolbar.
 * 
 * Features:
 * - Rich text editing with formatting toolbar
 * - Configurable heading level (H1-H6)
 * - Auto-growing height
 * - Floating toolbar when text is selected
 * - Content sync with Zustand store (debounced)
 */

import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import { cn } from '@/lib/utils';
import { useDocumentStore } from '@/store';
import { BlockType, IHeadingContent } from '@/types';
import { FloatingTextToolbar } from './FloatingTextToolbar';

interface HeadingBlockProps {
  id: string;
  content: IHeadingContent;
  isSelected?: boolean;
  onSelect?: () => void;
}

const headingStyles: Record<number, string> = {
  1: 'prose-h1:text-4xl prose-h1:font-bold',
  2: 'prose-h2:text-3xl prose-h2:font-bold',
  3: 'prose-h3:text-2xl prose-h3:font-semibold',
  4: 'prose-h4:text-xl prose-h4:font-semibold',
  5: 'prose-h5:text-lg prose-h5:font-medium',
  6: 'prose-h6:text-base prose-h6:font-medium',
};

export function HeadingBlock({
  id,
  content,
  isSelected = false,
  onSelect,
}: HeadingBlockProps) {
  const updateBlockContent = useDocumentStore((state) => state.updateBlockContent);
  const setEditingNodeId = useDocumentStore((state) => state.setEditingNodeId);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      Placeholder.configure({
        placeholder: 'Enter heading...',
        emptyEditorClass: 'is-editor-empty',
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
    ],
    content: content.html,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose max-w-none',
          'focus:outline-none',
          'min-h-[1.5em]',
          headingStyles[content.level],
          'prose-headings:font-semibold prose-headings:text-gray-900 prose-headings:mt-0 prose-headings:mb-1',
          'prose-strong:font-semibold',
          'prose-em:italic'
        ),
      },
    },
    onUpdate: ({ editor }) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(() => {
        const html = editor.getHTML();
        updateBlockContent(id, {
          type: BlockType.HEADING,
          html,
          level: content.level,
        });
      }, 500);
    },
    onFocus: () => {
      onSelect?.();
    },
    onSelectionUpdate: ({ editor }) => {
      const { from, to } = editor.state.selection;
      const hasSelection = from !== to;
      setShowToolbar(hasSelection);
      setEditingNodeId(hasSelection ? id : null);
    },
    onBlur: () => {
      setTimeout(() => {
        setShowToolbar(false);
        setEditingNodeId(null);
      }, 150);
    },
  });

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (editor && content.html !== editor.getHTML()) {
      editor.commands.setContent(content.html, false);
    }
  }, [editor, content.html]);

  // Set heading level when editor is ready
  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      editor.commands.setHeading({ level: content.level });
    }
  }, [editor, content.level]);

  return (
    <div
      className={cn(
        'relative rounded-lg',
        isSelected && !showToolbar && 'ring-2 ring-primary-500 ring-offset-2 ',
        'transition-all duration-200'
        
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onSelect?.();
        }
      }}
    >
      {editor && showToolbar && (
        <FloatingTextToolbar editor={editor} show={showToolbar} />
      )}

      <EditorContent
        editor={editor}
        className={cn(
          'w-full',
          'rounded-lg',
          'bg-white',
          'hover:bg-gray-50/50',
          'transition-colors duration-150'
        )}
      />
    </div>
  );
}

export default HeadingBlock;
