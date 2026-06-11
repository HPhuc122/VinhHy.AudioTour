import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { AuthUser, LoginResponse } from '../types/auth';
import { tokenStorage } from '../services/tokenStorage';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (data: LoginResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() =>
    tokenStorage.getUser(),
  );

  const login = useCallback((data: LoginResponse) => {
    tokenStorage.setTokens(data);
    setUser({
      userId: data.userId,
      username: data.username,
      role: data.role,
      preferredLanguage: data.preferredLanguage,
    });
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  // Keep user in sync if storage is cleared from another tab
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'vh_access_token' && !e.newValue) {
        setUser(null);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside AuthProvider');
  return ctx;
}
