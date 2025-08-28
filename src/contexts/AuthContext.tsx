import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { API_ENDPOINTS } from '../config/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearAllData: () => void;
  isAuthenticated: boolean;
  updateUser: (userData: Partial<User>) => void;
  updateUserProfile: (userData: Partial<User>) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// API base URL - using centralized configuration
const API_BASE_URL = API_ENDPOINTS.AUTH.replace('/auth.php', '');

// Helper functions for localStorage
const saveUserToStorage = (user: User) => {
  localStorage.setItem('authUser', JSON.stringify(user));
};

const getUserFromStorage = (): User | null => {
  const userStr = localStorage.getItem('authUser');
  return userStr ? JSON.parse(userStr) : null;
};

const removeUserFromStorage = () => {
  localStorage.removeItem('authUser');
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Session restoration on app load
  useEffect(() => {
    const restoreSession = async () => {
      const savedUser = getUserFromStorage();
      if (savedUser) {
        // Validate session with backend
        try {
          const response = await fetch(API_ENDPOINTS.AUTH, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'validate_session',
              user_id: savedUser.id
            })
          });

          const data = await response.json();
          
          if (data.success && data.user) {
            // Convert backend user format to frontend format
            const user: User = {
              id: data.user.id.toString(),
              name: data.user.name,
              email: data.user.email,
              role: data.user.role,
              department: data.user.location || 'Kedah State Government',
              position: data.user.role === 'admin' ? 'System Admin' : 
                       data.user.role === 'user' ? 'EXCO User' : 
                       data.user.role === 'Finance MMK' ? 'Finance MMK' : 'User',
              avatar: data.user.avatar || undefined,
              phone: data.user.phone || undefined,
              createdAt: data.user.created_at || new Date().toISOString()
            };
            setUser(user);
            saveUserToStorage(user);
          } else {
            // Session invalid, clear storage
            removeUserFromStorage();
          }
        } catch (error) {
          // Handle session validation error
          removeUserFromStorage();
        }
      }
      setIsLoading(false);
    };

    restoreSession();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(API_ENDPOINTS.AUTH, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          email,
          password,
        }),
      });

      const data = await response.json();
      
      if (data.success && data.user) {
        // Convert backend user format to frontend format
        const user: User = {
          id: data.user.id.toString(),
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          department: data.user.location || 'Kedah State Government',
          position: data.user.role === 'admin' ? 'System Admin' : 
                   data.user.role === 'user' ? 'EXCO User' : 
                   data.user.role === 'Finance MMK' ? 'Finance MMK' : 'User',
          avatar: data.user.avatar || undefined,
          phone: data.user.phone || undefined,
          createdAt: data.user.created_at || new Date().toISOString()
        };
        setUser(user);
        saveUserToStorage(user);
        return true;
      }
      return false;
    } catch (error) {
      // Handle login error
      return false;
    }
  };

  const clearAllData = () => {
    // Clear all application state
    setUser(null);
    removeUserFromStorage();
    
    // Clear any cached data in localStorage
    localStorage.removeItem('programs');
    localStorage.removeItem('notifications');
    localStorage.removeItem('userPreferences');
    
    // Force a page reload to clear all React state
    window.location.reload();
  };

  const logout = () => {
    clearAllData();
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      saveUserToStorage(updatedUser);
    }
  };

  const updateUserProfile = async (userData: Partial<User>): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const response = await fetch(API_ENDPOINTS.UPDATE_USER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          location: userData.department
        })
      });

      const data = await response.json();
      
      if (data.success && data.user) {
        // Update local user state with new data
        const updatedUser: User = {
          id: data.user.id.toString(),
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          department: data.user.location || 'Kedah State Government',
          position: data.user.role === 'admin' ? 'System Admin' : 
                   data.user.role === 'user' ? 'EXCO User' : 
                   data.user.role === 'Finance MMK' ? 'Finance MMK' : 'User',
          avatar: data.user.avatar || undefined,
          phone: data.user.phone || undefined,
          createdAt: data.user.created_at || new Date().toISOString()
        };
        setUser(updatedUser);
        saveUserToStorage(updatedUser);
        
        // Dispatch custom event to notify other components of profile update
        window.dispatchEvent(new CustomEvent('profileUpdated', { 
          detail: { 
            type: 'profile', 
            email: updatedUser.email,
            updates: {
              name: updatedUser.name,
              email: updatedUser.email,
              phone: updatedUser.phone,
              department: updatedUser.department
            }
          } 
        }));
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const response = await fetch(API_ENDPOINTS.CHANGE_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('Password changed successfully');
        return true;
      } else {
        console.error('Password change failed:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Error changing password:', error);
      return false;
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider value={{ user, login, logout, clearAllData, isAuthenticated, updateUser, updateUserProfile, changePassword, isLoading }}>
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