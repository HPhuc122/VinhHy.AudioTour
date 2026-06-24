import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/usersApi';
import type { CreateUserRequest, UpdateUserRequest } from '../types/user';

export const USER_KEYS = {
  all: ['users'] as const,
  list: (page: number, pageSize: number) => ['users', 'list', page, pageSize] as const,
  detail: (id: number) => ['users', id] as const,
};

export function useUsers(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: USER_KEYS.list(page, pageSize),
    queryFn: () => usersApi.getAll(page, pageSize),
  });
}

export function useUser(id: number) {
  return useQuery({
    queryKey: USER_KEYS.detail(id),
    queryFn: () => usersApi.getById(id),
    enabled: id > 0,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserRequest) => usersApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: USER_KEYS.all }),
  });
}

export function useUpdateUser(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateUserRequest) => usersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: USER_KEYS.all });
      qc.invalidateQueries({ queryKey: USER_KEYS.detail(id) });
    },
  });
}
