import type { LoginResponse } from '../types/auth';

const ACCESS_KEY = 'pw_access_token';
const REFRESH_KEY = 'pw_refresh_token';
const USER_KEY = 'pw_user';
const REFRESH_BACKUP = 'pw_rt_bk';

export const sessionStore = {
  setTokens(data: LoginResponse) {
    // sessionStorage → tự xoá khi đóng tab
    sessionStorage.setItem(ACCESS_KEY, data.accessToken);
    sessionStorage.setItem(REFRESH_KEY, data.refreshToken);
    sessionStorage.setItem(USER_KEY, JSON.stringify({
      userId: data.userId,
      username: data.username,
      role: data.role,
      preferredLanguage: data.preferredLanguage,
    }));
    // Backup để restore khi reload
    localStorage.setItem(REFRESH_BACKUP, data.refreshToken);
  },

  getAccessToken(): string | null {
    return sessionStorage.getItem(ACCESS_KEY);
  },

  getRefreshToken(): string | null {
    return sessionStorage.getItem(REFRESH_KEY) ?? localStorage.getItem(REFRESH_BACKUP);
  },

  getUser() {
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  },

  hasRefreshBackup(): boolean {
    return !!localStorage.getItem(REFRESH_BACKUP);
  },

  clear() {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(USER_KEY);
    localStorage.removeItem(REFRESH_BACKUP);
  },
};
