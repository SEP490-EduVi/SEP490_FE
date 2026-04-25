import api from '@/config/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type { ApiResponse, MaterialDto, UpdateMaterialInput, MaterialBrowseParams, PurchasedMaterialDto } from '@/types/api';
import { uploadMaterialFilesToGcs } from './gcsServices';

function getCurrentUserId(): string {
  if (typeof window === 'undefined') return 'anonymous';

  try {
    const raw = localStorage.getItem('user');
    if (!raw) return 'anonymous';

    const user = JSON.parse(raw) as {
      userId?: number | string;
      userCode?: string | null;
      expertId?: number | null;
      teacherId?: number | null;
      staffId?: number | null;
      adminId?: number | null;
    };

    const candidate =
      user.userId ??
      user.userCode ??
      user.expertId ??
      user.teacherId ??
      user.staffId ??
      user.adminId;

    if (candidate === undefined || candidate === null || String(candidate).trim() === '') {
      return 'anonymous';
    }

    return String(candidate);
  } catch {
    return 'anonymous';
  }
}

export async function uploadMaterial(form: {
  File: File;
  PreviewFile?: File;
  Title: string;
  Description?: string;
  Type: string;
  Price?: number;
  SubjectCode?: string;
  GradeCode?: string;
}): Promise<MaterialDto> {
  const userId = getCurrentUserId();

  const { resourceUrl, previewUrl } = await uploadMaterialFilesToGcs({
    file: form.File,
    previewFile: form.PreviewFile,
    prefix: form.SubjectCode ?? form.GradeCode ?? 'expert-material',
    userId,
  });

  const payload = {
    resourceUrl,
    previewUrl: previewUrl ?? '',
    title: form.Title,
    description: form.Description ?? '',
    type: form.Type,
    price: form.Price ?? 0,
    subjectCode: form.SubjectCode ?? '',
    gradeCode: form.GradeCode ?? '',
  };
  const { data } = await api.post<ApiResponse<MaterialDto>>(
    API_ENDPOINTS.MATERIAL.UPLOAD,
    payload,
  );
  return data.result;
}

export async function getMyMaterials(): Promise<MaterialDto[]> {
  const { data } = await api.get<ApiResponse<MaterialDto[]>>(
    API_ENDPOINTS.MATERIAL.GET_MY,
  );
  return data.result;
}

export async function updateMaterial(materialCode: string, input: UpdateMaterialInput): Promise<MaterialDto> {
  const { data } = await api.put<ApiResponse<MaterialDto>>(
    API_ENDPOINTS.MATERIAL.UPDATE(materialCode),
    input,
  );
  return data.result;
}

export async function deleteMaterial(materialCode: string): Promise<void> {
  await api.delete(API_ENDPOINTS.MATERIAL.DELETE(materialCode));
}

export async function browseMaterials(params?: MaterialBrowseParams): Promise<MaterialDto[]> {
  const { data } = await api.get<ApiResponse<MaterialDto[]>>(API_ENDPOINTS.MATERIAL.BROWSE, { params });
  return data.result;
}

export async function purchaseMaterial(materialCode: string): Promise<PurchasedMaterialDto> {
  const { data } = await api.post<ApiResponse<PurchasedMaterialDto>>(API_ENDPOINTS.MATERIAL.PURCHASE(materialCode));
  return data.result;
}

export async function getPurchasedMaterials(): Promise<PurchasedMaterialDto[]> {
  const { data } = await api.get<ApiResponse<PurchasedMaterialDto[]>>(API_ENDPOINTS.MATERIAL.GET_PURCHASED);
  return data.result;
}

export async function getMaterialByCode(materialCode: string): Promise<MaterialDto> {
  const { data } = await api.get<ApiResponse<MaterialDto>>(API_ENDPOINTS.MATERIAL.GET_BY_CODE(materialCode));
  return data.result;
}

export async function getPurchasedMaterialDetail(materialCode: string): Promise<PurchasedMaterialDto> {
  const { data } = await api.get<ApiResponse<PurchasedMaterialDto>>(API_ENDPOINTS.MATERIAL.GET_PURCHASED_DETAIL(materialCode));
  return data.result;
}
