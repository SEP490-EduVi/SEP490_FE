/**
 * Materials Mock API Route
 * ========================
 * 
 * GET /api/materials - Returns available materials/widgets from the library
 * 
 * BACKEND TEAM NOTES:
 * -------------------
 * This endpoint should return a list of available materials that users can
 * drag and drop into their presentations. Each material has:
 * - Basic info (id, name, description, icon)
 * - Widget type for rendering
 * - Default data and styles
 * - Category for organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { IMaterial, WidgetType, MaterialCategory } from '@/types';

/**
 * Mock materials data
 */
const mockMaterials: IMaterial[] = [
  // ========================================================================
  // MEDIA CATEGORY
  // ========================================================================
  {
    id: 'material-pdf-viewer',
    name: 'PDF Viewer',
    description: 'Embed and display PDF documents',
    widgetType: WidgetType.MATERIAL_PDF,
    icon: 'FileText',
    category: MaterialCategory.MEDIA,
    previewUrl: '/previews/pdf-viewer.png',
    defaultData: {
      src: 'https://www.w3.org/WAI/WCAG21/Techniques/pdf/img/table-word.pdf',
      title: 'Sample PDF Document',
      totalPages: 3,
    },
    defaultStyles: {
      width: '100%',
      maxWidth: '800px',
      aspectRatio: '3/4',
    },
  },
  {
    id: 'material-video-player',
    name: 'Video Player',
    description: 'Embed custom video content',
    widgetType: WidgetType.MATERIAL_VIDEO,
    icon: 'Video',
    category: MaterialCategory.MEDIA,
    previewUrl: '/previews/video-player.png',
    defaultData: {
      src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      title: 'Sample Video',
      poster: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800',
    },
    defaultStyles: {
      width: '100%',
      maxWidth: '800px',
      aspectRatio: '16/9',
    },
  },
];


/**
 * GET /api/materials
 * 
 * Returns all available materials from the library.
 * Can be filtered by category using query param: ?category=MEDIA
 */
export async function GET(request: NextRequest) {
  // Simulate network latency
  await new Promise((resolve) => setTimeout(resolve, 200));

  // Check for category filter
  const { searchParams } = new URL(request.url);
  const categoryFilter = searchParams.get('category');

  let materials = mockMaterials;

  if (categoryFilter) {
    materials = mockMaterials.filter(
      (m) => m.category === categoryFilter.toUpperCase()
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: materials,
      total: materials.length,
    },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}
