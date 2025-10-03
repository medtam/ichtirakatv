import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Customer, Expense, SubscriptionTier, AppData, Toast } from '../types';
import { SupabaseService, DatabaseCustomer, DatabaseExpense, DatabaseTier } from '../lib/supabase';
import { getSubscriptionStatus, getExpiryDate } from '../utils/dateUtils';
import useLocalStorage from '../hooks/useLocalStorage';

interface SupabaseContextType {
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
  tiers: SubscriptionTier[];
  setTiers: (tiers: SubscriptionTier[]) => void;
  addCustomer: (customer: Omit<Customer, 'id'>) => Promise<void>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  renewCustomer: (id: string) => Promise<void>;
  markCustomerAsPaid: (id: string) => Promise<void>;
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  getAppData: () => AppData;
  loadAppData: (data: AppData) => Promise<boolean>;
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: number) => void;
  expiringSoonCount: number;
  isOnline: boolean;
  isLoading: boolean;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

const initialTiers: SubscriptionTier[] = [
  { duration: 1, price: 5 },
  { duration: 3, price: 10 },
  { duration: 6, price: 15 },
  { duration: 12, price: 30 },
];

// Helper functions to convert between database and app types
const dbCustomerToCustomer = (dbCustomer: DatabaseCustomer): Customer => ({
  id: dbCustomer.id,
  name: dbCustomer.name,
  phone: dbCustomer.phone,
  startDate: dbCustomer.start_date,
  duration: dbCustomer.duration,
  price: dbCustomer.price,
  paymentStatus: dbCustomer.payment_status,
});

const customerToDbCustomer = (customer: Omit<Customer, 'id'>): Omit<DatabaseCustomer, 'id' | 'created_at' | 'updated_at'> => ({
  name: customer.name,
  phone: customer.phone,
  start_date: customer.startDate,
  duration: customer.duration,
  price: customer.price,
  payment_status: customer.paymentStatus || 'unpaid',
});

const dbExpenseToExpense = (dbExpense: DatabaseExpense): Expense => ({
  id: dbExpense.id,
  date: dbExpense.date,
  type: dbExpense.type,
  amount: dbExpense.amount,
  notes: dbExpense.notes,
});

const expenseToDbExpense = (expense: Omit<Expense, 'id'>): Omit<DatabaseExpense, 'id' | 'created_at' | 'updated_at'> => ({
  date: expense.date,
  type: expense.type,
  amount: expense.amount,
  notes: expense.notes,
});

const dbTierToTier = (dbTier: DatabaseTier): SubscriptionTier => ({
  duration: dbTier.duration,
  price: dbTier.price,
});

export const SupabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Fallback to localStorage when offline
  const [localCustomers, setLocalCustomers] = useLocalStorage<Customer[]>('customers', []);
  const [localExpenses, setLocalExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [localTiers, setLocalTiers] = useLocalStorage<SubscriptionTier[]>('tiers', initialTiers);

  const [customers, setCustomersState] = useState<Customer[]>([]);
  const [expenses, setExpensesState] = useState<Expense[]>([]);
  const [tiers, setTiersState] = useState<SubscriptionTier[]>(initialTiers);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check Supabase connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      setIsLoading(true);
      const connected = await SupabaseService.testConnection();
      setIsOnline(connected);
      
      if (connected) {
        try {
          // Load data from Supabase
          const [dbCustomers, dbExpenses, dbTiers] = await Promise.all([
            SupabaseService.getCustomers(),
            SupabaseService.getExpenses(),
            SupabaseService.getTiers(),
          ]);

          setCustomersState(dbCustomers.map(dbCustomerToCustomer));
          setExpensesState(dbExpenses.map(dbExpenseToExpense));
          setTiersState(dbTiers.map(dbTierToTier));
        } catch (error) {
          console.error('Error loading from Supabase:', error);
          // Fallback to localStorage
          setCustomersState(localCustomers);
          setExpensesState(localExpenses);
          setTiersState(localTiers);
          setIsOnline(false);
        }
      } else {
        // Use localStorage data
        setCustomersState(localCustomers);
        setExpensesState(localExpenses);
        setTiersState(localTiers);
      }
      setIsLoading(false);
    };

    checkConnection();
  }, [localCustomers, localExpenses, localTiers]);

  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const expiringSoonCount = useMemo(() => {
    return customers.filter(c => getSubscriptionStatus(c) === 'expiringSoon').length;
  }, [customers]);

  // Wrapper functions that handle both online and offline states
  const setCustomers = (newCustomers: Customer[]) => {
    setCustomersState(newCustomers);
    setLocalCustomers(newCustomers);
  };

  const setExpenses = (newExpenses: Expense[]) => {
    setExpensesState(newExpenses);
    setLocalExpenses(newExpenses);
  };

  const setTiers = (newTiers: SubscriptionTier[]) => {
    setTiersState(newTiers);
    setLocalTiers(newTiers);
  };

  const findTierPrice = (duration: number) => {
    const tier = tiers.find(t => t.duration === duration);
    return tier ? tier.price : 0;
  };

  const addCustomer = async (customer: Omit<Customer, 'id'>) => {
    try {
      if (isOnline) {
        const dbCustomer = await SupabaseService.addCustomer(customerToDbCustomer(customer));
        const newCustomer = dbCustomerToCustomer(dbCustomer);
        setCustomers([...customers, newCustomer]);
      } else {
        const newCustomer: Customer = { ...customer, id: crypto.randomUUID() };
        setCustomers([...customers, newCustomer]);
      }
      addToast('تم إضافة مشترك بنجاح', 'success');
    } catch (error) {
      console.error('Error adding customer:', error);
      addToast('فشل في إضافة المشترك', 'error');
    }
  };

  const updateCustomer = async (updatedCustomer: Customer) => {
    try {
      if (isOnline) {
        await SupabaseService.updateCustomer(updatedCustomer.id, customerToDbCustomer(updatedCustomer));
      }
      setCustomers(customers.map(c => (c.id === updatedCustomer.id ? updatedCustomer : c)));
      addToast('تم تحديث بيانات المشترك بنجاح', 'success');
    } catch (error) {
      console.error('Error updating customer:', error);
      addToast('فشل في تحديث المشترك', 'error');
    }
  };

  const deleteCustomer = async (id: string) => {
    try {
      if (isOnline) {
        await SupabaseService.deleteCustomer(id);
      }
      setCustomers(customers.filter(c => c.id !== id));
      addToast('تم حذف المشترك بنجاح', 'success');
    } catch (error) {
      console.error('Error deleting customer:', error);
      addToast('فشل في حذف المشترك', 'error');
    }
  };

  const renewCustomer = async (id: string) => {
    try {
      const customer = customers.find(c => c.id === id);
      if (!customer) return;

      const expiryDate = getExpiryDate(customer.startDate, customer.duration);
      const today = new Date();
      const newStartDate = expiryDate < today ? today : expiryDate;

      const renewedCustomer: Customer = {
        ...customer,
        startDate: newStartDate.toISOString(),
        price: findTierPrice(customer.duration),
        paymentStatus: 'unpaid'
      };

      if (isOnline) {
        await SupabaseService.updateCustomer(id, customerToDbCustomer(renewedCustomer));
      }
      
      setCustomers(customers.map(c => c.id === id ? renewedCustomer : c));
      addToast('تم تجديد الاشتراك بنجاح! الرجاء تسجيل الدفعة.', 'success');
    } catch (error) {
      console.error('Error renewing customer:', error);
      addToast('فشل في تجديد الاشتراك', 'error');
    }
  };

  const markCustomerAsPaid = async (id: string) => {
    try {
      const updatedCustomer = customers.find(c => c.id === id);
      if (!updatedCustomer) return;

      updatedCustomer.paymentStatus = 'paid';

      if (isOnline) {
        await SupabaseService.updateCustomer(id, { payment_status: 'paid' });
      }
      
      setCustomers(customers.map(c => c.id === id ? updatedCustomer : c));
      addToast('تم تسجيل الدفعة بنجاح', 'success');
    } catch (error) {
      console.error('Error marking customer as paid:', error);
      addToast('فشل في تسجيل الدفعة', 'error');
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    try {
      if (isOnline) {
        const dbExpense = await SupabaseService.addExpense(expenseToDbExpense(expense));
        const newExpense = dbExpenseToExpense(dbExpense);
        setExpenses([...expenses, newExpense]);
      } else {
        const newExpense: Expense = { ...expense, id: crypto.randomUUID() };
        setExpenses([...expenses, newExpense]);
      }
      addToast('تم إضافة المصروف بنجاح', 'success');
    } catch (error) {
      console.error('Error adding expense:', error);
      addToast('فشل في إضافة المصروف', 'error');
    }
  };

  const updateExpense = async (updatedExpense: Expense) => {
    try {
      if (isOnline) {
        await SupabaseService.updateExpense(updatedExpense.id, expenseToDbExpense(updatedExpense));
      }
      setExpenses(expenses.map(e => (e.id === updatedExpense.id ? updatedExpense : e)));
      addToast('تم تحديث المصروف بنجاح', 'success');
    } catch (error) {
      console.error('Error updating expense:', error);
      addToast('فشل في تحديث المصروف', 'error');
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      if (isOnline) {
        await SupabaseService.deleteExpense(id);
      }
      setExpenses(expenses.filter(e => e.id !== id));
      addToast('تم حذف المصروف بنجاح', 'success');
    } catch (error) {
      console.error('Error deleting expense:', error);
      addToast('فشل في حذف المصروف', 'error');
    }
  };

  const getAppData = (): AppData => ({
    customers,
    expenses,
    tiers,
  });

  const loadAppData = async (data: AppData): Promise<boolean> => {
    try {
      if (data && Array.isArray(data.customers) && Array.isArray(data.expenses) && Array.isArray(data.tiers)) {
        setCustomers(data.customers);
        setExpenses(data.expenses);
        setTiers(data.tiers);
        addToast('تم استعادة البيانات بنجاح!', 'success');
        return true;
      }
      addToast('فشل في استعادة البيانات. الملف غير صالح أو تالف.', 'error');
      return false;
    } catch (error) {
      console.error('Error loading app data:', error);
      addToast('فشل في استعادة البيانات', 'error');
      return false;
    }
  };

  return (
    <SupabaseContext.Provider value={{
      customers, setCustomers,
      expenses, setExpenses,
      tiers, setTiers,
      addCustomer, updateCustomer, deleteCustomer, renewCustomer, markCustomerAsPaid,
      addExpense, updateExpense, deleteExpense,
      getAppData, loadAppData,
      toasts, addToast, removeToast,
      expiringSoonCount,
      isOnline,
      isLoading
    }}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabaseContext = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabaseContext must be used within a SupabaseProvider');
  }
  return context;
};
