import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Toast as ToastType } from '../types';

const Toast: React.FC<{ toast: ToastType, onRemove: (id: number) => void }> = ({ toast, onRemove }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onRemove(toast.id);
        }, 5000);
        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);

    const baseClasses = 'p-4 rounded-md shadow-lg text-white mb-2 flex justify-between items-center transition-all duration-300';
    const typeClasses = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
    };

    return (
        <div className={`${baseClasses} ${typeClasses[toast.type]}`} role="alert">
            <span>{toast.message}</span>
            <button onClick={() => onRemove(toast.id)} className="ms-4 me-0 text-white font-bold text-lg leading-none">&times;</button>
        </div>
    );
};

export const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useAppContext();
    if (!toasts.length) return null;

    return (
        <div className="fixed top-5 right-5 z-[100] w-80">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onRemove={removeToast} />
            ))}
        </div>
    );
};
