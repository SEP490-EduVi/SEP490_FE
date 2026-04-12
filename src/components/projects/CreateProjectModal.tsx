// src/components/projects/CreateProjectModal.tsx

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOpen, X, Loader2, ChevronDown, BookOpen, GraduationCap } from 'lucide-react';
import type { SubjectDto, GradeDto } from '@/types/api';

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { projectName: string; subjectCode: string; gradeCode: string }) => void;
  subjects: SubjectDto[];
  grades: GradeDto[];
  subjectsLoading?: boolean;
  gradesLoading?: boolean;
  presetSubjectCode?: string;
  presetSubjectName?: string;
  presetGradeCode?: string;
  presetGradeName?: string;
  isLoading?: boolean;
}

export default function CreateProjectModal({
  open,
  onClose,
  onCreate,
  subjects,
  grades,
  subjectsLoading = false,
  gradesLoading = false,
  presetSubjectCode,
  presetSubjectName,
  presetGradeCode,
  presetGradeName,
  isLoading = false,
}: CreateProjectModalProps) {
  const [projectName, setProjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [gradeCode, setGradeCode] = useState('');
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [showGradePicker, setShowGradePicker] = useState(false);

  const resolvedSubjectCode = presetSubjectCode ?? subjectCode;
  const resolvedGradeCode = presetGradeCode ?? gradeCode;
  const hasPresetContext = !!presetSubjectCode && !!presetGradeCode;

  const handleSubmit = () => {
    if (!projectName.trim() || !resolvedSubjectCode || !resolvedGradeCode) return;
    onCreate({
      projectName: projectName.trim(),
      subjectCode: resolvedSubjectCode,
      gradeCode: resolvedGradeCode,
    });
  };

  const handleClose = () => {
    if (isLoading) return;
    setProjectName('');
    setSubjectCode('');
    setGradeCode('');
    onClose();
  };

  // Reset form when modal opens
  const handleExited = () => {
    setProjectName('');
    setSubjectCode('');
    setGradeCode('');
  };

  return (
    <AnimatePresence onExitComplete={handleExited}>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Tạo dự án mới</h2>
              </div>
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tên dự án <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="VD: Toán Đại số lớp 10"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 focus:bg-white transition-all"
                  autoFocus
                  disabled={isLoading}
                />
              </div>

              {hasPresetContext ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Môn học</label>
                    <div className="w-full px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700 font-medium">
                      {presetSubjectName || presetSubjectCode}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Khối lớp</label>
                    <div className="w-full px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-sm text-indigo-700 font-medium">
                      {presetGradeName || presetGradeCode}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Môn học <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => { if (!isLoading && !subjectsLoading) setShowSubjectPicker((v) => !v); }}
                        disabled={isLoading || subjectsLoading}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:border-blue-300 transition-colors text-left disabled:opacity-50"
                      >
                        <BookOpen className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span className="flex-1 text-sm font-medium text-gray-700 truncate">
                          {subjectsLoading
                            ? 'Đang tải...'
                            : subjectCode
                            ? subjects.find((s) => s.subjectCode === subjectCode)?.subjectName ?? subjectCode
                            : '-- Chọn môn học --'}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${showSubjectPicker ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {showSubjectPicker && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 right-0 z-20 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-y-auto max-h-52"
                          >
                            {subjects.map((s) => (
                              <button
                                key={s.subjectCode}
                                type="button"
                                onClick={() => { setSubjectCode(s.subjectCode); setShowSubjectPicker(false); }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-blue-50 ${
                                  subjectCode === s.subjectCode ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                }`}
                              >
                                <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{s.subjectName}</p>
                                  <p className="text-[11px] text-gray-400">{s.subjectCode}</p>
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Khối lớp <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => { if (!isLoading && !gradesLoading) setShowGradePicker((v) => !v); }}
                        disabled={isLoading || gradesLoading}
                        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:border-blue-300 transition-colors text-left disabled:opacity-50"
                      >
                        <GraduationCap className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        <span className="flex-1 text-sm font-medium text-gray-700 truncate">
                          {gradesLoading
                            ? 'Đang tải...'
                            : gradeCode
                            ? grades.find((g) => g.gradeCode === gradeCode)?.gradeName ?? gradeCode
                            : '-- Chọn khối lớp --'}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${showGradePicker ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {showGradePicker && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 right-0 z-20 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-y-auto max-h-52"
                          >
                            {grades.map((g) => (
                              <button
                                key={g.gradeCode}
                                type="button"
                                onClick={() => { setGradeCode(g.gradeCode); setShowGradePicker(false); }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-blue-50 ${
                                  gradeCode === g.gradeCode ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                }`}
                              >
                                <GraduationCap className="w-3.5 h-3.5 flex-shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{g.gradeName}</p>
                                  <p className="text-[11px] text-gray-400">{g.gradeCode}</p>
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={!projectName.trim() || !resolvedSubjectCode || !resolvedGradeCode || isLoading}
                className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLoading ? 'Đang tạo...' : 'Tạo dự án'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
