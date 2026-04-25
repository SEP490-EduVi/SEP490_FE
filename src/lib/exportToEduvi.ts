/**
 * EduVi Export Utility
 * ====================
 * 
 * Serializes the document state to .eduvi JSON format.
 * This file is consumed by the Flutter Viewer app.
 * 
 * File Format (.eduvi):
 * - JSON with strict schema
 * - Contains metadata, cards, and all block content
 * - Version-controlled for backwards compatibility
 * 
 * Usage:
 *   import { exportToEduvi } from '@/lib/exportToEduvi';
 *   import { useDocumentStore } from '@/store/useDocumentStore';
 *   
 *   const document = useDocumentStore.getState().document;
 *   exportToEduvi(document);
 */

import { 
  IDocument, 
  ICard, 
  ILayout, 
  IBlock,
  IBlockStyles,
  BlockType,
  LayoutVariant,
} from '@/types/nodes';

// ============================================================================
// EXPORT SCHEMA VERSION
// ============================================================================

const EDUVI_SCHEMA_VERSION = '1.1.0';
const EDUVI_FILE_EXTENSION = '.eduvi';
const DEFAULT_MEDIA_FETCH_TIMEOUT_MS = 10000;

// ============================================================================
// TYPES
// ============================================================================

/**
 * The strict schema for .eduvi files
 * This is what Flutter will parse
 */
export interface EduViFileSchema {
  /** Schema version for backwards compatibility */
  version: string;
  
  /** Export timestamp (ISO 8601) */
  exportedAt: string;
  
  /** Document metadata */
  metadata: {
    title: string;
    description: string;
    author?: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
    projectCode?: string;
    projectName?: string;
    subjectCode?: string;
    subjectName?: string;
    gradeCode?: string;
    gradeName?: string;
    lessonCode?: string;
    lessonName?: string;
    classroomCode?: string;
    classroomName?: string;
    curriculumYear?: number;
    folderName?: string;
    packageType?: EduViPackageType;
  };
  
  /** The actual content - array of cards (slides) */
  cards: EduViCard[];

  /** Optional exported game payloads linked to this product */
  games?: EduViGame[];

  /** Optional exported video payloads linked to this product */
  videos?: EduViVideo[];

  /** Optional embedded assets for offline playback in Flutter desktop app */
  assets?: Record<string, EduViAsset>;

  /** Raw source document preserved for exact round-trip rendering/import */
  sourceDocument?: IDocument;

  /** Export quality details for diagnostics */
  integrity?: EduViIntegrity;
}

export interface EduViIntegrity {
  warnings: string[];
  stats: EduViStats;
  offlineReady?: boolean;
}

export interface EduViStats {
  totalCards: number;
  totalLayouts: number;
  totalBlocks: number;
  cardsWithoutLayouts: number;
  blocksByType: Record<string, number>;
  unresolvedMediaCount: number;
  embeddedAssetCount: number;
}

export type EduViAssetKind = 'image' | 'video' | 'poster' | 'card-background' | 'generic';

export interface EduViAsset {
  mimeType: string;
  base64: string;
  originalUrl: string;
  kind: EduViAssetKind;
}

export interface EduViExportOptions {
  /** Embed images/videos as base64 assets and rewrite URLs to asset://<id> */
  embedAssets?: boolean;
  /** Pretty-print JSON output */
  pretty?: boolean;
  /** Throw error if schema validation fails */
  failOnValidationError?: boolean;
  /** Throw error when export is not fully offline-ready */
  requireOfflineReady?: boolean;
  /** Optional academic classification metadata to include in export */
  academicContext?: Partial<EduViAcademicContext>;
  /** Optional project name used as preferred export title */
  projectName?: string;
  /** Optional games to include in the exported EduVi package */
  games?: EduViGame[];
  /** Optional videos to include in the exported EduVi package */
  videos?: EduViVideo[];
  /** Logical folder name written into metadata for app-side grouping */
  folderName?: string;
  /** Package intent of this export file */
  packageType?: EduViPackageType;
  /** Optional suffix appended to generated file name (e.g. slide/game) */
  fileNameSuffix?: string;
  /** Timeout per asset fetch in milliseconds */
  mediaFetchTimeoutMs?: number;
}

export type EduViPackageType = 'slide' | 'game' | 'combined' | 'video';

export interface EduViAcademicContext {
  projectCode?: string;
  projectName?: string;
  subjectCode?: string;
  subjectName?: string;
  gradeCode?: string;
  gradeName?: string;
  lessonCode?: string;
  lessonName?: string;
  classroomCode?: string;
  classroomName?: string;
  curriculumYear?: number;
}

export interface EduViExportResult {
  fileName: string;
  schema: EduViFileSchema;
  validation: { valid: boolean; errors: string[] };
}

export interface EduViCard {
  id: string;
  title: string;
  order: number;
  templateId?: string;
  backgroundColor?: string;
  backgroundImage?: string;
  contentAlignment?: 'top' | 'center' | 'bottom';
  isVideoSlide?: boolean;
  renderedHtml?: string;
  layouts: EduViLayout[];
}

export interface EduViGame {
  gameCode: string;
  productGameCode: string;
  productCode: string;
  productGameName: string;
  templateCode: string;
  roundCount: number;
  status: string;
  resultJson: unknown;
}

export interface EduViVideo {
  productVideoCode: string;
  productCode: string;
  productName: string;
  status: string;
  duration: number | null;
  videoUrl: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string | null;
  interactions?: unknown;
}

export interface EduViLayout {
  id: string;
  variant: string; // LayoutVariant as string
  order: number;
  gap?: number;
  columnWidths?: number[];
  blocks: EduViBlock[];
}

export interface EduViBlock {
  id: string;
  type: string; // BlockType as string
  columnIndex: number;
  order: number;
  styles?: IBlockStyles;
  isResizable?: boolean;
  content: EduViBlockContent;
}

/**
 * Union type for all possible block content
 * Each type has its own structure
 */
export interface EduViHeadingContent {
  type: 'HEADING';
  html: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

export type EduViBlockContent = 
  | EduViTextContent
  | EduViHeadingContent
  | EduViImageContent
  | EduViVideoContent
  | EduViCodeContent
  | EduViQuizContent
  | EduViFlashcardContent
  | EduViFillBlankContent
  | EduViTableContent
  | EduViChartContent
  | EduViEmbedContent
  | Record<string, unknown>; // Fallback for unknown types

export interface EduViTextContent {
  type: 'TEXT';
  html?: string;
  text?: string;
  format?: 'plain' | 'html' | 'markdown';
}

export interface EduViImageContent {
  type: 'IMAGE';
  src: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  /** Set by export when src is empty — Flutter should render a placeholder with the alt text */
  missingMedia?: boolean;
}

export interface EduViVideoContent {
  type: 'VIDEO';
  src: string;
  provider?: 'youtube' | 'vimeo' | 'direct';
  poster?: string;
  autoplay?: boolean;
  /** Set by export when src is empty — Flutter should render a placeholder */
  missingMedia?: boolean;
}

export interface EduViCodeContent {
  type: 'CODE';
  code: string;
  language: string;
  showLineNumbers?: boolean;
}

export interface EduViQuizContent {
  type: 'QUIZ';
  title: string;
  questions: Array<{
    id: string;
    question: string;
    options: Array<{
      id: string;
      text: string;
    }>;
    correctIndex: number;
    explanation?: string;
  }>;
}

export interface EduViFlashcardContent {
  type: 'FLASHCARD';
  front: string;
  back: string;
}

export interface EduViFillBlankContent {
  type: 'FILL_BLANK';
  sentence: string;
  blanks: string[];
}

export interface EduViTableContent {
  type: 'TABLE';
  headers: string[];
  rows: string[][];
}

export interface EduViChartContent {
  type: 'CHART';
  chartType: string;
  data: unknown;
  options?: unknown;
}

export interface EduViEmbedContent {
  type: 'EMBED';
  url: string;
  embedType?: string;
}

// ============================================================================
// TRANSFORM FUNCTIONS
// ============================================================================

function transformBlock(block: IBlock, order: number, columnIndex: number): EduViBlock {
  const content = block.content || {};
  const contentType = (content as { type?: string }).type || 'UNKNOWN';
  
  // Content already has type field, spread it
  const contentWithType: Record<string, unknown> = {
    ...content,
  };

  // Flag media blocks that have no src so the Flutter app can render a placeholder
  if (contentType === BlockType.IMAGE || contentType === BlockType.VIDEO) {
    const src = typeof contentWithType.src === 'string' ? contentWithType.src : '';
    if (!src) {
      contentWithType.missingMedia = true;
    }
  }

  return {
    id: block.id,
    type: contentType,
    columnIndex,
    order,
    styles: block.styles,
    isResizable: block.isResizable,
    content: contentWithType as EduViBlockContent,
  };
}

/**
 * Get column count for a layout variant
 */
function getColumnCount(variant: string): number {
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

function transformLayout(layout: ILayout, order: number): EduViLayout {
  const columnCount = getColumnCount(layout.variant);
  const preservedColumnWidths = preserveColumnWidths(layout.columnWidths, columnCount);
  
  // Map blocks with their calculated column index
  const blocks = layout.children
    .filter((child): child is IBlock => 'content' in child)
    .map((block, idx) => {
    // Column index is determined by position: index % columnCount
    const columnIndex = idx % columnCount;
    return transformBlock(block as IBlock, idx, columnIndex);
  });

  return {
    id: layout.id,
    variant: layout.variant,
    order,
    gap: layout.gap,
    columnWidths: preservedColumnWidths,
    blocks,
  };
}

function transformCard(card: ICard, order: number): EduViCard {
  // Export explicit layouts first.
  const layouts = card.children
    .filter((child): child is ILayout => 'variant' in child)
    .map((layout, idx) => transformLayout(layout, idx));

  // Backward compatibility: if a card contains direct blocks,
  // wrap them into an implicit SINGLE layout so no content is lost in export.
  const standaloneBlocks = card.children
    .filter((child): child is IBlock => 'content' in child)
    .map((block, idx) => transformBlock(block, idx, 0));

  if (standaloneBlocks.length > 0) {
    layouts.push({
      id: `${card.id}-implicit-single-layout`,
      variant: LayoutVariant.SINGLE,
      order: layouts.length,
      blocks: standaloneBlocks,
    });
  }

  return {
    id: card.id,
    title: card.title,
    order,
    templateId: card.templateId,
    backgroundColor: card.backgroundColor,
    backgroundImage: card.backgroundImage,
    contentAlignment: card.contentAlignment,
    isVideoSlide: card.isVideoSlide,
    renderedHtml: card.renderedHtml,
    layouts,
  };
}

function preserveColumnWidths(columnWidths: number[] | undefined, columnCount: number): number[] | undefined {
  if (columnCount <= 1) return undefined;

  const fallback = Array.from({ length: columnCount }, () => 100 / columnCount);
  if (!columnWidths || columnWidths.length !== columnCount) return fallback;

  const parsed = columnWidths.map((value) => {
    if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) {
      return 0;
    }
    return Math.max(value, 0);
  });

  const total = parsed.reduce((sum, value) => sum + value, 0);
  if (total <= 0) return fallback;

  return parsed;
}

function sanitizeFileTitle(title: unknown): string {
  const safeTitle = typeof title === 'string' ? title : '';
  const normalizedTitle = safeTitle
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();

  return normalizedTitle
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'eduvi-presentation';
}

function resolveExportTitle(document: IDocument, fallbackProjectName?: string): string {
  const normalizedProjectName = typeof fallbackProjectName === 'string' ? fallbackProjectName.trim() : '';
  if (normalizedProjectName) return normalizedProjectName;

  const normalizedFirstSlideTitle =
    Array.isArray(document?.cards)
      ? document.cards
          .map((card) => (typeof card?.title === 'string' ? card.title.trim() : ''))
          .find((title) => title.length > 0) || ''
      : '';

  if (normalizedFirstSlideTitle) return normalizedFirstSlideTitle;
  return 'Untitled';
}

function createExportFileName(
  document: IDocument,
  fallbackProjectName?: string,
  fileNameSuffix?: string,
): string {
  const safeTitle = sanitizeFileTitle(resolveExportTitle(document, fallbackProjectName));
  const normalizedSuffix =
    typeof fileNameSuffix === 'string' && fileNameSuffix.trim().length > 0
      ? sanitizeFileTitle(fileNameSuffix)
      : '';
  const suffixPart = normalizedSuffix ? `-${normalizedSuffix}` : '';
  const now = new Date();
  const pad2 = (value: number): string => String(value).padStart(2, '0');
  const datePart = `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`;
  const timePart = `${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}`;

  return `${safeTitle}${suffixPart}-${datePart}-${timePart}${EDUVI_FILE_EXTENSION}`;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }

  return btoa(binary);
}

function parseDataUrl(url: string): { mimeType: string; base64: string } | null {
  const match = /^data:([^;]+);base64,(.+)$/i.exec(url);
  if (!match) return null;
  return {
    mimeType: match[1],
    base64: match[2],
  };
}

function cloneDocument(document: IDocument): IDocument {
  return JSON.parse(JSON.stringify(document)) as IDocument;
}

function guessAssetKindFromField(fieldName: unknown): EduViAssetKind {
  const key = typeof fieldName === 'string' ? fieldName.toLowerCase() : '';
  if (key.includes('poster')) return 'poster';
  if (key.includes('background')) return 'card-background';
  if (key.includes('video')) return 'video';
  if (key.includes('image') || key.includes('thumbnail') || key.includes('avatar')) return 'image';
  return 'generic';
}

function isLikelyMediaUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase();
  if (!trimmed) return false;
  if (trimmed.startsWith('data:') || trimmed.startsWith('asset://') || trimmed.startsWith('gs://')) return true;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return /(\.(png|jpg|jpeg|webp|gif|svg|bmp|avif|mp4|webm|mov|m4v|ogg|ogv|m3u8)(\?|$))/.test(trimmed)
      || /image|video|thumbnail|poster|avatar|background/.test(trimmed);
  }
  return false;
}

const MEDIA_FIELD_NAMES = new Set([
  'src',
  'url',
  'poster',
  'thumbnail',
  'thumbnailurl',
  'image',
  'imageurl',
  'video',
  'videourl',
  'preview',
  'previewurl',
  'cover',
  'coverurl',
  'backgroundimage',
  'avatarurl',
]);

function inferKindByFileName(url: string, fallback: EduViAssetKind): EduViAssetKind {
  const lower = url.toLowerCase();
  if (/(\.(mp4|webm|mov|m4v|ogg|ogv|m3u8)(\?|$))/.test(lower)) return 'video';
  if (/(\.(png|jpg|jpeg|webp|gif|svg|bmp|avif)(\?|$))/.test(lower)) return 'image';
  return fallback;
}

function guessMimeTypeFromUrl(url: string): string {
  const lower = url.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.svg')) return 'image/svg+xml';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  return 'application/octet-stream';
}

async function fetchAsset(url: string, timeoutMs: number): Promise<{ mimeType: string; base64: string }> {
  if (url.startsWith('data:')) {
    const parsed = parseDataUrl(url);
    if (!parsed) {
      throw new Error('Invalid data URL format');
    }
    return parsed;
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || guessMimeTypeFromUrl(url);
    return {
      mimeType: contentType,
      base64: arrayBufferToBase64(buffer),
    };
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function resolveGsUrlToSignedHttp(gsUrl: string): Promise<string> {
  const response = await fetch('/api/gcs/download-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gcsUrl: gsUrl }),
  });

  if (!response.ok) {
    throw new Error(`Failed to resolve gs:// URL (${response.status})`);
  }

  const body = (await response.json()) as { signedUrl?: string };
  if (!body.signedUrl || typeof body.signedUrl !== 'string') {
    throw new Error('Missing signedUrl in /api/gcs/download-url response');
  }

  return body.signedUrl;
}

function toGsUrlFromStorageHttp(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host !== 'storage.googleapis.com') return null;

    const path = parsed.pathname.replace(/^\/+/, '');
    if (!path) return null;

    const [bucket, ...rest] = path.split('/');
    if (!bucket || rest.length === 0) return null;

    return `gs://${bucket}/${rest.join('/')}`;
  } catch {
    return null;
  }
}

async function embedAssets(
  schema: EduViFileSchema,
  options: Required<Pick<EduViExportOptions, 'embedAssets' | 'mediaFetchTimeoutMs'>>,
): Promise<{ warnings: string[]; failedUrls: string[] }> {
  if (!options.embedAssets) return { warnings: [], failedUrls: [] };

  const warningSet = new Set<string>();
  const failedUrls = new Set<string>();
  const assets: Record<string, EduViAsset> = {};
  const urlToAssetId = new Map<string, string>();

  const registerAsset = async (
    url: string | undefined,
    kind: EduViAssetKind,
    required: boolean,
    applyRewrittenUrl: (rewrittenUrl: string) => void,
  ): Promise<void> => {
    if (!url) {
      if (required) {
        warningSet.add(`Missing required media URL for kind: ${kind}`);
      }
      return;
    }

    if (url.startsWith('asset://')) {
      return;
    }

    const existingAssetId = urlToAssetId.get(url);
    if (existingAssetId) {
      applyRewrittenUrl(`asset://${existingAssetId}`);
      return;
    }

    try {
      let fetched: { mimeType: string; base64: string } | null = null;
      let lastError: string | null = null;

      const tryFetch = async (candidateUrl: string): Promise<boolean> => {
        try {
          fetched = await fetchAsset(candidateUrl, options.mediaFetchTimeoutMs);
          return true;
        } catch (error) {
          lastError = error instanceof Error ? error.message : 'unknown error';
          return false;
        }
      };

      if (url.startsWith('gs://')) {
        const signed = await resolveGsUrlToSignedHttp(url);
        await tryFetch(signed);
      } else {
        const directOk = await tryFetch(url);
        if (!directOk) {
          const inferredGs = toGsUrlFromStorageHttp(url);
          if (inferredGs) {
            try {
              const refreshedSigned = await resolveGsUrlToSignedHttp(inferredGs);
              await tryFetch(refreshedSigned);
            } catch (error) {
              lastError = error instanceof Error ? error.message : 'unknown error';
            }
          }
        }
      }

      if (!fetched) {
        throw new Error(lastError || 'unknown error');
      }
      const fetchedAsset = fetched as { mimeType: string; base64: string };

      const assetId = `asset-${Object.keys(assets).length + 1}`;

      assets[assetId] = {
        mimeType: fetchedAsset.mimeType,
        base64: fetchedAsset.base64,
        originalUrl: url,
        kind,
      };

      urlToAssetId.set(url, assetId);
      applyRewrittenUrl(`asset://${assetId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      warningSet.add(`Cannot embed asset (${kind}) from URL: ${url}. Reason: ${message}`);
      failedUrls.add(url);
    }
  };

  const rewriteHtmlMediaUrls = async (html: string): Promise<string> => {
    if (!html || typeof window === 'undefined' || typeof window.DOMParser === 'undefined') {
      return html;
    }

    try {
      const parser = new window.DOMParser();
      const parsed = parser.parseFromString(html, 'text/html');

      const imgEls = Array.from(parsed.querySelectorAll('img'));
      for (const img of imgEls) {
        const src = img.getAttribute('src') || '';
        if (!src || !isLikelyMediaUrl(src)) continue;
        await registerAsset(src, inferKindByFileName(src, 'image'), false, (rewrittenUrl) => {
          img.setAttribute('src', rewrittenUrl);
        });
      }

      const videoEls = Array.from(parsed.querySelectorAll('video'));
      for (const video of videoEls) {
        const src = video.getAttribute('src') || '';
        const poster = video.getAttribute('poster') || '';

        if (src && isLikelyMediaUrl(src)) {
          await registerAsset(src, inferKindByFileName(src, 'video'), false, (rewrittenUrl) => {
            video.setAttribute('src', rewrittenUrl);
          });
        }
        if (poster && isLikelyMediaUrl(poster)) {
          await registerAsset(poster, inferKindByFileName(poster, 'poster'), false, (rewrittenUrl) => {
            video.setAttribute('poster', rewrittenUrl);
          });
        }

        const sources = Array.from(video.querySelectorAll('source'));
        for (const source of sources) {
          const sourceSrc = source.getAttribute('src') || '';
          if (!sourceSrc || !isLikelyMediaUrl(sourceSrc)) continue;
          await registerAsset(sourceSrc, inferKindByFileName(sourceSrc, 'video'), false, (rewrittenUrl) => {
            source.setAttribute('src', rewrittenUrl);
          });
        }
      }

      return parsed.body.innerHTML;
    } catch {
      return html;
    }
  };

  const rewriteDeepMediaFields = async (value: unknown, parentField = ''): Promise<unknown> => {
    if (Array.isArray(value)) {
      const nextItems = await Promise.all(value.map((item) => rewriteDeepMediaFields(item, parentField)));
      return nextItems;
    }

    if (!value || typeof value !== 'object') {
      return value;
    }

    const obj = value as Record<string, unknown>;
    for (const [key, raw] of Object.entries(obj)) {
      const normalizedKey = key.toLowerCase();

      if ((normalizedKey === 'html' || normalizedKey === 'renderedhtml') && typeof raw === 'string') {
        obj[key] = await rewriteHtmlMediaUrls(raw);
        continue;
      }

      if (typeof raw === 'string' && MEDIA_FIELD_NAMES.has(normalizedKey) && isLikelyMediaUrl(raw)) {
        const fallbackKind = guessAssetKindFromField(normalizedKey || parentField);
        const inferredKind = inferKindByFileName(raw, fallbackKind);
        await registerAsset(raw, inferredKind, false, (rewrittenUrl) => {
          obj[key] = rewrittenUrl;
        });
        continue;
      }

      if (raw && typeof raw === 'object') {
        obj[key] = await rewriteDeepMediaFields(raw, key);
      }
    }

    return obj;
  };

  for (const card of schema.cards) {
    const cardLabel = `card[${card.order}] "${card.title}"`;

    await registerAsset(card.backgroundImage, 'card-background', false, (rewrittenUrl) => {
      card.backgroundImage = rewrittenUrl;
    });

    for (const layout of card.layouts) {
      for (const block of layout.blocks) {
        const content = block.content as Record<string, unknown>;
        const contentType = String(content.type || block.type || '');
        const blockLabel = `${cardLabel} > block "${block.id}" (${contentType})`;

        if (contentType === BlockType.IMAGE) {
          const src = typeof content.src === 'string' ? content.src : undefined;
          await registerAsset(src, 'image', true, (rewrittenUrl) => {
            content.src = rewrittenUrl;
          });
          if (!src) {
            warningSet.add(`${blockLabel}: IMAGE has no src — Flutter will show placeholder with alt text`);
          }
        }

        if (contentType === BlockType.VIDEO) {
          const src = typeof content.src === 'string' ? content.src : undefined;
          const poster = typeof content.poster === 'string' ? content.poster : undefined;

          await registerAsset(src, 'video', true, (rewrittenUrl) => {
            content.src = rewrittenUrl;
          });

          await registerAsset(poster, 'poster', false, (rewrittenUrl) => {
            content.poster = rewrittenUrl;
          });
        }

        await rewriteDeepMediaFields(content, contentType);
      }
    }

    if (typeof card.renderedHtml === 'string' && card.renderedHtml) {
      card.renderedHtml = await rewriteHtmlMediaUrls(card.renderedHtml);
    }
  }

  if (schema.sourceDocument) {
    const source = schema.sourceDocument;
    for (const card of source.cards) {
      if (card.backgroundImage) {
        await registerAsset(card.backgroundImage, 'card-background', false, (rewrittenUrl) => {
          card.backgroundImage = rewrittenUrl;
        });
      }

      if (typeof card.renderedHtml === 'string' && card.renderedHtml) {
        card.renderedHtml = await rewriteHtmlMediaUrls(card.renderedHtml);
      }

      await rewriteDeepMediaFields(card, 'card');
    }
  }

  if (Array.isArray(schema.videos) && schema.videos.length > 0) {
    for (const video of schema.videos) {
      const videoUrl = typeof video.videoUrl === 'string' ? video.videoUrl : undefined;

      await registerAsset(videoUrl, 'video', true, (rewrittenUrl) => {
        video.videoUrl = rewrittenUrl;
      });

      await rewriteDeepMediaFields(video, 'video');
    }
  }

  if (Object.keys(assets).length > 0) {
    schema.assets = assets;
  }

  return {
    warnings: Array.from(warningSet),
    failedUrls: Array.from(failedUrls),
  };
}

function computeStats(schema: EduViFileSchema, failedEmbedUrlCount = 0): EduViStats {
  let totalLayouts = 0;
  let totalBlocks = 0;
  let cardsWithoutLayouts = 0;
  let unresolvedMediaCount = 0;
  const blocksByType: Record<string, number> = {};

  for (const card of schema.cards) {
    if (!card.layouts.length) cardsWithoutLayouts += 1;

    totalLayouts += card.layouts.length;

    for (const layout of card.layouts) {
      totalBlocks += layout.blocks.length;

      for (const block of layout.blocks) {
        const type = block.type || 'UNKNOWN';
        blocksByType[type] = (blocksByType[type] || 0) + 1;

        const content = block.content as Record<string, unknown>;
        const contentType = String(content.type || type);

        if (contentType === BlockType.IMAGE) {
          const src = typeof content.src === 'string' ? content.src : '';
          if (!src || (!src.startsWith('asset://') && !src.startsWith('http') && !src.startsWith('data:'))) {
            unresolvedMediaCount += 1;
          }
        }

        if (contentType === BlockType.VIDEO) {
          const src = typeof content.src === 'string' ? content.src : '';
          if (!src || (!src.startsWith('asset://') && !src.startsWith('http') && !src.startsWith('data:'))) {
            unresolvedMediaCount += 1;
          }
        }
      }
    }
  }

  if (Array.isArray(schema.videos)) {
    for (const video of schema.videos) {
      const videoUrl = typeof video.videoUrl === 'string' ? video.videoUrl : '';
      if (
        !videoUrl
        || (!videoUrl.startsWith('asset://') && !videoUrl.startsWith('http') && !videoUrl.startsWith('data:'))
      ) {
        unresolvedMediaCount += 1;
      }
    }
  }

  return {
    totalCards: schema.cards.length,
    totalLayouts,
    totalBlocks,
    cardsWithoutLayouts,
    blocksByType,
    unresolvedMediaCount: unresolvedMediaCount + Math.max(0, failedEmbedUrlCount),
    embeddedAssetCount: schema.assets ? Object.keys(schema.assets).length : 0,
  };
}

async function buildEduViData(document: IDocument, options: EduViExportOptions = {}): Promise<EduViFileSchema> {
  const resolvedOptions: Required<Pick<EduViExportOptions, 'embedAssets' | 'mediaFetchTimeoutMs'>> = {
    embedAssets: options.embedAssets ?? true,
    mediaFetchTimeoutMs: options.mediaFetchTimeoutMs ?? DEFAULT_MEDIA_FETCH_TIMEOUT_MS,
  };

  const schema = transformDocument(
    document,
    options.academicContext,
    options.games,
    options.videos,
    options.projectName,
    options.folderName,
    options.packageType,
  );
  const embedResult = await embedAssets(schema, resolvedOptions);
  const stats = computeStats(schema, embedResult.failedUrls.length);
  schema.integrity = {
    warnings: embedResult.warnings,
    stats,
    offlineReady: stats.unresolvedMediaCount === 0,
  };

  return schema;
}

function transformDocument(
  document: IDocument,
  academicContext?: Partial<EduViAcademicContext>,
  games?: EduViGame[],
  videos?: EduViVideo[],
  fallbackProjectName?: string,
  folderName?: string,
  packageType?: EduViPackageType,
): EduViFileSchema {
  const fallbackTimestamp = new Date().toISOString();
  const normalizedTitle = resolveExportTitle(document, fallbackProjectName);

  return {
    version: EDUVI_SCHEMA_VERSION,
    exportedAt: fallbackTimestamp,
    metadata: {
      title: normalizedTitle,
      description: '', // IDocument doesn't have description yet
      createdAt: document.createdAt || fallbackTimestamp,
      updatedAt: document.updatedAt || fallbackTimestamp,
      ...(academicContext?.projectCode ? { projectCode: academicContext.projectCode } : {}),
      ...(academicContext?.projectName ? { projectName: academicContext.projectName } : {}),
      ...(academicContext?.subjectCode ? { subjectCode: academicContext.subjectCode } : {}),
      ...(academicContext?.subjectName ? { subjectName: academicContext.subjectName } : {}),
      ...(academicContext?.gradeCode ? { gradeCode: academicContext.gradeCode } : {}),
      ...(academicContext?.gradeName ? { gradeName: academicContext.gradeName } : {}),
      ...(academicContext?.lessonCode ? { lessonCode: academicContext.lessonCode } : {}),
      ...(academicContext?.lessonName ? { lessonName: academicContext.lessonName } : {}),
      ...(academicContext?.classroomCode ? { classroomCode: academicContext.classroomCode } : {}),
      ...(academicContext?.classroomName ? { classroomName: academicContext.classroomName } : {}),
      ...(typeof academicContext?.curriculumYear === 'number' ? { curriculumYear: academicContext.curriculumYear } : {}),
      ...(typeof folderName === 'string' && folderName.trim().length > 0
        ? { folderName: folderName.trim() }
        : {}),
      ...(packageType ? { packageType } : {}),
    },
    cards: document.cards.map((card, idx) => transformCard(card, idx)),
    ...(Array.isArray(games) && games.length > 0
      ? {
          games: games.map((game) => ({
            gameCode: game.gameCode,
            productGameCode: game.productGameCode,
            productCode: game.productCode,
            productGameName: game.productGameName,
            templateCode: game.templateCode,
            roundCount: game.roundCount,
            status: game.status,
            resultJson: game.resultJson,
          })),
        }
      : {}),
    ...(Array.isArray(videos) && videos.length > 0
      ? {
          videos: videos.map((video) => ({
            productVideoCode: video.productVideoCode,
            productCode: video.productCode,
            productName: video.productName,
            status: video.status,
            duration: video.duration,
            videoUrl: video.videoUrl,
            createdAt: video.createdAt,
            updatedAt: video.updatedAt,
            completedAt: video.completedAt,
            interactions: video.interactions,
          })),
        }
      : {}),
    sourceDocument: cloneDocument(document),
  };
}

// ============================================================================
// EXPORT FUNCTION
// ============================================================================

/**
 * Export the document to a .eduvi file
 * Triggers a browser download
 */
export async function exportToEduvi(
  document: IDocument,
  options: EduViExportOptions = {},
): Promise<EduViExportResult> {
  const eduViData = await buildEduViData(document, options);
  if (options.requireOfflineReady && eduViData.integrity && !eduViData.integrity.offlineReady) {
    const warningPreview = eduViData.integrity.warnings.slice(0, 5).join('\n');
    throw new Error(
      `Export requires offline-ready package, but unresolved media still exists (${eduViData.integrity.stats.unresolvedMediaCount}).` +
      (warningPreview ? `\n\nTop warnings:\n${warningPreview}` : ''),
    );
  }
  const validation = validateEduViSchema(eduViData);
  if (!validation.valid && options.failOnValidationError) {
    throw new Error(`EduVi export schema invalid: ${validation.errors.join('; ')}`);
  }

  // Serialize to JSON with pretty printing for debugging
  const jsonString = JSON.stringify(eduViData, null, options.pretty === false ? 0 : 2);
  
  // Create blob
  const blob = new Blob([jsonString], { type: 'application/json' });
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  const fileName = createExportFileName(document, options.projectName, options.fileNameSuffix);
  
  // Generate filename from resolved export title
  link.download = fileName;
  link.href = url;
  
  // Trigger download
  window.document.body.appendChild(link);
  link.click();
  window.document.body.removeChild(link);
  
  // Cleanup
  URL.revokeObjectURL(url);

  if (eduViData.integrity?.warnings.length) {
    console.warn('[EduVi] Export warnings:', eduViData.integrity.warnings);
  }

  console.log('[EduVi] Exported document:', link.download, eduViData.integrity?.stats);

  return {
    fileName,
    schema: eduViData,
    validation,
  };
}

/**
 * Export to JSON string without triggering download
 * Useful for testing or API submissions
 */
export function serializeToEduvi(document: IDocument): string {
  const eduViData = transformDocument(document);
  return JSON.stringify(eduViData, null, 2);
}

/**
 * Serialize document with full export pipeline (including optional asset embedding)
 */
export async function serializeToEduviAdvanced(
  document: IDocument,
  options: EduViExportOptions = {},
): Promise<EduViExportResult> {
  const schema = await buildEduViData(document, options);
  if (options.requireOfflineReady && schema.integrity && !schema.integrity.offlineReady) {
    const warningPreview = schema.integrity.warnings.slice(0, 5).join('\n');
    throw new Error(
      `Export requires offline-ready package, but unresolved media still exists (${schema.integrity.stats.unresolvedMediaCount}).` +
      (warningPreview ? `\n\nTop warnings:\n${warningPreview}` : ''),
    );
  }
  const validation = validateEduViSchema(schema);
  if (!validation.valid && options.failOnValidationError) {
    throw new Error(`EduVi export schema invalid: ${validation.errors.join('; ')}`);
  }

  return {
    fileName: createExportFileName(document, options.projectName, options.fileNameSuffix),
    schema,
    validation,
  };
}

/**
 * Validate that a JSON object conforms to the EduVi schema
 * Returns validation errors if any
 */
export function validateEduViSchema(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Data must be an object'] };
  }

  const obj = data as Record<string, unknown>;

  // Check required top-level fields
  if (!obj.version) errors.push('Missing required field: version');
  if (!obj.metadata) errors.push('Missing required field: metadata');
  if (!obj.cards) errors.push('Missing required field: cards');
  if (!Array.isArray(obj.cards)) errors.push('cards must be an array');
  if (obj.games !== undefined && !Array.isArray(obj.games)) {
    errors.push('games must be an array when provided');
  }
  if (obj.videos !== undefined && !Array.isArray(obj.videos)) {
    errors.push('videos must be an array when provided');
  }

  // Check metadata
  if (obj.metadata && typeof obj.metadata === 'object') {
    const meta = obj.metadata as Record<string, unknown>;
    if (!meta.title) errors.push('Missing required field: metadata.title');
    if (!meta.createdAt) errors.push('Missing required field: metadata.createdAt');
    if (!meta.updatedAt) errors.push('Missing required field: metadata.updatedAt');
    if (meta.folderName !== undefined && typeof meta.folderName !== 'string') {
      errors.push('metadata.folderName must be a string when provided');
    }
    if (meta.packageType !== undefined) {
      const allowedPackageTypes = new Set(['slide', 'game', 'combined', 'video']);
      if (typeof meta.packageType !== 'string' || !allowedPackageTypes.has(meta.packageType)) {
        errors.push('metadata.packageType must be one of: slide, game, combined, video');
      }
    }
  }

  if (Array.isArray(obj.videos)) {
    obj.videos.forEach((videoRaw, videoIndex) => {
      if (!videoRaw || typeof videoRaw !== 'object') {
        errors.push(`videos[${videoIndex}] must be an object`);
        return;
      }

      const video = videoRaw as Record<string, unknown>;
      if (!video.productVideoCode) errors.push(`videos[${videoIndex}] missing productVideoCode`);
      if (!video.productCode) errors.push(`videos[${videoIndex}] missing productCode`);
      if (!video.videoUrl) errors.push(`videos[${videoIndex}] missing videoUrl`);
    });
  }

  if (Array.isArray(obj.cards)) {
    obj.cards.forEach((cardRaw, cardIndex) => {
      if (!cardRaw || typeof cardRaw !== 'object') {
        errors.push(`cards[${cardIndex}] must be an object`);
        return;
      }

      const card = cardRaw as Record<string, unknown>;
      if (!card.id) errors.push(`cards[${cardIndex}] missing id`);
      if (!card.title) errors.push(`cards[${cardIndex}] missing title`);
      if (!Array.isArray(card.layouts)) {
        errors.push(`cards[${cardIndex}].layouts must be an array`);
        return;
      }

      card.layouts.forEach((layoutRaw, layoutIndex) => {
        if (!layoutRaw || typeof layoutRaw !== 'object') {
          errors.push(`cards[${cardIndex}].layouts[${layoutIndex}] must be an object`);
          return;
        }

        const layout = layoutRaw as Record<string, unknown>;
        if (!layout.id) errors.push(`cards[${cardIndex}].layouts[${layoutIndex}] missing id`);
        if (!layout.variant) errors.push(`cards[${cardIndex}].layouts[${layoutIndex}] missing variant`);
        if (!Array.isArray(layout.blocks)) {
          errors.push(`cards[${cardIndex}].layouts[${layoutIndex}].blocks must be an array`);
          return;
        }

        layout.blocks.forEach((blockRaw, blockIndex) => {
          if (!blockRaw || typeof blockRaw !== 'object') {
            errors.push(`cards[${cardIndex}].layouts[${layoutIndex}].blocks[${blockIndex}] must be an object`);
            return;
          }

          const block = blockRaw as Record<string, unknown>;
          if (!block.id) errors.push(`cards[${cardIndex}].layouts[${layoutIndex}].blocks[${blockIndex}] missing id`);
          if (!block.type) errors.push(`cards[${cardIndex}].layouts[${layoutIndex}].blocks[${blockIndex}] missing type`);
          if (!block.content || typeof block.content !== 'object') {
            errors.push(`cards[${cardIndex}].layouts[${layoutIndex}].blocks[${blockIndex}] missing content object`);
          }
        });
      });
    });
  }

  if (Array.isArray(obj.games)) {
    obj.games.forEach((gameRaw, gameIndex) => {
      if (!gameRaw || typeof gameRaw !== 'object') {
        errors.push(`games[${gameIndex}] must be an object`);
        return;
      }

      const game = gameRaw as Record<string, unknown>;
      if (!game.gameCode) errors.push(`games[${gameIndex}] missing gameCode`);
      if (!game.productGameCode) errors.push(`games[${gameIndex}] missing productGameCode`);
      if (!game.productCode) errors.push(`games[${gameIndex}] missing productCode`);
      if (!game.productGameName) errors.push(`games[${gameIndex}] missing productGameName`);
      if (!game.templateCode) errors.push(`games[${gameIndex}] missing templateCode`);
      if (typeof game.roundCount !== 'number') errors.push(`games[${gameIndex}] roundCount must be a number`);
      if (!game.status) errors.push(`games[${gameIndex}] missing status`);
      if (!('resultJson' in game)) errors.push(`games[${gameIndex}] missing resultJson`);
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export default exportToEduvi;
