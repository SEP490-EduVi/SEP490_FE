'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export function MetadataSelect({
  label,
  value,
  onChange,
  options,
  isLoading,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { code: string; name: string }[];
  isLoading: boolean;
  required?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const selectedLabel = options.find((o) => o.code === value)?.name ?? null;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative" ref={ref}>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => setOpen((v) => !v)}
          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 bg-white border rounded-xl text-sm transition-colors disabled:opacity-50 ${
            open ? 'border-blue-400 ring-2 ring-blue-500/20' : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <span className={selectedLabel ? 'text-gray-800' : 'text-gray-400'}>
            {isLoading ? 'Đang tải...' : (selectedLabel ?? `-- Chọn ${label} --`)}
          </span>
          {isLoading
            ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />
            : <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
          }
        </button>
        <AnimatePresence>
          {open && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 z-20 mt-1 bg-white rounded-xl border border-gray-200 shadow-lg overflow-y-auto max-h-52"
            >
              <button
                type="button"
                onClick={() => { onChange(''); setOpen(false); }}
                className={`w-full flex items-center px-3 py-2 text-left hover:bg-blue-50 transition-colors ${!value ? 'bg-blue-50' : ''}`}
              >
                <span className={`text-sm ${!value ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>-- Chọn --</span>
              </button>
              {options.map((o) => (
                <button
                  key={o.code}
                  type="button"
                  onClick={() => { onChange(o.code); setOpen(false); }}
                  className={`w-full flex items-center px-3 py-2 text-left hover:bg-blue-50 transition-colors ${value === o.code ? 'bg-blue-50' : ''}`}
                >
                  <span className={`text-sm truncate ${value === o.code ? 'text-blue-600 font-medium' : 'text-gray-700'}`}>{o.name}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
