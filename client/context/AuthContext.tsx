'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type UserRole = 'ADMIN' | 'MANAGER' | 'MEMBER';
export type UserCountry = 'INDIA' | 'AMERICA' | null;

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  country: UserCountry;
  token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  can: (action: 'placeOrder' | 'cancelOrder' | 'updatePayment') => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const PERMISSIONS: Record<string, UserRole[]> = {
  placeOrder:    ['ADMIN', 'MANAGER'],
  cancelOrder:   ['ADMIN', 'MANAGER'],
  updatePayment: ['ADMIN'],
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const login = (u: AuthUser) => {
    localStorage.setItem('token', u.token);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const can = (action: keyof typeof PERMISSIONS) =>
    !!user && PERMISSIONS[action].includes(user.role);

  return (
    <AuthContext.Provider value={{ user, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
