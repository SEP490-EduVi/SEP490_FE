/**
 * Tree Utility Functions
 * ======================
 * 
 * Pure utility functions for immutable tree traversal and manipulation.
 * Used by all store actions that need to update the document tree.
 */

import { INode, ILayout, LayoutVariant } from '@/types';

// ============================================================================
// TREE TRAVERSAL
// ============================================================================

/**
 * Find a node in the tree by ID (recursive)
 */
export function findNode(nodes: INode[], nodeId: string): INode | null {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    if (node.children.length > 0) {
      const found = findNode(node.children as INode[], nodeId);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Find parent of a node by ID
 */
export function findParent(
  nodes: INode[],
  nodeId: string,
  parent: INode | null = null
): { parent: INode | null; index: number } | null {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.id === nodeId) {
      return { parent, index: i };
    }
    if (node.children.length > 0) {
      const found = findParent(node.children as INode[], nodeId, node);
      if (found) return found;
    }
  }
  return null;
}

// ============================================================================
// TREE MUTATIONS (IMMUTABLE)
// ============================================================================

/**
 * Update a node in the tree immutably
 */
export function updateNodeInTree<T extends INode>(
  nodes: T[],
  nodeId: string,
  updater: (node: INode) => INode
): T[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return updater(node) as T;
    }
    if (node.children.length > 0) {
      return {
        ...node,
        children: updateNodeInTree(node.children as INode[], nodeId, updater),
      } as T;
    }
    return node;
  }) as T[];
}

/**
 * Delete a node from the tree immutably
 */
export function deleteNodeFromTree<T extends INode>(nodes: T[], nodeId: string): T[] {
  return nodes
    .filter((node) => node.id !== nodeId)
    .map((node) => {
      if (node.children.length > 0) {
        return {
          ...node,
          children: deleteNodeFromTree(node.children as INode[], nodeId),
        } as T;
      }
      return node;
    }) as T[];
}

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Reorder items in an array (for drag & drop)
 */
export function arrayMove<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const newArray = [...array];
  const [movedItem] = newArray.splice(fromIndex, 1);
  newArray.splice(toIndex, 0, movedItem);
  return newArray;
}

// ============================================================================
// LAYOUT UTILITIES
// ============================================================================

/**
 * Get column count for a layout variant
 */
export function getColumnCountForVariant(variant: LayoutVariant): number {
  switch (variant) {
    case LayoutVariant.TWO_COLUMN:
    case LayoutVariant.SIDEBAR_LEFT:
    case LayoutVariant.SIDEBAR_RIGHT:
      return 2;
    case LayoutVariant.THREE_COLUMN:
      return 3;
    default:
      return 1;
  }
}

// ============================================================================
// DEEP CLONE
// ============================================================================

/**
 * Deep clone helper for immutable updates
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
