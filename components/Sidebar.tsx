import React, { useEffect, useRef } from 'react';
import { Page } from '../App';
import { HomeIcon, UsersIcon, WalletIcon, BarChartIcon, SettingsIcon, XIcon } from './icons';
import { useAppContext } from '../context/AppContext';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const navItems = [
  { page: 'dashboard', label: 'لوحة التحكم', icon: HomeIcon },
  { page: 'customers', label: 'المشتركين', icon: UsersIcon },
  { page: 'expenses', label: 'المصاريف', icon: WalletIcon },
  { page: 'reports', label: 'التقارير', icon: BarChartIcon },
  { page: 'settings', label: 'الإعدادات', icon: SettingsIcon },
];

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isOpen, setIsOpen }) => {
  const { expiringSoonCount } = useAppContext();
  const sidebarRef = useRef<HTMLElement>(null);

  const handleNavigation = (page: Page) => {
    setCurrentPage(page);
    setIsOpen(false); // Close sidebar on navigation in mobile
  }
  
  // Close sidebar if clicked outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, setIsOpen]);

  return (
    <>
      {/* Backdrop for mobile */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      ></div>

      <aside 
        ref={sidebarRef}
        className={`fixed md:relative inset-y-0 right-0 z-40 w-64 bg-gray-800 text-white flex flex-col
                   transform transition-transform duration-300 ease-in-out md:transform-none
                   ${isOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}
      >
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-center flex-1">مدير الاشتراكات</h1>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <XIcon className="h-6 w-6"/>
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-2">
          {navItems.map(item => (
            <button
              key={item.page}
              onClick={() => handleNavigation(item.page as Page)}
              className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                currentPage === item.page
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-gray-700'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="mr-3">{item.label}</span>
              {item.page === 'customers' && expiringSoonCount > 0 && (
                  <span className="mr-auto bg-yellow-500 text-gray-900 text-xs font-bold px-2 py-0.5 rounded-full">
                      {expiringSoonCount}
                  </span>
              )}
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
