import React from 'react';

interface StatusToastProps {
  kind: 'success' | 'error';
  message: string;
  onClose: () => void;
}

export default function StatusToast({ kind, message, onClose }: StatusToastProps) {
  return (
    <div
      className={`fixed right-4 top-4 z-50 rounded-lg border px-4 py-3 shadow-lg ${
        kind === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-red-200 bg-red-50 text-red-700'
      }`}
    >
      <div className="flex items-center gap-3">
        <p className="text-sm font-medium">{message}</p>
        <button type="button" className="text-xs underline" onClick={onClose}>
          Dong
        </button>
      </div>
    </div>
  );
}
