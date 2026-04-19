'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, LayoutTemplate } from 'lucide-react';
import Modal from '@/components/common/Modal';
import { notify } from '@/components/common';
import SkeletonPreview from '@/components/common/SkeletonPreview';
import { useTemplates, useDeleteTemplate } from '@/hooks/useTemplateApi';
import type { ICardTemplate } from '@/types/api';


export default function AdminTemplatesPage() {
  const router = useRouter();
  const { data: templates = [], isLoading, error } = useTemplates();
  const deleteTemplate = useDeleteTemplate();

  const [deletingTemplate, setDeletingTemplate] = useState<ICardTemplate | null>(null);

  const handleDelete = async () => {
    if (!deletingTemplate) return;
    try {
      await deleteTemplate.mutateAsync(deletingTemplate.templateCode);
      notify.success('Đã xóa template thành công');
    } catch {
      notify.error('Xóa template thất bại');
    } finally {
      setDeletingTemplate(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <LayoutTemplate className="w-6 h-6 text-blue-600" />
            Mẫu bố cục trang
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý các mẫu bố cục trang cho giáo viên sử dụng trong editor
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/templates/editor')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tạo mẫu mới
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[4/3] bg-gray-200 rounded-lg mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-1" />
              <div className="h-3 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-500">
          Không thể tải danh sách template. Vui lòng thử lại.
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-24">
          <LayoutTemplate className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Chưa có template nào</p>
          <p className="text-sm text-gray-400 mt-1">Nhấn &quot;Tạo mẫu mới&quot; để bắt đầu</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {templates.map((template) => (
            <div key={template.templateCode} className="group relative flex flex-col gap-2">
              {/* Preview card */}
              <div className="aspect-[4/3] rounded-lg overflow-hidden border-2 border-gray-100 group-hover:border-blue-300 transition-colors shadow-sm">
                <SkeletonPreview skeleton={template.skeleton} />
              </div>

              {/* Info */}
              <div>
                <p className="text-sm font-medium text-gray-800 truncate">{template.name}</p>
                {template.description && (
                  <p className="text-xs text-gray-400 mt-0.5 truncate" title={template.description}>
                    {template.description}
                  </p>
                )}
              </div>

              {/* Actions (hover) */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() =>
                    router.push(`/admin/templates/editor?templateCode=${template.templateCode}`)
                  }
                  className="p-1.5 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-colors"
                  title="Sửa"
                >
                  <Pencil className="w-3.5 h-3.5 text-gray-600" />
                </button>
                <button
                  onClick={() => setDeletingTemplate(template)}
                  className="p-1.5 bg-white border border-gray-200 rounded-md shadow-sm hover:bg-red-50 hover:border-red-300 transition-colors"
                  title="Xóa"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm modal */}
      <Modal
        isOpen={!!deletingTemplate}
        onClose={() => setDeletingTemplate(null)}
        title="Xác nhận xóa template"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Bạn có chắc muốn xóa template{' '}
            <span className="font-semibold text-gray-900">{deletingTemplate?.name}</span>?
            Thao tác này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeletingTemplate(null)}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteTemplate.isPending}
              className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {deleteTemplate.isPending ? 'Đang xóa...' : 'Xóa'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
