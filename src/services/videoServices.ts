// src/services/videoServices.ts

import api from '@/config/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type { GenerateVideoInput, VideoProductDto, ApiResponse } from '@/types/api';

// ─── GET all videos for current user ────────────────────────────────────────
export async function getAllVideos(): Promise<VideoProductDto[]> {
  const res = await api.get<ApiResponse<VideoProductDto[]>>(API_ENDPOINTS.VIDEO.GET_ALL);
  return res.data.result ?? [];
}

// ─── POST generate video ───────────────────────────────────────────────────
export async function generateVideo(input: GenerateVideoInput): Promise<void> {
  await api.post(API_ENDPOINTS.VIDEO.GENERATE, input);
}

// ─── GET all videos by project ───────────────────────────────────────────
export async function getVideosByProject(projectCode: string): Promise<VideoProductDto[]> {
  const res = await api.get<ApiResponse<VideoProductDto[]>>(
    API_ENDPOINTS.VIDEO.GET_BY_PROJECT(projectCode),
  );
  return res.data.result ?? [];
}

// ─── GET latest video by project ──────────────────────────────────────────
export async function getLatestVideoByProject(projectCode: string): Promise<VideoProductDto | null> {
  const res = await api.get<ApiResponse<VideoProductDto>>(
    API_ENDPOINTS.VIDEO.GET_LATEST_BY_PROJECT(projectCode),
  );
  return res.data.result ?? null;
}

// ─── DELETE video ────────────────────────────────────────────────────────
export async function deleteVideo(productVideoCode: string): Promise<void> {
  await api.delete(API_ENDPOINTS.VIDEO.DELETE(productVideoCode));
}

// ─── Get a browser-playable signed URL for a gs:// video ──────────────────
export async function getVideoSignedUrl(gcsUrl: string): Promise<string> {
  const res = await fetch('/api/gcs/download-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gcsUrl }),
  });
  if (!res.ok) throw new Error('Failed to get video URL');
  const data = await res.json();
  return data.signedUrl as string;
}
