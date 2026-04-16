'use client';

import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Upload, Loader2, FileText, X, ChevronDown } from 'lucide-react';
import type { SubjectDto, GradeDto } from '@/types/api';
import { MetadataSelect } from './MetadataSelect';
import { MATERIAL_TYPE_OPTIONS } from './materialConstants';

interface UploadForm {
  title: string;
  description: string;
  type: string;
  price: number;
  subjectCode: string;
  gradeCode: string;
}

interface UploadMaterialFormProps {
  subjects: SubjectDto[];
  grades: GradeDto[];
  subjectsLoading: boolean;
  gradesLoading: boolean;
  isUploading: boolean;
  onUpload: (data: {
    File: File;
    PreviewFile?: File;
    Title: string;
    Description?: string;
    Type: string;
    Price?: number;
    SubjectCode?: string;
    GradeCode?: string;
  }) => void;
  onCancel: () => void;
}

export function UploadMaterialForm({
  subjects, grades, subjectsLoading, gradesLoading, isUploading, onUpload, onCancel,
}: UploadMaterialFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [form, setForm] = useState<UploadForm>({
    title: '', description: '', type: 'image', price: 0, subjectCode: '', gradeCode: '',
  });
  const [showTypePicker, setShowTypePicker] = useState(false);

  const set = (key: keyof UploadForm) => (value: string | number) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleSubmit = () => {
    if (!file || !form.title) return;
    onUpload({
      File: file,
      PreviewFile: previewFile ?? undefined,
      Title: form.title,
      Description: form.description || undefined,
      Type: form.type,
      Price: form.price || undefined,
      SubjectCode: form.subjectCode || undefined,
      GradeCode: form.gradeCode || undefined,
    });
  };

  const handleCancel = () => {
    setFile(null);
    setPreviewFile(null);
    setForm({ title: '', description: '', type: 'image', price: 0, subjectCode: '', gradeCode: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (previewInputRef.current) previewInputRef.current.value = '';
    onCancel();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="overflow-hidden mb-8"
      >
        <div className="bg-white/90 backdrop-blur rounded-2xl border border-blue-100 p-6 space-y-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Tải lên tài liệu mới</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tệp tài liệu <span className="text-red-500">*</span>
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f) { setFile(f); if (!form.title) set('title')(f.name.replace(/\.[^.]+$/, '')); }
                }}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                  file ? 'border-blue-300 bg-blue-50' : 'border-blue-100 hover:border-blue-300 hover:bg-blue-50/40'
                }`}
              >
                {file ? (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-blue-700 truncate">{file.name}</p>
                      <p className="text-xs text-blue-400">{(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-7 h-7 text-gray-300 mx-auto mb-1.5" />
                    <p className="text-sm font-medium text-gray-600">Kéo thả hoặc nhấn để chọn</p>
                    <p className="text-xs text-gray-400 mt-0.5">PDF, JPG, PNG, MP4 · Tối đa 50 MB</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) { setFile(f); if (!form.title) set('title')(f.name.replace(/\.[^.]+$/, '')); }
                  }}
                  className="hidden"
                />
              </div>
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ảnh xem trước (tùy chọn)
              </label>
              <div
                onClick={() => previewInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const f = e.dataTransfer.files?.[0];
                  if (f && f.type.startsWith('image/')) setPreviewFile(f);
                }}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                  previewFile ? 'border-emerald-300 bg-emerald-50' : 'border-blue-100 hover:border-blue-300 hover:bg-blue-50/40'
                }`}
              >
                {previewFile ? (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={URL.createObjectURL(previewFile)}
                        alt="preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-emerald-700 truncate">{previewFile.name}</p>
                      <p className="text-xs text-emerald-400">{(previewFile.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPreviewFile(null); if (previewInputRef.current) previewInputRef.current.value = ''; }}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-7 h-7 text-gray-300 mx-auto mb-1.5" />
                    <p className="text-sm font-medium text-gray-600">Kéo thả hoặc nhấn để chọn ảnh</p>
                    <p className="text-xs text-gray-400 mt-0.5">JPG, PNG, GIF · Tối đa 5 MB</p>
                  </>
                )}
                <input
                  ref={previewInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) setPreviewFile(f); }}
                  className="hidden"
                />
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                value={form.title}
                onChange={(e) => set('title')(e.target.value)}
                placeholder="Nhập tiêu đề tài liệu..."
                className="w-full px-3 py-2.5 bg-white border border-blue-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại <span className="text-red-500">*</span></label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTypePicker((v) => !v)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-white border rounded-xl text-sm transition-colors ${
                    showTypePicker ? 'border-blue-400 ring-2 ring-blue-500/20' : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <span className="text-gray-800">
                    {MATERIAL_TYPE_OPTIONS.find((o) => o.value === form.type)?.label ?? form.type}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${showTypePicker ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {showTypePicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 z-20 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden"
                    >
                      {MATERIAL_TYPE_OPTIONS.map((o) => (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => { set('type')(o.value); setShowTypePicker(false); }}
                          className={`w-full flex items-center px-3 py-2 text-left hover:bg-blue-50 transition-colors ${form.type === o.value ? 'bg-blue-50' : ''}`}
                        >
                          <span className={`text-sm ${form.type === o.value ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>{o.label}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VNĐ)</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => set('price')(Number(e.target.value))}
                min={0}
                placeholder="0 = Miễn phí"
                className="w-full px-3 py-2.5 bg-white border border-blue-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>

            <MetadataSelect
              label="Môn học"
              value={form.subjectCode}
              onChange={set('subjectCode') as (v: string) => void}
              options={subjects.map((s) => ({ code: s.subjectCode, name: s.subjectName }))}
              isLoading={subjectsLoading}
            />

            <MetadataSelect
              label="Khối lớp"
              value={form.gradeCode}
              onChange={set('gradeCode') as (v: string) => void}
              options={grades.map((g) => ({ code: g.gradeCode, name: g.gradeName }))}
              isLoading={gradesLoading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description')(e.target.value)}
              rows={2}
              placeholder="Mô tả ngắn về tài liệu..."
              className="w-full px-3 py-2.5 bg-white border border-blue-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={!file || !form.title || isUploading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-semibold shadow-md shadow-blue-600/20"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {isUploading ? 'Đang tải lên...' : 'Tải lên'}
            </button>
            <button onClick={handleCancel} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors text-sm">
              Huỷ
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
