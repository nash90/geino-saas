import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, type AuthUser, type LoginData, type RegisterData } from '@/api/auth';

interface AuthContextType {
  user: AuthUser | null;
  organizations: any[];
  projects: any[];
  loading: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  hasOrganizationAccess: (orgId: string) => boolean;
  hasProjectAccess: (projectId: string) => boolean;
  getProjectRole: (projectId: string) => number | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, []);

  // Auto-refresh token every 50 minutes (tokens expire in 60 minutes)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(async () => {
      try {
        await authApi.refresh();
      } catch (error) {
        console.error('Token refresh failed:', error);
        handleLogout();
      }
    }, 50 * 60 * 1000); // 50 minutes

    return () => clearInterval(interval);
  }, [user]);

  const checkSession = async () => {
    try {
      const data = await authApi.getSession();
      setUser(data.user);
      setOrganizations(data.organizations);
      setProjects(data.projects);
    } catch (error) {
      // No active session
      setUser(null);
      setOrganizations([]);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (data: LoginData) => {
    const response = await authApi.login(data);
    setUser(response.user);
    setOrganizations(response.organizations);
    setProjects(response.projects);
  };

  const handleRegister = async (data: RegisterData) => {
    await authApi.register(data);
    // User needs to verify email before logging in
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Logout anyway on error
    } finally {
      setUser(null);
      setOrganizations([]);
      setProjects([]);
    }
  };

  const refreshSession = async () => {
    await checkSession();
  };

  const hasOrganizationAccess = (orgId: string): boolean => {
    if (user?.systemRoleCode === 1) return true; // System Admin
    return organizations.some((org) => org.id === orgId);
  };

  const hasProjectAccess = (projectId: string): boolean => {
    if (user?.systemRoleCode === 1) return true; // System Admin
    return projects.some((proj) => proj.id === projectId);
  };

  const getProjectRole = (projectId: string): number | null => {
    const project = projects.find((proj) => proj.id === projectId);
    return project?.projectRoleCode || null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organizations,
        projects,
        loading,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        refreshSession,
        hasOrganizationAccess,
        hasProjectAccess,
        getProjectRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
