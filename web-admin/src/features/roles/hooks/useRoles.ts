import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { rolesApi } from '../api/rolesApi';
import type { CreateRoleRequest, UpdateRoleRequest } from '../types/role';

export const ROLE_KEYS = {
  all: ['roles'] as const,
  list: () => ['roles', 'list'] as const,
  detail: (id: number) => ['roles', id] as const,
};

export function useRoles() {
  return useQuery({
    queryKey: ROLE_KEYS.list(),
    queryFn: rolesApi.getAll,
  });
}

export function useCreateRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRoleRequest) => rolesApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROLE_KEYS.all }),
  });
}

export function useUpdateRole(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateRoleRequest) => rolesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ROLE_KEYS.all });
      qc.invalidateQueries({ queryKey: ROLE_KEYS.detail(id) });
    },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => rolesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ROLE_KEYS.all }),
  });
}
