import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { ManagerUser } from '../lib/types';

interface ManagerContextType {
  manager: ManagerUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const ManagerContext = createContext<ManagerContextType | undefined>(undefined);

export function ManagerProvider({ children }: { children: ReactNode }) {
  const [manager, setManager] = useState<ManagerUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUsername = localStorage.getItem('manager_username');
    if (savedUsername) {
      loadManager(savedUsername);
    } else {
      setLoading(false);
    }
  }, []);

  const loadManager = async (username: string) => {
    try {
      const { data, error } = await supabase
        .from('manager_users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (error) throw error;
      if (data) setManager(data);
    } catch (error) {
      console.error('Error loading manager:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const { data, error } = await supabase
        .from('manager_users')
        .select('*')
        .eq('username', username)
        .eq('password_hash', password)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setManager(data);
        localStorage.setItem('manager_username', username);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error during manager login:', error);
      return false;
    }
  };

  const logout = () => {
    setManager(null);
    localStorage.removeItem('manager_username');
  };

  return (
    <ManagerContext.Provider value={{ manager, loading, login, logout }}>
      {children}
    </ManagerContext.Provider>
  );
}

export function useManager() {
  const context = useContext(ManagerContext);
  if (context === undefined) {
    throw new Error('useManager must be used within a ManagerProvider');
  }
  return context;
}
