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
      return 'Không thể phát audio vì mã nghe đã hết hạn hoặc không hợp lệ.';
    case 'forbidden':
      return 'Mã nghe hiện tại không áp dụng cho nội dung này.';
    case 'notfound':
      return 'Điểm này chưa có bản thuyết minh hoặc không còn khả dụng.';
    default:
      return 'Không thể tải audio. Vui lòng thử lại sau.';
  }
}
