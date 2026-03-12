// src/components/projects/ProjectListTable.tsx

'use client';

import React from 'react';
import { Trash2 } from 'lucide-react';
import type { ProjectDto } from '@/types/api';

function getStatusLabel(status: number) {
  return status === 0 ? 'Hoạt động' : 'Lưu trữ';
}

interface ProjectListTableProps {
  projects: ProjectDto[];
  onClickProject: (projectCode: string) => void;
  onDelete: (projectCode: string) => void;
  isDeleting?: string | null;
}

export default function ProjectListTable({
  projects,
  onClickProject,
  onDelete,
  isDeleting,
}: ProjectListTableProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-100">
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
              Mã dự án
            </th>
            <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
              Tên dự án
            </th>
            <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">
              Trạng thái
            </th>
            <th className="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr
              key={project.projectCode}
              onClick={() => onClickProject(project.projectCode)}
              className="border-b border-gray-50 hover:bg-blue-50/30 cursor-pointer transition-colors"
            >
              <td className="px-5 py-4">
                <span className="text-xs text-gray-500 font-mono">
                  {project.projectCode}
                </span>
              </td>
              <td className="px-5 py-4">
                <p className="text-sm font-medium text-gray-900">
                  {project.projectName}
                </p>
              </td>
              <td className="px-5 py-4 text-center">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    project.status === 0
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {getStatusLabel(project.status)}
                </span>
              </td>
              <td className="px-5 py-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project.projectCode);
                  }}
                  disabled={isDeleting === project.projectCode}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
