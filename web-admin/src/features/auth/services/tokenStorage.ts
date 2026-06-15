import type { LoginResponse } from '../types/auth';

// Dùng sessionStorage → tự xoá khi đóng tab/trình duyệt
const ACCESS_TOKEN_KEY = 'vh_access_token';
const REFRESH_TOKEN_KEY = 'vh_refresh_token';
const USER_KEY = 'vh_user';

// Backup refresh token vào localStorage để dùng khi refresh page
// (sessionStorage bị xoá khi reload trong một số browser)
const REFRESH_BACKUP_KEY = 'vh_rt_bk';

export const tokenStorage = {
  setTokens(data: LoginResponse) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    sessionStorage.setItem(
      USER_KEY,
      JSON.stringify({
        userId: data.userId,
        username: data.username,
        role: data.role,
        preferredLanguage: data.preferredLanguage,
      }),
    );
    // Backup refresh token để restore session sau khi reload
    localStorage.setItem(REFRESH_BACKUP_KEY, data.refreshToken);
  },

  getAccessToken(): string | null {
    return sessionStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return sessionStorage.getItem(REFRESH_TOKEN_KEY)
      ?? localStorage.getItem(REFRESH_BACKUP_KEY);
  },

  getUser() {
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  // Có refresh token backup không (để restore session khi reload)
  hasRefreshBackup(): boolean {
    return !!localStorage.getItem(REFRESH_BACKUP_KEY);
  },

  clear() {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(REFRESH_BACKUP_KEY);
  },
};
