/**
 * Mock Games API Route
 * ====================
 *
 * POST /api/games/mock
 * - Input: GameConfigRequest
 * - Output: PlayableGameResponse
 *
 * Mục đích: mô phỏng đúng luồng FE -> BE (Save config) -> BE trả playable payload.
 * Khi BE thật sẵn sàng, FE chỉ cần đổi base URL / endpoint.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  GAME_BLUEPRINTS,
  createMockGameQuizHoverSelectPlayableGameResponse,
  createMockPlayableGameResponse,
  createMockPlayablePayload,
} from '@/mediapipe-game/api-contracts.js';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const templateId = body?.templateId;
    if (templateId !== GAME_BLUEPRINTS.HOVER_SELECT && templateId !== GAME_BLUEPRINTS.DRAG_DROP) {
      return NextResponse.json(
        { error: 'templateId is required and must be a supported blueprint' },
        { status: 400 }
      );
    }

    const teacherConfigs = body?.teacherConfigs ?? {};

    const timeLimitSec = Number.isFinite(Number(teacherConfigs.timeLimitSec))
      ? Number(teacherConfigs.timeLimitSec)
      : 60;
    const hoverHoldMs = Number.isFinite(Number(teacherConfigs.hoverHoldMs))
      ? Number(teacherConfigs.hoverHoldMs)
      : 2000;
    const pinchThreshold = Number.isFinite(Number(teacherConfigs.pinchThreshold))
      ? Number(teacherConfigs.pinchThreshold)
      : 0.045;

    const slideIds = Array.isArray(body?.slideDataReferences?.slideIds)
      ? body.slideDataReferences.slideIds
      : [];
    const roundCount = Math.max(1, Math.min(10, slideIds.length || 1));

    const note = String(body?.slideDataReferences?.note ?? '');
    const useGameQuizPreset = /game[_-]?quiz/i.test(note);

    // Simulate a bit of network latency (like real BE)
    await new Promise((r) => setTimeout(r, 250));

    const playable =
      templateId === GAME_BLUEPRINTS.HOVER_SELECT && useGameQuizPreset
        ? createMockGameQuizHoverSelectPlayableGameResponse({
            settings: { mirror: true, timeLimitSec, hoverHoldMs, pinchThreshold },
            scene: { title: 'BÀI 1: ĐỊA LÍ VỚI ĐỜI SỐNG' },
          })
        : createMockPlayableGameResponse(templateId, {
            settings: { mirror: true, timeLimitSec, hoverHoldMs, pinchThreshold },
            scene: { title: body?.slideDataReferences?.note ? 'Mock Game (from config)' : undefined },
          });

    // Multi-round: if teacher passes multiple slideIds, simulate multiple questions.
    if (roundCount > 1 && !(templateId === GAME_BLUEPRINTS.HOVER_SELECT && useGameQuizPreset)) {
      playable.payload = Array.from({ length: roundCount }, (_v, i) =>
        createMockPlayablePayload(templateId, i)
      );
      playable.scene = {
        ...playable.scene,
        title: `${playable.scene?.title ?? 'Mock Game'} (${roundCount} câu)`,
      };
    }

    return NextResponse.json(playable, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
