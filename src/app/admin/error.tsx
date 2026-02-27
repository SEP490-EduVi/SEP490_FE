'use client';

import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Admin] Unhandled error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-20">
      <h2 className="text-2xl font-semibold text-gray-900">Đã xảy ra lỗi</h2>
      <p className="text-sm text-gray-500 max-w-md">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Thử lại
      </button>
    </div>
  );
}
