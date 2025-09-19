export interface Customer {
  id: string;
  name: string;
  phone: string;
  startDate: string; // ISO string
  duration: number; // in months
  price: number;
}

export interface Expense {
  id: string;
  date: string; // ISO string
  type: string;
  amount: number;
  notes: string;
}

export interface SubscriptionTier {
  duration: number; // in months
  price: number;
}

export interface AppData {
    customers: Customer[];
    expenses: Expense[];
    tiers: SubscriptionTier[];
}

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export type SubscriptionStatus = 'active' | 'expiringSoon' | 'expired';
