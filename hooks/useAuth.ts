import { useState, useEffect } from 'react';
import type { User } from '../types';
import { apiLogin, apiSignup, apiLogout, apiCheckAuth } from '../utils/api';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Add loading state

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        const authResult = await apiCheckAuth();
        if (authResult) {
          setUser(authResult.user);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("An unexpected error occurred during auth check", error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkUser();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { user } = await apiLogin(username, password);
      setUser(user);
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const signup = async (username: string, password: string): Promise<boolean> => {
    try {
      const { user } = await apiSignup(username, password);
      setUser(user);
      return true;
    } catch (error) {
      console.error("Signup failed:", error);
      return false;
    }
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  return { user, login, signup, logout, loading };
};