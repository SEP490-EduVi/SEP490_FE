'use client';

/**
 * Widgets Barrel Export & Registration
 * ====================================
 * 
 * This file exports all widget components and registers them
 * with the WidgetRegistry on module load.
 */

import { WidgetType } from '@/types';
import { WidgetRegistry, WidgetProps, UnknownWidget, renderWidget } from './WidgetRegistry';

// Widget Components
import { PDFViewerWidget } from './PDFViewerWidget';
import { MaterialVideoWidget } from './MaterialVideoWidget';
import { YouTubeEmbedWidget } from './YouTubeEmbedWidget';
import { QuizWidget } from './QuizWidget';
import { ChartWidget } from './ChartWidget';
import { AudioWidget } from './AudioWidget';
import { EmbedWidget } from './EmbedWidget';
import { CodeWidget } from './CodeWidget';

// Interactive block widgets (Quiz / Flashcard / Fill-in-Blank)
import { QuizBlockWidget } from './QuizBlockWidget';
import { FlashcardBlockWidget } from './FlashcardBlockWidget';
import { FillBlankBlockWidget } from './FillBlankBlockWidget';

// ============================================================================
// REGISTER ALL WIDGETS
// ============================================================================

// Register widgets with the registry
WidgetRegistry.register(WidgetType.MATERIAL_PDF, PDFViewerWidget);
WidgetRegistry.register(WidgetType.MATERIAL_VIDEO, MaterialVideoWidget);
WidgetRegistry.register(WidgetType.MATERIAL_YOUTUBE, YouTubeEmbedWidget);
WidgetRegistry.register(WidgetType.MATERIAL_QUIZ, QuizWidget);
WidgetRegistry.register(WidgetType.MATERIAL_CHART, ChartWidget);
WidgetRegistry.register(WidgetType.MATERIAL_AUDIO, AudioWidget);
WidgetRegistry.register(WidgetType.MATERIAL_EMBED, EmbedWidget);
WidgetRegistry.register(WidgetType.MATERIAL_CODE, CodeWidget);

// ============================================================================
// EXPORTS
// ============================================================================

export {
  WidgetRegistry,
  renderWidget,
  UnknownWidget,
};

export type { WidgetProps };

export {
  PDFViewerWidget,
  MaterialVideoWidget,
  YouTubeEmbedWidget,
  QuizWidget,
  ChartWidget,
  AudioWidget,
  EmbedWidget,
  CodeWidget,
  // Interactive block widgets
  QuizBlockWidget,
  FlashcardBlockWidget,
  FillBlankBlockWidget,
};
