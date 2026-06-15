import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AuthUser, LoginResponse } from '../types/auth';
import { sessionStore } from '../services/sessionStore';
import { httpClient } from '../../../api/httpClient';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
  login: (data: LoginResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Tự đăng xuất sau 3 giờ không hoạt động
const IDLE_TIMEOUT_MS = 3 * 60 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(() => {
    sessionStore.clear();
    setUser(null);
    if (idleTimer.current) clearTimeout(idleTimer.current);
  }, []);

  const login = useCallback((data: LoginResponse) => {
    sessionStore.setTokens(data);
    setUser({
      userId: data.userId,
      username: data.username,
      role: data.role,
      preferredLanguage: data.preferredLanguage,
    });
  }, []);

  const resetIdleTimer = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(logout, IDLE_TIMEOUT_MS);
  }, [logout]);

  // Restore session khi reload
  useEffect(() => {
    const restore = async () => {
      const existingUser = sessionStore.getUser();
      if (existingUser && sessionStore.getAccessToken()) {
        setUser(existingUser);
        setIsRestoring(false);
        return;
      }

      if (sessionStore.hasRefreshBackup()) {
        try {
          const refreshToken = sessionStore.getRefreshToken();
          const res = await httpClient.post('/auth/refresh', { refreshToken });
          const data = res.data.data;
          sessionStore.setTokens(data);
          setUser({
            userId: data.userId,
            username: data.username,
            role: data.role,
            preferredLanguage: data.preferredLanguage,
          });
        } catch {
          sessionStore.clear();
        }
      }

      setIsRestoring(false);
    };

    restore();
  }, []);

  // Idle timeout
  useEffect(() => {
    if (!user) return;
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((e) => window.addEventListener(e, resetIdleTimer, { passive: true }));
    resetIdleTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdleTimer));
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [user, resetIdleTimer]);

  // Sync logout giữa các tab
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'pw_rt_bk' && !e.newValue) setUser(null);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isRestoring, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
