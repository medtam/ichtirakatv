import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { Customer, Expense, SubscriptionTier, AppData, Toast } from '../types';
import { getSubscriptionStatus, getExpiryDate } from '../utils/dateUtils';
import { supabase } from '../utils/supabase';

interface AppContextType {
  customers: Customer[];
  expenses: Expense[];
  tiers: SubscriptionTier[];
  setTiers: (tiers: SubscriptionTier[]) => Promise<void>;
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
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tiers, setTiersState] = useState<SubscriptionTier[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [customersRes, expensesRes, tiersRes] = await Promise.all([
          supabase.from('customers').select('*'),
          supabase.from('expenses').select('*'),
          supabase.from('tiers').select('*'),
        ]);

        if (customersRes.error) throw customersRes.error;
        if (expensesRes.error) throw expensesRes.error;
        if (tiersRes.error) throw tiersRes.error;

        setCustomers(customersRes.data.map(c => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          startDate: c.start_date,
          duration: c.duration,
          price: c.price,
          paymentStatus: (c.payment_status as Customer['paymentStatus']) || 'paid',
        })));
        
        setExpenses(expensesRes.data.map(e => ({
            id: e.id,
            date: e.date,
            type: e.type,
            amount: e.amount,
            notes: e.notes || '',
        })));

        setTiersState(tiersRes.data.sort((a,b) => a.duration - b.duration));

      } catch (error: any) {
        addToast(`خطأ في تحميل البيانات: ${error.message}`, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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

  const addCustomer = async (customer: Omit<Customer, 'id'>) => {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: customer.name,
        phone: customer.phone,
        start_date: customer.startDate,
        duration: customer.duration,
        price: customer.price,
        payment_status: customer.paymentStatus,
      })
      .select()
      .single();

    if (error) {
      addToast(`خطأ في إضافة مشترك: ${error.message}`, 'error');
    } else if (data) {
      const newCustomer: Customer = {
          id: data.id,
          name: data.name,
          phone: data.phone,
          startDate: data.start_date,
          duration: data.duration,
          price: data.price,
          paymentStatus: (data.payment_status as Customer['paymentStatus']) || 'paid',
      };
      setCustomers(prev => [...prev, newCustomer]);
      addToast('تم إضافة مشترك بنجاح', 'success');
    }
  };

  const updateCustomer = async (updatedCustomer: Customer) => {
    const { data, error } = await supabase
      .from('customers')
      .update({
        name: updatedCustomer.name,
        phone: updatedCustomer.phone,
        start_date: updatedCustomer.startDate,
        duration: updatedCustomer.duration,
        price: updatedCustomer.price,
        payment_status: updatedCustomer.paymentStatus,
      })
      .eq('id', updatedCustomer.id)
      .select()
      .single();

    if (error) {
        addToast(`خطأ في تحديث المشترك: ${error.message}`, 'error');
    } else if (data) {
        const updated: Customer = {
            id: data.id,
            name: data.name,
            phone: data.phone,
            startDate: data.start_date,
            duration: data.duration,
            price: data.price,
            paymentStatus: (data.payment_status as Customer['paymentStatus']) || 'paid',
        };
        setCustomers(customers.map(c => (c.id === updated.id ? updated : c)));
        addToast('تم تحديث بيانات المشترك بنجاح', 'success');
    }
  };

  const deleteCustomer = async (id: string) => {
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) {
        addToast(`خطأ في حذف المشترك: ${error.message}`, 'error');
    } else {
        setCustomers(customers.filter(c => c.id !== id));
        addToast('تم حذف المشترك بنجاح', 'success');
    }
  };
  
  const renewCustomer = async (id: string) => {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;
    
    const expiryDate = getExpiryDate(customer.startDate, customer.duration);
    const today = new Date();
    
    const newStartDate = expiryDate < today ? today : expiryDate;
    
    const { data, error } = await supabase
        .from('customers')
        .update({
            start_date: newStartDate.toISOString(),
            price: findTierPrice(customer.duration),
            payment_status: 'unpaid'
        })
        .eq('id', id)
        .select()
        .single();
    
    if (error) {
        addToast(`خطأ في تجديد الاشتراك: ${error.message}`, 'error');
    } else if (data) {
        const updated: Customer = {
            id: data.id,
            name: data.name,
            phone: data.phone,
            startDate: data.start_date,
            duration: data.duration,
            price: data.price,
            paymentStatus: (data.payment_status as Customer['paymentStatus']) || 'paid',
        };
        setCustomers(prev => prev.map(c => c.id === id ? updated : c));
        addToast('تم تجديد الاشتراك بنجاح! الرجاء تسجيل الدفعة.', 'success');
    }
  };

  const markCustomerAsPaid = async (id: string) => {
    const { error } = await supabase.from('customers').update({ payment_status: 'paid' }).eq('id', id);
    if (error) {
        addToast(`خطأ في تحديث الدفع: ${error.message}`, 'error');
    } else {
        setCustomers(prev => prev.map(c => c.id === id ? { ...c, paymentStatus: 'paid' } : c));
        addToast('تم تسجيل الدفعة بنجاح', 'success');
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    const { data, error } = await supabase
      .from('expenses')
      .insert({ ...expense })
      .select()
      .single();
    if (error) {
        addToast(`خطأ في إضافة المصروف: ${error.message}`, 'error');
    } else if (data) {
        const newExpense: Expense = {
            id: data.id,
            date: data.date,
            type: data.type,
            amount: data.amount,
            notes: data.notes || '',
        };
        setExpenses(prev => [...prev, newExpense]);
        addToast('تم إضافة المصروف بنجاح', 'success');
    }
  };

  const updateExpense = async (updatedExpense: Expense) => {
    const { data, error } = await supabase
        .from('expenses')
        .update({
            date: updatedExpense.date,
            type: updatedExpense.type,
            amount: updatedExpense.amount,
            notes: updatedExpense.notes
        })
        .eq('id', updatedExpense.id)
        .select()
        .single();
    
    if (error) {
        addToast(`خطأ في تحديث المصروف: ${error.message}`, 'error');
    } else if (data) {
        const updated: Expense = {
            id: data.id,
            date: data.date,
            type: data.type,
            amount: data.amount,
            notes: data.notes || '',
        };
        setExpenses(expenses.map(e => (e.id === updated.id ? updated : e)));
        addToast('تم تحديث المصروف بنجاح', 'success');
    }
  };

  const deleteExpense = async (id: string) => {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) {
        addToast(`خطأ في حذف المصروف: ${error.message}`, 'error');
    } else {
        setExpenses(expenses.filter(e => e.id !== id));
        addToast('تم حذف المصروف بنجاح', 'success');
    }
  };

  const setTiers = async (newTiers: SubscriptionTier[]) => {
    const { error: deleteError } = await supabase.from('tiers').delete().neq('duration', -1);
    if (deleteError) {
        addToast(`خطأ في تحديث الأسعار: ${deleteError.message}`, 'error');
        return;
    }
    const { data, error: insertError } = await supabase.from('tiers').insert(newTiers).select();
    if (insertError) {
        addToast(`خطأ في تحديث الأسعار: ${insertError.message}`, 'error');
    } else if (data) {
        setTiersState(data.sort((a,b) => a.duration - b.duration));
        addToast('تم تحديث الأسعار بنجاح', 'success');
    }
  };

  const getAppData = (): AppData => ({ customers, expenses, tiers });

  const loadAppData = async (data: AppData): Promise<boolean> => {
    if (data && Array.isArray(data.customers) && Array.isArray(data.expenses) && Array.isArray(data.tiers)) {
      setIsLoading(true);
      try {
        await supabase.from('customers').delete().neq('id', 'dummy-id');
        await supabase.from('expenses').delete().neq('id', 'dummy-id');
        await supabase.from('tiers').delete().neq('duration', -1);

        const { error: customerError } = await supabase.from('customers').insert(data.customers.map(c => ({ ...c, start_date: c.startDate, payment_status: c.paymentStatus })));
        if (customerError) throw customerError;
        const { error: expenseError } = await supabase.from('expenses').insert(data.expenses);
        if (expenseError) throw expenseError;
        const { error: tierError } = await supabase.from('tiers').insert(data.tiers);
        if (tierError) throw tierError;

        setCustomers(data.customers);
        setExpenses(data.expenses);
        setTiersState(data.tiers.sort((a,b) => a.duration - b.duration));
        addToast('تم استعادة البيانات بنجاح!', 'success');
        return true;
      } catch (error: any) {
        addToast(`فشل في استعادة البيانات: ${error.message}`, 'error');
        return false;
      } finally {
        setIsLoading(false);
      }
    }
    addToast('فشل في استعادة البيانات. الملف غير صالح أو تالف.', 'error');
    return false;
  };

  return (
    <AppContext.Provider value={{
      customers,
      expenses,
      tiers,
      setTiers,
      addCustomer, updateCustomer, deleteCustomer, renewCustomer, markCustomerAsPaid,
      addExpense, updateExpense, deleteExpense,
      getAppData, loadAppData,
      toasts, addToast, removeToast,
      expiringSoonCount,
      isLoading
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
