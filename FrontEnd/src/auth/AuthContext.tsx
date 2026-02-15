import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthState } from '@/types';
import * as authApi from '@/api/dev/authDev';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; confirmPassword: string; firstName: string; lastName: string; phoneNumber?: string }) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

interface JwtPayload {
  sub?: string; // user id
  email?: string;
  given_name?: string;
  family_name?: string;
  role?: string | string[];
  exp?: number;
  // ASP.NET Core Identity claim names
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'?: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string | string[];
  [key: string]: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as User;
        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await authApi.login({ email, password });
      const token = response.token;
      
      // Decode JWT to extract user info
      const decoded = jwtDecode<JwtPayload>(token);
      console.log('🔍 JWT Decoded:', decoded);
      
      // Extract role (might be array or string) - check both standard and ASP.NET Identity claim names
      let role = 'customer';
      const roleClaimValue = decoded.role || decoded['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      if (roleClaimValue) {
        role = Array.isArray(roleClaimValue) ? roleClaimValue[0] : roleClaimValue;
        console.log('🎭 Role from JWT (before lowercase):', role);
        role = role.toLowerCase();
        console.log('🎭 Role after lowercase:', role);
      }
      
      // Extract user info - check both standard and ASP.NET Identity claim names
      const userId = decoded.sub || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '';
      const userEmail = decoded.email || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || email;
      const firstName = decoded.given_name || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname'] || response.userName.split(' ')[0] || 'User';
      const lastName = decoded.family_name || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname'] || response.userName.split(' ')[1] || '';
      
      const user: User = {
        id: userId,
        email: userEmail,
        firstName: firstName,
        lastName: lastName,
        role: role as User['role'],
        createdAt: response.createdAt || new Date().toISOString(),
        avatarUrl: response.avatarUrl || undefined,
      };
      
      console.log('👤 Created user object:', user);
      
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token_expires', response.expires);
      
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      
      console.error('❌ Login error:', error.response?.data);
      
      let errorMessage = 'Email və ya şifrə yanlışdır';
      
      if (error.response?.data) {
        const data = error.response.data;
        
        // Check for ValidationProblemDetails format (ASP.NET Core validation errors)
        if (data.errors && typeof data.errors === 'object') {
          const errorMessages = Object.entries(data.errors).map(([field, messages]: [string, any]) => {
            const msgArray = Array.isArray(messages) ? messages : [messages];
            return `${field}: ${msgArray.join(', ')}`;
          });
          errorMessage = errorMessages.join('; ');
        }
        // Check for ProblemDetails format
        else if (data.title) {
          errorMessage = data.title;
          if (data.detail) {
            errorMessage = data.detail;
          }
        }
        // Check for simple message
        else if (data.message) {
          errorMessage = data.message;
        }
        // Check for string response
        else if (typeof data === 'string') {
          errorMessage = data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Specific error codes
      if (error.response?.status === 401) {
        errorMessage = 'Email və ya şifrə yanlışdır. Zəhmət olmasa yenidən cəhd edin.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Bu hesab deaktiv edilib və ya silinib.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Çox sayda uğursuz cəhd. Zəhmət olmasa bir az gözləyin.';
      }
      
      throw new Error(errorMessage);
    }
  }, []);

  const register = useCallback(async (data: { 
    email: string; 
    password: string;
    confirmPassword: string;
    firstName: string; 
    lastName: string;
    phoneNumber?: string;
  }) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await authApi.register({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        phoneNumber: data.phoneNumber,
      });
      
      // After successful registration, auto-login
      await login(data.email, data.password);
    } catch (error: any) {
      setState(prev => ({ ...prev, isLoading: false }));
      
      // Extract error message from various possible formats
      let errorMessage = 'Qeydiyyat zamanı xəta baş verdi';
      
      if (error.response?.data) {
        const data = error.response.data;
        
        // Check for ValidationProblemDetails format (ASP.NET Core validation errors)
        if (data.errors && typeof data.errors === 'object') {
          const errorMessages = Object.values(data.errors).flat();
          errorMessage = errorMessages.join(', ');
        }
        // Check for ProblemDetails format
        else if (data.title) {
          errorMessage = data.title;
          if (data.detail) {
            errorMessage += ': ' + data.detail;
          }
        }
        // Check for simple message
        else if (data.message) {
          errorMessage = data.message;
        }
        // If data is a string
        else if (typeof data === 'string') {
          errorMessage = data;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('❌ Registration error details:', error.response?.data);
      throw new Error(errorMessage);
    }
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const updateUser = useCallback((user: User) => {
    localStorage.setItem('user', JSON.stringify(user));
    setState(prev => ({ ...prev, user }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
