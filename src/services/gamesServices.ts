import api from '@/config/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type {
  ApiResponse,
  CreatePlayableGameTaskInput,
  GameProgressDto,
  GameTaskResponseDto,
} from '@/types/api';

export async function createPlayableGameTask(
  input: CreatePlayableGameTaskInput,
): Promise<GameTaskResponseDto> {
  const { data } = await api.post<ApiResponse<GameTaskResponseDto>>(
    API_ENDPOINTS.GAMES.CREATE_PLAYABLE_TASK,
    input,
  );

  return data.result;
}

export async function getGameTaskStatus(taskId: string): Promise<GameProgressDto> {
  const { data } = await api.get<ApiResponse<GameProgressDto>>(
    API_ENDPOINTS.GAMES.GET_TASK_STATUS(taskId),
  );

  return data.result;
}
