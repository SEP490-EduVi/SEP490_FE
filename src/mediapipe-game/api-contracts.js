/**
 * API Contracts (Mock-first)
 * =========================
 *
 * Mục tiêu: định nghĩa rõ payload FE <-> BE cho feature “Game Blueprint”.
 * - GameConfigRequest: FE gửi khi teacher bấm Save Game
 * - PlayableGameResponse: BE trả về khi FE cần render game
 *
 * Lưu ý:
 * - Tất cả tọa độ (rect/point) trong payload là normalized (0..1) theo canvas.
 * - GameEngine không cần biết lesson plan gốc; payload phải “flattened”.
 */

export const GAME_BLUEPRINTS = /** @type {const} */ ({
  HOVER_SELECT: 'HOVER_SELECT',
  DRAG_DROP: 'DRAG_DROP',
});

/**
 * @typedef {'HOVER_SELECT'|'DRAG_DROP'} GameBlueprintTemplateId
 */

/**
 * @typedef {{
 *   documentId?: string;
 *   slideIds?: string[];
 *   assetUrls?: string[];
 *   note?: string;
 * }} SlideDataReferences
 */

/**
 * Teacher-level configs (not per question).
 * @typedef {{
 *   timeLimitSec?: number;
 *   hoverHoldMs?: number;
 *   pinchThreshold?: number;
 *   enableSound?: boolean;
 * }} TeacherConfigs
 */

/**
 * FE -> BE: payload khi teacher “Save Game”.
 * @typedef {{
 *   templateId: GameBlueprintTemplateId;
 *   slideDataReferences: SlideDataReferences;
 *   teacherConfigs: TeacherConfigs;
 * }} GameConfigRequest
 */

/**
 * Common normalized rect.
 * @typedef {{ x: number; y: number; w: number; h: number; }} NormalizedRect
 */

/**
 * @typedef {{
 *   id: string;
 *   text: string;
 *   zone: NormalizedRect;
 * }} HoverChoice
 */

/**
 * Blueprint payload: Hover & Select.
 * @typedef {{
 *   prompt: string;
 *   choices: HoverChoice[];
 *   correctChoiceId: string;
 * }} HoverSelectPlayable
 */

/**
 * @typedef {{
 *   id: string;
 *   label: string;
 *   start: { x: number; y: number };
 *   size: { w: number; h: number };
 * }} DraggableItem
 */

/**
 * @typedef {{
 *   id: string;
 *   label: string;
 *   zone: NormalizedRect;
 *   acceptsItemId: string;
 * }} DropZone
 */

/**
 * Blueprint payload: Drag & Drop.
 * @typedef {{
 *   prompt: string;
 *   items: DraggableItem[];
 *   dropZones: DropZone[];
 * }} DragDropPlayable
 */

/**
 * BE -> FE: flattened payload để GameEngine consume.
 * @typedef {{
 *   gameId: string;
 *   templateId: GameBlueprintTemplateId;
 *   version: string;
 *   settings: {
 *     mirror: true;
 *     timeLimitSec: number;
 *     hoverHoldMs: number;
 *     pinchThreshold: number;
 *   };
 *   scene: {
 *     title?: string;
 *     backgroundUrl?: string;
 *   };
 *   // payload có thể là 1 câu (single) hoặc list nhiều câu (multi-round).
 *   // Nếu là list: mọi phần tử phải cùng loại với templateId.
 *   payload: HoverSelectPlayable | DragDropPlayable | Array<HoverSelectPlayable | DragDropPlayable>;
 * }} PlayableGameResponse
 */

// ---------------------------------------------------------------------------
// JSON Schemas (handover cho BE team)
// ---------------------------------------------------------------------------

export const GameConfigRequestSchema = {
  $id: 'GameConfigRequest',
  type: 'object',
  additionalProperties: false,
  required: ['templateId', 'slideDataReferences', 'teacherConfigs'],
  properties: {
    templateId: {
      type: 'string',
      enum: [GAME_BLUEPRINTS.HOVER_SELECT, GAME_BLUEPRINTS.DRAG_DROP],
    },
    slideDataReferences: {
      type: 'object',
      additionalProperties: false,
      properties: {
        documentId: { type: 'string' },
        slideIds: { type: 'array', items: { type: 'string' } },
        assetUrls: { type: 'array', items: { type: 'string' } },
        note: { type: 'string' },
      },
    },
    teacherConfigs: {
      type: 'object',
      additionalProperties: false,
      properties: {
        timeLimitSec: { type: 'number', minimum: 5, maximum: 600 },
        hoverHoldMs: { type: 'number', minimum: 250, maximum: 5000 },
        pinchThreshold: { type: 'number', minimum: 0.005, maximum: 0.2 },
        enableSound: { type: 'boolean' },
      },
    },
  },
};

const NormalizedRectSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['x', 'y', 'w', 'h'],
  properties: {
    x: { type: 'number', minimum: 0, maximum: 1 },
    y: { type: 'number', minimum: 0, maximum: 1 },
    w: { type: 'number', minimum: 0, maximum: 1 },
    h: { type: 'number', minimum: 0, maximum: 1 },
  },
};

const HoverSelectPlayableSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['prompt', 'choices', 'correctChoiceId'],
  properties: {
    prompt: { type: 'string' },
    correctChoiceId: { type: 'string' },
    choices: {
      type: 'array',
      minItems: 2,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'text', 'zone'],
        properties: {
          id: { type: 'string' },
          text: { type: 'string' },
          zone: NormalizedRectSchema,
        },
      },
    },
  },
};

const DragDropPlayableSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['prompt', 'items', 'dropZones'],
  properties: {
    prompt: { type: 'string' },
    items: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'label', 'start', 'size'],
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          start: {
            type: 'object',
            additionalProperties: false,
            required: ['x', 'y'],
            properties: {
              x: { type: 'number', minimum: 0, maximum: 1 },
              y: { type: 'number', minimum: 0, maximum: 1 },
            },
          },
          size: {
            type: 'object',
            additionalProperties: false,
            required: ['w', 'h'],
            properties: {
              w: { type: 'number', minimum: 0.01, maximum: 1 },
              h: { type: 'number', minimum: 0.01, maximum: 1 },
            },
          },
        },
      },
    },
    dropZones: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'label', 'zone', 'acceptsItemId'],
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          zone: NormalizedRectSchema,
          acceptsItemId: { type: 'string' },
        },
      },
    },
  },
};

export const PlayableGameResponseSchema = {
  $id: 'PlayableGameResponse',
  type: 'object',
  additionalProperties: false,
  required: ['gameId', 'templateId', 'version', 'settings', 'scene', 'payload'],
  properties: {
    gameId: { type: 'string' },
    templateId: {
      type: 'string',
      enum: [GAME_BLUEPRINTS.HOVER_SELECT, GAME_BLUEPRINTS.DRAG_DROP],
    },
    version: { type: 'string' },
    settings: {
      type: 'object',
      additionalProperties: false,
      required: ['mirror', 'timeLimitSec', 'hoverHoldMs', 'pinchThreshold'],
      properties: {
        mirror: { const: true },
        timeLimitSec: { type: 'number', minimum: 5, maximum: 600 },
        hoverHoldMs: { type: 'number', minimum: 250, maximum: 5000 },
        pinchThreshold: { type: 'number', minimum: 0.005, maximum: 0.2 },
      },
    },
    scene: {
      type: 'object',
      additionalProperties: false,
      properties: {
        title: { type: 'string' },
        backgroundUrl: { type: 'string' },
      },
    },
    payload: {
      oneOf: [
        HoverSelectPlayableSchema,
        DragDropPlayableSchema,
        {
          type: 'array',
          minItems: 1,
          items: {
            oneOf: [HoverSelectPlayableSchema, DragDropPlayableSchema],
          },
        },
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Mock responses (2 blueprints) – dùng cho FE demo khi BE chưa xong
// ---------------------------------------------------------------------------

/**
 * Create a single playable payload for a given round (useful for multi-round demos).
 * @param {GameBlueprintTemplateId} templateId
 * @param {number} roundIndex
 */
export function createMockPlayablePayload(templateId, roundIndex) {
  if (templateId === GAME_BLUEPRINTS.HOVER_SELECT) {
    const a = 2 + roundIndex;
    const b = 2 + roundIndex;
    const correct = a + b;
    return {
      prompt: `Câu ${roundIndex + 1}: ${a} + ${b} = ?`,
      correctChoiceId: `c${roundIndex}_2`,
      choices: [
        { id: `c${roundIndex}_1`, text: String(correct - 1), zone: { x: 0.08, y: 0.28, w: 0.38, h: 0.18 } },
        { id: `c${roundIndex}_2`, text: String(correct), zone: { x: 0.54, y: 0.28, w: 0.38, h: 0.18 } },
        { id: `c${roundIndex}_3`, text: String(correct + 1), zone: { x: 0.08, y: 0.56, w: 0.38, h: 0.18 } },
        { id: `c${roundIndex}_4`, text: String(correct + 2), zone: { x: 0.54, y: 0.56, w: 0.38, h: 0.18 } },
      ],
    };
  }

  if (templateId === GAME_BLUEPRINTS.DRAG_DROP) {
    return {
      prompt: `Câu ${roundIndex + 1}: Kéo đúng nhãn vào đúng ô:`,
      items: [
        {
          id: `item_${roundIndex}_cat`,
          label: 'Mèo',
          start: { x: 0.15, y: 0.75 },
          size: { w: 0.18, h: 0.12 },
        },
        {
          id: `item_${roundIndex}_dog`,
          label: 'Chó',
          start: { x: 0.38, y: 0.75 },
          size: { w: 0.18, h: 0.12 },
        },
      ],
      dropZones: [
        {
          id: `zone_${roundIndex}_cat`,
          label: 'Ô Mèo',
          acceptsItemId: `item_${roundIndex}_cat`,
          zone: { x: 0.12, y: 0.2, w: 0.32, h: 0.22 },
        },
        {
          id: `zone_${roundIndex}_dog`,
          label: 'Ô Chó',
          acceptsItemId: `item_${roundIndex}_dog`,
          zone: { x: 0.56, y: 0.2, w: 0.32, h: 0.22 },
        },
      ],
    };
  }

  // fallback (shouldn't happen)
  return /** @type {any} */ ({});
}

/**
 * @param {GameBlueprintTemplateId} templateId
 * @param {Partial<PlayableGameResponse>} [overrides]
 * @returns {PlayableGameResponse}
 */
export function createMockPlayableGameResponse(templateId, overrides = {}) {
  const baseSettings = {
    mirror: true,
    timeLimitSec: 60,
    hoverHoldMs: 2000,
    pinchThreshold: 0.045,
  };

  /** @type {PlayableGameResponse} */
  const base = {
    gameId: `mock_${templateId.toLowerCase()}_${Date.now()}`,
    templateId,
    version: '2026-03-31',
    settings: baseSettings,
    scene: {
      title: 'Mock Game',
    },
    payload: /** @type {any} */ ({}),
  };

  if (templateId === GAME_BLUEPRINTS.HOVER_SELECT) {
    base.scene.title = 'Hover & Select';
    base.payload = createMockPlayablePayload(templateId, 0);
  }

  if (templateId === GAME_BLUEPRINTS.DRAG_DROP) {
    base.scene.title = 'Drag & Drop';
    base.payload = createMockPlayablePayload(templateId, 0);
  }

  return /** @type {PlayableGameResponse} */ ({
    ...base,
    ...overrides,
    settings: { ...base.settings, ...(overrides.settings ?? {}) },
    scene: { ...base.scene, ...(overrides.scene ?? {}) },
    payload: overrides.payload ?? base.payload,
  });
}

// ---------------------------------------------------------------------------
// Preset mock: game_quiz (HOVER_SELECT) – payload thực tế BE dự kiến trả
// ---------------------------------------------------------------------------

/** @type {PlayableGameResponse} */
export const MOCK_GAME_QUIZ_HOVER_SELECT = {
  gameId: 'b854f974-e6a1-4031-bb14-376ebd0c5555',
  templateId: GAME_BLUEPRINTS.HOVER_SELECT,
  version: '1.0',
  settings: {
    mirror: true,
    timeLimitSec: 60.0,
    hoverHoldMs: 2000.0,
    pinchThreshold: 0.045,
  },
  scene: {
    title: 'BÀI 1: ĐỊA LÍ VỚI ĐỜI SỐNG',
  },
  payload: [
    {
      prompt: 'Kiến thức Địa lí có thể ứng dụng trong ngành nghề nào sau đây?',
      choices: [
        { id: 'A', text: 'Nông nghiệp', zone: { x: 0.08, y: 0.28, w: 0.38, h: 0.18 } },
        { id: 'B', text: 'Du lịch', zone: { x: 0.54, y: 0.28, w: 0.38, h: 0.18 } },
        { id: 'C', text: 'Quy hoạch đô thị', zone: { x: 0.08, y: 0.56, w: 0.38, h: 0.18 } },
        { id: 'D', text: 'Tất cả các đáp án trên', zone: { x: 0.54, y: 0.56, w: 0.38, h: 0.18 } },
      ],
      correctChoiceId: 'D',
    },
    {
      prompt: 'Ngành nghề nào sau đây chủ yếu ứng dụng kiến thức Địa lí tự nhiên?',
      choices: [
        { id: 'A', text: 'Hướng dẫn viên du lịch', zone: { x: 0.08, y: 0.28, w: 0.38, h: 0.18 } },
        { id: 'B', text: 'Nghiên cứu thị trường', zone: { x: 0.54, y: 0.28, w: 0.38, h: 0.18 } },
        { id: 'C', text: 'Quản lí đất đai', zone: { x: 0.08, y: 0.56, w: 0.38, h: 0.18 } },
        { id: 'D', text: 'Quy hoạch đô thị', zone: { x: 0.54, y: 0.56, w: 0.38, h: 0.18 } },
      ],
      correctChoiceId: 'C',
    },
    {
      prompt: 'Một hướng dẫn viên du lịch cần vận dụng kiến thức Địa lí nào nhiều nhất?',
      choices: [
        { id: 'A', text: 'Địa lí tự nhiên', zone: { x: 0.08, y: 0.28, w: 0.38, h: 0.18 } },
        { id: 'B', text: 'Địa lí kinh tế - xã hội', zone: { x: 0.54, y: 0.28, w: 0.38, h: 0.18 } },
        { id: 'C', text: 'Công nghệ GIS', zone: { x: 0.08, y: 0.56, w: 0.38, h: 0.18 } },
        { id: 'D', text: 'Thủy văn', zone: { x: 0.54, y: 0.56, w: 0.38, h: 0.18 } },
      ],
      correctChoiceId: 'B',
    },
    {
      prompt: 'Ứng dụng GIS và viễn thám trong phân tích không gian thuộc lĩnh vực Địa lí nào?',
      choices: [
        { id: 'A', text: 'Địa lí tự nhiên', zone: { x: 0.08, y: 0.28, w: 0.38, h: 0.18 } },
        { id: 'B', text: 'Địa lí kinh tế - xã hội', zone: { x: 0.54, y: 0.28, w: 0.38, h: 0.18 } },
        { id: 'C', text: 'Quy hoạch & Nghiên cứu', zone: { x: 0.08, y: 0.56, w: 0.38, h: 0.18 } },
        { id: 'D', text: 'Nông nghiệp', zone: { x: 0.54, y: 0.56, w: 0.38, h: 0.18 } },
      ],
      correctChoiceId: 'C',
    },
    {
      prompt: 'Nhận định nào sau đây đúng về môn Địa lí?',
      choices: [
        { id: 'A', text: 'Chỉ là khoa học tự nhiên', zone: { x: 0.08, y: 0.28, w: 0.38, h: 0.18 } },
        { id: 'B', text: 'Chỉ là khoa học xã hội', zone: { x: 0.54, y: 0.28, w: 0.38, h: 0.18 } },
        { id: 'C', text: 'Là môn học tổng hợp cả khoa học tự nhiên và xã hội', zone: { x: 0.08, y: 0.56, w: 0.38, h: 0.18 } },
        { id: 'D', text: 'Không liên quan đến định hướng nghề nghiệp', zone: { x: 0.54, y: 0.56, w: 0.38, h: 0.18 } },
      ],
      correctChoiceId: 'C',
    },
  ],
};

/**
 * @param {Partial<PlayableGameResponse>} [overrides]
 * @returns {PlayableGameResponse}
 */
export function createMockGameQuizHoverSelectPlayableGameResponse(overrides = {}) {
  return /** @type {PlayableGameResponse} */ ({
    ...MOCK_GAME_QUIZ_HOVER_SELECT,
    ...overrides,
    settings: { ...MOCK_GAME_QUIZ_HOVER_SELECT.settings, ...(overrides.settings ?? {}) },
    scene: { ...MOCK_GAME_QUIZ_HOVER_SELECT.scene, ...(overrides.scene ?? {}) },
    payload: overrides.payload ?? MOCK_GAME_QUIZ_HOVER_SELECT.payload,
  });
}
