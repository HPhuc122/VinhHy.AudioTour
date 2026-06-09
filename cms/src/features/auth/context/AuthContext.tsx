import axios from 'axios';
import type { AxiosInstance } from 'axios';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createHttpClient } from '@/api/httpClient';
import { env } from '@/config/env';
import { createAuthApi, type AuthApi } from '@/features/auth/api/authApi';
import {
  isAccessTokenExpired,
  mapLoginResponseToSession,
  tokenStorage,
} from '@/features/auth/services/tokenStorage';
import type { AuthSession, AuthUser, LoginRequest } from '@/types/auth';

export interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  httpClient: AxiosInstance;
  authApi: AuthApi;
  login: (credentials: LoginRequest) => Promise<AuthSession>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const sessionRef = useRef<AuthSession | null>(null);
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const applySession = useCallback((next: AuthSession | null) => {
    sessionRef.current = next;
    setSession(next);
    if (next) {
      tokenStorage.saveSession(next);
    } else {
      tokenStorage.clearSession();
    }
  }, []);

  const refreshClient = useMemo(
    () =>
      axios.create({
        baseURL: env.apiBaseUrl || undefined,
        headers: { 'Content-Type': 'application/json' },
        timeout: 30_000,
      }),
    [],
  );

  const authApiRef = useRef<AuthApi | null>(null);

  const httpClient = useMemo(
    () =>
      createHttpClient({
        getAccessToken: () => sessionRef.current?.accessToken ?? null,
        getRefreshToken: () => sessionRef.current?.refreshToken ?? null,
        refreshSession: async () => {
          const refreshToken = sessionRef.current?.refreshToken;
          if (!refreshToken) {
            throw new Error('Missing refresh token');
          }

          const authApi = authApiRef.current;
          if (!authApi) {
            throw new Error('Auth API is not initialized');
          }

          const dto = await authApi.refresh({ refreshToken });
          const newSession = mapLoginResponseToSession(dto);
          applySession(newSession);
          return newSession.accessToken;
        },
        onSessionExpired: () => {
          applySession(null);
        },
      }),
    [applySession],
  );

  const authApi = useMemo(() => {
    const api = createAuthApi(httpClient, { refreshClient });
    authApiRef.current = api;
    return api;
  }, [httpClient, refreshClient]);

  const login = useCallback(
    async (credentials: LoginRequest): Promise<AuthSession> => {
      const dto = await authApi.login(credentials);
      const newSession = mapLoginResponseToSession(dto);
      applySession(newSession);
      return newSession;
    },
    [authApi, applySession],
  );

  const logout = useCallback(() => {
    applySession(null);
  }, [applySession]);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession(): Promise<void> {
      const stored = tokenStorage.getSession();
      if (!stored) {
        if (!cancelled) {
          setIsInitializing(false);
        }
        return;
      }

      applySession(stored);

      if (!isAccessTokenExpired(stored.expiresAtUtc)) {
        if (!cancelled) {
          setIsInitializing(false);
        }
        return;
      }

      try {
        const dto = await authApi.refresh({ refreshToken: stored.refreshToken });
        if (!cancelled) {
          applySession(mapLoginResponseToSession(dto));
        }
      } catch {
        if (!cancelled) {
          applySession(null);
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [authApi, applySession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: session !== null,
      isInitializing,
      httpClient,
      authApi,
      login,
      logout,
    }),
    [session, isInitializing, httpClient, authApi, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
