import { httpClient } from '../../../api/httpClient';
import type { ApiResponse } from '../../../types/api';
import type { CreateRoleRequest, RoleDto, UpdateRoleRequest } from '../types/role';

export const rolesApi = {
  async getAll(): Promise<RoleDto[]> {
    const res = await httpClient.get<ApiResponse<RoleDto[]>>('/roles');
    return unwrapApiResponse(res.data);
  },

  async getById(id: number): Promise<RoleDto> {
    const res = await httpClient.get<ApiResponse<RoleDto>>(`/roles/${id}`);
    return unwrapApiResponse(res.data);
  },

  async create(data: CreateRoleRequest): Promise<RoleDto> {
    const res = await httpClient.post<ApiResponse<RoleDto>>('/roles', data);
    return unwrapApiResponse(res.data);
  },

  async update(id: number, data: UpdateRoleRequest): Promise<RoleDto> {
    const res = await httpClient.put<ApiResponse<RoleDto>>(`/roles/${id}`, data);
    return unwrapApiResponse(res.data);
  },

  async delete(id: number): Promise<void> {
    await httpClient.delete(`/roles/${id}`);
  },
};

function unwrapApiResponse<T>(body: ApiResponse<T>): T {
  if (!body.success || body.data === null) {
    throw new Error(body.message || 'Request failed');
  }

  return body.data;
}
