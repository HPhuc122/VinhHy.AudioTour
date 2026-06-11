import { AxiosError } from 'axios';
import type { ApiResponse } from '../types/api';

export function extractApiError(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiResponse<unknown> | undefined;
    if (data?.message) return data.message;
    if (data?.errors) {
      const first = Object.values(data.errors)[0];
      if (first?.[0]) return first[0];
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return 'Đã xảy ra lỗi không xác định';
}
