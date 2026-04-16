import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as teacherService from '@/services/teacherServices';
import type { UpdateTeacherProfileInput } from '@/types/api';

const TEACHER_PROFILE_KEY = 'teacher-profile';

interface ProfileQueryOptions {
  enabled?: boolean;
}

export function useTeacherProfile(options?: ProfileQueryOptions) {
  return useQuery({
    queryKey: [TEACHER_PROFILE_KEY],
    queryFn: teacherService.getTeacherProfile,
    enabled: options?.enabled ?? true,
  });
}

export function useUpdateTeacherProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTeacherProfileInput) => teacherService.updateTeacherProfile(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TEACHER_PROFILE_KEY] });
    },
  });
}
