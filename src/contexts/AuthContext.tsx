import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { apiFetch } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, role?: UserRole) => Promise<User>;
  logout: () => void;
  getRoleDashboardPath: (role: UserRole, eventId?: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('anvesha_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await apiFetch<{ success: boolean; user: User }>('/auth/me');
        if (res.success) {
          setUser(res.user);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('Failed to verify token, clearing session.', err);
        logout();
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [token]);

  const login = async (username: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username }),
      });
      
      localStorage.setItem('anvesha_token', res.token);
      setToken(res.token);
      setUser(res.user);
      setIsLoading(false);
      return res.user;
    } catch (err) {
      setIsLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('anvesha_token');
    setToken(null);
    setUser(null);
  };

  const getRoleDashboardPath = (role: UserRole, eventId?: string): string => {
    switch (role) {
      case 'admin':
        return '/dashboard/admin';
      case 'registration_team':
        return '/dashboard/verification';
      case 'hospitality_team':
        return '/dashboard/hospitality';
      case 'certificate_team':
        return '/dashboard/certificates';
      case 'officials':
        return '/dashboard/reports';
      default:
        // Faculty roles
        if (eventId) return `/dashboard/event/${eventId}`;
        if (role.startsWith('faculty_')) {
          const evt = role.replace('faculty_', '');
          return `/dashboard/event/${evt.includes('football') ? 'sports_football' : evt.includes('dance') ? 'cultural_dance' : 'sports_' + evt}`;
        }
        return '/dashboard/admin';
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, getRoleDashboardPath }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
