import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { useAppContext } from '../context/AppContext';

interface CustomerFormProps {
  onClose: () => void;
  customerToEdit?: Customer;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ onClose, customerToEdit }) => {
  const { tiers, addCustomer, updateCustomer } = useAppContext();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState(tiers[0]?.duration || 1);
  const [price, setPrice] = useState(tiers[0]?.price || 0);

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name);
      setPhone(customerToEdit.phone);
      setStartDate(new Date(customerToEdit.startDate).toISOString().split('T')[0]);
      setDuration(customerToEdit.duration);
      setPrice(customerToEdit.price);
    } else {
      // Reset to defaults for a new customer form
      setName('');
      setPhone('');
      setStartDate(new Date().toISOString().split('T')[0]);
      const firstTier = tiers[0] || { duration: 1, price: 0 };
      setDuration(firstTier.duration);
      setPrice(firstTier.price);
    }
  }, [customerToEdit, tiers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customerData = { name, phone, startDate, duration: Number(duration), price: Number(price) };
    if (customerToEdit) {
      updateCustomer({ ...customerToEdit, ...customerData });
    } else {
      addCustomer(customerData);
    }
    onClose();
  };
  
  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDuration = Number(e.target.value);
    setDuration(newDuration);
    const selectedTier = tiers.find(t => t.duration === newDuration);
    if (selectedTier) {
      setPrice(selectedTier.price);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">{customerToEdit ? 'تعديل مشترك' : 'إضافة مشترك جديد'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">الاسم</label>
            <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">رقم الهاتف</label>
            <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">تاريخ بداية الاشتراك</label>
            <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700">مدة الاشتراك</label>
            <select id="duration" value={duration} onChange={handleDurationChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              {tiers.map(tier => (
                <option key={tier.duration} value={tier.duration}>
                  {tier.duration} {tier.duration === 1 ? 'شهر' : tier.duration <= 10 ? 'أشهر' : 'شهرًا'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700">سعر الاشتراك (€)</label>
            <input
                type="number"
                id="price"
                value={price}
                onChange={e => setPrice(parseFloat(e.target.value) || 0)}
                required
                min="0"
                step="0.01"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="flex justify-end space-x-2 space-x-reverse pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">إلغاء</button>
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">{customerToEdit ? 'حفظ التعديلات' : 'إضافة مشترك'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;
