import React, { useState } from 'react';
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

const pageTitles: Record<Page, string> = {
    dashboard: 'لوحة التحكم',
    customers: 'إدارة المشتركين',
    expenses: 'إدارة المصاريف',
    reports: 'التقارير',
    settings: 'الإعدادات',
};

const Header: React.FC<{ onMenuClick: () => void, currentPage: Page }> = ({ onMenuClick, currentPage }) => (
    <header className="bg-white shadow-sm md:hidden p-4 flex items-center">
        <button onClick={onMenuClick} className="text-gray-600 hover:text-gray-800">
            <MenuIcon className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-bold text-gray-800 mr-4">{pageTitles[currentPage]}</h1>
    </header>
);


const App: React.FC = () => {
    const [currentPage, setCurrentPage] = useState<Page>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

    return (
        <AppProvider>
            <div className="flex h-screen bg-gray-100 overflow-hidden">
                <ToastContainer />
                <Sidebar 
                    currentPage={currentPage} 
                    setCurrentPage={setCurrentPage}
                    isOpen={isSidebarOpen}
                    setIsOpen={setIsSidebarOpen}
                />
                <div className="flex-1 flex flex-col min-w-0">
                    <Header onMenuClick={() => setIsSidebarOpen(true)} currentPage={currentPage}/>
                    <main className="flex-1 overflow-y-auto">
                        {renderPage()}
                    </main>
                </div>
            </div>
        </AppProvider>
    );
};

export default App;