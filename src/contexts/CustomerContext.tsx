import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Customer } from '../lib/types';

interface CustomerContextType {
  customer: Customer | null;
  loading: boolean;
  login: (name: string, mobile: string) => Promise<void>;
  logout: () => void;
  refreshCustomer: () => Promise<void>;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedMobile = localStorage.getItem('customer_mobile');
    if (savedMobile) {
      loadCustomer(savedMobile);
    } else {
      setLoading(false);
    }
  }, []);

  const loadCustomer = async (mobile: string) => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('mobile', mobile)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        await supabase
          .from('customers')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', data.id);

        setCustomer(data);
      }
    } catch (error) {
      console.error('Error loading customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (name: string, mobile: string) => {
    try {
      const { data: existing } = await supabase
        .from('customers')
        .select('*')
        .eq('mobile', mobile)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('customers')
          .update({
            name,
            last_active_at: new Date().toISOString()
          })
          .eq('id', existing.id);

        setCustomer({ ...existing, name });
      } else {
        const { data: newCustomer, error } = await supabase
          .from('customers')
          .insert({ name, mobile })
          .select()
          .single();

        if (error) throw error;
        setCustomer(newCustomer);
      }

      localStorage.setItem('customer_mobile', mobile);
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const logout = () => {
    setCustomer(null);
    localStorage.removeItem('customer_mobile');
  };

  const refreshCustomer = async () => {
    if (customer) {
      await loadCustomer(customer.mobile);
    }
  };

  return (
    <CustomerContext.Provider value={{ customer, loading, login, logout, refreshCustomer }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
}
