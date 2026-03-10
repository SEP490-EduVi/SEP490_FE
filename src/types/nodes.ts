/**
 * EduVi Node Types & Interfaces
 * =============================
 * 
 * This file defines the core data structures for the node-based architecture.
 * 
 * Architecture Overview:
 * ----------------------
 * X-Axis: Cards (Slides) - Horizontal navigation between slides
 * Y-Axis: Layouts/Blocks - Vertical stacking within a slide
 * Z-Axis: Children - Nesting depth (Layout containing Blocks)
 * 
 * Node Hierarchy:
 * ---------------
 * CARD (Root/Slide)
 *   └── LAYOUT (Container) - e.g., 2-column grid
 *         └── BLOCK (Content) - Text, Image, Video
 *   └── BLOCK (Content) - Can also be direct child of Card
 * 
 * BACKEND CONTRACT:
 * -----------------
 * The Backend should return JSON matching the IDocument interface.
 * Each node MUST have: id, type, and children array.
 * Block nodes should have a 'content' object with type-specific data.
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * NodeType enum defines the three levels of the node hierarchy
 */
export enum NodeType {
  CARD = 'CARD',       // Slide level (X-axis)
  LAYOUT = 'LAYOUT',   // Container level (Y-axis grouping)
  BLOCK = 'BLOCK',     // Content level (leaf nodes)
}

/**
 * BlockType defines the content type for BLOCK nodes
 */
export enum BlockType {
  TEXT = 'TEXT',       // Rich text via Tiptap
  IMAGE = 'IMAGE',     // Image widget
  VIDEO = 'VIDEO',     // Video embed widget
  HEADING = 'HEADING', // Heading text block
  MATERIAL = 'MATERIAL', // Material widget (from library)
  // Interactive blocks for learning
  QUIZ = 'QUIZ',             // Interactive quiz with MCQ
  FLASHCARD = 'FLASHCARD',   // Flip card with front/back
  FILL_BLANK = 'FILL_BLANK', // Fill in the blank exercise
}

/**
 * WidgetType defines the specific material/widget types from the library
 */
export enum WidgetType {
  MATERIAL_PDF = 'MATERIAL_PDF',
  MATERIAL_VIDEO = 'MATERIAL_VIDEO',
  MATERIAL_YOUTUBE = 'MATERIAL_YOUTUBE',
  MATERIAL_QUIZ = 'MATERIAL_QUIZ',
  MATERIAL_CHART = 'MATERIAL_CHART',
  MATERIAL_AUDIO = 'MATERIAL_AUDIO',
  MATERIAL_EMBED = 'MATERIAL_EMBED',
  MATERIAL_CODE = 'MATERIAL_CODE',
}

/**
 * LayoutVariant defines the structure pattern for LAYOUT nodes
 */
export enum LayoutVariant {
  SINGLE = 'SINGLE',           // Single column (default)
  TWO_COLUMN = 'TWO_COLUMN',   // Two equal columns
  THREE_COLUMN = 'THREE_COLUMN', // Three equal columns
  SIDEBAR_LEFT = 'SIDEBAR_LEFT',  // Narrow left, wide right
  SIDEBAR_RIGHT = 'SIDEBAR_RIGHT', // Wide left, narrow right
  MASONRY = 'MASONRY',         // Masonry grid layout
}

// ============================================================================
// BASE NODE INTERFACE
// ============================================================================

/**
 * IBaseNode - Common properties for all node types
 * 
 * @property id - Unique identifier (UUID v4 recommended)
 * @property type - Node type discriminator
 * @property meta - Optional metadata for extensions
 */
export interface IBaseNode {
  id: string;
  type: NodeType;
  meta?: Record<string, unknown>;
}

// ============================================================================
// CARD NODE (SLIDE)
// ============================================================================

/**
 * ICard - Represents a single slide in the presentation
 * 
 * @property title - Slide title (displayed in sidebar)
 * @property templateId - Optional template ID from cardTemplates
 * @property children - Layout or Block nodes within this card
 * @property backgroundColor - Optional background color
 * @property backgroundImage - Optional background image URL
 * @property contentAlignment - Vertical alignment of content group: 'top' | 'center' | 'bottom'
 */
export interface ICard extends IBaseNode {
  type: NodeType.CARD;
  title: string;
  templateId?: string;
  children: (ILayout | IBlock)[];
  backgroundColor?: string;
  backgroundImage?: string;
  contentAlignment?: 'top' | 'center' | 'bottom';
}

// ============================================================================
// LAYOUT NODE (CONTAINER)
// ============================================================================

/**
 * ILayout - Container node that defines structural arrangement
 * 
 * @property variant - Layout pattern (columns, masonry, etc.)
 * @property children - Block nodes within this layout
 * @property gap - Gap between children (Tailwind spacing scale)
 */
export interface ILayout extends IBaseNode {
  type: NodeType.LAYOUT;
  variant: LayoutVariant;
  children: (ILayout | IBlock)[];
  gap?: number;
}

// ============================================================================
// BLOCK NODE (CONTENT)
// ============================================================================

/**
 * ITextContent - Content for TEXT block type
 * @property html - Rich text content as HTML string (from Tiptap)
 */
export interface ITextContent {
  type: BlockType.TEXT;
  html: string;
}

/**
 * IHeadingContent - Content for HEADING block type
 * @property html - HTML content with formatting
 * @property level - Heading level (1-6)
 */
export interface IHeadingContent {
  type: BlockType.HEADING;
  html: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * IImageContent - Content for IMAGE block type
 * @property src - Image URL
 * @property alt - Alternative text for accessibility
 * @property caption - Optional image caption
 */
export interface IImageContent {
  type: BlockType.IMAGE;
  src: string;
  alt: string;
  caption?: string;
}

/**
 * IVideoContent - Content for VIDEO block type
 * @property src - Video URL (YouTube, Vimeo, or direct)
 * @property provider - Video provider for embed handling
 */
export interface IVideoContent {
  type: BlockType.VIDEO;
  src: string;
  provider: 'youtube' | 'vimeo' | 'direct';
}

/**
 * IMaterialContent - Content for MATERIAL block type (from library)
 * @property widgetType - The specific widget type from WidgetType enum
 * @property data - Widget-specific data payload from backend
 */
export interface IMaterialContent {
  type: BlockType.MATERIAL;
  widgetType: WidgetType;
  data: Record<string, unknown>;
}

// ============================================================================
// INTERACTIVE CONTENT TYPES (for Learning Logic)
// ============================================================================

/**
 * IQuizOption - Single option in a quiz question
 */
export interface IQuizOption {
  id: string;
  text: string;
}

/**
 * IQuizQuestion - Single question in a quiz
 */
export interface IQuizQuestion {
  id: string;
  question: string;
  options: IQuizOption[];
  correctIndex: number;
  explanation?: string;
}

/**
 * IQuizContent - Content for QUIZ block type
 * Used in Creator Tool (edit mode) and exported to .eduvi for Viewer
 */
export interface IQuizContent {
  type: BlockType.QUIZ;
  title: string;
  questions: IQuizQuestion[];
}

/**
 * IFlashcardContent - Content for FLASHCARD block type
 * Front/Back flip card for memorization
 */
export interface IFlashcardContent {
  type: BlockType.FLASHCARD;
  front: string;  // Front side text/HTML
  back: string;   // Back side text/HTML
}

/**
 * IFillBlankContent - Content for FILL_BLANK block type
 * Sentence with [bracketed] words that become blanks in Viewer
 * Example: "Java is a [programming] language"
 */
export interface IFillBlankContent {
  type: BlockType.FILL_BLANK;
  sentence: string;        // Full sentence with [brackets]
  blanks: string[];        // Extracted answers: ["programming"]
  hint?: string;           // Optional hint for learners
}

/**
 * BlockContent - Union type for all block content types
 */
export type BlockContent = 
  | ITextContent 
  | IHeadingContent 
  | IImageContent 
  | IVideoContent 
  | IMaterialContent
  | IQuizContent
  | IFlashcardContent
  | IFillBlankContent;

/**
 * IBlockStyles - Styling properties for resizable blocks
 * These are inline styles applied to the block wrapper
 */
export interface IBlockStyles {
  width?: string;
  height?: string;
  maxWidth?: string;
  maxHeight?: string;
  minWidth?: string;
  minHeight?: string;
  aspectRatio?: string;
}

/**
 * IBlock - Leaf node containing actual content
 * 
 * @property content - Type-specific content data
 * @property styles - Optional inline styles (for resizing)
 * @property isResizable - Whether the block can be resized
 */
export interface IBlock extends IBaseNode {
  type: NodeType.BLOCK;
  content: BlockContent;
  children: []; // Blocks are leaf nodes, always empty
  styles?: IBlockStyles;
  isResizable?: boolean;
}

// ============================================================================
// UNION TYPES
// ============================================================================

/**
 * INode - Discriminated union of all node types
 * Use type guards or switch on node.type to narrow the type
 */
export type INode = ICard | ILayout | IBlock;

// ============================================================================
// DOCUMENT STRUCTURE
// ============================================================================

/**
 * IDocument - Root document structure returned by API
 * 
 * @property id - Document unique identifier
 * @property title - Document title
 * @property cards - Array of Card nodes (slides)
 * @property activeCardId - Currently selected card ID
 * @property createdAt - ISO timestamp
 * @property updatedAt - ISO timestamp
 */
export interface IDocument {
  id: string;
  title: string;
  cards: ICard[];
  activeCardId: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type guard to check if a node is a Card
 */
export function isCard(node: INode): node is ICard {
  return node.type === NodeType.CARD;
}

/**
 * Type guard to check if a node is a Layout
 */
export function isLayout(node: INode): node is ILayout {
  return node.type === NodeType.LAYOUT;
}

/**
 * Type guard to check if a node is a Block
 */
export function isBlock(node: INode): node is IBlock {
  return node.type === NodeType.BLOCK;
}

/**
 * Type guard for text content
 */
export function isTextContent(content: BlockContent): content is ITextContent {
  return content.type === BlockType.TEXT;
}

/**
 * Type guard for heading content
 */
export function isHeadingContent(content: BlockContent): content is IHeadingContent {
  return content.type === BlockType.HEADING;
}

/**
 * Type guard for image content
 */
export function isImageContent(content: BlockContent): content is IImageContent {
  return content.type === BlockType.IMAGE;
}

/**
 * Type guard for video content
 */
export function isVideoContent(content: BlockContent): content is IVideoContent {
  return content.type === BlockType.VIDEO;
}

/**
 * Type guard for material content
 */
export function isMaterialContent(content: BlockContent): content is IMaterialContent {
  return content.type === BlockType.MATERIAL;
}

/**
 * Type guard for quiz content
 */
export function isQuizContent(content: BlockContent): content is IQuizContent {
  return content.type === BlockType.QUIZ;
}

/**
 * Type guard for flashcard content
 */
export function isFlashcardContent(content: BlockContent): content is IFlashcardContent {
  return content.type === BlockType.FLASHCARD;
}

/**
 * Type guard for fill-in-blank content
 */
export function isFillBlankContent(content: BlockContent): content is IFillBlankContent {
  return content.type === BlockType.FILL_BLANK;
}

// ============================================================================
// MATERIAL LIBRARY TYPES
// ============================================================================

/**
 * IMaterial - Represents a material item from the library
 * This is what the /api/materials endpoint returns
 */
export interface IMaterial {
  id: string;
  name: string;
  description: string;
  widgetType: WidgetType;
  icon: string;
  category: MaterialCategory;
  previewUrl?: string;
  defaultData: Record<string, unknown>;
  defaultStyles: IBlockStyles;
}

/**
 * MaterialCategory - Categories for organizing materials in the library
 */
export enum MaterialCategory {
  MEDIA = 'MEDIA',
  INTERACTIVE = 'INTERACTIVE',
  DATA = 'DATA',
  EMBED = 'EMBED',
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * CreateNodePayload - Payload for creating new nodes
 */
export type CreateNodePayload = 
  | { type: NodeType.CARD; title: string }
  | { type: NodeType.LAYOUT; variant: LayoutVariant }
  | { type: NodeType.BLOCK; content: BlockContent };

/**
 * NodePath - Represents the path to a node in the tree
 * Used for traversal and updates
 */
export type NodePath = string[];
