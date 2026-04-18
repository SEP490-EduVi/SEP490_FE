'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, Loader2, AlertCircle, CheckCircle,
  LockKeyhole, Check,
} from 'lucide-react';
import { useChangePasswordService } from '@/services/authServices';
import { notify, MSGS } from '@/components/common';

function passwordStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string; color: string } {
  if (!pw) return { level: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  if (score === 1) return { level: 1, label: 'Yếu',        color: 'bg-red-400'    };
  if (score === 2) return { level: 2, label: 'Trung bình',  color: 'bg-amber-400'  };
  return             { level: 3, label: 'Mạnh',        color: 'bg-emerald-500' };
}

function PasswordInput({
  value, onChange, show, onToggle, placeholder,
}: {
  value: string; onChange: (val: string) => void; show: boolean; onToggle: () => void; placeholder?: string;
}) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
      />
      <button type="button" onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

export default function SecurityTab() {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurr,  setShowCurr]  = useState(false);
  const [showNew,   setShowNew]   = useState(false);
  const [showConf,  setShowConf]  = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError,   setPwError]   = useState<string | null>(null);
  const changePassword = useChangePasswordService();
  const strength       = passwordStrength(newPw);

  const handleChangePw = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    if (newPw !== confirmPw) { setPwError('Mật khẩu xác nhận không khớp.'); return; }
    if (newPw.length < 8)   { setPwError('Mật khẩu mới cần ít nhất 8 ký tự.'); return; }
    changePassword.mutate(
      { currentPassword: currentPw, newPassword: newPw, confirmPassword: confirmPw },
      {
        onSuccess: () => {
          notify.success(MSGS.profile.changePwSuccess);
          setPwSuccess(true);
          setCurrentPw(''); setNewPw(''); setConfirmPw('');
          setTimeout(() => setPwSuccess(false), 4000);
        },
        onError: (err: unknown) => {
          const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
          setPwError(msg ?? MSGS.profile.changePwError);
          notify.error(msg ?? MSGS.profile.changePwError);
        },
      },
    );
  };

  return (
    <motion.div key="security"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
      className="max-w-lg"
    >
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
            <LockKeyhole className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Đổi mật khẩu</h2>
            <p className="text-xs text-gray-400">Cập nhật mật khẩu để bảo vệ tài khoản</p>
          </div>
        </div>

        <form onSubmit={handleChangePw} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu hiện tại</label>
            <PasswordInput value={currentPw} onChange={setCurrentPw} show={showCurr}
              onToggle={() => setShowCurr(v => !v)} placeholder="Nhập mật khẩu hiện tại" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Mật khẩu mới</label>
            <PasswordInput value={newPw} onChange={setNewPw} show={showNew}
              onToggle={() => setShowNew(v => !v)} placeholder="Tối thiểu 8 ký tự" />
            {newPw && (
              <div className="mt-2.5">
                <div className="flex gap-1.5 mb-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      strength.level >= i ? strength.color : 'bg-gray-100'
                    }`} />
                  ))}
                </div>
                <p className="text-xs text-gray-400">
                  Độ mạnh: <span className={`font-semibold ${
                    strength.level === 1 ? 'text-red-500' :
                    strength.level === 2 ? 'text-amber-500' : 'text-emerald-600'
                  }`}>{strength.label}</span>
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Xác nhận mật khẩu mới</label>
            <PasswordInput value={confirmPw} onChange={setConfirmPw} show={showConf}
              onToggle={() => setShowConf(v => !v)} placeholder="Nhập lại mật khẩu mới" />
          </div>

          <AnimatePresence>
            {pwError && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2.5 text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {pwError}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {pwSuccess && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center gap-2.5 text-sm text-emerald-600 bg-emerald-50 border border-emerald-100 px-4 py-3 rounded-xl">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                Đổi mật khẩu thành công!
              </motion.div>
            )}
          </AnimatePresence>

          <button type="submit"
            disabled={changePassword.isPending || !currentPw || !newPw || !confirmPw}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
          >
            {changePassword.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Đang cập nhật...</>
            ) : (
              <><Check className="w-4 h-4" />Cập nhật mật khẩu</>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
