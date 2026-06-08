import type { AuthSession } from '@/types/auth';

const STORAGE_KEY = 'vinhhy.cms.auth.session';

export interface TokenStorageService {
  getSession(): AuthSession | null;
  saveSession(session: AuthSession): void;
  clearSession(): void;
}

function isAuthSession(value: unknown): value is AuthSession {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const session = value as AuthSession;
  return (
    typeof session.accessToken === 'string' &&
    typeof session.refreshToken === 'string' &&
    typeof session.expiresAtUtc === 'string' &&
    typeof session.user?.userId === 'number' &&
    typeof session.user?.username === 'string' &&
    typeof session.user?.role === 'string' &&
    typeof session.user?.preferredLanguage === 'string'
  );
}

export const tokenStorage: TokenStorageService = {
  getSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }

      const parsed: unknown = JSON.parse(raw);
      return isAuthSession(parsed) ? parsed : null;
    } catch {
      return null;
    }
  },

  saveSession(session: AuthSession): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  },

  clearSession(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};

export function isAccessTokenExpired(expiresAtUtc: string, bufferSeconds = 30): boolean {
  const expiresAt = Date.parse(expiresAtUtc);
  if (Number.isNaN(expiresAt)) {
    return true;
  }

  return Date.now() >= expiresAt - bufferSeconds * 1000;
}

export function mapLoginResponseToSession(dto: {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc: string;
  userId: number;
  username: string;
  role: string;
  preferredLanguage: string;
}): AuthSession {
  return {
    accessToken: dto.accessToken,
    refreshToken: dto.refreshToken,
    expiresAtUtc: dto.expiresAtUtc,
    user: {
      userId: dto.userId,
      username: dto.username,
      role: dto.role,
      preferredLanguage: dto.preferredLanguage,
    },
  };
}
