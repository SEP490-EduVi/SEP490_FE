'use client';

/**
 * ResizableBlockWrapper Component
 * ===============================
 *
 * Wraps block content to provide resize functionality.
 * Uses re-resizable for drag handles on corners and edges.
 *
 * Maintains Reflow Logic:
 * - Uses CSS Flow (not absolute positioning)
 * - When resized, surrounding content automatically adjusts
 * - Width is percentage-based to maintain responsiveness
 *
 * Resize handles:
 * - 4 corner handles (proportional feel)
 * - 4 edge handles (horizontal-only or vertical-only)
 */

import React, { useState, useCallback } from 'react';
import { Resizable, Enable } from 're-resizable';
import { cn } from '@/lib/utils';
import { IBlockStyles } from '@/types';

export interface ResizableBlockWrapperProps {
  id: string;
  children: React.ReactNode;
  styles?: IBlockStyles;
  isResizable?: boolean;
  isSelected?: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: string;
  onStyleChange?: (styles: Partial<IBlockStyles>) => void;
  onClick?: () => void;
}

// All 8 directions enabled for full resize control
const RESIZE_ENABLE: Enable = {
  top: true,
  right: true,
  bottom: true,
  left: true,
  topRight: true,
  bottomRight: true,
  bottomLeft: true,
  topLeft: true,
};

// Hit-area styles — generous zones for easy grabbing
const handleStyles = {
  top:         { height: '10px', top: '-5px',   cursor: 'ns-resize'   },
  right:       { width:  '10px', right: '-5px',  cursor: 'ew-resize'  },
  bottom:      { height: '10px', bottom: '-5px', cursor: 'ns-resize'  },
  left:        { width:  '10px', left: '-5px',   cursor: 'ew-resize'  },
  topRight:    { width: '14px', height: '14px', right: '-5px', top: '-5px',    cursor: 'nesw-resize' },
  bottomRight: { width: '14px', height: '14px', right: '-5px', bottom: '-5px', cursor: 'nwse-resize' },
  bottomLeft:  { width: '14px', height: '14px', left: '-5px',  bottom: '-5px', cursor: 'nesw-resize' },
  topLeft:     { width: '14px', height: '14px', left: '-5px',  top: '-5px',    cursor: 'nwse-resize' },
};

export function ResizableBlockWrapper({
  id,
  children,
  styles,
  isResizable = true,
  isSelected = false,
  minWidth = 100,
  minHeight = 50,
  maxWidth = '100%',
  onStyleChange,
  onClick,
}: ResizableBlockWrapperProps) {
  const [isResizing, setIsResizing] = useState(false);

  const currentWidth = styles?.width || '100%';
  const currentHeight = styles?.height || 'auto';

  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleResizeStop = useCallback(
    (
      e: MouseEvent | TouchEvent,
      direction: string,
      ref: HTMLElement,
      delta: { width: number; height: number }
    ) => {
      setIsResizing(false);

      const parentWidth = ref.parentElement?.clientWidth || ref.clientWidth;
      const newWidthPx = ref.clientWidth;
      const newHeightPx = ref.clientHeight;
      const newWidthPercent = Math.round((newWidthPx / parentWidth) * 100);

      const newStyles: IBlockStyles = {
        ...styles,
        width: `${Math.min(newWidthPercent, 100)}%`,
        height: `${newHeightPx}px`,
      };

      onStyleChange?.(newStyles);
    },
    [styles, onStyleChange]
  );

  if (!isResizable) {
    return (
      <div style={{ width: currentWidth, height: currentHeight, maxWidth }}>
        {children}
      </div>
    );
  }

  return (
    <Resizable
      size={{ width: currentWidth, height: currentHeight }}
      minWidth={minWidth}
      minHeight={minHeight}
      maxWidth={maxWidth}
      enable={isSelected ? RESIZE_ENABLE : false}
      handleStyles={handleStyles}
      onResizeStart={handleResizeStart}
      onResizeStop={handleResizeStop}
      className={cn(
        'relative group',
        !isResizing && 'transition-all duration-200',
        isSelected && 'resize-selected'
      )}
      handleComponent={{
        top:         undefined,
        right:       undefined,
        bottom:      undefined,
        left:        undefined,
        topLeft:     undefined,
        topRight:    undefined,
        bottomLeft:  undefined,
        bottomRight: undefined,
      }}
    >
      {/* Content wrapper — stopPropagation so blocks inside layouts are individually selectable */}
      <div
        className="w-full h-full"
        onClick={(e) => {
          e.stopPropagation();
          onClick?.();
        }}
      >
        {children}
      </div>

      {/* Size tooltip while resizing */}
      {isSelected && isResizing && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-50">
          {currentWidth} × {currentHeight}
        </div>
      )}
    </Resizable>
  );
}

export default ResizableBlockWrapper;
