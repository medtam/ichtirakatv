
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Expense } from '../types';
import ExpenseForm from '../components/ExpenseForm';
import { PlusCircleIcon, EditIcon, Trash2Icon } from '../components/icons';
import ConfirmationModal from '../components/ConfirmationModal';

const ExpensesPage: React.FC = () => {
    const { expenses, deleteExpense } = useAppContext();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState<Expense | undefined>(undefined);
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
    });

    const openFormForEdit = (expense: Expense) => {
        setExpenseToEdit(expense);
        setIsFormOpen(true);
    };

    const openFormForAdd = () => {
        setExpenseToEdit(undefined);
        setIsFormOpen(true);
    };

    const handleDelete = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'تأكيد الحذف',
            message: 'هل أنت متأكد من رغبتك في حذف هذا المصروف؟',
            onConfirm: () => {
                deleteExpense(id);
                setConfirmModal({ ...confirmModal, isOpen: false });
            }
        });
    };
    
    const sortedExpenses = useMemo(() => {
        return [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses]);

    const totalExpenses = useMemo(() => {
        return expenses.reduce((sum, e) => sum + e.amount, 0);
    }, [expenses]);

    return (
        <div className="p-6 md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">إدارة المصاريف</h1>
                <button onClick={openFormForAdd} className="flex items-center justify-center sm:justify-start bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition-colors">
                    <PlusCircleIcon className="h-5 w-5 ms-2" />
                    <span className="mr-2">إضافة مصروف جديد</span>
                </button>
            </div>
            
            <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
                <p className="text-lg text-gray-700">إجمالي المصاريف: <span className="font-bold text-red-600">{totalExpenses.toFixed(2)}€</span></p>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full min-w-max text-right">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                            <th className="p-3 text-sm font-semibold tracking-wide">التاريخ</th>
                            <th className="p-3 text-sm font-semibold tracking-wide">النوع</th>
                            <th className="p-3 text-sm font-semibold tracking-wide">المبلغ</th>
                            <th className="p-3 text-sm font-semibold tracking-wide">ملاحظات</th>
                            <th className="p-3 text-sm font-semibold tracking-wide text-center">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {sortedExpenses.map(expense => (
                            <tr key={expense.id} className="hover:bg-gray-50">
                                <td className="p-3 text-sm text-gray-700">{new Date(expense.date).toLocaleDateString('ar-EG', { numberingSystem: 'latn' })}</td>
                                <td className="p-3 text-sm text-gray-700">{expense.type}</td>
                                <td className="p-3 text-sm text-red-600 font-semibold">{expense.amount.toFixed(2)}€</td>
                                <td className="p-3 text-sm text-gray-700 max-w-xs truncate">{expense.notes || '-'}</td>
                                <td className="p-3 text-center">
                                    <div className="flex justify-center items-center space-x-2 space-x-reverse">
                                        <button onClick={() => openFormForEdit(expense)} title="تعديل" className="text-yellow-500 hover:text-yellow-700"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => handleDelete(expense.id)} title="حذف" className="text-red-500 hover:text-red-700"><Trash2Icon className="w-5 h-5"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {expenses.length === 0 && (
                     <p className="text-center text-gray-500 py-8">لا توجد مصاريف لعرضها.</p>
                )}
            </div>

            {isFormOpen && <ExpenseForm onClose={() => setIsFormOpen(false)} expenseToEdit={expenseToEdit} />}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText="حذف"
                confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            />
        </div>
    );
};

export default ExpensesPage;