'use client';

import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Upload, Loader2 } from 'lucide-react';
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
    console.log('Submitting upload with data:', {
      File: file.name,
      PreviewFile: previewFile?.name,
        Title: form.title, 
        Description: form.description,
        Type: form.type,
        Price: form.price,
        SubjectCode: form.subjectCode,
        GradeCode: form.gradeCode,
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
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Tải lên tài liệu mới</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tệp tài liệu <span className="text-red-500">*</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) { setFile(f); if (!form.title) set('title')(f.name.replace(/\.[^.]+$/, '')); }
                }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {/* Preview */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh xem trước</label>
              <input
                ref={previewInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setPreviewFile(f); }}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
              />
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
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại <span className="text-red-500">*</span></label>
              <select
                value={form.type}
                onChange={(e) => set('type')(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              >
                {MATERIAL_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
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
                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
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
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={!file || !form.title || isUploading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
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
