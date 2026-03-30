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
  {
    id: 'material-youtube',
    name: 'YouTube Embed',
    description: 'Embed YouTube videos',
    widgetType: WidgetType.MATERIAL_YOUTUBE,
    icon: 'Youtube',
    category: MaterialCategory.MEDIA,
    previewUrl: '/previews/youtube.png',
    defaultData: {
      videoId: 'dQw4w9WgXcQ',
      title: 'YouTube Video',
      autoplay: false,
    },
    defaultStyles: {
      width: '100%',
      maxWidth: '800px',
      aspectRatio: '16/9',
    },
  },
  {
    id: 'material-audio-player',
    name: 'Audio Player',
    description: 'Embed audio content',
    widgetType: WidgetType.MATERIAL_AUDIO,
    icon: 'Music',
    category: MaterialCategory.MEDIA,
    previewUrl: '/previews/audio.png',
    defaultData: {
      src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      title: 'Sample Audio Track',
      artist: 'SoundHelix',
    },
    defaultStyles: {
      width: '100%',
      maxWidth: '500px',
    },
  },

  // ========================================================================
  // INTERACTIVE CATEGORY
  // ========================================================================
  {
    id: 'material-quiz',
    name: 'Quiz',
    description: 'Interactive multiple choice quiz',
    widgetType: WidgetType.MATERIAL_QUIZ,
    icon: 'HelpCircle',
    category: MaterialCategory.INTERACTIVE,
    previewUrl: '/previews/quiz.png',
    defaultData: {
      title: 'Knowledge Check',
      questions: [
        {
          id: 'q1',
          question: 'What is the capital of France?',
          options: ['London', 'Berlin', 'Paris', 'Madrid'],
          correctIndex: 2,
        },
        {
          id: 'q2',
          question: 'Which planet is known as the Red Planet?',
          options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
          correctIndex: 1,
        },
        {
          id: 'q3',
          question: 'What is 2 + 2?',
          options: ['3', '4', '5', '6'],
          correctIndex: 1,
        },
      ],
    },
    defaultStyles: {
      width: '100%',
      maxWidth: '600px',
    },
  },

  // ========================================================================
  // DATA CATEGORY
  // ========================================================================
  {
    id: 'material-chart-bar',
    name: 'Bar Chart',
    description: 'Display data as bar chart',
    widgetType: WidgetType.MATERIAL_CHART,
    icon: 'BarChart3',
    category: MaterialCategory.DATA,
    previewUrl: '/previews/bar-chart.png',
    defaultData: {
      title: 'Sales by Region',
      type: 'bar',
      data: [
        { label: 'North', value: 420 },
        { label: 'South', value: 380 },
        { label: 'East', value: 290 },
        { label: 'West', value: 350 },
      ],
    },
    defaultStyles: {
      width: '100%',
      maxWidth: '600px',
    },
  },
  {
    id: 'material-chart-pie',
    name: 'Pie Chart',
    description: 'Display data as pie chart',
    widgetType: WidgetType.MATERIAL_CHART,
    icon: 'PieChart',
    category: MaterialCategory.DATA,
    previewUrl: '/previews/pie-chart.png',
    defaultData: {
      title: 'Market Share',
      type: 'pie',
      data: [
        { label: 'Product A', value: 35 },
        { label: 'Product B', value: 25 },
        { label: 'Product C', value: 20 },
        { label: 'Others', value: 20 },
      ],
    },
    defaultStyles: {
      width: '100%',
      maxWidth: '500px',
    },
  },
  {
    id: 'material-chart-line',
    name: 'Line Chart',
    description: 'Display trends with line chart',
    widgetType: WidgetType.MATERIAL_CHART,
    icon: 'TrendingUp',
    category: MaterialCategory.DATA,
    previewUrl: '/previews/line-chart.png',
    defaultData: {
      title: 'Monthly Growth',
      type: 'line',
      data: [
        { label: 'Jan', value: 100 },
        { label: 'Feb', value: 120 },
        { label: 'Mar', value: 115 },
        { label: 'Apr', value: 140 },
        { label: 'May', value: 160 },
        { label: 'Jun', value: 155 },
      ],
    },
    defaultStyles: {
      width: '100%',
      maxWidth: '600px',
    },
  },

  // ========================================================================
  // EMBED CATEGORY
  // ========================================================================
  {
    id: 'material-embed',
    name: 'Web Embed',
    description: 'Embed external web content',
    widgetType: WidgetType.MATERIAL_EMBED,
    icon: 'ExternalLink',
    category: MaterialCategory.EMBED,
    previewUrl: '/previews/embed.png',
    defaultData: {
      src: 'https://example.com',
      title: 'Embedded Content',
    },
    defaultStyles: {
      width: '100%',
      maxWidth: '800px',
      aspectRatio: '16/9',
    },
  },
  {
    id: 'material-code',
    name: 'Code Snippet',
    description: 'Display code with syntax highlighting',
    widgetType: WidgetType.MATERIAL_CODE,
    icon: 'Code',
    category: MaterialCategory.EMBED,
    previewUrl: '/previews/code.png',
    defaultData: {
      code: `function greet(name) {
  console.log(\`Hello, \${name}!\`);
}

greet('EduVi');`,
      language: 'javascript',
      filename: 'example.js',
    },
    defaultStyles: {
      width: '100%',
      maxWidth: '700px',
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
