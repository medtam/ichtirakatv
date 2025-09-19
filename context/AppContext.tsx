import React, { createContext, useContext, useState, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Customer, Expense, SubscriptionTier, AppData, Toast } from '../types';
import { getSubscriptionStatus, getExpiryDate } from '../utils/dateUtils';

interface AppContextType {
  customers: Customer[];
  setCustomers: (customers: Customer[]) => void;
  expenses: Expense[];
  setExpenses: (expenses: Expense[]) => void;
  tiers: SubscriptionTier[];
  setTiers: (tiers: SubscriptionTier[]) => void;
  addCustomer: (customer: Omit<Customer, 'id'>) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  renewCustomer: (id: string) => void;
  markCustomerAsPaid: (id: string) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (expense: Expense) => void;
  deleteExpense: (id: string) => void;
  getAppData: () => AppData;
  loadAppData: (data: AppData) => boolean;
  toasts: Toast[];
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: number) => void;
  expiringSoonCount: number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialTiers: SubscriptionTier[] = [
  { duration: 1, price: 5 },
  { duration: 3, price: 10 },
  { duration: 6, price: 15 },
  { duration: 12, price: 30 },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customers, setCustomers] = useLocalStorage<Customer[]>('customers', []);
  const [expenses, setExpenses] = useLocalStorage<Expense[]>('expenses', []);
  const [tiers, setTiers] = useLocalStorage<SubscriptionTier[]>('tiers', initialTiers);
  const [toasts, setToasts] = useState<Toast[]>([]);

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

  const findTierPrice = (duration: number) => {
    const tier = tiers.find(t => t.duration === duration);
    return tier ? tier.price : 0;
  };

  const addCustomer = (customer: Omit<Customer, 'id'>) => {
    const newCustomer: Customer = { ...customer, id: crypto.randomUUID() };
    setCustomers([...customers, newCustomer]);
    addToast('تم إضافة مشترك بنجاح', 'success');
  };

  const updateCustomer = (updatedCustomer: Customer) => {
    setCustomers(customers.map(c => (c.id === updatedCustomer.id ? updatedCustomer : c)));
    addToast('تم تحديث بيانات المشترك بنجاح', 'success');
  };

  const deleteCustomer = (id: string) => {
    setCustomers(customers.filter(c => c.id !== id));
    addToast('تم حذف المشترك بنجاح', 'success');
  };
  
  const renewCustomer = (id: string) => {
    setCustomers(prevCustomers => {
        const customer = prevCustomers.find(c => c.id === id);
        if (!customer) return prevCustomers;
        
        const expiryDate = getExpiryDate(customer.startDate, customer.duration);
        const today = new Date();
        
        // If expired, renew from today. If not, extend from the expiry date.
        const newStartDate = expiryDate < today ? today : expiryDate;
        
        const renewedCustomer: Customer = {
            ...customer,
            startDate: newStartDate.toISOString(),
            // Re-fetch price in case tiers have changed
            price: findTierPrice(customer.duration),
            paymentStatus: 'unpaid'
        };
        
        return prevCustomers.map(c => c.id === id ? renewedCustomer : c);
    });
    addToast('تم تجديد الاشتراك بنجاح! الرجاء تسجيل الدفعة.', 'success');
  };

  const markCustomerAsPaid = (id: string) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, paymentStatus: 'paid' } : c));
    addToast('تم تسجيل الدفعة بنجاح', 'success');
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    const newExpense: Expense = { ...expense, id: crypto.randomUUID() };
    setExpenses([...expenses, newExpense]);
    addToast('تم إضافة المصروف بنجاح', 'success');
  };

  const updateExpense = (updatedExpense: Expense) => {
    setExpenses(expenses.map(e => (e.id === updatedExpense.id ? updatedExpense : e)));
     addToast('تم تحديث المصروف بنجاح', 'success');
  };

  const deleteExpense = (id: string) => {
    setExpenses(expenses.filter(e => e.id !== id));
    addToast('تم حذف المصروف بنجاح', 'success');
  };

  const getAppData = (): AppData => ({
    customers,
    expenses,
    tiers,
  });

  const loadAppData = (data: AppData): boolean => {
    if (data && Array.isArray(data.customers) && Array.isArray(data.expenses) && Array.isArray(data.tiers)) {
      setCustomers(data.customers);
      setExpenses(data.expenses);
      setTiers(data.tiers);
      addToast('تم استعادة البيانات بنجاح!', 'success');
      return true;
    }
    addToast('فشل في استعادة البيانات. الملف غير صالح أو تالف.', 'error');
    return false;
  };

  return (
    <AppContext.Provider value={{
      customers, setCustomers,
      expenses, setExpenses,
      tiers, setTiers,
      addCustomer, updateCustomer, deleteCustomer, renewCustomer, markCustomerAsPaid,
      addExpense, updateExpense, deleteExpense,
      getAppData, loadAppData,
      toasts, addToast, removeToast,
      expiringSoonCount
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
