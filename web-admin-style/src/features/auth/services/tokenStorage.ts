import type { LoginResponse } from '../types/auth';

const ACCESS_TOKEN_KEY = 'vh_access_token';
const REFRESH_TOKEN_KEY = 'vh_refresh_token';
const USER_KEY = 'vh_user';

export const tokenStorage = {
  setTokens(data: LoginResponse) {
    localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
    localStorage.setItem(
      USER_KEY,
      JSON.stringify({
        userId: data.userId,
        username: data.username,
        role: data.role,
        preferredLanguage: data.preferredLanguage,
      }),
    );
  },

  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  getUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};
