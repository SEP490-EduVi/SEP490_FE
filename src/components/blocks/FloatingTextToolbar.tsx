'use client';

/**
 * ContextualTextToolbar
 * =====================
 *
 * Fixed bar rendered at "Row 2" position inside the Toolbar.
 * - Always visible as a white strip with bottom border.
 * - Formatting tools + Màu nền appear ONLY when text is highlighted.
 * - Reads the active Tiptap editor from activeEditorStore (module-level ref).
 * - Includes BgColorPicker that previously lived in Toolbar Row 2.
 */

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { useActiveEditorStore, getActiveEditor } from '@/store/activeEditorStore';
import { useDocumentStore } from '@/store';
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
  Minus,
  Plus,
  Palette,
  ChevronDown,
  Type,
} from 'lucide-react';

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 60, 72];

// ============================================================================
// SLIDE BACKGROUND COLORS  (moved from Toolbar.tsx)
// ============================================================================

const SLIDE_BG_COLORS = [
  { label: 'Trắng', value: '#ffffff' },
  { label: 'Xám nhạt', value: '#f8fafc' },
  { label: 'Vàng nhạt', value: '#fefce8' },
  { label: 'Xanh nhạt', value: '#eff6ff' },
  { label: 'Hồng nhạt', value: '#fff1f2' },
  { label: 'Xanh lá', value: '#f0fdf4' },
  { label: 'Tím nhạt', value: '#faf5ff' },
  { label: 'Cam nhạt', value: '#fff7ed' },
  { label: 'Đen', value: '#0f172a' },
  { label: 'Xám đậm', value: '#1e293b' },
  { label: 'Xanh đậm', value: '#1e3a5f' },
  { label: 'Đỏ đậm', value: '#7f1d1d' },
];

function BgColorPicker({
  currentColor,
  onApplyCurrent,
  onApplyAll,
}: {
  currentColor: string;
  onApplyCurrent: (color: string) => void;
  onApplyAll: (color: string) => void;
}) {
  const [selected, setSelected] = useState(currentColor || '#ffffff');

  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Màu nền slide</p>
      <div className="grid grid-cols-6 gap-1.5">
        {SLIDE_BG_COLORS.map((c) => (
          <button
            key={c.value}
            title={c.label}
            onClick={() => setSelected(c.value)}
            className={cn(
              'w-7 h-7 rounded border-2 transition-all hover:scale-110',
              selected === c.value ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
            )}
            style={{ backgroundColor: c.value }}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-gray-500 flex-shrink-0">Tuỳ chỉnh:</label>
        <input
          type="color"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-7 h-7 rounded border border-gray-200 cursor-pointer p-0 flex-shrink-0"
        />
        <span className="text-xs text-gray-400 font-mono truncate">{selected}</span>
      </div>
      <div className="flex gap-2 pt-1 border-t border-gray-100">
        <button
          onClick={() => onApplyCurrent(selected)}
          className="flex-1 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors"
        >
          Slide này
        </button>
        <button
          onClick={() => onApplyAll(selected)}
          className="flex-1 py-1.5 rounded-lg bg-slate-700 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
        >
          Tất cả
        </button>
      </div>
    </div>
  );
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

const FONT_FAMILIES = [
  { label: 'Mặc định', value: '' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
];

// ============================================================================
// TOOLBAR BUTTON
// ============================================================================

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  title?: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, title, children }: ToolbarButtonProps) {
  return (
    <button
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      title={title}
      className={cn(
        'p-1.5 rounded transition-colors',
        isActive ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-600'
      )}
    >
      {children}
    </button>
  );
}

// ============================================================================
// CONTEXTUAL TEXT TOOLBAR — floating centered portal, appears on text selection
// ============================================================================

/**
 * Renders as a fixed centered floating bar near the top of the editor stage.
 * Appears only when text is highlighted; hidden otherwise.
 * Uses createPortal to escape parent stacking contexts (z-index issues).
 */
export function ContextualTextToolbar() {
  const hasSelection = useActiveEditorStore((state) => state.hasSelection);
  // Subscribe to editorVersion so the bar re-renders on every editor transaction
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ver = useActiveEditorStore((state) => state.editorVersion);
  const editor = getActiveEditor();

  const activeCardId = useDocumentStore((state) => state.activeCardId);
  const doc = useDocumentStore((state) => state.document);
  const setCardBackground = useDocumentStore((state) => state.setCardBackground);
  const activeCard = doc?.cards.find((c) => c.id === activeCardId);
  const currentBgColor = activeCard?.backgroundColor ?? '';

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showFontFamily, setShowFontFamily] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [fontSizeInput, setFontSizeInput] = useState('');
  const bgButtonRef = useRef<HTMLButtonElement>(null);
  const bgPickerRef = useRef<HTMLDivElement>(null);
  const [bgPickerPos, setBgPickerPos] = useState({ top: 0, left: 0 });
  const fontFamilyButtonRef = useRef<HTMLButtonElement>(null);
  const fontFamilyPickerRef = useRef<HTMLDivElement>(null);
  const [fontFamilyPos, setFontFamilyPos] = useState({ top: 0, left: 0 });
  const colorPickerButtonRef = useRef<HTMLButtonElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const [colorPickerPos, setColorPickerPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        bgPickerRef.current && !bgPickerRef.current.contains(e.target as Node) &&
        bgButtonRef.current && !bgButtonRef.current.contains(e.target as Node)
      ) {
        setShowBgPicker(false);
      }
    };
    if (showBgPicker) window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [showBgPicker]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        fontFamilyPickerRef.current && !fontFamilyPickerRef.current.contains(e.target as Node) &&
        fontFamilyButtonRef.current && !fontFamilyButtonRef.current.contains(e.target as Node)
      ) {
        setShowFontFamily(false);
      }
    };
    if (showFontFamily) window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [showFontFamily]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node) &&
        colorPickerButtonRef.current && !colorPickerButtonRef.current.contains(e.target as Node)
      ) {
        setShowColorPicker(false);
      }
    };
    if (showColorPicker) window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, [showColorPicker]);

  // Close all dropdowns when selection disappears
  useEffect(() => {
    if (!hasSelection) {
      setShowColorPicker(false);
      setShowFontFamily(false);
      setShowBgPicker(false);
      setShowSizeDropdown(false);
    }
  }, [hasSelection]);

  const show = hasSelection && editor !== null;

  // ── Font size helpers ──────────────────────────────────────────────────────
  const rawFontSize: string = show && editor
    ? ((editor.getAttributes('textStyle') as Record<string, string>).fontSize ?? '')
    : '';
  // rawFontSize is like "24px" — strip unit for display
  const displaySize = rawFontSize ? rawFontSize.replace(/[^0-9.]/g, '') : '16';

  function applyFontSize(sizeStr: string) {
    const n = parseInt(sizeStr, 10);
    if (isNaN(n) || n < 1 || n > 999 || !editor) return;
    (editor.chain().focus() as any).setFontSize(`${n}px`).run();
  }

  function stepFontSize(delta: number) {
    const current = parseInt(displaySize, 10) || 16;
    const next = Math.max(6, Math.min(999, current + delta));
    applyFontSize(String(next));
  }

  // ── Font family helpers ────────────────────────────────────────────────────
  const currentFont = show && editor ? ((editor.getAttributes('textStyle') as Record<string, string>).fontFamily || '') : '';
  const currentFontLabel = FONT_FAMILIES.find((f) => f.value === currentFont)?.label || 'Mặc định';

  if (!show || typeof window === 'undefined') return null;

  return createPortal(
    <div
      className={cn(
        'fixed z-[9999] flex items-center gap-0.5 px-3 py-1.5',
        'bg-white rounded-xl shadow-xl border border-gray-200',
        'animate-in fade-in slide-in-from-top-1 duration-150',
        'max-w-[calc(100vw-2rem)] overflow-x-auto',
      )}
      style={{ top: 64, left: '50%', transform: 'translateX(-50%)' }}
    >
      {/* ── Font Family ──────────────────────────────────────────── */}
      <div className="pr-2 border-r border-gray-200">
        <button
          ref={fontFamilyButtonRef}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (!showFontFamily && fontFamilyButtonRef.current) {
              const rect = fontFamilyButtonRef.current.getBoundingClientRect();
              setFontFamilyPos({ top: rect.bottom + 4, left: rect.left });
            }
            setShowFontFamily((v) => !v);
            setShowColorPicker(false);
            setShowBgPicker(false);
            setShowSizeDropdown(false);
          }}
          className={cn(
            'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors min-w-[80px]',
            showFontFamily ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-600'
          )}
          title="Font chữ"
        >
          <Type className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate max-w-[56px]">{currentFontLabel}</span>
          <ChevronDown className="w-3 h-3 flex-shrink-0" />
        </button>
      </div>
      {showFontFamily && createPortal(
        <div
          ref={fontFamilyPickerRef}
          className="fixed z-[10000] bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-44 animate-in fade-in slide-in-from-top-2 duration-150"
          style={{ top: fontFamilyPos.top, left: fontFamilyPos.left }}
        >
          {FONT_FAMILIES.map((font) => (
            <button
              key={font.label}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (font.value) (editor.chain().focus() as any).setFontFamily(font.value).run();
                else (editor.chain().focus() as any).unsetFontFamily().run();
                setShowFontFamily(false);
              }}
              className={cn(
                'w-full text-left px-3 py-1.5 text-sm transition-colors',
                currentFont === font.value ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50 text-gray-700'
              )}
              style={{ fontFamily: font.value || 'inherit' }}
            >
              {font.label}
            </button>
          ))}
        </div>,
        globalThis.document.body
      )}

      {/* ── Font Size ────────────────────────────────────────────── */}
      <div className="relative flex items-center gap-0.5 px-2 border-r border-gray-200">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => stepFontSize(-1)}
          className="p-1 rounded hover:bg-gray-100 text-gray-600 transition-colors"
          title="Giảm cỡ chữ"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <div className="relative">
          <input
            type="text"
            value={fontSizeInput !== '' ? fontSizeInput : displaySize}
            onFocus={(e) => { e.target.select(); setFontSizeInput(displaySize); setShowSizeDropdown(true); }}
            onChange={(e) => setFontSizeInput(e.target.value.replace(/[^0-9]/g, ''))}
            onBlur={() => {
              if (fontSizeInput) applyFontSize(fontSizeInput);
              setFontSizeInput('');
              setTimeout(() => setShowSizeDropdown(false), 150);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { applyFontSize(fontSizeInput || displaySize); setFontSizeInput(''); setShowSizeDropdown(false); (e.target as HTMLInputElement).blur(); }
              if (e.key === 'Escape') { setFontSizeInput(''); setShowSizeDropdown(false); (e.target as HTMLInputElement).blur(); }
            }}
            className="w-10 text-center text-xs border border-gray-200 rounded px-1 py-0.5 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
          />
          {showSizeDropdown && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 w-16 max-h-52 overflow-y-auto animate-in fade-in duration-100">
              {FONT_SIZES.map((size) => (
                <button
                  key={size}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { applyFontSize(String(size)); setShowSizeDropdown(false); setFontSizeInput(''); }}
                  className={cn(
                    'w-full text-center px-2 py-1 text-xs transition-colors',
                    displaySize === String(size) ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'hover:bg-gray-50 text-gray-700'
                  )}
                >
                  {size}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => stepFontSize(1)}
          className="p-1 rounded hover:bg-gray-100 text-gray-600 transition-colors"
          title="Tăng cỡ chữ"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Text Formatting ──────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 pr-2 border-r border-gray-200">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="In đậm (Ctrl+B)"><Bold className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="In nghiêng (Ctrl+I)"><Italic className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => (editor.chain().focus() as any).toggleUnderline().run()} isActive={editor.isActive('underline')} title="Gạch chân (Ctrl+U)"><Underline className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Gạch ngang"><Strikethrough className="w-4 h-4" /></ToolbarButton>
      </div>

      {/* ── Text Alignment ────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 px-2 border-r border-gray-200">
        <ToolbarButton onClick={() => (editor.chain().focus() as any).setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Canh trái"><AlignLeft className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => (editor.chain().focus() as any).setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Canh giữa"><AlignCenter className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => (editor.chain().focus() as any).setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Canh phải"><AlignRight className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton onClick={() => (editor.chain().focus() as any).setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} title="Đều hai đầu"><AlignJustify className="w-4 h-4" /></ToolbarButton>
      </div>

      {/* ── Lists ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-0.5 px-2 border-r border-gray-200">
        <ToolbarButton
          onClick={() => {
            if (editor.isActive('orderedList')) editor.chain().focus().toggleOrderedList().run();
            editor.chain().focus().toggleBulletList().run();
          }}
          isActive={editor.isActive('bulletList')} title="Danh sách chấm"
        ><List className="w-4 h-4" /></ToolbarButton>
        <ToolbarButton
          onClick={() => {
            if (editor.isActive('bulletList')) editor.chain().focus().toggleBulletList().run();
            editor.chain().focus().toggleOrderedList().run();
          }}
          isActive={editor.isActive('orderedList')} title="Danh sách số"
        ><ListOrdered className="w-4 h-4" /></ToolbarButton>
      </div>

      {/* ── Text Color ───────────────────────────────────────────── */}
      <div className="pr-2 border-r border-gray-200">
        <button
          ref={colorPickerButtonRef}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (!showColorPicker && colorPickerButtonRef.current) {
              const rect = colorPickerButtonRef.current.getBoundingClientRect();
              setColorPickerPos({ top: rect.bottom + 4, left: rect.left });
            }
            setShowColorPicker((v) => !v);
            setShowFontFamily(false);
            setShowBgPicker(false);
            setShowSizeDropdown(false);
          }}
          title="Màu chữ"
          className={cn('p-1.5 rounded transition-colors', showColorPicker ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-600')}
        >
          <Palette className="w-4 h-4" />
        </button>
      </div>
      {showColorPicker && createPortal(
        <div
          ref={colorPickerRef}
          className="fixed z-[10000] bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-28 animate-in fade-in slide-in-from-top-2 duration-150"
          style={{ top: colorPickerPos.top, left: colorPickerPos.left }}
        >
          <div className="grid grid-cols-3 gap-1">
            {TEXT_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => { (editor.chain().focus() as any).setColor(color.value).run(); setShowColorPicker(false); }}
                className={cn(
                  'w-6 h-6 rounded border-2 transition-all hover:scale-110 hover:shadow-md',
                  editor.isActive('textStyle', { color: color.value }) ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-gray-300'
                )}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>,
        globalThis.document.body
      )}

      {/* ── Màu nền slide ───────────────────────────────────────── */}
      <div className="relative flex-shrink-0">
        <button
          ref={bgButtonRef}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (!showBgPicker && bgButtonRef.current) {
              const rect = bgButtonRef.current.getBoundingClientRect();
              setBgPickerPos({ top: rect.bottom + 4, left: rect.left });
            }
            setShowColorPicker(false);
            setShowFontFamily(false);
            setShowBgPicker((v) => !v);
          }}
          disabled={!activeCardId}
          title="Màu nền slide"
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
            !activeCardId
              ? 'text-gray-300 cursor-not-allowed'
              : showBgPicker
              ? 'bg-gray-100 text-slate-700'
              : 'text-slate-600 hover:bg-gray-100 hover:text-blue-500'
          )}
        >
          <span className="w-4 h-4 rounded border border-gray-300 flex-shrink-0" style={{ backgroundColor: currentBgColor || '#ffffff' }} />
          <span>Màu nền</span>
          <ChevronDown className="w-3 h-3" />
        </button>
        {showBgPicker && createPortal(
          <div
            ref={bgPickerRef}
            className="fixed z-[10000] bg-white rounded-xl shadow-xl border border-gray-200 p-3 w-56"
            style={{ top: bgPickerPos.top, left: bgPickerPos.left }}
          >
            <BgColorPicker
              currentColor={currentBgColor}
              onApplyCurrent={(color) => { if (activeCardId) setCardBackground(activeCardId, color); setShowBgPicker(false); }}
              onApplyAll={(color) => { setCardBackground(null, color); setShowBgPicker(false); }}
            />
          </div>,
          globalThis.document.body
        )}
      </div>
    </div>,
    globalThis.document.body
  );
}

// ============================================================================
// LEGACY EXPORT — no-op; TextBlock/HeadingBlock no longer need this
// ============================================================================

/** @deprecated Remove from TextBlock/HeadingBlock; use ContextualTextToolbar in Toolbar instead. */
export function FloatingTextToolbar(_props: { editor: unknown; show: boolean }) {
  return null;
}

export default ContextualTextToolbar;
