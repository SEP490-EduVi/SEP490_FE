// src/hooks/useMetadataApi.ts

import { useQuery } from '@tanstack/react-query';
import * as metadataService from '@/services/metadataServices';

export function useSubjects() {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: metadataService.getSubjects,
  });
}

export function useGrades() {
  return useQuery({
    queryKey: ['grades'],
    queryFn: metadataService.getGrades,
  });
}

export function useLessons(subjectCode?: string) {
  return useQuery({
    queryKey: ['lessons', subjectCode],
    queryFn: () => metadataService.getLessons(subjectCode!),
    enabled: !!subjectCode,
  });
}
