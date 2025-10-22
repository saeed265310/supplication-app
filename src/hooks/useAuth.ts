import { useState, useEffect } from 'react';
import type { User } from '../types';

// NOTE: This is a mock authentication system using localStorage.
// DO NOT use this in a production environment. Passwords are stored in plain text.

const USERS_STORAGE_KEY = 'supplication_app_users';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loggedInUser = localStorage.getItem('supplication_app_currentUser');
    if (loggedInUser) {
      setUser(JSON.parse(loggedInUser));
    }
  }, []);

  const getUsers = (): Record<string, string> => {
    const users = localStorage.getItem(USERS_STORAGE_KEY);
    return users ? JSON.parse(users) : {};
  };

  const login = (username: string, password: string):boolean => {
    const users = getUsers();
    if (users[username] && users[username] === password) {
      const currentUser = { username };
      setUser(currentUser);
      localStorage.setItem('supplication_app_currentUser', JSON.stringify(currentUser));
      return true;
    }
    return false;
  };

  const signup = (username: string, password: string): boolean => {
    const users = getUsers();
    if (users[username]) {
      return false; // User already exists
    }
    users[username] = password;
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    
    // Also create initial data for the new user
    localStorage.setItem(`supplication_app_data_${username}`, JSON.stringify({ groups: [] }));

    const currentUser = { username };
    setUser(currentUser);
    localStorage.setItem('supplication_app_currentUser', JSON.stringify(currentUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('supplication_app_currentUser');
  };

  return { user, login, signup, logout };
};
