
import React, { useState, useEffect } from 'react';
import { Expense } from '../types';
import { useAppContext } from '../context/AppContext';

interface ExpenseFormProps {
  onClose: () => void;
  expenseToEdit?: Expense;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onClose, expenseToEdit }) => {
  const { addExpense, updateExpense } = useAppContext();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [type, setType] = useState('شراء خدمة');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (expenseToEdit) {
      setDate(new Date(expenseToEdit.date).toISOString().split('T')[0]);
      setType(expenseToEdit.type);
      setAmount(String(expenseToEdit.amount));
      setNotes(expenseToEdit.notes);
    }
  }, [expenseToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (expenseToEdit) {
      updateExpense({ ...expenseToEdit, date, type, amount: parseFloat(amount), notes });
    } else {
      addExpense({ date, type, amount: parseFloat(amount), notes });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">{expenseToEdit ? 'تعديل مصروف' : 'إضافة مصروف جديد'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">التاريخ</label>
            <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700">نوع المصروف</label>
            <select id="type" value={type} onChange={e => setType(e.target.value)} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                <option>شراء خدمة</option>
                <option>معدات</option>
                <option>أجهزة</option>
                <option>أخرى</option>
            </select>
          </div>
           <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">المبلغ (€)</label>
            <input type="number" id="amount" value={amount} onChange={e => setAmount(e.target.value)} required min="0" step="0.01" className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">ملاحظات</label>
            <textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <div className="flex justify-end space-x-2 space-x-reverse pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">إلغاء</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">{expenseToEdit ? 'حفظ التعديلات' : 'إضافة مصروف'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;