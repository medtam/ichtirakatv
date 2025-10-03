import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration from environment or use defaults for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://qztkjyoiheuwsryipqma.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6dGtqeW9paGV1d3NyeWlwcW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTcxOTMsImV4cCI6MjA3NDk5MzE5M30.X8UsXDz7cM9PMwXt5zVTnlO-F8D9uVsW2eLNtfYLJzA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface DatabaseCustomer {
  id: string;
  name: string;
  phone: string;
  start_date: string;
  duration: number;
  price: number;
  payment_status: 'paid' | 'unpaid';
  created_at: string;
  updated_at: string;
}

export interface DatabaseExpense {
  id: string;
  date: string;
  type: string;
  amount: number;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseTier {
  id: string;
  duration: number;
  price: number;
  created_at: string;
  updated_at: string;
}

// Database operations
export class SupabaseService {
  // Customers
  static async getCustomers(): Promise<DatabaseCustomer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async addCustomer(customer: Omit<DatabaseCustomer, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseCustomer> {
    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateCustomer(id: string, updates: Partial<DatabaseCustomer>): Promise<DatabaseCustomer> {
    const { data, error } = await supabase
      .from('customers')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteCustomer(id: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Expenses
  static async getExpenses(): Promise<DatabaseExpense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  static async addExpense(expense: Omit<DatabaseExpense, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseExpense> {
    const { data, error } = await supabase
      .from('expenses')
      .insert([expense])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async updateExpense(id: string, updates: Partial<DatabaseExpense>): Promise<DatabaseExpense> {
    const { data, error } = await supabase
      .from('expenses')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async deleteExpense(id: string): Promise<void> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Subscription Tiers
  static async getTiers(): Promise<DatabaseTier[]> {
    const { data, error } = await supabase
      .from('subscription_tiers')
      .select('*')
      .order('duration', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  static async updateTiers(tiers: Array<{ duration: number; price: number }>): Promise<void> {
    // Delete existing tiers and insert new ones
    await supabase.from('subscription_tiers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    const { error } = await supabase
      .from('subscription_tiers')
      .insert(tiers);
    
    if (error) throw error;
  }

  // Test connection
  static async testConnection(): Promise<boolean> {
    try {
      const { error } = await supabase.from('customers').select('count').limit(1);
      return !error;
    } catch {
      return false;
    }
  }
}
