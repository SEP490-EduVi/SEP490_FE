'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { usePipelineProgressStore } from '@/store/usePipelineProgressStore';
import { usePipelineTaskStore } from '@/store/usePipelineTaskStore';

export default function GlobalPipelinePill() {
  const router = useRouter();
  const pathname = usePathname();

  const progress = usePipelineProgressStore((s) => s.progress);
  const pipelineType = usePipelineProgressStore((s) => s.pipelineType);
  const storedProjectCode = usePipelineProgressStore((s) => s.projectCode);

  // Also fall back to any projectCode stored in the task store
  const taskStoreProjectCode = usePipelineTaskStore((s) => {
    for (const { key } of s.getAllTasks()) {
      const [type, ...rest] = key.split(':');
      const productCode = rest.join(':');
      const pc = s.getProjectCode(type as Parameters<typeof s.getProjectCode>[0], productCode);
      if (pc) return pc;
    }
    return null;
  });

  const projectCode = storedProjectCode ?? taskStoreProjectCode;
  const tasks = usePipelineTaskStore((s) => s.getAllTasks());

  // Show only when there's active progress (not completed/failed) and we know where to navigate
  const isActive =
    progress &&
    progress.status !== 'completed' &&
    progress.status !== 'failed' &&
    tasks.length > 0 &&
    !!projectCode;

  // Hide on the project detail page and editor (both have their own slide overlay)
  if (!isActive || pathname === `/teacher/${projectCode}` || pathname === '/teacher/editor') return null;

  const label =
    pipelineType === 'video' ? 'Tạo video' :
    pipelineType === 'slides' ? 'Tạo slide' : 'Đánh giá';

  return (
    <button
      onClick={() => router.push(`/teacher/${projectCode}`)}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-2xl shadow-xl transition-all"
    >
      <Sparkles className="w-4 h-4 animate-pulse" />
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm font-bold">{progress?.progress ?? 0}%</span>
    </button>
  );
}
