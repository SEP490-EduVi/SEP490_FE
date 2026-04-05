/**
 * MediaPipe Game Engine (ES Modules)
 * =================================
 *
 * Separation of concerns:
 * - MediaPipeTracker: camera + hand landmark detection
 * - GameEngine: render loop + blueprint selection
 * - Blueprint logic: HoverSelectGame, DragDropGame
 *
 * Mirroring requirement:
 * - UI should mirror both video and canvas (CSS transform scaleX(-1)).
 * - Landmark x must be flipped when mapping to canvas:
 *   xCanvas = (1 - landmark.x) * canvas.width
 */

import { GAME_BLUEPRINTS } from './api-contracts.js';

const TASKS_VISION_VERSION = '0.10.18';
const TASKS_VISION_WASM_BASE_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${TASKS_VISION_VERSION}/wasm`;
const HAND_LANDMARKER_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const PERFORMANCE_PROFILE = (() => {
  if (typeof globalThis === 'undefined' || !globalThis.navigator) {
    return { detectFps: 14, renderFps: 24, canvasScale: 0.66 };
  }

  const nav = globalThis.navigator;
  const cores = Number(nav.hardwareConcurrency || 4);
  const memory = Number(nav.deviceMemory || 4);
  const isLowEndDevice = cores <= 4 || memory <= 4;

  if (isLowEndDevice) {
    return { detectFps: 10, renderFps: 18, canvasScale: 0.56 };
  }

  return { detectFps: 14, renderFps: 24, canvasScale: 0.66 };
})();

const TARGET_DETECTION_FPS = PERFORMANCE_PROFILE.detectFps;
const TARGET_RENDER_FPS = PERFORMANCE_PROFILE.renderFps;
const CANVAS_RENDER_SCALE = PERFORMANCE_PROFILE.canvasScale;
const MAX_TEXT_LAYOUT_CACHE_SIZE = 300;
const textLayoutCache = new Map();
const HAND_SMOOTHING_ALPHA = 0.25;

/**
 * @typedef {{x:number,y:number,z?:number}} Landmark
 */

/**
 * @typedef {{
 *   landmarks: Landmark[] | null;
 *   hasHand: boolean;
 *   isPinching: boolean;
 *   pinchMid?: {x:number,y:number};
 *   indexTip?: {x:number,y:number};
 *   nowMs: number;
 * }} InputFrame
 */

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function smoothPoint(prev, next, alpha) {
  if (!prev) return next;
  return {
    x: lerp(prev.x, next.x, alpha),
    y: lerp(prev.y, next.y, alpha),
  };
}

function dist2(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function mapLandmarkToCanvas(landmark, canvas) {
  return {
    x: (1 - landmark.x) * canvas.width,
    y: landmark.y * canvas.height,
  };
}

function rectToCanvas(normRect, canvas) {
  return {
    x: normRect.x * canvas.width,
    y: normRect.y * canvas.height,
    w: normRect.w * canvas.width,
    h: normRect.h * canvas.height,
  };
}

function pointInRect(pt, rect) {
  return pt.x >= rect.x && pt.x <= rect.x + rect.w && pt.y >= rect.y && pt.y <= rect.y + rect.h;
}

function drawRoundedRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawGameContentPanel(ctx, canvas, options = {}) {
  const { width, height } = canvas;
  const x = options.x ?? width * 0.035;
  const y = options.y ?? height * 0.06;
  const w = options.w ?? width * 0.93;
  const h = options.h ?? height * 0.8;
  const radius = options.radius ?? 24;

  ctx.save();
  drawRoundedRect(ctx, x, y, w, h, radius);
  ctx.fillStyle = 'rgba(15,23,42,0.55)';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = 'rgba(255,255,255,0.24)';
  ctx.stroke();
  ctx.restore();
}

function wrapTextLines(ctx, text, maxWidth, maxLines, enableEllipsis = true) {
  const raw = String(text ?? '').trim();
  if (!raw) return [''];

  const words = raw.split(/\s+/);
  const lines = [];
  let current = '';

  const pushLine = (line) => {
    if (lines.length < maxLines) lines.push(line);
  };

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }

    if (!current) {
      // Fallback for a very long token without spaces.
      let partial = '';
      for (const ch of word) {
        const next = partial + ch;
        if (ctx.measureText(next).width <= maxWidth) {
          partial = next;
        } else {
          break;
        }
      }
      pushLine(partial || word.slice(0, 1));
      current = word.slice((partial || word.slice(0, 1)).length).trim();
    } else {
      pushLine(current);
      current = word;
    }

    if (lines.length >= maxLines) break;
  }

  if (lines.length < maxLines && current) {
    pushLine(current);
  }

  // Ellipsis when truncated.
  const consumedWordCount = lines.join(' ').split(/\s+/).filter(Boolean).length;
  const truncated = consumedWordCount < words.length;
  if (enableEllipsis && truncated && lines.length > 0) {
    const lastIdx = lines.length - 1;
    let last = lines[lastIdx];
    const ellipsis = '...';
    while (last && ctx.measureText(last + ellipsis).width > maxWidth) {
      last = last.slice(0, -1);
    }
    lines[lastIdx] = (last || '').trimEnd() + ellipsis;
  }

  return lines.slice(0, maxLines);
}

function drawCenteredMultilineText(ctx, text, centerX, centerY, maxWidth, lineHeight, maxLines) {
  const lines = wrapTextLines(ctx, text, maxWidth, maxLines);
  const blockHeight = lines.length * lineHeight;
  let y = centerY - blockHeight / 2 + lineHeight / 2;

  for (const line of lines) {
    ctx.fillText(line, centerX, y);
    y += lineHeight;
  }
}

function drawAutoFitTextInRect(ctx, text, rect, options = {}) {
  const {
    paddingX = 12,
    paddingY = 8,
    minFontPx = 10,
    maxFontPx = 18,
    maxLines = 3,
    fontWeight = 600,
    ellipsis = true,
  } = options;

  const availableWidth = Math.max(12, rect.w - paddingX * 2);
  const availableHeight = Math.max(12, rect.h - paddingY * 2);

  const cacheKey = [
    String(text ?? ''),
    Math.round(rect.w),
    Math.round(rect.h),
    paddingX,
    paddingY,
    minFontPx,
    maxFontPx,
    maxLines,
    fontWeight,
    ellipsis,
  ].join('|');

  const cached = textLayoutCache.get(cacheKey);
  if (cached) {
    ctx.font = cached.font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const blockHeight = cached.lines.length * cached.lineHeight;
    let y = rect.y + rect.h / 2 - blockHeight / 2 + cached.lineHeight / 2;
    const x = rect.x + rect.w / 2;

    for (const line of cached.lines) {
      ctx.fillText(line, x, y);
      y += cached.lineHeight;
    }
    return;
  }

  let chosenFont = minFontPx;
  let chosenLineHeight = Math.max(12, Math.round(minFontPx * 1.25));
  let chosenLines = [''];

  for (let fontPx = maxFontPx; fontPx >= minFontPx; fontPx -= 1) {
    const lineHeight = Math.max(12, Math.round(fontPx * 1.25));
    const allowedLines = Math.max(1, Math.min(maxLines, Math.floor(availableHeight / lineHeight)));
    if (allowedLines <= 0) continue;

    ctx.font = `${fontWeight} ${fontPx}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    const lines = wrapTextLines(ctx, text, availableWidth, allowedLines, ellipsis);
    const blockHeight = lines.length * lineHeight;

    if (blockHeight <= availableHeight) {
      chosenFont = fontPx;
      chosenLineHeight = lineHeight;
      chosenLines = lines;
      break;
    }
  }

  const resolvedFont = `${fontWeight} ${chosenFont}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
  ctx.font = resolvedFont;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const blockHeight = chosenLines.length * chosenLineHeight;
  let y = rect.y + rect.h / 2 - blockHeight / 2 + chosenLineHeight / 2;
  const x = rect.x + rect.w / 2;

  for (const line of chosenLines) {
    ctx.fillText(line, x, y);
    y += chosenLineHeight;
  }

  if (textLayoutCache.size >= MAX_TEXT_LAYOUT_CACHE_SIZE) {
    const oldestKey = textLayoutCache.keys().next().value;
    if (oldestKey) textLayoutCache.delete(oldestKey);
  }
  textLayoutCache.set(cacheKey, {
    font: resolvedFont,
    lineHeight: chosenLineHeight,
    lines: chosenLines,
  });
}

async function importTasksVision() {
  // Runtime ESM import from CDN (do not bundle).
  const mod = await import(
    /* webpackIgnore: true */ 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18'
  );
  return {
    HandLandmarker: mod.HandLandmarker,
    FilesetResolver: mod.FilesetResolver,
  };
}

export class MediaPipeTracker {
  /**
   * @param {{
   *  videoEl: HTMLVideoElement;
   *  onFrame: (results: any) => void;
   *  options?: {
   *    numHands?: number;
   *    minHandDetectionConfidence?: number;
   *    minHandPresenceConfidence?: number;
   *    minTrackingConfidence?: number;
   *  }
   * }} params
   */
  constructor({ videoEl, onFrame, options = {} }) {
    this.videoEl = videoEl;
    this.onFrame = onFrame;
    this.options = options;

    this.handLandmarker = null;
    this.stream = null;
    this.rafId = null;
    this.lastVideoTime = -1;
    this.lastDetectAtMs = 0;
    this.isReady = false;
  }

  async init() {
    const { HandLandmarker, FilesetResolver } = await importTasksVision();

    const vision = await FilesetResolver.forVisionTasks(TASKS_VISION_WASM_BASE_URL);
    const createLandmarker = async (delegate) => HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: HAND_LANDMARKER_MODEL_URL,
        delegate,
      },
      runningMode: 'VIDEO',
      numHands: this.options.numHands ?? 1,
      minHandDetectionConfidence: this.options.minHandDetectionConfidence ?? 0.35,
      minHandPresenceConfidence: this.options.minHandPresenceConfidence ?? 0.35,
      minTrackingConfidence: this.options.minTrackingConfidence ?? 0.35,
    });

    try {
      this.handLandmarker = await createLandmarker('GPU');
    } catch (gpuErr) {
      // eslint-disable-next-line no-console
      console.warn('[MediaPipe] GPU delegate unavailable, falling back to CPU.', gpuErr);
      this.handLandmarker = await createLandmarker('CPU');
    }

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 960 }, height: { ideal: 540 }, facingMode: 'user' },
      audio: false,
    });

    this.videoEl.srcObject = this.stream;
    await this.videoEl.play();

    this.isReady = true;
  }

  start() {
    if (!this.handLandmarker) {
      throw new Error('MediaPipeTracker.start() called before init()');
    }

    const tick = () => {
      if (this.handLandmarker && this.videoEl.readyState >= 2) {
        const nowMs = performance.now();
        const minDetectInterval = 1000 / TARGET_DETECTION_FPS;
        const currentTime = this.videoEl.currentTime;
        if (currentTime !== this.lastVideoTime && nowMs - this.lastDetectAtMs >= minDetectInterval) {
          this.lastVideoTime = currentTime;
          this.lastDetectAtMs = nowMs;
          const results = this.handLandmarker.detectForVideo(this.videoEl, nowMs);
          this.onFrame(results);
        }
      }
      this.rafId = requestAnimationFrame(tick);
    };

    this.rafId = requestAnimationFrame(tick);
  }

  stop() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;

    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }
}

class HoverSelectGame {
  /**
   * @param {{ playable: any; settings: any; canvas: HTMLCanvasElement }} params
   */
  constructor({ playable, settings, canvas }) {
    this.playable = playable;
    this.settings = settings;
    this.canvas = canvas;

    this.hoveringChoiceId = null;
    this.hoverStartMs = 0;
    this.selectedChoiceId = null;
    this.isCorrect = null;

    this.correctCompletedAtMs = null;
    this.wrongSelectedAtMs = null;
    this.promptFontPx = 17;
  }

  /** @param {InputFrame} frame */
  update(frame) {
    if (!frame.hasHand || !frame.indexTip) {
      this.hoveringChoiceId = null;
      this.hoverStartMs = 0;
      return;
    }

    if (this.selectedChoiceId) {
      // Allow retry if wrong selection.
      if (this.isCorrect === false && this.wrongSelectedAtMs != null) {
        if (frame.nowMs - this.wrongSelectedAtMs >= 900) {
          this.selectedChoiceId = null;
          this.isCorrect = null;
          this.wrongSelectedAtMs = null;
          this.hoveringChoiceId = null;
          this.hoverStartMs = 0;
        }
      }
      return;
    }

    const tip = frame.indexTip;
    let hit = null;

    for (const c of this.playable.choices) {
      const rect = rectToCanvas(c.zone, this.canvas);
      if (pointInRect(tip, rect)) {
        hit = c.id;
        break;
      }
    }

    if (!hit) {
      this.hoveringChoiceId = null;
      this.hoverStartMs = 0;
      return;
    }

    if (hit !== this.hoveringChoiceId) {
      this.hoveringChoiceId = hit;
      this.hoverStartMs = frame.nowMs;
      return;
    }

    const elapsed = frame.nowMs - this.hoverStartMs;
    if (elapsed >= this.settings.hoverHoldMs) {
      this.selectedChoiceId = hit;
      this.isCorrect = hit === this.playable.correctChoiceId;

      if (this.isCorrect) {
        if (this.correctCompletedAtMs == null) this.correctCompletedAtMs = frame.nowMs;
      } else {
        this.wrongSelectedAtMs = frame.nowMs;
      }
    }
  }

  isComplete() {
    return this.correctCompletedAtMs != null;
  }

  getCompletedAtMs() {
    return this.correctCompletedAtMs;
  }

  /** @param {{ctx: CanvasRenderingContext2D; frame: InputFrame}} params */
  render({ ctx, frame }) {
    const { width, height } = this.canvas;

    // Background (clear with identity transform, then restore current transform)
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    drawGameContentPanel(ctx, this.canvas, {
      y: height * 0.06,
      h: height * 0.78,
    });

    // Prompt
    ctx.fillStyle = '#ffffff';
    ctx.font = `600 ${this.promptFontPx}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawCenteredMultilineText(ctx, this.playable.prompt, width / 2, 34, width * 0.9, 24, 2);

    // Choices
    for (const c of this.playable.choices) {
      const rect = rectToCanvas(c.zone, this.canvas);

      const isHover = this.hoveringChoiceId === c.id;
      const isSelected = this.selectedChoiceId === c.id;

      ctx.save();
      drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 14);

      if (isSelected) {
        ctx.fillStyle = this.isCorrect ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)';
      } else {
        ctx.fillStyle = isHover ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.10)';
      }
      ctx.fill();

      ctx.lineWidth = isHover ? 3 : 2;
      ctx.strokeStyle = isHover ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)';
      ctx.stroke();

      // Clip text inside choice box to avoid crossing into neighboring choices.
      drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 14);
      ctx.clip();

      // Text
      ctx.fillStyle = '#ffffff';
      drawAutoFitTextInRect(ctx, c.text, rect, {
        minFontPx: 10,
        maxFontPx: 15,
        maxLines: 3,
        paddingX: 10,
        paddingY: 8,
        fontWeight: 600,
      });
      ctx.restore();
    }

    // Finger cursor + hover progress arc
    if (frame.hasHand && frame.indexTip) {
      const p = frame.indexTip;
      ctx.save();
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fill();

      if (this.hoveringChoiceId && !this.selectedChoiceId) {
        const elapsed = frame.nowMs - this.hoverStartMs;
        const t = clamp01(elapsed / this.settings.hoverHoldMs);

        ctx.beginPath();
        ctx.arc(p.x, p.y, 18, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * t);
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 4;
        ctx.stroke();
      }

      ctx.restore();
    }

    // Result
    if (this.selectedChoiceId) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, height - 56, width, 56);
      ctx.fillStyle = '#ffffff';
      ctx.font = '600 18px system-ui, -apple-system, Segoe UI, Roboto, Arial';
      ctx.textAlign = 'center';
      const msg = this.isCorrect ? 'Đúng rồi!' : 'Chưa đúng, thử lại nhé!';
      ctx.fillText(msg, width / 2, height - 22);
      ctx.restore();
    }
  }
}

class DragDropGame {
  /**
   * @param {{ playable: any; settings: any; canvas: HTMLCanvasElement }} params
   */
  constructor({ playable, settings, canvas }) {
    // Clone so layout optimization does not mutate external payload/state.
    this.playable = {
      ...playable,
      items: (playable.items ?? []).map((it) => ({
        ...it,
        start: { ...it.start },
        size: { ...it.size },
      })),
      dropZones: (playable.dropZones ?? []).map((z) => ({
        ...z,
        zone: { ...z.zone },
      })),
    };
    this.settings = settings;
    this.canvas = canvas;

    this._optimizeDropZoneLayout();
    this._optimizeItemLayout();

    this.items = this.playable.items.map((it) => ({
      ...it,
      pos: { x: it.start.x, y: it.start.y },
      placedZoneId: null,
    }));

    this.grabbedItemId = null;
    this.wasPinching = false;

    this.completedAtMs = null;
    this.promptFontPx = 17;
  }

  _optimizeDropZoneLayout() {
    const zones = this.playable.dropZones;
    if (!Array.isArray(zones) || zones.length < 3) return;

    const yValues = zones.map((z) => z.zone.y + z.zone.h / 2);
    const isSameRow = Math.max(...yValues) - Math.min(...yValues) <= 0.18;
    if (!isSameRow) return;

    const sorted = [...zones].sort((a, b) => a.zone.x - b.zone.x);
    let minGap = Infinity;
    for (let i = 0; i < sorted.length - 1; i += 1) {
      const a = sorted[i].zone;
      const b = sorted[i + 1].zone;
      minGap = Math.min(minGap, b.x - (a.x + a.w));
    }

    // Existing spacing is good enough.
    if (minGap >= 0.02) return;

    const n = sorted.length;
    const sidePadding = 0.05;
    const targetGap = 0.02;
    const availableWidth = 1 - sidePadding * 2 - targetGap * (n - 1);
    const oldAvgW = sorted.reduce((sum, z) => sum + z.zone.w, 0) / n;
    const targetW = Math.max(0.11, Math.min(oldAvgW, availableWidth / n));

    let x = sidePadding;
    for (const zone of sorted) {
      zone.zone.x = x;
      zone.zone.w = targetW;
      x += targetW + targetGap;
    }
  }

  _optimizeItemLayout() {
    const items = this.playable.items;
    if (!Array.isArray(items) || items.length < 3) return;

    const yValues = items.map((it) => it.start.y);
    const isSameRow = Math.max(...yValues) - Math.min(...yValues) <= 0.2;
    if (!isSameRow) return;

    const sorted = [...items].sort((a, b) => a.start.x - b.start.x);
    let minGap = Infinity;
    for (let i = 0; i < sorted.length - 1; i += 1) {
      const aLeft = sorted[i].start.x - sorted[i].size.w / 2;
      const aRight = sorted[i].start.x + sorted[i].size.w / 2;
      const bLeft = sorted[i + 1].start.x - sorted[i + 1].size.w / 2;
      minGap = Math.min(minGap, bLeft - aRight);
    }

    if (minGap >= 0.018) return;

    const n = sorted.length;
    const sidePadding = 0.06;
    const targetGap = 0.02;
    const availableWidth = 1 - sidePadding * 2 - targetGap * (n - 1);
    const oldAvgW = sorted.reduce((sum, it) => sum + it.size.w, 0) / n;
    const targetW = Math.max(0.1, Math.min(oldAvgW, availableWidth / n));

    let centerX = sidePadding + targetW / 2;
    for (const it of sorted) {
      it.size.w = targetW;
      it.start.x = centerX;
      centerX += targetW + targetGap;
    }
  }

  /** @param {InputFrame} frame */
  update(frame) {
    if (!frame.hasHand || !frame.pinchMid) {
      this._release();
      this.wasPinching = false;
      return;
    }

    const pinch = frame.pinchMid;

    if (frame.isPinching && !this.wasPinching) {
      // Pinch started: pick nearest item under pinch
      const pick = this._pickItemAt(pinch);
      this.grabbedItemId = pick;
    }

    if (frame.isPinching && this.grabbedItemId) {
      const item = this.items.find((i) => i.id === this.grabbedItemId);
      if (item) {
        item.pos.x = clamp01(pinch.x);
        item.pos.y = clamp01(pinch.y);
      }
    }

    if (!frame.isPinching && this.wasPinching) {
      // Pinch released
      this._snapIfOverZone();
      this._release();
    }

    if (this.completedAtMs == null) {
      const allPlaced = this.items.length > 0 && this.items.every((i) => Boolean(i.placedZoneId));
      if (allPlaced) this.completedAtMs = frame.nowMs;
    }

    this.wasPinching = frame.isPinching;
  }

  isComplete() {
    return this.completedAtMs != null;
  }

  getCompletedAtMs() {
    return this.completedAtMs;
  }

  _release() {
    this.grabbedItemId = null;
  }

  _pickItemAt(pinchNorm) {
    // prioritize items not placed yet
    const candidates = [...this.items].sort((a, b) => (a.placedZoneId ? 1 : 0) - (b.placedZoneId ? 1 : 0));

    for (const it of candidates) {
      const rectNorm = {
        x: it.pos.x - it.size.w / 2,
        y: it.pos.y - it.size.h / 2,
        w: it.size.w,
        h: it.size.h,
      };
      const rect = rectToCanvas(rectNorm, this.canvas);
      const pinch = {
        x: pinchNorm.x * this.canvas.width,
        y: pinchNorm.y * this.canvas.height,
      };
      if (pointInRect(pinch, rect)) return it.id;
    }
    return null;
  }

  _snapIfOverZone() {
    if (!this.grabbedItemId) return;

    const item = this.items.find((i) => i.id === this.grabbedItemId);
    if (!item) return;

    const itemRectNorm = {
      x: item.pos.x - item.size.w / 2,
      y: item.pos.y - item.size.h / 2,
      w: item.size.w,
      h: item.size.h,
    };

    const itemCenter = {
      x: item.pos.x,
      y: item.pos.y,
    };

    for (const zone of this.playable.dropZones) {
      const z = zone.zone;
      const inside =
        itemCenter.x >= z.x &&
        itemCenter.x <= z.x + z.w &&
        itemCenter.y >= z.y &&
        itemCenter.y <= z.y + z.h;

      if (!inside) continue;

      // snap to zone center
      item.pos.x = z.x + z.w / 2;
      item.pos.y = z.y + z.h / 2;
      item.placedZoneId = zone.id;

      // if wrong zone, keep placed but highlight later (simple)
      return;
    }
  }

  _findFocusedLabel(pointerCanvas) {
    if (!pointerCanvas) return null;

    for (let i = this.items.length - 1; i >= 0; i -= 1) {
      const it = this.items[i];
      const rectNorm = {
        x: it.pos.x - it.size.w / 2,
        y: it.pos.y - it.size.h / 2,
        w: it.size.w,
        h: it.size.h,
      };
      const rect = rectToCanvas(rectNorm, this.canvas);
      if (pointInRect(pointerCanvas, rect)) return it.label;
    }

    for (const zone of this.playable.dropZones) {
      const rect = rectToCanvas(zone.zone, this.canvas);
      if (pointInRect(pointerCanvas, rect)) return zone.label;
    }

    return null;
  }

  /** @param {{ctx: CanvasRenderingContext2D; frame: InputFrame}} params */
  render({ ctx, frame }) {
    const { width, height } = this.canvas;

    // Background (clear with identity transform, then restore current transform)
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    drawGameContentPanel(ctx, this.canvas, {
      y: height * 0.06,
      h: height * 0.78,
    });

    ctx.fillStyle = '#ffffff';
    ctx.font = `600 ${this.promptFontPx}px system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawCenteredMultilineText(ctx, this.playable.prompt, width / 2, 34, width * 0.9, 24, 2);

    // Drop zones
    for (const zone of this.playable.dropZones) {
      const rect = rectToCanvas(zone.zone, this.canvas);

      ctx.save();
      drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 16);
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 2;
      ctx.stroke();

      drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 16);
      ctx.clip();

      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      drawAutoFitTextInRect(ctx, zone.label, rect, {
        minFontPx: 8,
        maxFontPx: 14,
        maxLines: 6,
        paddingX: 7,
        paddingY: 5,
        fontWeight: 600,
        ellipsis: false,
      });
      ctx.restore();
    }

    // Items
    for (const it of this.items) {
      const rectNorm = {
        x: it.pos.x - it.size.w / 2,
        y: it.pos.y - it.size.h / 2,
        w: it.size.w,
        h: it.size.h,
      };
      const rect = rectToCanvas(rectNorm, this.canvas);
      const isGrabbed = this.grabbedItemId === it.id;

      // correct placement check
      let placedCorrect = null;
      if (it.placedZoneId) {
        const zone = this.playable.dropZones.find((z) => z.id === it.placedZoneId);
        placedCorrect = zone ? zone.acceptsItemId === it.id : null;
      }

      ctx.save();
      drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 14);

      if (placedCorrect === true) ctx.fillStyle = 'rgba(16,185,129,0.30)';
      else if (placedCorrect === false) ctx.fillStyle = 'rgba(239,68,68,0.30)';
      else ctx.fillStyle = isGrabbed ? 'rgba(255,255,255,0.20)' : 'rgba(255,255,255,0.12)';

      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = isGrabbed ? 3 : 2;
      ctx.stroke();

      drawRoundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 14);
      ctx.clip();

      ctx.fillStyle = '#ffffff';
      drawAutoFitTextInRect(ctx, it.label, rect, {
        minFontPx: 8,
        maxFontPx: 14,
        maxLines: 5,
        paddingX: 7,
        paddingY: 5,
        fontWeight: 700,
        ellipsis: false,
      });
      ctx.restore();
    }

    // Pinch cursor
    if (frame.hasHand && frame.indexTip) {
      ctx.save();
      const p = frame.indexTip;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = frame.isPinching ? 'rgba(255,204,77,0.95)' : 'rgba(255,255,255,0.85)';
      ctx.fill();
      ctx.restore();
    }

    const focusedLabel = this._findFocusedLabel(frame.indexTip || null);
    if (focusedLabel) {
      const panel = {
        x: width * 0.03,
        y: height - 98,
        w: width * 0.62,
        h: 44,
      };

      ctx.save();
      drawRoundedRect(ctx, panel.x, panel.y, panel.w, panel.h, 10);
      ctx.fillStyle = 'rgba(15,23,42,0.75)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      drawAutoFitTextInRect(ctx, focusedLabel, panel, {
        minFontPx: 10,
        maxFontPx: 14,
        maxLines: 2,
        paddingX: 10,
        paddingY: 6,
        fontWeight: 600,
        ellipsis: false,
      });
      ctx.restore();
    }

    // Hint
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, height - 42, width, 42);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = '500 14px system-ui, -apple-system, Segoe UI, Roboto, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Gắp = chụm ngón cái + trỏ (pinch) và kéo thả.', width / 2, height - 21);
    ctx.restore();
  }
}

export class GameEngine {
  /**
   * @param {{
   *  canvasEl: HTMLCanvasElement;
   *  videoEl: HTMLVideoElement;
   *  playable: any;
   *  tracker: MediaPipeTracker;
   *  onStatus?: (msg: string) => void;
   * }} params
   */
  constructor({ canvasEl, videoEl, playable, tracker, onStatus }) {
    this.canvasEl = canvasEl;
    this.videoEl = videoEl;
    this.playable = playable;
    this.tracker = tracker;
    this.onStatus = onStatus ?? (() => {});

    this.ctx = canvasEl.getContext('2d');
    this.rafId = null;
    this.lastResults = null;
    this.blueprint = null;
    this.lastRenderAtMs = 0;
    this.lastIndexTip = null;
    this.lastPinchMid = null;

    this.rounds = null;
    this.roundIndex = 0;
    this.isFinished = false;

    this._handleResize = this._handleResize.bind(this);
  }

  async init() {
    if (!this.ctx) throw new Error('Canvas 2D context not available');

    this._handleResize();
    window.addEventListener('resize', this._handleResize);

    // Bind tracker callback to store results
    this.tracker.onFrame = (results) => {
      this.lastResults = results;
    };

    this.onStatus('Đang khởi tạo camera...');
    await this.tracker.init();
    this.tracker.start();

    this.onStatus('Đang chạy game...');

    const payload = this.playable.payload;
    this.rounds = Array.isArray(payload) ? payload : [payload];
    this.roundIndex = 0;
    this.isFinished = false;
    this._createBlueprintForRound();

    this._tick();
  }

  _createBlueprintForRound() {
    const templateId = this.playable.templateId;
    const roundPayload = this.rounds?.[this.roundIndex];

    if (!roundPayload) {
      this.blueprint = null;
      this.isFinished = true;
      return;
    }

    if (templateId === GAME_BLUEPRINTS.HOVER_SELECT) {
      this.blueprint = new HoverSelectGame({
        playable: roundPayload,
        settings: this.playable.settings,
        canvas: this.canvasEl,
      });
      return;
    }

    if (templateId === GAME_BLUEPRINTS.DRAG_DROP) {
      this.blueprint = new DragDropGame({
        playable: roundPayload,
        settings: this.playable.settings,
        canvas: this.canvasEl,
      });
      return;
    }

    throw new Error(`Unsupported templateId: ${templateId}`);
  }

  dispose() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;

    window.removeEventListener('resize', this._handleResize);
    this.tracker.stop();

    this.lastResults = null;
    this.blueprint = null;

    this.rounds = null;
    this.roundIndex = 0;
    this.isFinished = false;

    if (this.ctx) this.ctx.clearRect(0, 0, this.canvasEl.width, this.canvasEl.height);
  }

  _handleResize() {
    // Match canvas size to rendered size to keep hit-testing consistent.
    const rect = this.canvasEl.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvasEl.width = Math.max(2, Math.floor(rect.width * dpr * CANVAS_RENDER_SCALE));
    this.canvasEl.height = Math.max(2, Math.floor(rect.height * dpr * CANVAS_RENDER_SCALE));
  }

  _buildInputFrame(nowMs) {
    const landmarks = this.lastResults?.landmarks?.[0] ?? null;
    const hasHand = Boolean(landmarks && landmarks.length);

    /** @type {InputFrame} */
    const frame = {
      landmarks,
      hasHand,
      isPinching: false,
      nowMs,
    };

    if (!hasHand) return frame;

    // index tip (8)
    const indexLm = landmarks[8];
    const rawIndexTip = mapLandmarkToCanvas(indexLm, this.canvasEl);
    const smoothedIndexTip = smoothPoint(this.lastIndexTip, rawIndexTip, HAND_SMOOTHING_ALPHA);
    this.lastIndexTip = smoothedIndexTip;
    frame.indexTip = smoothedIndexTip;

    // pinch (4, 8)
    const thumbLm = landmarks[4];
    const indexNorm = { x: indexLm.x, y: indexLm.y };
    const thumbNorm = { x: thumbLm.x, y: thumbLm.y };

    const pinchDistance = dist2(indexNorm, thumbNorm);
    const threshold = this.playable.settings?.pinchThreshold ?? 0.045;

    frame.isPinching = pinchDistance < threshold;

    const midNorm = {
      x: (indexNorm.x + thumbNorm.x) / 2,
      y: (indexNorm.y + thumbNorm.y) / 2,
    };

    const rawPinchMid = {
      x: clamp01(1 - midNorm.x), // flip for mirrored canvas
      y: clamp01(midNorm.y),
    };
    const smoothedPinchMid = smoothPoint(this.lastPinchMid, rawPinchMid, HAND_SMOOTHING_ALPHA);
    this.lastPinchMid = smoothedPinchMid;
    frame.pinchMid = smoothedPinchMid;

    return frame;
  }

  _tick() {
    const nowMs = performance.now();
    const minRenderInterval = 1000 / TARGET_RENDER_FPS;
    if (nowMs - this.lastRenderAtMs < minRenderInterval) {
      this.rafId = requestAnimationFrame(() => this._tick());
      return;
    }
    this.lastRenderAtMs = nowMs;

    const frame = this._buildInputFrame(nowMs);

    // Canvas element is mirrored via CSS. Mirror the drawing context too to avoid
    // mirrored (reversed) text, while still drawing with flipped X coordinates.
    // Net effect: UI looks normal, but interaction aligns with mirrored video.
    this.ctx.setTransform(-1, 0, 0, 1, this.canvasEl.width, 0);

    if (this.blueprint) {
      this.blueprint.update(frame);
      this.blueprint.render({ ctx: this.ctx, frame });

      const isComplete = typeof this.blueprint.isComplete === 'function' ? this.blueprint.isComplete() : false;
      const completedAtMs =
        typeof this.blueprint.getCompletedAtMs === 'function' ? this.blueprint.getCompletedAtMs() : null;

      if (isComplete && completedAtMs != null && nowMs - completedAtMs >= 700) {
        this.roundIndex += 1;
        if (this.rounds && this.roundIndex < this.rounds.length) {
          this._createBlueprintForRound();
        } else {
          this.blueprint = null;
          this.isFinished = true;
        }
      }
    }

    if (this.isFinished) {
      // Simple overlay.
      const w = this.canvasEl.width;
      const h = this.canvasEl.height;
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(0,0,0,0.55)';
      this.ctx.fillRect(0, h / 2 - 44, w, 88);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '700 22px system-ui, -apple-system, Segoe UI, Roboto, Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('Hoàn thành!', w / 2, h / 2);
      this.ctx.restore();
    }

    this.rafId = requestAnimationFrame(() => this._tick());
  }
}
