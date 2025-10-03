import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qztkjyoiheuwsryipqma.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6dGtqeW9paGV1d3NyeWlwcW1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTcxOTMsImV4cCI6MjA3NDk5MzE5M30.X8UsXDz7cM9PMwXt5zVTnlO-F8D9uVsW2eLNtfYLJzA';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          name: string
          phone: string
          start_date: string
          duration: number
          price: number
          payment_status: string | null
        }
        Insert: {
          id?: string
          name: string
          phone: string
          start_date: string
          duration: number
          price: number
          payment_status?: string | null
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          start_date?: string
          duration?: number
          price?: number
          payment_status?: string | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          id: string
          date: string
          type: string
          amount: number
          notes: string | null
        }
        Insert: {
          id?: string
          date: string
          type: string
          amount: number
          notes?: string | null
        }
        Update: {
          id?: string
          date?: string
          type?: string
          amount?: number
          notes?: string | null
        }
        Relationships: []
      }
      tiers: {
        Row: {
          duration: number
          price: number
        }
        Insert: {
          duration: number
          price: number
        }
        Update: {
          duration?: number
          price?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
