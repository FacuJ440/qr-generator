import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authApi } from '../lib/api-services';
import type { AuthResponse } from '../types';

interface AuthContextValue {
  user: AuthResponse['user'] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('user', JSON.stringify(res.user));
    setUser(res.user);
  }, []);

  const register = useCallback(async (email: string, name: string, password: string) => {
    const res = await authApi.register({ email, name, password });
    localStorage.setItem('accessToken', res.accessToken);
    localStorage.setItem('user', JSON.stringify(res.user));
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
