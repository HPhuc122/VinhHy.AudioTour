import { httpClient } from '../../../api/httpClient';
import type { ApiResponse, PagedResult } from '../../../types/api';
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserDto,
} from './types/user';

export const usersApi = {
  async getAll(page = 1, pageSize = 20): Promise<PagedResult<UserDto>> {
    const res = await httpClient.get<ApiResponse<PagedResult<UserDto>>>(
      '/users',
      { params: { page, pageSize } },
    );
    return res.data.data;
  },

  async getById(id: number): Promise<UserDto> {
    const res = await httpClient.get<ApiResponse<UserDto>>(`/users/${id}`);
    return res.data.data;
  },

  async create(data: CreateUserRequest): Promise<UserDto> {
    const res = await httpClient.post<ApiResponse<UserDto>>('/users', data);
    return res.data.data;
  },

  async update(id: number, data: UpdateUserRequest): Promise<UserDto> {
    const res = await httpClient.put<ApiResponse<UserDto>>(
      `/users/${id}`,
      data,
    );
    return res.data.data;
  },

  async delete(id: number): Promise<void> {
    await httpClient.delete(`/users/${id}`);
  },
};
