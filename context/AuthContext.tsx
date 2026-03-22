import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useData } from './DataContext'; // Import useData hook
import type { User } from '../types';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  login: (userId: string, password: string, save: boolean) => boolean;
  logout: () => void;
  createUser: (user: Omit<User, 'status'>) => Promise<boolean>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const defaultAdmin: User = { id: 'Admin', password: '1274', role: 'admin', status: 'active' };

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const data = useData(); // Consume data from DataContext
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    if (data?.users && data.users.length > 0) {
      const sheetUsers = data.users;
      const adminExists = sheetUsers.some(u => u.id === 'Admin');
      
      if (!adminExists) {
        setUsers([defaultAdmin, ...sheetUsers]);
      } else {
        setUsers(sheetUsers);
      }
    } else if (data?.users) {
      // If users tab exists but is empty, just show default admin
      setUsers([defaultAdmin]);
    }
  }, [data?.users]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for saved user on initial load
    try {
        const savedUser = window.localStorage.getItem('currentUser');
        if (savedUser) {
            setCurrentUser(JSON.parse(savedUser));
        }
    } catch (e) {
        console.error("Failed to parse saved user", e);
        window.localStorage.removeItem('currentUser');
    }
  }, []);

  const login = (userId: string, password: string, save: boolean): boolean => {
    const user = users.find(u => u.id.toLowerCase() === userId.toLowerCase() && u.password === password);
    if (user) {
      if (user.status === 'pending') {
        alert('Your account is pending approval from an administrator.');
        return false;
      }
      setCurrentUser(user);
      if (save) {
        localStorage.setItem('currentUser', JSON.stringify(user));
      } else {
        localStorage.removeItem('currentUser');
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };
  
  const createUser = async (newUser: Omit<User, 'status'>): Promise<boolean> => {
    if (users.some(u => u.id === newUser.id)) {
        return false;
    }
    try {
        const userToCreate = { ...newUser, status: 'pending' };
        await data.createData('Users', userToCreate);
        // DataContext will refetch and AuthContext useEffect will update local users
        return true;
    } catch (error) {
        console.error("Failed to create user in sheet:", error);
        return false;
    }
  };
  
  const changePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    if (!currentUser) return false;

    if (currentUser.password !== oldPassword) {
        return false; // Let UI handle the alert
    }

    const updatedUser = { ...currentUser, password: newPassword };
    
    try {
        await data.updateData('Users', updatedUser);
        // Update the current user state
        setCurrentUser(updatedUser);

        // Update localStorage if the session was saved
        if (localStorage.getItem('currentUser')) {
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
        return true;
    } catch (error) {
        console.error("Failed to update password in sheet:", error);
        return false;
    }
  };


  return (
    <AuthContext.Provider value={{ currentUser, users, setUsers, login, logout, createUser, changePassword }}>
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