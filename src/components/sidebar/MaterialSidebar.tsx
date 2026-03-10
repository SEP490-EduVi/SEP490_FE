/**
 * MaterialSidebar Component
 * =========================
 * 
 * Right sidebar displaying the material library.
 * Users can drag materials from here to drop into cards.
 * 
 * Features:
 * - Fetches materials from API
 * - Groups by category
 * - Draggable items using dnd-kit
 * - Search/filter functionality
 * - Quick layout buttons for multi-widget rows
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { useDocumentStore } from '@/store';
import { IMaterial, MaterialCategory } from '@/types';
import { Modal } from '@/components/common/Modal';
import { basicCardTemplates, freeformCardTemplates } from './cardTemplates';
import * as LucideIcons from 'lucide-react';
import { 
  Loader2, 
  Search, 
  GripVertical, 
  ChevronDown, 
  ChevronRight, 
  Package,
  Columns2,
  Columns3,
  LayoutGrid,
  Sparkles,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface MaterialSidebarProps {
  className?: string;
}

interface MaterialItemProps {
  material: IMaterial;
}

interface CategorySectionProps {
  category: MaterialCategory;
  materials: IMaterial[];
  isExpanded: boolean;
  onToggle: () => void;
}

// ============================================================================
// HELPER: Get Lucide Icon by name
// ============================================================================

function getIconByName(name: string): React.ReactNode {
  const icons = LucideIcons as unknown as Record<string, React.FC<{ className?: string }>>;
  const IconComponent = icons[name];
  if (IconComponent) {
    return <IconComponent className="w-4 h-4" />;
  }
  return <Package className="w-4 h-4" />;
}

// ============================================================================
// CATEGORY LABELS & ICONS
// ============================================================================

const categoryConfig: Record<MaterialCategory, { label: string; icon: keyof typeof LucideIcons; color: string; bg: string }> = {
  [MaterialCategory.MEDIA]: { label: 'Phương tiện', icon: 'Film', color: 'text-rose-500', bg: 'bg-rose-50' },
  [MaterialCategory.INTERACTIVE]: { label: 'Tương tác', icon: 'MousePointer2', color: 'text-violet-500', bg: 'bg-violet-50' },
  [MaterialCategory.DATA]: { label: 'Dữ liệu & Biểu đồ', icon: 'BarChart3', color: 'text-orange-400', bg: 'bg-orange-50' },
  [MaterialCategory.EMBED]: { label: 'Nhúng ngoài', icon: 'Code', color: 'text-pink-500', bg: 'bg-pink-50' },
};

// ============================================================================
// DRAGGABLE MATERIAL ITEM
// ============================================================================

function DraggableMaterialItem({ material }: MaterialItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `material-${material.id}`,
    data: {
      type: 'MATERIAL',
      material,
    },
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 1000 : undefined,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-3 p-2 rounded-lg cursor-grab',
        'bg-white border border-gray-100',
        'hover:border-rose-300 hover:bg-rose-50/40',
        'transition-all duration-150',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-rose-400'
      )}
      {...listeners}
      {...attributes}
    >
      {/* Drag Handle */}
      <div className="flex-shrink-0 text-gray-300 group-hover:text-rose-400">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center',
          'bg-violet-50',
          'text-violet-500'
        )}
      >
        {getIconByName(material.icon)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-gray-900 truncate">
          {material.name}
        </h4>
        <p className="text-xs text-gray-500 truncate">
          {material.description}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// CATEGORY SECTION
// ============================================================================

function CategorySection({ category, materials, isExpanded, onToggle }: CategorySectionProps) {
  const config = categoryConfig[category];
  const icons = LucideIcons as unknown as Record<string, React.FC<{ className?: string }>>;
  const CategoryIcon = icons[config.icon];

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* Category Header */}
      <button
        onClick={onToggle}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2.5',
          'text-left hover:bg-rose-50/50 transition-colors'
        )}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
        <div className={cn('w-6 h-6 rounded flex items-center justify-center flex-shrink-0', config.bg)}>
          {CategoryIcon && <CategoryIcon className={cn('w-3.5 h-3.5', config.color)} />}
        </div>
        <span className="flex-1 text-sm font-semibold text-slate-700">
          {config.label}
        </span>
        <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', config.bg, config.color)}>
          {materials.length}
        </span>
      </button>

      {/* Materials List */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          {materials.map((material) => (
            <DraggableMaterialItem key={material.id} material={material} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MaterialSidebar({ className }: MaterialSidebarProps) {
  const [materials, setMaterials] = useState<IMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<MaterialCategory>>(
    new Set(Object.values(MaterialCategory))
  );

  // --------------------------------------------------------------------------
  // Fetch materials on mount
  // --------------------------------------------------------------------------
  useEffect(() => {
    async function fetchMaterials() {
      try {
        setLoading(true);
        const response = await fetch('/api/materials');
        const result = await response.json();

        if (result.success) {
          setMaterials(result.data);
        } else {
          setError('Failed to load materials');
        }
      } catch (err) {
        setError('Network error');
        console.error('Failed to fetch materials:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMaterials();
  }, []);

  // --------------------------------------------------------------------------
  // Filter materials by search query
  // --------------------------------------------------------------------------
  const filteredMaterials = useMemo(() => {
    if (!searchQuery.trim()) return materials;

    const query = searchQuery.toLowerCase();
    return materials.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.description.toLowerCase().includes(query)
    );
  }, [materials, searchQuery]);

  // --------------------------------------------------------------------------
  // Group materials by category
  // --------------------------------------------------------------------------
  const materialsByCategory = useMemo(() => {
    const grouped: Record<MaterialCategory, IMaterial[]> = {
      [MaterialCategory.MEDIA]: [],
      [MaterialCategory.INTERACTIVE]: [],
      [MaterialCategory.DATA]: [],
      [MaterialCategory.EMBED]: [],
    };

    filteredMaterials.forEach((material) => {
      if (grouped[material.category]) {
        grouped[material.category].push(material);
      }
    });

    return grouped;
  }, [filteredMaterials]);

  // --------------------------------------------------------------------------
  // Toggle category expansion
  // --------------------------------------------------------------------------
  const toggleCategory = (category: MaterialCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <aside
      className={cn(
        'w-72 bg-white border-l border-gray-100',
        'flex flex-col h-full overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-white">
        <h2 className="text-base font-bold text-slate-800 mb-3">
          Thư viện tài nguyên
        </h2>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm tài nguyên..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              'w-full pl-9 pr-3 py-2 text-sm',
              'border border-gray-200 rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-rose-400 focus:border-transparent',
              'placeholder:text-gray-400'
            )}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-6 h-6 text-rose-400 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-4 text-center">
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-2 text-sm text-rose-500 hover:underline"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredMaterials.length === 0 && (
          <div className="p-4 text-center">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              {searchQuery ? 'Không tìm thấy tài nguyên' : 'Chưa có tài nguyên nào'}
            </p>
          </div>
        )}

        {/* Categories */}
        {!loading && !error && filteredMaterials.length > 0 && (
          <div className="divide-y divide-gray-100">
            {Object.values(MaterialCategory).map((category) => {
              const categoryMaterials = materialsByCategory[category];
              if (categoryMaterials.length === 0) return null;

              return (
                <CategorySection
                  key={category}
                  category={category}
                  materials={categoryMaterials}
                  isExpanded={expandedCategories.has(category)}
                  onToggle={() => toggleCategory(category)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Layout Buttons */}
      <QuickLayoutSection />

      {/* Footer Hint */}
      <div className="p-3 bg-gradient-to-r from-rose-50 to-violet-50 border-t border-rose-100">
        <p className="text-xs text-rose-500 text-center">
          <span className="font-semibold">Mẹo:</span> Kéo tài nguyên vào các cột bố cục
        </p>
      </div>
    </aside>
  );
}

// ============================================================================
// QUICK LAYOUT SECTION
// ============================================================================

function QuickLayoutSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'freeform'>('basic');
  const addCardFromTemplate = useDocumentStore((state) => state.addCardFromTemplate);

  const handleAddTemplate = (templateType: string) => {
    addCardFromTemplate(templateType);
    setIsModalOpen(false);
  };

  return (
    <>
      <div className="p-3 border-t border-gray-100 bg-white">
        <button
          onClick={() => setIsModalOpen(true)}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg',
            'font-semibold text-sm transition-all duration-150',
            'bg-gradient-to-r from-rose-500 to-violet-500 text-white hover:from-rose-600 hover:to-violet-600 shadow-sm hover:shadow-md'
          )}
        >
          <Sparkles className="w-4 h-4" />
          Bố cục nhanh
        </button>
      </div>

      {/* Card Templates Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Chọn bố cục trang"
        size="xl"
        bodyClassName="p-0"
        className="max-w-4xl"
      >
        <div className="max-h-[70vh] overflow-y-auto">
          {/* Tabs */}
          <div className="px-6 pt-4 flex gap-1 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('basic')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
                activeTab === 'basic'
                  ? 'bg-white text-rose-500 border border-b-white border-gray-200 -mb-px'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              Cơ bản
            </button>
            <button
              onClick={() => setActiveTab('freeform')}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-t-lg transition-colors',
                activeTab === 'freeform'
                  ? 'bg-white text-rose-500 border border-b-white border-gray-200 -mb-px'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              Tùy chỉnh
            </button>
          </div>

          {/* Basic Tab */}
          {activeTab === 'basic' && (
            <div className="px-6 py-4">
              <p className="text-xs text-gray-500 mb-4">
                Các mẫu bố cục cột sẵn có
              </p>
              <div className="grid grid-cols-3 gap-4">
                {basicCardTemplates.map((template) => (
                  <button
                    key={template.type}
                    onClick={() => handleAddTemplate(template.type)}
                    className={cn(
                      'flex flex-col gap-2 p-0 rounded-lg',
                      'transition-all duration-150',
                      'hover:scale-[1.02]'
                    )}
                  >
                    <div
                      className={cn(
                        'aspect-[4/3] w-full h-32 rounded-lg overflow-hidden',
                        'border-2 transition-all duration-150',
                        'border-gray-100 hover:border-rose-400 hover:shadow-md'
                      )}
                    >
                      {template.preview}
                    </div>
                    <span className="text-xs text-center px-1 text-gray-700">
                      {template.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Freeform Tab */}
          {activeTab === 'freeform' && (
            <div className="px-6 py-4">
              <p className="text-xs text-gray-500 mb-4">
                Các mẫu trang đặc biệt không theo cấu trúc cột cố định
              </p>
              <div className="grid grid-cols-3 gap-4">
                {freeformCardTemplates.map((template) => (
                  <button
                    key={template.type}
                    onClick={() => handleAddTemplate(template.type)}
                    className={cn(
                      'flex flex-col gap-2 p-0 rounded-lg',
                      'transition-all duration-150',
                      'hover:scale-[1.02]'
                    )}
                  >
                    <div
                      className={cn(
                        'w-full h-32 rounded-lg overflow-hidden',
                        'border-2 transition-all duration-150',
                        'border-gray-100 hover:border-rose-400 hover:shadow-md'
                      )}
                    >
                      {template.preview}
                    </div>
                    <span className="text-xs text-center px-1 text-gray-700">
                      {template.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}

export default MaterialSidebar;
