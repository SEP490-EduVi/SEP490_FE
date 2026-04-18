'use client';

import React, { useState } from 'react';
import { Film, X } from 'lucide-react';

interface CreateVideoModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (videoName: string) => void;
}

export default function CreateVideoModal({ open, onClose, onConfirm }: CreateVideoModalProps) {
  const [videoName, setVideoName] = useState('');

  const handleClose = () => {
    setVideoName('');
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(videoName.trim());
    setVideoName('');
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-800">Tạo video bài giảng</h3>
          <button onClick={handleClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
              <Film className="w-5 h-5 text-violet-500" />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Quá trình tạo video có thể mất vài phút. Bạn có thể đặt tên cho video trước khi bắt đầu.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tên video <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
            </label>
            <input
              type="text"
              value={videoName}
              onChange={(e) => setVideoName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleConfirm(); }}
              placeholder="VD: Bài 1 — Giới thiệu chương trình"
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 focus:bg-white transition-all"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2.5 px-6 py-4 bg-gray-50 border-t border-gray-100">
          <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
            Hủy
          </button>
          <button onClick={handleConfirm} className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl hover:shadow-md transition-all">
            Tạo video
          </button>
        </div>
      </div>
    </div>
  );
}
