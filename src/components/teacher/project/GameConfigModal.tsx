'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gamepad2, Loader2 } from 'lucide-react';
import { createPlayableGameTask } from '@/services/gamesServices';
import { getEditedSlideGcsUrl } from '@/services/productServices';
import { GAME_BLUEPRINTS } from '@/mediapipe-game/api-contracts.js';
import { notify, MSGS } from '@/components/common';
import type { GameTemplateId } from '@/types/api';

const GAME_OPTIONS: { id: GameTemplateId; label: string; desc: string; icon: string }[] = [
  { id: 'HOVER_SELECT', label: 'Giơ tay & Chọn', desc: 'Giơ tay chọn đáp án', icon: '🖐️' },
  { id: 'DRAG_DROP',    label: 'Kéo & Thả',      desc: 'Kéo thả đáp án',      icon: '✋' },
  { id: 'SNAKE_DUEL',   label: 'Rắn đấu',        desc: 'Rắn đấu (2 người)',   icon: '⚔️' },
];

interface GameConfigModalProps {
  productCode: string;
  productName: string;
  onClose: () => void;
}

export default function GameConfigModal({ productCode, productName, onClose }: GameConfigModalProps) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState<GameTemplateId>(GAME_BLUEPRINTS.HOVER_SELECT as GameTemplateId);
  const [roundCount, setRoundCount] = useState(1);
  const [gameName, setGameName] = useState('');
  const [creating, setCreating] = useState(false);
  const [status, setStatus] = useState('');

  const handleConfirm = async () => {
    setStatus('Đang lấy dữ liệu slide...');
    setCreating(true);
    try {
      const url = await getEditedSlideGcsUrl(productCode);
      if (!url) { setStatus(MSGS.game.noSlideError); setCreating(false); return; }
      setStatus('Đang gửi yêu cầu tạo game...');
      const task = await createPlayableGameTask({
        productGameName: gameName.trim() || productName,
        productCode,
        templateId,
        slideEditedDocumentUrl: url,
        roundCount,
      });
      onClose();
      notify.success(MSGS.game.createSuccess);

      const query = new URLSearchParams({ taskId: task.taskId, productCode });
      if (productName.trim()) query.set('productName', productName.trim());
      const normalizedProductGameName = gameName.trim() || productName.trim() || 'Game chưa đặt tên';
      if (normalizedProductGameName) query.set('productGameName', normalizedProductGameName);
      if (templateId) query.set('templateCode', templateId);

      router.push(`/teacher/game-maker?${query.toString()}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : MSGS.game.createError;
      setStatus(msg);
      notify.error(MSGS.game.createError);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
            <Gamepad2 className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Tạo trò chơi học tập</h3>
            <p className="text-sm text-gray-500">Chọn kiểu game và số round cho bài học.</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dạng trò chơi</label>
            <div className="grid grid-cols-2 gap-2">
              {GAME_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTemplateId(opt.id)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                    templateId === opt.id
                      ? 'border-violet-400 bg-violet-50 text-violet-700'
                      : 'border-gray-200 bg-gray-50 hover:border-violet-300 hover:bg-violet-50/40 text-gray-700'
                  }`}
                >
                  <span className="text-lg leading-none">{opt.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate">{opt.label}</p>
                    <p className="text-[11px] text-gray-400 truncate">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên trò chơi</label>
            <input
              type="text"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
              placeholder={productName || 'Nhập tên trò chơi...'}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Số vòng</label>
            <input
              type="number"
              min={1}
              max={20}
              value={roundCount}
              onChange={(e) => setRoundCount(Math.max(1, Number(e.target.value) || 1))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
          {status && (
            <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">{status}</p>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            disabled={creating}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={creating}
            className="px-4 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl disabled:opacity-60 flex items-center gap-2"
          >
            {creating && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
            {creating ? 'Đang tạo...' : 'Bắt đầu'}
          </button>
        </div>
      </div>
    </div>
  );
}
