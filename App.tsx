import React, { useState, useEffect } from 'react';
import { AppProvider } from './context/AppContext';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/DashboardPage';
import CustomersPage from './pages/CustomersPage';
import ExpensesPage from './pages/ExpensesPage';
import ReportsPage from './pages/ReportsPage';
import SettingsPage from './pages/SettingsPage';
import { ToastContainer } from './components/Toast';
import { MenuIcon } from './components/icons';

export type Page = 'dashboard' | 'customers' | 'expenses' | 'reports' | 'settings';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // PWA functionality: Service Worker registration
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        // Use an absolute path to avoid origin mismatch errors in some environments
        const swUrl = `${window.location.origin}/sw.js`;
        navigator.serviceWorker.register(swUrl)
          .then(registration => {
            console.log('Service Worker registration successful with scope: ', registration.scope);
          })
          .catch(err => {
            console.log('Service Worker registration failed: ', err);
          });
      });
    }
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'customers':
        return <CustomersPage />;
      case 'expenses':
        return <ExpensesPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardPage />;
    }
  };

  const pageTitles: Record<Page, string> = {
    dashboard: 'لوحة التحكم',
    customers: 'المشتركين',
    expenses: 'المصاريف',
    reports: 'التقارير',
    settings: 'الإعدادات'
  };

  return (
    <AppProvider>
      <div className="flex h-screen bg-gray-100 font-sans" dir="rtl">
        <Sidebar 
            currentPage={currentPage} 
            setCurrentPage={setCurrentPage} 
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white shadow-md md:hidden p-4 flex justify-between items-center">
             <h1 className="text-xl font-bold text-gray-800">
                { pageTitles[currentPage] }
             </h1>
             <button onClick={() => setIsSidebarOpen(true)} className="text-gray-600">
                <MenuIcon className="h-6 w-6" />
             </button>
          </header>
          <div className="flex-1 overflow-x-hidden overflow-y-auto">
            {renderPage()}
          </div>
        </main>
        <ToastContainer />
      </div>
    </AppProvider>
  );
};

export default App;
