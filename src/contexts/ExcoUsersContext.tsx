import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_ENDPOINTS } from '../config/api';

interface ExcoUser {
  id: number;
  name: string;
  title: string;
  role: string;
  image_url: string;
  email: string;
  phone: string;
  department: string;
  position: string;
}

interface ExcoUsersContextType {
  excoUsers: ExcoUser[];
  loading: boolean;
  fetchExcoUsers: () => Promise<void>;
  refreshExcoUsers: () => void;
  updateExcoUser: (email: string, updates: Partial<ExcoUser>) => Promise<void>;
}

const ExcoUsersContext = createContext<ExcoUsersContextType | undefined>(undefined);

export const ExcoUsersProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [excoUsers, setExcoUsers] = useState<ExcoUser[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchExcoUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.EXCO_USERS);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setExcoUsers(data.excoUsers || []);
      } else {
        console.error('API returned error:', data.error || data.message);
        setExcoUsers([]);
      }
    } catch (error) {
      console.error('Error fetching EXCO users:', error);
      setExcoUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshExcoUsers = () => {
    fetchExcoUsers();
  };

  const updateExcoUser = async (email: string, updates: Partial<ExcoUser>) => {
    try {
      console.log('Updating EXCO user:', email, 'with updates:', updates);
      
      // Update the local state immediately for better UX
      setExcoUsers(prevUsers => 
        prevUsers.map(user => 
          user.email === email 
            ? { ...user, ...updates }
            : user
        )
      );

      // Also update the backend
      console.log('Sending PUT request to:', API_ENDPOINTS.EXCO_USERS);
      const response = await fetch(API_ENDPOINTS.EXCO_USERS, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          updates: updates
        })
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.success) {
        console.log('EXCO user updated successfully on backend:', email);
        // Refresh from server to ensure consistency
        await fetchExcoUsers();
      } else {
        console.error('Failed to update EXCO user on backend:', data.error || data.message);
        // Revert local changes on error
        await fetchExcoUsers();
        throw new Error(data.error || data.message || 'Failed to update EXCO user');
      }
      
      console.log('EXCO user updated successfully:', email);
    } catch (error) {
      console.error('Error updating EXCO user:', error);
      // Revert on error
      await fetchExcoUsers();
      throw error; // Re-throw to let calling code handle it
    }
  };

  useEffect(() => {
    fetchExcoUsers();
  }, []);

  return (
    <ExcoUsersContext.Provider value={{ 
      excoUsers, 
      loading, 
      fetchExcoUsers, 
      refreshExcoUsers,
      updateExcoUser
    }}>
      {children}
    </ExcoUsersContext.Provider>
  );
};

export const useExcoUsers = () => {
  const context = useContext(ExcoUsersContext);
  if (context === undefined) {
    throw new Error('useExcoUsers must be used within an ExcoUsersProvider');
  }
  return context;
};
