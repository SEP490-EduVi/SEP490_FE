// src/services/templateServices.ts

import api from '@/config/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type {
  ApiResponse,
  ICardTemplate,
  CreateTemplateInput,
  UpdateTemplateInput,
} from '@/types/api';

// ─── GET all templates ─────────────────────────────────────────────────────
export async function getAllTemplates(): Promise<ICardTemplate[]> {
  const { data } = await api.get<ApiResponse<ICardTemplate[]>>(
    API_ENDPOINTS.TEMPLATE.GET_ALL,
  );
  return data.result ?? [];
}

// ─── GET template by code ──────────────────────────────────────────────────
export async function getTemplateByCode(templateCode: string): Promise<ICardTemplate> {
  const { data } = await api.get<ApiResponse<ICardTemplate>>(
    API_ENDPOINTS.TEMPLATE.GET_BY_CODE(templateCode),
  );
  return data.result;
}

// ─── POST create template ──────────────────────────────────────────────────
export async function createTemplate(input: CreateTemplateInput): Promise<ICardTemplate> {
  const { data } = await api.post<ApiResponse<ICardTemplate>>(
    API_ENDPOINTS.TEMPLATE.CREATE,
    input,
  );
  return data.result;
}

// ─── PUT update template ───────────────────────────────────────────────────
export async function updateTemplate(
  templateCode: string,
  input: UpdateTemplateInput,
): Promise<ICardTemplate> {
  const { data } = await api.put<ApiResponse<ICardTemplate>>(
    API_ENDPOINTS.TEMPLATE.UPDATE(templateCode),
    input,
  );
  return data.result;
}

// ─── DELETE template ───────────────────────────────────────────────────────
export async function deleteTemplate(templateCode: string): Promise<void> {
  await api.delete(API_ENDPOINTS.TEMPLATE.DELETE(templateCode));
}
