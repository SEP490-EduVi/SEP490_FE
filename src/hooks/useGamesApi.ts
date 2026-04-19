import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as gamesService from '@/services/gamesServices';

const KEY = 'games';

export function useGames() {
  return useQuery({
    queryKey: [KEY],
    queryFn: () => gamesService.getAllGames(),
    // Poll every 4s while any game is still processing
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasPending = Array.isArray(data) && data.some(
        (g) => g.status === 'processing' || g.status === 'pending',
      );
      return hasPending ? 4000 : false;
    },
  });
}

export function useGameDetail(gameCode?: string) {
  return useQuery({
    queryKey: [KEY, gameCode],
    queryFn: () => gamesService.getGameByCode(gameCode!),
    enabled: !!gameCode,
  });
}

export function useDeleteGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (gameCode: string) => gamesService.deleteGame(gameCode),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [KEY] });
    },
  });
}
