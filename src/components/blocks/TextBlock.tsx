'use client';

/**
 * TextBlock Component
 * ===================
 * 
 * Rich text editor block using Tiptap.
 * Implements the "Gamma Reflow" logic - content expands naturally
 * and pushes siblings down using standard CSS flow.
 * 
 * Features:
 * - Rich text editing (bold, italic, underline, color, alignment, etc.)
 * - Auto-growing height (no fixed height)
 * - Placeholder text for empty blocks
 * - Floating toolbar when editing
 * - Content sync with Zustand store (debounced for performance)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import { ColoredListItem } from './extensions/coloredListItem';
import { cn } from '@/lib/utils';
import { useDocumentStore } from '@/store';
import { BlockType, ITextContent } from '@/types';
import { FloatingTextToolbar } from './FloatingTextToolbar';

interface TextBlockProps {
  id: string;
  content: ITextContent;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function TextBlock({
  id,
  content,
  isSelected = false,
  onSelect,
}: TextBlockProps) {
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
        placeholder: 'Start typing...',
        emptyEditorClass: 'is-editor-empty',
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Color,
      FontFamily,
      ColoredListItem,
    ],
    content: content.html,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm sm:prose max-w-none',
          'focus:outline-none',
          'min-h-[1.5em]', // Minimum height for empty state
          // Prose customizations
          'prose-p:my-2 prose-p:leading-relaxed',
          'prose-headings:font-semibold prose-headings:text-gray-900',
          'prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg',
          'prose-ul:my-2 prose-ol:my-2',
          'prose-li:my-0',
          'prose-strong:font-semibold',
          'prose-em:italic'
        ),
      },
    },
    onUpdate: ({ editor }) => {
      // Debounce content updates to avoid creating too many history entries
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      debounceTimerRef.current = setTimeout(() => {
        const html = editor.getHTML();
        updateBlockContent(id, {
          type: BlockType.TEXT,
          html,
        });
      }, 500); // Wait 500ms after user stops typing
    },
    onFocus: () => {
      setShowToolbar(true);
      setEditingNodeId(id);
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

  // Clean up debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Update editor content when prop changes (e.g., undo/redo)
  useEffect(() => {
    if (editor && content.html !== editor.getHTML()) {
      editor.commands.setContent(content.html, false);
    }
  }, [editor, content.html]);

  return (
    <div
      className={cn(
        'relative',
        'transition-all duration-200'
      )}
      onClick={(e) => {
        // Only select block if clicking outside the editor content
        if (e.target === e.currentTarget) {
          onSelect?.();
        }
      }}
    >
      {/* Floating Text Toolbar - shows when editing or has selection */}
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
          'transition-colors duration-150',
          isSelected && !showToolbar && 'ring-2 ring-primary-500 ring-offset-2'
        )}
      />
    </div>
  );
}

export default TextBlock;
