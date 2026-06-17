import { httpClient } from '../../../api/httpClient';
import type { ApiResponse, PagedResult } from '../../../types/api';
import type {
  CreateUserRequest,
  UpdateUserRequest,
  UserDto,
} from '../types/user';

const USERS_BASE = '/api/v1/users';

export const usersApi = {
  async getAll(page = 1, pageSize = 20): Promise<PagedResult<UserDto>> {
    const res = await httpClient.get<ApiResponse<PagedResult<UserDto>>>(
      USERS_BASE,
      { params: { page, pageSize } },
    );
    return unwrapApiResponse(res.data);
  },

  async getById(id: number): Promise<UserDto> {
    const res = await httpClient.get<ApiResponse<UserDto>>(`${USERS_BASE}/${id}`);
    return unwrapApiResponse(res.data);
  },

  async create(data: CreateUserRequest): Promise<UserDto> {
    const res = await httpClient.post<ApiResponse<UserDto>>(USERS_BASE, data);
    return unwrapApiResponse(res.data);
  },

  async update(id: number, data: UpdateUserRequest): Promise<UserDto> {
    const res = await httpClient.put<ApiResponse<UserDto>>(
      `${USERS_BASE}/${id}`,
      data,
    );
    return unwrapApiResponse(res.data);
  },

  async delete(id: number): Promise<void> {
    await httpClient.delete(`${USERS_BASE}/${id}`);
  },
};

function unwrapApiResponse<T>(body: ApiResponse<T>): T {
  if (!body.success || body.data === null) {
    throw new Error(body.message || 'Request failed');
  }

  return body.data;
}
