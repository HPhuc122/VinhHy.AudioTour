import type { AxiosError } from 'axios';
import type { ApiResponse } from '@/types/api';

export class ApiClientError extends Error {
  readonly statusCode?: number;
  readonly errors?: Record<string, string[]>;

  constructor(message: string, statusCode?: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export function toApiClientError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) {
    return error;
  }

  if (isAxiosApiError(error)) {
    const body = error.response?.data;
    const statusCode = error.response?.status;
    return new ApiClientError(
      normalizeApiMessage(body?.message ?? error.message, statusCode),
      statusCode,
      body?.errors,
    );
  }

  if (error instanceof Error) {
    return new ApiClientError(normalizeApiMessage(error.message));
  }

  return new ApiClientError('Đã xảy ra lỗi ngoài dự kiến. Vui lòng thử lại.');
}

export function extractApiError(error: unknown): string {
  const clientError = toApiClientError(error);
  if (clientError.errors) {
    const fieldMessages = Object.values(clientError.errors)
      .flat()
      .filter((message) => message.trim().length > 0);
    if (fieldMessages.length > 0) {
      return fieldMessages.join(' ');
    }
  }

  return clientError.message;
}

function normalizeApiMessage(message?: string | null, statusCode?: number): string {
  const text = message?.trim();

  if (!text || /^request failed$/i.test(text) || /Request failed with status code/i.test(text)) {
    if (statusCode === 400) return 'Dữ liệu chưa hợp lệ. Vui lòng kiểm tra lại.';
    if (statusCode === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    if (statusCode === 403) return 'Bạn không có quyền thực hiện thao tác này.';
    if (statusCode === 404) return 'Không tìm thấy dữ liệu cần thao tác.';
    return 'Thao tác thất bại. Vui lòng kiểm tra dữ liệu và thử lại.';
  }

  return text
    .replace(/\bPendingReview\b/g, 'Chờ duyệt')
    .replace(/\bPendingPayment\b/g, 'Chờ thanh toán')
    .replace(/\bNotRequired\b/g, 'Không yêu cầu')
    .replace(/\bActive\b/g, 'Đang hoạt động')
    .replace(/\bApproved\b/g, 'Đã duyệt')
    .replace(/\bRejected\b/g, 'Bị từ chối')
    .replace(/\bExpired\b/g, 'Hết hạn')
    .replace(/\bWaived\b/g, 'Miễn thanh toán')
    .replace(/\bPaid\b/g, 'Đã thanh toán')
    .replace(/\bGuestAccessPass\b/g, 'mã nghe')
    .replace(/\bAudioTrack\b/g, 'bản âm thanh')
    .replace(/\bNarrationDraft\b/g, 'bản thuyết minh');
}

function isAxiosApiError(
  error: unknown,
): error is AxiosError<ApiResponse<unknown>> {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error;
}
