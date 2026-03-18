'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import type { MaterialDto, UpdateMaterialInput } from '@/types/api';
import { MetadataSelect } from './MetadataSelect';

export function EditMaterialModal({
  material,
  onClose,
  onSave,
  isLoading,
  subjects,
  grades,
  subjectsLoading,
  gradesLoading,
}: {
  material: MaterialDto;
  onClose: () => void;
  onSave: (code: string, input: UpdateMaterialInput) => void;
  isLoading: boolean;
  subjects: { code: string; name: string }[];
  grades: { code: string; name: string }[];
  subjectsLoading: boolean;
  gradesLoading: boolean;
}) {
  const [title, setTitle] = useState(material.title);
  const [description, setDescription] = useState(material.description);
  const [price, setPrice] = useState(material.price);
  const [subjectCode, setSubjectCode] = useState(material.subjectCode);
  const [gradeCode, setGradeCode] = useState(material.gradeCode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Chỉnh sửa tài liệu</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Giá (VNĐ)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              min={0}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>

          <MetadataSelect
            label="Môn học"
            value={subjectCode}
            onChange={setSubjectCode}
            options={subjects}
            isLoading={subjectsLoading}
          />

          <MetadataSelect
            label="Khối lớp"
            value={gradeCode}
            onChange={setGradeCode}
            options={grades}
            isLoading={gradesLoading}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            Huỷ
          </button>
          <button
            onClick={() => { if (title) onSave(material.materialCode, { title, description, price, subjectCode, gradeCode }); }}
            disabled={!title || isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Lưu thay đổi
          </button>
        </div>
      </motion.div>
    </div>
  );
}
