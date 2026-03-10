import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { ChefUser } from '../lib/types';

interface ChefContextType {
  chef: ChefUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const ChefContext = createContext<ChefContextType | undefined>(undefined);

export function ChefProvider({ children }: { children: ReactNode }) {
  const [chef, setChef] = useState<ChefUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUsername = localStorage.getItem('chef_username');
    if (savedUsername) {
      loadChef(savedUsername);
    } else {
      setLoading(false);
    }
  }, []);

  const loadChef = async (username: string) => {
    try {
      const { data, error } = await supabase
        .from('chef_users')
        .select('*')
        .eq('username', username)
        .maybeSingle();

      if (error) throw error;
      if (data) setChef(data);
    } catch (error) {
      console.error('Error loading chef:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const { data, error } = await supabase
        .from('chef_users')
        .select('*')
        .eq('username', username)
        .eq('password_hash', password)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setChef(data);
        localStorage.setItem('chef_username', username);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error during chef login:', error);
      return false;
    }
  };

  const logout = () => {
    setChef(null);
    localStorage.removeItem('chef_username');
  };

  return (
    <ChefContext.Provider value={{ chef, loading, login, logout }}>
      {children}
    </ChefContext.Provider>
  );
}

export function useChef() {
  const context = useContext(ChefContext);
  if (context === undefined) {
    throw new Error('useChef must be used within a ChefProvider');
  }
  return context;
}
