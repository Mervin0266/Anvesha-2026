import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { apiFetch } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password?: string) => Promise<User>;
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

  const login = async (username: string, password?: string): Promise<User> => {
    setIsLoading(true);
    try {
      const res = await apiFetch<{ success: boolean; token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
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
        // Faculty / Coordinator roles
        if (eventId) {
          if (eventId.startsWith('sports_')) return '/dashboard/sports';
          if (eventId === 'cultural_open_mic' || eventId === 'cultural_treasure_hunt') return '/dashboard/fun-activities';
          return '/dashboard/culturals';
        }
        if (role.startsWith('faculty_')) {
          const evt = role.replace('faculty_', '');
          if (evt.includes('football') || evt.includes('volleyball') || evt.includes('tug')) {
            return '/dashboard/sports';
          }
          if (evt.includes('open_mic') || evt.includes('treasure_hunt')) {
            return '/dashboard/fun-activities';
          }
          return '/dashboard/culturals';
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
