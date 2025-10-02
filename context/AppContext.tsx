import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { Customer, Expense, SubscriptionTier, AppData, Toast } from '../types';
import { getSubscriptionStatus, getExpiryDate } from '../utils/dateUtils';

// ✅ Firebase imports
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc 
} from "firebase/firestore";

// ✅ إعداد Firebase (غير هاد القيم عوضهم بالقيم ديالك من Firebase console)
const firebaseConfig = {
  apiKey: "AIzaSyBsL8pUR4ygIV4_WUpE8-06-rqcpSFND4g",
  authDomain: "ichtirak-app.firebaseapp.com",
  projectId: "ichtirak-app",
  storageBucket: "ichtirak-app.firebasestorage.app",
  messagingSenderId: "686012843393",
  appId: "1:686012843393:web:8040e987181f3ac9bcd480",
  measurementId: "G-C510BPS9JV"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tiers, setTiers] = useState<SubscriptionTier[]>(initialTiers);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ✅ Toasts
  const addToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // ✅ Expiring soon
  const expiringSoonCount = useMemo(() => {
    return customers.filter(c => getSubscriptionStatus(c) === 'expiringSoon').length;
  }, [customers]);

  // ✅ Load data from Firestore
  useEffect(() => {
    const fetchCustomers = async () => {
      const snapshot = await getDocs(collection(db, "customers"));
      setCustomers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Customer[]);
    };

    const fetchExpenses = async () => {
      const snapshot = await getDocs(collection(db, "expenses"));
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Expense[]);
    };

    fetchCustomers();
    fetchExpenses();
  }, []);

  // ✅ Customers CRUD
  const addCustomer = async (customer: Omit<Customer, 'id'>) => {
    const docRef = await addDoc(collection(db, "customers"), customer);
    const newCustomer: Customer = { ...customer, id: docRef.id };
    setCustomers([...customers, newCustomer]);
    addToast('تم إضافة مشترك بنجاح', 'success');
  };

  const updateCustomer = async (updatedCustomer: Customer) => {
    const ref = doc(db, "customers", updatedCustomer.id);
    await updateDoc(ref, updatedCustomer as any);
    setCustomers(customers.map(c => (c.id === updatedCustomer.id ? updatedCustomer : c)));
    addToast('تم تحديث بيانات المشترك بنجاح', 'success');
  };

  const deleteCustomer = async (id: string) => {
    await deleteDoc(doc(db, "customers", id));
    setCustomers(customers.filter(c => c.id !== id));
    addToast('تم حذف المشترك بنجاح', 'success');
  };

  const renewCustomer = (id: string) => {
    setCustomers(prevCustomers => {
      const customer = prevCustomers.find(c => c.id === id);
      if (!customer) return prevCustomers;

      const expiryDate = getExpiryDate(customer.startDate, customer.duration);
      const today = new Date();

      const newStartDate = expiryDate < today ? today : expiryDate;

      const renewedCustomer: Customer = {
        ...customer,
        startDate: newStartDate.toISOString(),
        price: tiers.find(t => t.duration === customer.duration)?.price || 0,
        paymentStatus: 'unpaid'
      };

      updateCustomer(renewedCustomer);
      return prevCustomers.map(c => c.id === id ? renewedCustomer : c);
    });
    addToast('تم تجديد الاشتراك بنجاح! الرجاء تسجيل الدفعة.', 'success');
  };

  const markCustomerAsPaid = (id: string) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, paymentStatus: 'paid' } : c));
    addToast('تم تسجيل الدفعة بنجاح', 'success');
  };

  // ✅ Expenses CRUD
  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    const docRef = await addDoc(collection(db, "expenses"), expense);
    const newExpense: Expense = { ...expense, id: docRef.id };
    setExpenses([...expenses, newExpense]);
    addToast('تم إضافة المصروف بنجاح', 'success');
  };

  const updateExpense = async (updatedExpense: Expense) => {
    const ref = doc(db, "expenses", updatedExpense.id);
    await updateDoc(ref, updatedExpense as any);
    setExpenses(expenses.map(e => (e.id === updatedExpense.id ? updatedExpense : e)));
    addToast('تم تحديث المصروف بنجاح', 'success');
  };

  const deleteExpense = async (id: string) => {
    await deleteDoc(doc(db, "expenses", id));
    setExpenses(expenses.filter(e => e.id !== id));
    addToast('تم حذف المصروف بنجاح', 'success');
  };

  // ✅ Data backup/restore
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

