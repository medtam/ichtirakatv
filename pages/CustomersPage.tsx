import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Customer, SubscriptionStatus, PaymentStatus } from '../types';
import CustomerForm from '../components/CustomerForm';
import { PlusCircleIcon, EditIcon, Trash2Icon, RefreshCwIcon, CheckCircleIcon } from '../components/icons';
import ConfirmationModal from '../components/ConfirmationModal';
import { getExpiryDate, getSubscriptionStatus } from '../utils/dateUtils';

type FilterType = 'all' | SubscriptionStatus;

const CustomersPage: React.FC = () => {
    const { customers, deleteCustomer, renewCustomer, markCustomerAsPaid } = useAppContext();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [customerToEdit, setCustomerToEdit] = useState<Customer | undefined>(undefined);
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<FilterType>('all');
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {},
        confirmText: 'تأكيد',
        confirmButtonClass: ''
    });

    const openFormForEdit = (customer: Customer) => {
        setCustomerToEdit(customer);
        setIsFormOpen(true);
    };

    const openFormForAdd = () => {
        setCustomerToEdit(undefined);
        setIsFormOpen(true);
    };
    
    const handleRenew = (id: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'تأكيد التجديد',
            message: 'هل أنت متأكد من رغبتك في تجديد هذا الاشتراك؟ سيتم تمديد الاشتراك وتحديث حالة الدفع إلى "لم يدفع".',
            onConfirm: () => {
                renewCustomer(id);
                setConfirmModal({ ...confirmModal, isOpen: false });
            },
            confirmText: 'تجديد',
            confirmButtonClass: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
        });
    };

    const handleDelete = (id: string) => {
         setConfirmModal({
            isOpen: true,
            title: 'تأكيد الحذف',
            message: 'هل أنت متأكد من رغبتك في حذف هذا المشترك؟ لا يمكن التراجع عن هذا الإجراء.',
            onConfirm: () => {
                deleteCustomer(id);
                setConfirmModal({ ...confirmModal, isOpen: false });
            },
            confirmText: 'حذف',
            confirmButtonClass: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        });
    };
    
    const handleMarkAsPaid = (id: string) => {
        markCustomerAsPaid(id);
    };

    const filteredCustomers = useMemo(() => {
        return customers
            .map(c => ({...c, status: getSubscriptionStatus(c)}))
            .filter(c => {
                const searchMatch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm);
                const filterMatch = filter === 'all' || c.status === filter;
                return searchMatch && filterMatch;
            })
            .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    }, [customers, searchTerm, filter]);

    const subStatusConfig: Record<SubscriptionStatus, { text: string, className: string, rowClassName: string }> = {
        active: { text: 'نشط', className: 'bg-green-100 text-green-800', rowClassName: 'bg-white' },
        expiringSoon: { text: 'ينتهي قريباً', className: 'bg-yellow-100 text-yellow-800', rowClassName: 'bg-yellow-50' },
        expired: { text: 'منتهي', className: 'bg-red-100 text-red-800', rowClassName: 'bg-red-50' }
    };

    const paymentStatusConfig: Record<PaymentStatus, { text: string, className: string }> = {
        paid: { text: 'تم الدفع', className: 'bg-green-100 text-green-800' },
        unpaid: { text: 'لم يدفع', className: 'bg-orange-100 text-orange-800' }
    };

    return (
        <div className="p-6 md:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">إدارة المشتركين</h1>
                <button onClick={openFormForAdd} className="flex items-center justify-center sm:justify-start bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition-colors">
                    <PlusCircleIcon className="h-5 w-5 ms-2" />
                    <span className="mr-2">إضافة مشترك جديد</span>
                </button>
            </div>

            <div className="mb-4 bg-white p-4 rounded-md shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="ابحث بالاسم أو رقم الهاتف..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:w-1/3 p-2 border border-gray-300 rounded-md"
                    />
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">تصفية حسب:</span>
                        <div className="flex gap-1 p-1 bg-gray-200 rounded-md">
                            {(['all', 'active', 'expiringSoon', 'expired'] as FilterType[]).map(f => (
                                <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 text-sm rounded-md transition-colors ${filter === f ? 'bg-indigo-600 text-white shadow' : 'bg-transparent text-gray-600 hover:bg-gray-300'}`}>
                                    { {all: 'الكل', active: 'نشط', expiringSoon: 'قريب الانتهاء', expired: 'منتهي'}[f] }
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-md overflow-x-auto">
                <table className="w-full min-w-max text-right">
                    <thead className="bg-gray-50 border-b-2 border-gray-200">
                        <tr>
                            <th className="p-3 text-sm font-semibold tracking-wide">الاسم</th>
                            <th className="p-3 text-sm font-semibold tracking-wide">رقم الهاتف</th>
                            <th className="p-3 text-sm font-semibold tracking-wide">تاريخ البدء</th>
                            <th className="p-3 text-sm font-semibold tracking-wide">تاريخ الانتهاء</th>
                            <th className="p-3 text-sm font-semibold tracking-wide">حالة الاشتراك</th>
                            <th className="p-3 text-sm font-semibold tracking-wide">حالة الدفع</th>
                            <th className="p-3 text-sm font-semibold tracking-wide">السعر</th>
                            <th className="p-3 text-sm font-semibold tracking-wide text-center">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {filteredCustomers.map(customer => {
                            const expiryDate = getExpiryDate(customer.startDate, customer.duration);
                            const subStatusInfo = subStatusConfig[customer.status];
                            const paymentStatus = customer.paymentStatus || 'paid';
                            const paymentStatusInfo = paymentStatusConfig[paymentStatus];

                            return (
                                <tr key={customer.id} className={`${subStatusInfo.rowClassName} hover:bg-opacity-50`}>
                                    <td className="p-3 text-sm text-gray-700">{customer.name}</td>
                                    <td className="p-3 text-sm text-gray-700">{customer.phone}</td>
                                    <td className="p-3 text-sm text-gray-700">{new Date(customer.startDate).toLocaleDateString('ar-EG', { numberingSystem: 'latn' })}</td>
                                    <td className="p-3 text-sm text-gray-700">{expiryDate.toLocaleDateString('ar-EG', { numberingSystem: 'latn' })}</td>
                                    <td className="p-3 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${subStatusInfo.className}`}>
                                            {subStatusInfo.text}
                                        </span>
                                    </td>
                                    <td className="p-3 text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${paymentStatusInfo.className}`}>
                                            {paymentStatusInfo.text}
                                        </span>
                                    </td>
                                    <td className="p-3 text-sm text-gray-700">{customer.price}€</td>
                                    <td className="p-3 text-center">
                                        <div className="flex justify-center items-center space-x-2 space-x-reverse">
                                            {paymentStatus === 'unpaid' && (
                                                <button onClick={() => handleMarkAsPaid(customer.id)} title="تسجيل دفعة" className="text-green-500 hover:text-green-700">
                                                    <CheckCircleIcon className="w-5 h-5"/>
                                                </button>
                                            )}
                                            <button onClick={() => handleRenew(customer.id)} title="تجديد" className="text-blue-500 hover:text-blue-700"><RefreshCwIcon className="w-5 h-5"/></button>
                                            <button onClick={() => openFormForEdit(customer)} title="تعديل" className="text-yellow-500 hover:text-yellow-700"><EditIcon className="w-5 h-5"/></button>
                                            <button onClick={() => handleDelete(customer.id)} title="حذف" className="text-red-500 hover:text-red-700"><Trash2Icon className="w-5 h-5"/></button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredCustomers.length === 0 && (
                     <p className="text-center text-gray-500 py-8">
                        {searchTerm || filter !== 'all' ? 'لا توجد نتائج تطابق بحثك أو التصفية.' : 'لا يوجد مشتركين لعرضهم.'}
                    </p>
                )}
            </div>

            {isFormOpen && <CustomerForm onClose={() => setIsFormOpen(false)} customerToEdit={customerToEdit} />}
            <ConfirmationModal 
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                confirmButtonClass={confirmModal.confirmButtonClass}
            />
        </div>
    );
};

export default CustomersPage;
