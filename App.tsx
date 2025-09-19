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

  // PWA functionality
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

    // Dynamic Manifest
    const manifest = {
      "name": "مدير الاشتراكات",
      "short_name": "الاشتراكات",
      "description": "تطبيق لإدارة اشتراكات خدمة القنوات التلفزيونية والمصاريف والتقارير. يعمل بدون الحاجة للاتصال بالإنترنت.",
      "start_url": ".",
      "display": "standalone",
      "background_color": "#ffffff",
      "theme_color": "#4f46e5",
      "icons": [
        {
          "src": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzRmNDZlNSI+PHJlY3QgeD0iMiIgeT0iNCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjE1IiByeD0iMiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxLjUiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNOS41IDE1LjVWLjVMMTYuNSAxMkw5LjUgMTUuNVoiIGZpbGw9IndoaXRlIi8+PGxpbmUgeDE9IjciIHkxPSIyMSIgeDI9IjE3IiB5Mj0iMjEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=",
          "sizes": "192x192",
          "type": "image/svg+xml",
          "purpose": "any maskable"
        },
        {
          "src": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzRmNDZlNSI+PHJlY3QgeD0iMiIgeT0iNCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjE1IiByeD0iMiIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIxLjUiIGZpbGw9Im5vbmUiLz48cGF0aCBkPSJNOS41IDE1LjVWLjVMMTYuNSAxMkw5LjUgMTUuNVoiIGZpbGw9IndoaXRlIi8+PGxpbmUgeDE9IjciIHkxPSIyMSIgeDI9IjE3IiB5Mj0iMjEiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMS41IiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=",
          "sizes": "512x512",
          "type": "image/svg+xml",
          "purpose": "any maskable"
        }
      ]
    };

    const manifestBlob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
    const manifestUrl = URL.createObjectURL(manifestBlob);
    
    let manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!manifestLink) {
        manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        document.head.appendChild(manifestLink);
    }
    manifestLink.href = manifestUrl;

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
