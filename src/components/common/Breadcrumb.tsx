'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm mb-6">
      <Link
        href="/teacher"
        className="flex items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
          {item.href ? (
            <Link
              href={item.href}
              className="text-gray-400 hover:text-blue-600 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-700 font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
