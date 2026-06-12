import { useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/context/AuthContext';
import {
  createTourApi,
  type AddTourPoiRequest,
  type CreateTourTranslationRequest,
  type ReorderTourPoisRequest,
  type UpdateTourTranslationRequest,
} from '@/features/tours/api/tourApi';
import { tourQueryKeys } from '@/features/tours/hooks/useToursQuery';

function useTourApi() {
  const { httpClient } = useAuth();
  return useMemo(() => createTourApi(httpClient), [httpClient]);
}

function useRefreshTour(tourId: number) {
  const queryClient = useQueryClient();

  return () => {
    void queryClient.invalidateQueries({ queryKey: tourQueryKeys.all });
    void queryClient.invalidateQueries({ queryKey: tourQueryKeys.detail(tourId) });
  };
}

export function useAddTourTranslationMutation(tourId: number) {
  const tourApi = useTourApi();
  const refreshTour = useRefreshTour(tourId);

  return useMutation({
    mutationKey: ['tours', tourId, 'translations', 'add'],
    mutationFn: (request: CreateTourTranslationRequest) =>
      tourApi.addTranslation(tourId, request),
    onSuccess: refreshTour,
  });
}

export function useUpdateTourTranslationMutation(tourId: number) {
  const tourApi = useTourApi();
  const refreshTour = useRefreshTour(tourId);

  return useMutation({
    mutationKey: ['tours', tourId, 'translations', 'update'],
    mutationFn: ({
      translationId,
      request,
    }: {
      translationId: number;
      request: UpdateTourTranslationRequest;
    }) => tourApi.updateTranslation(translationId, request),
    onSuccess: refreshTour,
  });
}

export function useDeleteTourTranslationMutation(tourId: number) {
  const tourApi = useTourApi();
  const refreshTour = useRefreshTour(tourId);

  return useMutation({
    mutationKey: ['tours', tourId, 'translations', 'delete'],
    mutationFn: (translationId: number) => tourApi.deleteTranslation(translationId),
    onSuccess: refreshTour,
  });
}

export function useAddTourPoiMutation(tourId: number) {
  const tourApi = useTourApi();
  const refreshTour = useRefreshTour(tourId);

  return useMutation({
    mutationKey: ['tours', tourId, 'pois', 'add'],
    mutationFn: (request: AddTourPoiRequest) => tourApi.addPoi(tourId, request),
    onSuccess: refreshTour,
  });
}

export function useRemoveTourPoiMutation(tourId: number) {
  const tourApi = useTourApi();
  const refreshTour = useRefreshTour(tourId);

  return useMutation({
    mutationKey: ['tours', tourId, 'pois', 'remove'],
    mutationFn: (poiId: number) => tourApi.removePoi(tourId, poiId),
    onSuccess: refreshTour,
  });
}

export function useReorderTourPoisMutation(tourId: number) {
  const tourApi = useTourApi();
  const refreshTour = useRefreshTour(tourId);

  return useMutation({
    mutationKey: ['tours', tourId, 'pois', 'reorder'],
    mutationFn: (request: ReorderTourPoisRequest) => tourApi.reorderPois(tourId, request),
    onSuccess: refreshTour,
  });
}
