import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { API_ENDPOINTS } from '../config/api';

interface UserContextType {
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<boolean>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  toggleUserStatus: (id: string) => Promise<void>;
  getUser: (id: string) => User | undefined;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch users from backend on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {

      const response = await fetch(API_ENDPOINTS.USERS, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      

      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      
      if (data.success && data.users) {
        // Convert backend user format to frontend format
        const convertedUsers: User[] = data.users.map((user: any) => {
          // Map backend roles to frontend display roles
          let displayRole = user.role;
          let position = 'User';
          
          switch (user.role) {
            case 'admin':
              displayRole = 'admin';
              position = 'System Admin';
              break;
            case 'user':
              displayRole = 'user';
              position = 'EXCO User';
              break;
            case 'finance':
              displayRole = 'Finance MMK';
              position = 'Finance MMK';
              break;
            case 'finance_officer':
              displayRole = 'Finance Officer';
              position = 'Finance Officer';
              break;
            case 'super_admin':
              displayRole = 'Super Admin';
              position = 'Super Admin';
              break;
            default:
              displayRole = user.role;
              position = user.role;
          }
          
          return {
            id: user.id.toString(),
            name: user.name,
            email: user.email,
            role: user.role, // Keep original backend role for API calls
            displayRole: displayRole, // Add display role for UI
            department: user.location || 'Kedah State Government',
            position: position,
            createdAt: user.created_at,
            phone: user.phone || '',
            isActive: user.is_active === 1,
            location: user.location || 'Kedah State Government',
            avatar: user.avatar || undefined
          };
        });

        setUsers(convertedUsers);
      }
    } catch (error) {
      // Handle error silently
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (userData: Omit<User, 'id' | 'createdAt'>) => {
    try {

      
      const response = await fetch(`${API_ENDPOINTS.USERS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create',
          name: userData.name,
          email: userData.email,
          password: userData.password || 'password123', // Use provided password or default
          role: userData.role,
          phone: userData.phone,
          location: userData.location
        })
      });

      const data = await response.json();

      
      if (data.success) {
        // Refresh users list
        await fetchUsers();
        return true;
      } else {
        // Handle error
        throw new Error(data.error || 'Failed to add user');
      }
    } catch (error) {
      // Handle error
      throw error;
    }
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.USERS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          id: id,
          name: updates.name,
          email: updates.email,
          role: updates.role,
          phone: updates.phone,
          location: updates.location,
          is_active: updates.isActive ? 1 : 0
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh users list
        await fetchUsers();
      } else {
        throw new Error(data.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const response = await fetch(`${API_ENDPOINTS.USERS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          id: id
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh users list
        await fetchUsers();
      } else {
        throw new Error(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const toggleUserStatus = async (id: string) => {
    try {
      const user = users.find(u => u.id === id);
      if (!user) {
        throw new Error('User not found');
      }

      const response = await fetch(`${API_ENDPOINTS.USERS}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          id: id,
          is_active: !user.isActive ? 1 : 0
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh users list
        await fetchUsers();
      } else {
        throw new Error(data.error || 'Failed to toggle user status');
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  };



  const getUser = (id: string) => {
    return users.find(user => user.id === id);
  };

  return (
    <UserContext.Provider value={{ 
      users, 
      addUser, 
      updateUser, 
      deleteUser, 
      toggleUserStatus, 
      getUser,
      loading 
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUsers = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUsers must be used within a UserProvider');
  }
  return context;
};