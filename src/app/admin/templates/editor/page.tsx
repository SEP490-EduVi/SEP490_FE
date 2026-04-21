'use client';

/**
 * Admin Template Editor
 * =====================
 *
 * Full-screen editor for creating / editing card layout templates.
 * Reuses the exact same MainStage + Sidebar + DndContext stack as the
 * teacher editor — the only difference is the custom header bar that
 * exposes "Save template" instead of the regular Toolbar.
 *
 * URL params:
 *   ?templateCode=xxx   — edit mode: loads existing template
 *   (no param)          — create mode: starts with a blank document
 */

import React, { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  useSensor,
  useSensors,
  PointerSensor,
  KeyboardSensor,
  pointerWithin,
  rectIntersection,
  closestCenter,
  CollisionDetection,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { ContextualTextToolbar } from '@/components/blocks/FloatingTextToolbar';
import { Modal } from '@/components/common/Modal';
import { useDocumentStore } from '@/store';
import { Sidebar, MainStage } from '@/components/layout';
import { MaterialSidebar } from '@/components/sidebar/MaterialSidebar';
import { notify, MSGS } from '@/components/common';
import { IMaterial, BlockType } from '@/types';
import type { PurchasedMaterialDto } from '@/types/api';
import { useTemplate, useCreateTemplate, useUpdateTemplate } from '@/hooks/useTemplateApi';
import { extractSkeleton } from '@/store/helpers/skeletonUtils';
import { hydrateSkeleton } from '@/store/helpers/skeletonUtils';
import { Package } from 'lucide-react';

// ────────────────────────────────────────────────────────────────────────────
// Collision detection (copied from teacher editor)
// ────────────────────────────────────────────────────────────────────────────
const customCollisionDetection: CollisionDetection = (args) => {
  const { active } = args;
  const isDraggingBlock =
    !active.data.current?.material &&
    !active.data.current?.purchasedMaterial &&
    active.data.current?.type !== 'INSERT_TEMPLATE' &&
    active.data.current?.type !== 'INSERT_BLOCK';

  if (isDraggingBlock) {
    const sortableOnly = {
      ...args,
      droppableContainers: args.droppableContainers.filter((c) => {
        const t = c.data.current?.type as string | undefined;
        return t !== 'CARD' && t !== 'LAYOUT_COLUMN';
      }),
    };
    return closestCenter(sortableOnly);
  }

  const pointerCollisions = pointerWithin(args);
  const columnCollision = pointerCollisions.find(
    (c) => c.data?.droppableContainer?.data?.current?.type === 'LAYOUT_COLUMN',
  );
  if (columnCollision) return [columnCollision];

  const cardCollision = pointerCollisions.find(
    (c) => c.data?.droppableContainer?.data?.current?.type === 'CARD',
  );
  if (cardCollision) return [cardCollision];

  const rectCollisions = rectIntersection(args);
  return rectCollisions.length > 0 ? rectCollisions : pointerCollisions;
};

// ────────────────────────────────────────────────────────────────────────────
// Page component
// ────────────────────────────────────────────────────────────────────────────
export default function AdminTemplateEditorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateCode = searchParams.get('templateCode') ?? undefined;
  const isEditMode = !!templateCode;

  // Store selectors
  const setDocument = useDocumentStore((s) => s.setDocument);
  const getActiveCard = useDocumentStore((s) => s.getActiveCard);
  const addCardFromTemplate = useDocumentStore((s) => s.addCardFromTemplate);
  const activeCardId = useDocumentStore((s) => s.activeCardId);
  const dropMaterial = useDocumentStore((s) => s.dropMaterial);
  const dropPurchasedMaterial = useDocumentStore((s) => s.dropPurchasedMaterial);
  const reorderNodesInCard = useDocumentStore((s) => s.reorderNodesInCard);
  const reorderNodesInLayout = useDocumentStore((s) => s.reorderNodesInLayout);

  // Save modal state
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Mutations
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const isSaving = createTemplate.isPending || updateTemplate.isPending;

  // Load existing template in edit mode
  const { data: existingTemplate, isLoading: isLoadingTemplate } = useTemplate(templateCode);

  // Track whether we've already initialised the document for this session
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;

    if (isEditMode) {
      // Wait for the template to load
      if (!existingTemplate) return;
      setName(existingTemplate.name);
      setDescription(existingTemplate.description ?? '');
      // Hydrate the skeleton into a document so the editor can render it
      const card = hydrateSkeleton(existingTemplate.skeleton, existingTemplate.name);
      setDocument(
        {
          id: `admin-template-${existingTemplate.templateCode}`,
          title: existingTemplate.name,
          cards: [card],
          activeCardId: card.id,
          createdAt: existingTemplate.createdAt,
          updatedAt: existingTemplate.updatedAt,
        },
      );
    } else {
      // Create mode: blank document with a single empty card via built-in template
      setDocument({
        id: `admin-template-new-${Date.now()}`,
        title: 'Template mới',
        cards: [],
        activeCardId: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      // Add one blank slide to start editing immediately
      addCardFromTemplate('two-columns');
    }

    didInit.current = true;
  }, [existingTemplate, isEditMode, setDocument, addCardFromTemplate]);

  // ── Open save modal ─────────────────────────────────────────────────────
  const handleOpenSaveModal = () => {
    const activeCard = getActiveCard();
    if (!activeCard) {
      notify.error(MSGS.template.noSlideError);
      return;
    }
    setShowSaveModal(true);
  };

  // ── Save ────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      notify.error(MSGS.template.nameRequired);
      return;
    }

    const activeCard = getActiveCard();
    if (!activeCard) {
      notify.error(MSGS.template.noSlideError);
      return;
    }

    const skeleton = extractSkeleton(activeCard);

    try {
      if (isEditMode && templateCode) {
        await updateTemplate.mutateAsync({
          templateCode,
          input: { name: trimmedName, category: 'layout', description: description.trim() || undefined, skeleton },
        });
        notify.success(MSGS.template.updateSuccess);
      } else {
        await createTemplate.mutateAsync({
          name: trimmedName,
          category: 'layout',
          description: description.trim() || undefined,
          skeleton,
        });
        notify.success(MSGS.template.createSuccess);
      }
      router.push('/admin/templates');
    } catch {
      notify.error(MSGS.template.saveError);
    } finally {
      setShowSaveModal(false);
    }
  };

  // ── DnD sensors ─────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const [activeDragItem, setActiveDragItem] = useState<IMaterial | null>(null);
  const [activePurchasedDrag, setActivePurchasedDrag] = useState<PurchasedMaterialDto | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (active.data.current?.material) setActiveDragItem(active.data.current.material as IMaterial);
    else if (active.data.current?.purchasedMaterial) setActivePurchasedDrag(active.data.current.purchasedMaterial as PurchasedMaterialDto);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const dragData = active.data.current;

    setActiveDragItem(null);
    setActivePurchasedDrag(null);

    if (dragData?.type === 'INSERT_TEMPLATE' && dragData.templateType) {
      addCardFromTemplate(dragData.templateType as string);
      return;
    }

    if (dragData?.type === 'INSERT_BLOCK' && dragData.blockType) {
      if (over?.data.current?.type === 'LAYOUT_COLUMN') {
        useDocumentStore.getState().addBlockToLayout(over.data.current.layoutId as string, dragData.blockType as BlockType);
        return;
      }
      const targetCardId = (over?.data.current?.type === 'CARD' && (over.data.current.cardId as string)) || activeCardId;
      if (targetCardId) useDocumentStore.getState().addBlockToCard(targetCardId, dragData.blockType as BlockType);
      return;
    }

    if (!over) return;

    if (dragData?.purchasedMaterial) {
      const pm = dragData.purchasedMaterial as PurchasedMaterialDto;
      if (!pm.type.toLowerCase().includes('video') && over?.data.current?.type === 'LAYOUT_COLUMN') {
        dropPurchasedMaterial(over.data.current.layoutId as string, pm);
        return;
      }
      const targetCardId = (over.data.current?.type === 'CARD' && (over.data.current.cardId as string)) || activeCardId;
      dropPurchasedMaterial(targetCardId, pm);
      return;
    }

    if (dragData?.material) {
      const material = dragData.material as IMaterial;
      if (over.data.current?.type === 'LAYOUT_COLUMN') {
        dropMaterial(over.data.current.layoutId as string, material, over.data.current.columnIndex as number);
        return;
      }
      if (over.data.current?.type === 'CARD') { dropMaterial(over.data.current.cardId as string, material); return; }
      if (activeCardId) dropMaterial(activeCardId, material);
    } else {
      const overType = over.data.current?.type as string | undefined;
      if (overType === 'CARD' || overType === 'LAYOUT_COLUMN') return;
      if (active.id !== over.id && activeCardId) {
        const parentLayoutId = active.data.current?.parentLayoutId;
        if (parentLayoutId) reorderNodesInLayout(activeCardId, parentLayoutId as string, active.id as string, over.id as string);
        else reorderNodesInCard(activeCardId, active.id as string, over.id as string);
      }
    }
  };

  if (isEditMode && isLoadingTemplate) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Đang tải template...</span>
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="h-screen flex flex-col bg-surface-tertiary">
          {/* ── Custom Header (replaces Toolbar) ────────────────── */}
          <div className="h-14 flex items-center gap-3 px-4 bg-white border-b border-gray-200 flex-shrink-0 z-20">
            {/* Back */}
            <button
              onClick={() => router.push('/admin/templates')}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </button>

            <div className="w-px h-5 bg-gray-200" />

            {/* Template name display (edit mode only) */}
            {isEditMode && name && (
              <span className="text-sm font-medium text-gray-700 truncate max-w-xs">{name}</span>
            )}

            <div className="flex-1" />

            {/* Save / Update button → opens modal */}
            <button
              onClick={handleOpenSaveModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save className="w-4 h-4" />
              {isEditMode ? 'Cập nhật' : 'Lưu template'}
            </button>
          </div>

          {/* ── Editor body (same as teacher editor) ──────────────── */}
          <div className="flex-1 flex overflow-hidden">
            <Sidebar />
            <MainStage />
            <MaterialSidebar />
          </div>
        </div>

        {/* ── Floating text toolbar (portal-based, must be inside DndContext tree) ── */}
        <ContextualTextToolbar />

        <DragOverlay zIndex={10001}>
          {activeDragItem && (
            <div className="bg-white border-2 border-indigo-400 rounded-lg p-3 shadow-xl opacity-90">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded flex items-center justify-center">
                  <Package className="w-4 h-4 text-indigo-600" />
                </div>
                <p className="text-sm font-medium">{activeDragItem.name}</p>
              </div>
            </div>
          )}
          {activePurchasedDrag && (
            <div className="bg-white border-2 border-blue-400 rounded-lg p-3 shadow-xl opacity-90">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                  <Package className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-sm font-medium">{activePurchasedDrag.title}</p>
              </div>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* ── Save / Update Modal ─────────────────────────────────────────────── */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        title={isEditMode ? 'Cập nhật template' : 'Lưu template mới'}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowSaveModal(false)}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Huỷ
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSaving ? 'Đang lưu...' : isEditMode ? 'Cập nhật' : 'Tạo template'}
            </button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên template <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên template..."
              autoFocus
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category badge (fixed, display only) */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
              Template do quản trị viên tạo
            </span>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả <span className="text-xs text-gray-400">(tuỳ chọn)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về template..."
              className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
