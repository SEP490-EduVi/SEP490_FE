// src/components/projects/ProjectStatsBar.tsx

'use client';

import React from 'react';
import { FolderOpen, Package, Clock } from 'lucide-react';
import type { ProjectDto } from '@/types/api';
import type { ProductDto } from '@/types/api';

interface ProjectStatsBarProps {
  projects: ProjectDto[];
  products?: ProductDto[];
}

export default function ProjectStatsBar({ projects, products = [] }: ProjectStatsBarProps) {
  const stats = [
    {
      label: 'Tổng dự án',
      value: projects.length,
      icon: FolderOpen,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Hoạt động',
      value: projects.filter((p) => p.status === 0).length,
      icon: Clock,
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4"
          >
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
