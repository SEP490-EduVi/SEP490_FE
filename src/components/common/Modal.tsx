'use client';

/**
 * Modal Component
 * ===============
 * 
 * Reusable modal component with customizable content.
 * Common features like backdrop, animations, and close handlers are built-in.
 * Content and styling can be customized via props.
 * 
 * Features:
 * - Backdrop with click-to-close
 * - ESC key to close
 * - Smooth animations
 * - Customizable size and styling
 * - Header, body, footer sections
 */

import React, { useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
}

// ============================================================================
// SIZE CLASSES
// ============================================================================

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4',
};

// ============================================================================
// MODAL COMPONENT
// ============================================================================

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEsc = true,
  className,
  headerClassName,
  bodyClassName,
  footerClassName,
}: ModalProps) {
  // --------------------------------------------------------------------------
  // Handle ESC key press
  // --------------------------------------------------------------------------
  const handleEscKey = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape') {
        onClose();
      }
    },
    [closeOnEsc, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleEscKey]);

  // --------------------------------------------------------------------------
  // Handle backdrop click
  // --------------------------------------------------------------------------
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div
        className={cn(
          'absolute inset-0 bg-black/50 backdrop-blur-sm',
          'animate-in fade-in duration-200'
        )}
      />

      {/* Modal Container */}
      <div
        className={cn(
          'relative w-full bg-white rounded-xl shadow-2xl',
          'animate-in zoom-in-95 fade-in duration-200',
          sizeClasses[size],
          className
        )}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            className={cn(
              'flex items-center justify-between',
              'px-6 py-4 border-b border-gray-200',
              headerClassName
            )}
          >
            {title && (
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className={cn(
                  'p-1 rounded-lg text-gray-400',
                  'hover:bg-gray-100 hover:text-gray-600',
                  'transition-colors',
                  !title && 'ml-auto'
                )}
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div
          className={cn(
            'px-6 py-4',
            bodyClassName
          )}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className={cn(
              'px-6 py-4 border-t border-gray-200',
              'bg-gray-50 rounded-b-xl',
              footerClassName
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
