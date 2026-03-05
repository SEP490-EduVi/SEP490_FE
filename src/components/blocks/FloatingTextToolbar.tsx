'use client';

/**
 * FloatingTextToolbar Component
 * ==============================
 * 
 * Floating formatting toolbar for Tiptap editor.
 * Appears when text is being edited.
 * 
 * Features:
 * - Bold, Italic, Underline, Strikethrough
 * - Text alignment (left, center, right, justify)
 * - Text color picker
 * - Heading levels
 * - Lists (bullet, ordered)
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Editor } from '@tiptap/react';
import { cn } from '@/lib/utils';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Palette,
} from 'lucide-react';

interface FloatingTextToolbarProps {
  editor: Editor;
  show: boolean;
}

const TEXT_COLORS = [
  { name: 'Default', value: '#000000' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Indigo', value: '#6366f1' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
];

export function FloatingTextToolbar({ editor, show }: FloatingTextToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  if (!show) return null;

  const editorDom = editor.view.dom as HTMLElement;
  const rect = editorDom.getBoundingClientRect();
  const toolbarTop = Math.max(8, rect.top - 60);
  const toolbarLeft = rect.left;

  return createPortal(
    <div
      className={cn(
        'fixed z-[9999]',
        'flex items-center gap-1 px-2 py-2',
        'bg-white rounded-lg shadow-xl border border-gray-200',
        'animate-in fade-in slide-in-from-top-2 duration-200'
      )}
      style={{ top: toolbarTop, left: toolbarLeft }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => {
        e.preventDefault();
      }}
    >
      {/* Text Formatting */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => (editor.chain().focus() as any).toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Text Alignment */}
      <div className="flex items-center gap-0.5 px-2 border-r border-gray-200">
        <ToolbarButton
          onClick={() => (editor.chain().focus() as any).setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => (editor.chain().focus() as any).setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => (editor.chain().focus() as any).setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => (editor.chain().focus() as any).setTextAlign('justify').run()}
          isActive={editor.isActive({ textAlign: 'justify' })}
          title="Justify"
        >
          <AlignJustify className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Headings */}
      <div className="flex items-center gap-0.5 px-2 border-r border-gray-200">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Lists */}
      <div className="flex items-center gap-0.5 px-2 border-r border-gray-200">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
      </div>

      {/* Text Color */}
      <div className="relative pl-2">
        <ToolbarButton
          onClick={() => setShowColorPicker(!showColorPicker)}
          isActive={showColorPicker}
          title="Text Color"
        >
          <Palette className="w-4 h-4" />
        </ToolbarButton>

        {/* Color Picker Dropdown */}
        {showColorPicker && (
          <div
            className={cn(
              'absolute top-full left-0 mt-2 z-50',
              'bg-white rounded-lg shadow-xl border border-gray-200 p-3',
              'animate-in fade-in slide-in-from-top-2 duration-200 w-28'
            )}
          >
            <div className="grid grid-cols-3 gap-1">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => {
                    (editor.chain().focus() as any).setColor(color.value).run();
                    setShowColorPicker(false);
                  }}
                  className={cn(
                    'w-6 h-6 rounded border-2 transition-all',
                    'hover:scale-110 hover:shadow-md',
                    editor.isActive('textStyle', { color: color.value })
                      ? 'border-indigo-500 ring-2 ring-indigo-200'
                      : 'border-gray-300'
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  title?: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, title, children }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'p-1.5 rounded transition-colors',
        isActive
          ? 'bg-indigo-100 text-indigo-600'
          : 'hover:bg-gray-100 text-gray-600'
      )}
    >
      {children}
    </button>
  );
}

export default FloatingTextToolbar;
