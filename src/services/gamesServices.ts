import api from '@/config/axios';
import { API_ENDPOINTS } from '@/constants/apiEndpoints';
import type {
  ApiResponse,
  CreatePlayableGameTaskInput,
  GameDto,
  GameDetailDto,
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

export async function getAllGames(): Promise<GameDto[]> {
  const { data } = await api.get<ApiResponse<GameDto[]>>(API_ENDPOINTS.GAMES.GET_ALL);
  return data.result;
}

export async function getGameByCode(gameCode: string): Promise<GameDetailDto> {
  const { data } = await api.get<ApiResponse<GameDetailDto>>(
    API_ENDPOINTS.GAMES.GET_BY_CODE(gameCode),
  );
  return data.result;
}

export async function deleteGame(gameCode: string): Promise<void> {
  await api.delete(API_ENDPOINTS.GAMES.DELETE(gameCode));
}
