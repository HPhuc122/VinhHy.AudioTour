import { AxiosError } from 'axios';

export type AudioTourErrorKind = 'unauthorized' | 'forbidden' | 'notfound' | 'unknown';

export function getAudioTourErrorKind(error: unknown): AudioTourErrorKind {
  if (!(error instanceof AxiosError)) {
    return 'unknown';
  }

  switch (error.response?.status) {
    case 401:
      return 'unauthorized';
    case 403:
      return 'forbidden';
    case 404:
      return 'notfound';
    default:
      return 'unknown';
  }
}

export function getAudioTourErrorMessage(kind: AudioTourErrorKind): string {
  switch (kind) {
    case 'unauthorized':
      return 'Cần GuestAccessPass hợp lệ để nghe thuyết minh.';
    case 'forbidden':
      return 'GuestAccessPass không áp dụng cho nội dung này.';
    case 'notfound':
      return 'Audio hoặc địa điểm hiện không khả dụng công khai.';
    default:
      return 'Không thể tải audio. Vui lòng thử lại sau.';
  }
}
