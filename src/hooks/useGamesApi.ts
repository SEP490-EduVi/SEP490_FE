import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as gamesService from '@/services/gamesServices';

const KEY = 'games';

export function useGames() {
  return useQuery({
    queryKey: [KEY],
    queryFn: () => gamesService.getAllGames(),
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
