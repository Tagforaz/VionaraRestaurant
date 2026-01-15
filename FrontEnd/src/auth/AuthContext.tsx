import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, AuthState } from '@/types';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; firstName: string; lastName: string }) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for development
const DEMO_USERS: Record<string, { password: string; user: User }> = {
  'customer@demo.com': {
    password: 'demo123',
    user: {
      id: '1',
      email: 'customer@demo.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'customer',
      phone: '+1234567890',
      createdAt: new Date().toISOString(),
    },
  },
  'admin@demo.com': {
    password: 'admin123',
    user: {
      id: '2',
      email: 'admin@demo.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      createdAt: new Date().toISOString(),
    },
  },
};

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
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const demoUser = DEMO_USERS[email.toLowerCase()];
    
    if (demoUser && demoUser.password === password) {
      const token = `demo_token_${Date.now()}`;
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user', JSON.stringify(demoUser.user));
      
      setState({
        user: demoUser.user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
      throw new Error('Invalid email or password');
    }
  }, []);

  const register = useCallback(async (data: { 
    email: string; 
    password: string; 
    firstName: string; 
    lastName: string 
  }) => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (DEMO_USERS[data.email.toLowerCase()]) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw new Error('Email already registered');
    }
    
    const newUser: User = {
      id: `user_${Date.now()}`,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      role: 'customer',
      createdAt: new Date().toISOString(),
    };
    
    const token = `demo_token_${Date.now()}`;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('user', JSON.stringify(newUser));
    
    setState({
      user: newUser,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

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
