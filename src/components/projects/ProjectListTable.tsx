// src/components/projects/ProjectListTable.tsx

'use client';

import React, { useState } from 'react';
import { BookOpen, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import type { ProjectDto } from '@/types/api';
import { formatDate } from './ProjectCard';

interface ProjectListTableProps {
  projects: ProjectDto[];
  onClickProject: (projectCode: string) => void;
  onDelete: (projectCode: string) => void;
  onEdit?: (project: ProjectDto) => void;
  isDeleting?: string | null;
}

export default function ProjectListTable({
  projects,
  onClickProject,
  onDelete,
  onEdit,
  isDeleting,
}: ProjectListTableProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left text-xs font-medium text-gray-400 px-5 py-3">Tên dự án</th>
            <th className="text-left text-xs font-medium text-gray-400 px-5 py-3 hidden sm:table-cell">Ngày tạo</th>
            <th className="text-left text-xs font-medium text-gray-400 px-5 py-3 hidden md:table-cell">Trạng thái</th>
            <th className="w-12 px-3 py-3" />
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr
              key={project.projectCode}
              onClick={() => onClickProject(project.projectCode)}
              className="border-b border-gray-50 last:border-0 hover:bg-blue-50/30 cursor-pointer transition-colors group"
            >
              {/* Title */}
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 line-clamp-1">{project.projectName}</p>
                </div>
              </td>

              {/* Created date */}
              <td className="px-5 py-3.5 hidden sm:table-cell">
                <span className="text-xs text-gray-400">{formatDate(project.createdAt)}</span>
              </td>

              {/* Status */}
              <td className="px-5 py-3.5 hidden md:table-cell">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    project.status === 0
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {project.status === 0 ? 'Hoạt động' : 'Lưu trữ'}
                </span>
              </td>

              {/* Actions */}
              <td
                className="px-3 py-3.5 text-right"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative inline-block">
                  <button
                    type="button"
                    onClick={() => setOpenMenu(openMenu === project.projectCode ? null : project.projectCode)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  {openMenu === project.projectCode && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setOpenMenu(null)} />
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 z-20 py-1 overflow-hidden">
                        {onEdit && (
                          <button
                            type="button"
                            onClick={() => { setOpenMenu(null); onEdit(project); }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5 text-gray-400" />
                            Chỉnh sửa
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => { setOpenMenu(null); onDelete(project.projectCode); }}
                          disabled={isDeleting === project.projectCode}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Xóa dự án
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
