// src/services/templateServices.ts

import api from '@/config/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type {
  ApiResponse,
  ICardTemplate,
  CreateTemplateInput,
  UpdateTemplateInput,
} from '@/types/api';
import type { ITemplateSkeleton } from '@/types/nodes';

// ─── Helper: API sends skeleton as a JSON string → parse/stringify ─────────
function parseSkeleton(raw: unknown): ITemplateSkeleton {
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as ITemplateSkeleton; } catch { return raw as unknown as ITemplateSkeleton; }
  }
  return raw as ITemplateSkeleton;
}

function normalizeSkeleton(template: ICardTemplate & { skeleton: unknown }): ICardTemplate {
  return { ...template, skeleton: parseSkeleton(template.skeleton) };
}

// ─── GET all templates ─────────────────────────────────────────────────────
export async function getAllTemplates(): Promise<ICardTemplate[]> {
  const { data } = await api.get<ApiResponse<(ICardTemplate & { skeleton: unknown })[]>>(
    API_ENDPOINTS.TEMPLATE.GET_ALL,
  );
  return (data.result ?? []).map(normalizeSkeleton);
}

// ─── GET template by code ──────────────────────────────────────────────────
export async function getTemplateByCode(templateCode: string): Promise<ICardTemplate> {
  const { data } = await api.get<ApiResponse<ICardTemplate & { skeleton: unknown }>>(
    API_ENDPOINTS.TEMPLATE.GET_BY_CODE(templateCode),
  );
  return normalizeSkeleton(data.result);
}

// ─── POST create template ──────────────────────────────────────────────────
export async function createTemplate(input: CreateTemplateInput): Promise<ICardTemplate> {
  const { data } = await api.post<ApiResponse<ICardTemplate & { skeleton: unknown }>>(
    API_ENDPOINTS.TEMPLATE.CREATE,
    input,
  );
  return normalizeSkeleton(data.result);
}

// ─── PUT update template ───────────────────────────────────────────────────
export async function updateTemplate(
  templateCode: string,
  input: UpdateTemplateInput,
): Promise<ICardTemplate> {
  const { data } = await api.put<ApiResponse<ICardTemplate & { skeleton: unknown }>>(
    API_ENDPOINTS.TEMPLATE.UPDATE(templateCode),
    input,
  );
  return normalizeSkeleton(data.result);
}

// ─── DELETE template ───────────────────────────────────────────────────────
export async function deleteTemplate(templateCode: string): Promise<void> {
  await api.delete(API_ENDPOINTS.TEMPLATE.DELETE(templateCode));
}
