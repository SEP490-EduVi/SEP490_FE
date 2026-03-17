/**
 * Store Types
 * ===========
 * 
 * Shared type definitions for the document store.
 * Extracted so action slices can reference them without circular imports.
 */

import {
  IDocument,
  ICard,
  INode,
  BlockType,
  BlockContent,
  LayoutVariant,
  IBlockStyles,
  IMaterial,
} from '@/types';

// ============================================================================
// APP MODE
// ============================================================================

export type AppMode = 'EDITOR' | 'PRESENT';

// ============================================================================
// STORE STATE & ACTIONS INTERFACE
// ============================================================================

export interface DocumentState {
  // State
  document: IDocument | null;
  activeCardId: string | null;
  selectedNodeId: string | null;
  isLoading: boolean;
  error: string | null;
  currentProductCode: string | null;
  isSaving: boolean;
  
  // History for undo/redo
  history: IDocument[];
  historyIndex: number;
  
  // Online users
  onlineUsers: Array<{ id: string; name: string; avatar: string; color: string }>;
  
  // App Mode State
  appMode: AppMode;
  presentationSlideIndex: number;

  // Editing State (which node is currently being edited in Tiptap)
  editingNodeId: string | null;

  // Slide Generation State (progressive reveal)
  isGenerating: boolean;
  generationStep: string | null;
  generationProgress: number;
  generationProductCode: string | null;
  revealedCardCount: number;

  // Document Actions
  loadDocument: () => Promise<void>;
  setDocument: (doc: IDocument, productCode?: string) => void;
  saveSlide: () => Promise<void>;
  
  // Undo/Redo Actions
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Online Users Actions
  setOnlineUsers: (users: Array<{ id: string; name: string; avatar: string; color: string }>) => void;
  
  // App Mode Actions
  setAppMode: (mode: AppMode) => void;
  startPresentation: () => void;
  exitPresentation: () => void;
  nextSlide: () => void;
  previousSlide: () => void;
  goToSlide: (index: number) => void;
  
  // Navigation Actions
  setActiveCard: (cardId: string) => void;
  setSelectedNode: (nodeId: string | null) => void;
  setEditingNodeId: (nodeId: string | null) => void;
  
  // Node CRUD Actions
  addCard: (title?: string) => void;
  addCardFromTemplate: (templateType: string) => void;
  addBlockToCard: (cardId: string, blockType: BlockType) => void;
  addLayoutToCard: (cardId: string, variant: LayoutVariant) => void;
  addBlockToLayout: (layoutId: string, blockType: BlockType) => void;
  
  // Update Actions
  updateNode: (nodeId: string, updates: Partial<INode>) => void;
  updateBlockContent: (blockId: string, content: BlockContent) => void;
  updateBlockStyles: (blockId: string, styles: IBlockStyles) => void;
  updateCardTitle: (cardId: string, title: string) => void;
  setCardContentAlignment: (cardId: string, alignment: 'top' | 'center' | 'bottom') => void;
  setCardBackground: (cardId: string | null, color: string) => void;
  updateLayoutColumnWidths: (layoutId: string, columnWidths: number[]) => void;
  
  // Delete Actions
  deleteNode: (nodeId: string) => void;
  
  // Reorder Actions (for drag & drop)
  reorderCards: (activeId: string, overId: string) => void;
  reorderNodesInCard: (cardId: string, activeId: string, overId: string) => void;
  reorderNodesInLayout: (cardId: string, layoutId: string, activeId: string, overId: string) => void;
  
  // Material/Widget Actions
  dropMaterial: (parentId: string, material: IMaterial, columnIndex?: number, customData?: Record<string, unknown>) => void;
  createWidgetGroup: (cardId: string, variant: LayoutVariant, materials: IMaterial[]) => void;
  wrapBlocksInLayout: (cardId: string, blockIds: string[], variant: LayoutVariant) => void;
  
  // Generation Actions
  startGeneration: (productCode: string) => void;
  setGenerationProgress: (step: string, progress: number) => void;
  completeGeneration: (doc: IDocument) => void;
  cancelGeneration: () => void;
  revealNextCard: () => void;
  finishReveal: () => void;

  // Utility
  getActiveCard: () => ICard | null;
  findNodeById: (nodeId: string) => INode | null;
}

// ============================================================================
// ACTION CREATOR HELPERS
// ============================================================================

/**
 * Common params passed to all action creator functions.
 * Avoids tight coupling to Zustand's internal API.
 */
export type StoreGet = () => DocumentState;
export type StoreSet = (partial: Partial<DocumentState>) => void;
export type SetDocumentWithHistory = (
  newDoc: IDocument,
  otherUpdates?: Partial<Omit<DocumentState, 'document' | 'history' | 'historyIndex'>>
) => void;
