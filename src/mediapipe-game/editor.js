/**
 * Teacher Game Config UI (Mock)
 * ============================
 *
 * This module is intentionally DOM-driven (vanilla JS) to match the spec.
 * It expects a root element with child nodes marked by data-role attributes.
 */

import { GAME_BLUEPRINTS } from './api-contracts.js';
import { MediaPipeTracker, GameEngine } from './mediapipe-engine.js';

/**
 * @typedef {{
 *  rootEl: HTMLElement;
 * }} InitParams
 */

/**
 * @param {HTMLElement} rootEl
 * @param {string} role
 */
function q(rootEl, role) {
  const el = rootEl.querySelector(`[data-role="${role}"]`);
  if (!el) throw new Error(`Missing element [data-role="${role}"]`);
  return /** @type {HTMLElement} */ (el);
}

function show(el) {
  el.classList.remove('hidden');
}
function hide(el) {
  el.classList.add('hidden');
}

function safeNumber(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * @param {InitParams} params
 * @returns {() => void} dispose
 */
export function initTeacherGameEditor({ rootEl }) {
  const createBtn = /** @type {HTMLButtonElement} */ (q(rootEl, 'create-game-btn'));
  const modalEl = q(rootEl, 'config-modal');
  const modalBackdrop = q(rootEl, 'config-backdrop');
  const closeBtn = /** @type {HTMLButtonElement} */ (q(rootEl, 'close-modal-btn'));
  const saveBtn = /** @type {HTMLButtonElement} */ (q(rootEl, 'save-game-btn'));

  const templateSelect = /** @type {HTMLSelectElement} */ (q(rootEl, 'template-select'));
  const timeLimitInput = /** @type {HTMLInputElement} */ (q(rootEl, 'time-limit-input'));

  const hoverHoldInput = /** @type {HTMLInputElement} */ (q(rootEl, 'hover-hold-input'));
  const pinchThresholdInput = /** @type {HTMLInputElement} */ (q(rootEl, 'pinch-threshold-input'));

  const statusEl = q(rootEl, 'engine-status');
  const videoEl = /** @type {HTMLVideoElement} */ (q(rootEl, 'video'));
  const canvasEl = /** @type {HTMLCanvasElement} */ (q(rootEl, 'canvas'));

  /** @type {GameEngine | null} */
  let engine = null;
  /** @type {MediaPipeTracker | null} */
  let tracker = null;

  const setStatus = (msg) => {
    statusEl.textContent = msg;
  };

  const openModal = () => show(modalEl);
  const closeModal = () => hide(modalEl);

  const launchGame = async (playable) => {
    // dispose previous
    if (engine) {
      engine.dispose();
      engine = null;
    }

    if (tracker) {
      tracker.stop();
      tracker = null;
    }

    tracker = new MediaPipeTracker({
      videoEl,
      onFrame: () => {},
    });

    engine = new GameEngine({
      canvasEl,
      videoEl,
      playable,
      tracker,
      onStatus: setStatus,
    });

    await engine.init();
  };

  const handleSave = async () => {
    const templateId = /** @type {any} */ (templateSelect.value);

    const timeLimitSec = safeNumber(timeLimitInput.value, 60);
    const hoverHoldMs = safeNumber(hoverHoldInput.value, 2000);
    const pinchThreshold = safeNumber(pinchThresholdInput.value, 0.045);

    /** @type {import('./api-contracts.js').GameConfigRequest} */
    const req = {
      templateId,
      slideDataReferences: {
        documentId: 'mock_document',
        slideIds: ['mock_slide_1'],
        note: 'Mock-only: BE chưa implement',
      },
      teacherConfigs: {
        timeLimitSec,
        hoverHoldMs,
        pinchThreshold,
        enableSound: false,
      },
    };

    // Task requirement: console.log GameConfigRequest
    // eslint-disable-next-line no-console
    console.log('[GameConfigRequest]', req);

    closeModal();

    try {
      setStatus('Đang gửi cấu hình xuống BE (mock)...');

      const res = await fetch('/api/games/mock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || `BE error (${res.status})`);
      }

      const playable = await res.json();

      setStatus('Đang khởi tạo...');
      await launchGame(playable);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      setStatus(e instanceof Error ? e.message : 'Failed to start game');
    }
  };

  const handleCreateClick = () => {
    // Defaults
    if (!templateSelect.value) templateSelect.value = GAME_BLUEPRINTS.HOVER_SELECT;
    openModal();
  };

  createBtn.addEventListener('click', handleCreateClick);
  closeBtn.addEventListener('click', closeModal);
  modalBackdrop.addEventListener('click', closeModal);
  saveBtn.addEventListener('click', handleSave);

  setStatus('Chưa có game. Bấm “Create Game”.');

  return () => {
    createBtn.removeEventListener('click', handleCreateClick);
    closeBtn.removeEventListener('click', closeModal);
    modalBackdrop.removeEventListener('click', closeModal);
    saveBtn.removeEventListener('click', handleSave);

    if (engine) engine.dispose();
    if (tracker) tracker.stop();
  };
}
