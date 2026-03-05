'use client';

/**
 * Toolbar Component
 * =================
 * 
 * Top toolbar with buttons to add content blocks and layouts.
 * Includes Export functionality for .eduvi files.
 */

import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useDocumentStore } from '@/store';
import { BlockType, LayoutVariant } from '@/types';
import { exportToEduvi } from '@/lib/exportToEduvi';
import {
  Undo2,
  Redo2,
  Play,
  ShoppingBag,
} from 'lucide-react';

interface ToolbarButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function ToolbarButton({ icon, label, onClick, disabled }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg',
        'text-sm font-medium',
        'transition-colors duration-150',
        disabled
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
      )}
      title={label}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-8 bg-gray-200 mx-1" />;
}

export function Toolbar() {
  const activeCardId = useDocumentStore((state) => state.activeCardId);
  const addBlockToCard = useDocumentStore((state) => state.addBlockToCard);
  const addLayoutToCard = useDocumentStore((state) => state.addLayoutToCard);
  const document = useDocumentStore((state) => state.document);
  const startPresentation = useDocumentStore((state) => state.startPresentation);
  const canUndo = useDocumentStore((state) => state.canUndo());
  const canRedo = useDocumentStore((state) => state.canRedo());
  const onlineUsers = useDocumentStore((state) => state.onlineUsers);

  const hasActiveCard = !!activeCardId;

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useDocumentStore.getState().undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        useDocumentStore.getState().redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAddBlock = (blockType: BlockType) => {
    if (activeCardId) {
      addBlockToCard(activeCardId, blockType);
    }
  };

  const handleAddLayout = (variant: LayoutVariant) => {
    if (activeCardId) {
      addLayoutToCard(activeCardId, variant);
    }
  };

  return (
    <header className="h-16 bg-gradient-to-r from-cyan-500 to-purple-600 px-6 flex items-center justify-between shadow-md">
      {/* Left section - Document title */}
      <div className="flex items-center gap-5">
        <button
          className="p-2.5 rounded-lg hover:bg-white/10 text-white transition-colors"
          title="Menu"
        >
          <div className="w-6 h-6 flex flex-col justify-center gap-1.5">
            <div className="w-full h-0.5 bg-white rounded"></div>
            <div className="w-full h-0.5 bg-white rounded"></div>
            <div className="w-full h-0.5 bg-white rounded"></div>
          </div>
        </button>
        <h1 className="text-lg font-semibold text-white">
          {document?.title || 'EduVi Product Launch'}
        </h1>
        
        <button
          onClick={() => useDocumentStore.getState().undo()}
          disabled={!canUndo}
          className={cn(
            "rounded-lg text-white transition-colors",
            canUndo ? "hover:bg-white/10" : "opacity-50 cursor-not-allowed"
          )}
          title="Hoàn tác (Ctrl+Z)"
        >
          <Undo2 className="w-6 h-6" />
        </button>
        <button
          onClick={() => useDocumentStore.getState().redo()}
          disabled={!canRedo}
          className={cn(
            " rounded-lg text-white transition-colors",
            canRedo ? "hover:bg-white/10" : "opacity-50 cursor-not-allowed"
          )}
          title="Làm lại (Ctrl+Y)"
        >
          <Redo2 className="w-6 h-6" />
        </button>
      </div>

      {/* Right section - Actions */}
      <div className="flex items-center gap-4">
        {/* Online Users */}
        <div className="flex items-center -space-x-3">
          {onlineUsers.slice(0, 3).map((user) => (
            <div
              key={user.id}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-white text-base font-semibold border-2 border-white shadow-sm",
                user.color
              )}
              title={user.name}
            >
              {user.avatar}
            </div>
          ))}
          {onlineUsers.length > 3 && (
            <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-white text-sm font-semibold border-2 border-white shadow-sm">
              +{onlineUsers.length - 3}
            </div>
          )}
        </div>

        <button
          onClick={() => window.location.href = '/shop'}
          className={cn(
            'flex items-center gap-2.5 px-5 py-2.5 rounded-lg',
            'bg-white/20 hover:bg-white/30 text-white',
            'font-semibold text-base transition-colors'
          )}
          title="Shop"
        >
          <ShoppingBag className="w-5 h-5" />
          Shop
        </button>
        
        <button
          onClick={startPresentation}
          disabled={!document || !document.cards.length}
          className={cn(
            'flex items-center gap-2.5 px-5 py-2.5 rounded-lg',
            'bg-white/20 hover:bg-white/30 text-white',
            'font-semibold text-base transition-colors',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          title="Thuyết trình"
        >
          <Play className="w-5 h-5" />
          Thuyết trình
        </button>
        
        <button
          onClick={() => {
            if (document) {
              exportToEduvi(document);
            }
          }}
          disabled={!document}
          className={cn(
            'flex items-center gap-2.5 px-5 py-2.5 rounded-lg',
            'bg-white text-purple-600 hover:bg-gray-100',
            'font-semibold text-base transition-colors shadow-sm',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          title="Chia sẻ"
        >
          Chia sẻ
        </button>
      </div>
    </header>
  );
}

export default Toolbar;
