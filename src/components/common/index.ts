/**
 * Common Components Index
 * =======================
 * 
 * Centralized exports for reusable common components.
 */

export { Modal } from './Modal';
export type { ModalProps } from './Modal';

export { Breadcrumb } from './Breadcrumb';
export type { BreadcrumbItem } from './Breadcrumb';

export { ToastProvider, notify } from './ToastProvider';
export { GcsImage, resolveGcsUrl } from './GcsImage';

/**
 * MSGS — Centralized notification message strings.
 * Import alongside `notify` to keep all user-facing strings in one place.
 *
 * @example
 *   import { notify, MSGS } from '@/components/common';
 *   notify.success(MSGS.project.createSuccess('My Project'));
 *   notify.error(MSGS.slide.deleteError);
 */
export { MSGS } from './notifications';
