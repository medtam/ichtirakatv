import React from 'react';
import { useAppContext } from '../context/AppContext';
import { UsersIcon, WalletIcon, BarChartIcon } from '../components/icons';
import { getExpiryDate, getSubscriptionStatus } from '../utils/dateUtils';

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
    <div className="bg-white rounded-lg shadow-md p-6 flex items-center">
        <div className={`p-3 rounded-full ${color}`}>
            {icon}
        </div>
        <div className="mr-4">
            <p className="text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-800">{value}</p>
        </div>
    </div>
);

const DashboardPage: React.FC = () => {
    const { customers, expenses, expiringSoonCount } = useAppContext();

    const totalIncome = customers.reduce((sum, c) => sum + c.price, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalIncome - totalExpenses;

    const expiringSoonCustomers = customers.filter(c => getSubscriptionStatus(c) === 'expiringSoon');

    return (
        <div className="p-6 md:p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">لوحة التحكم</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="إجمالي المشتركين" 
                    value={customers.length} 
                    icon={<UsersIcon className="h-6 w-6 text-white"/>}
                    color="bg-blue-500"
                />
                <StatCard 
                    title="ينتهي اشتراكهم قريباً" 
                    value={expiringSoonCount} 
                    icon={<UsersIcon className="h-6 w-6 text-white"/>}
                    color="bg-yellow-500"
                />
                <StatCard 
                    title="إجمالي المداخيل" 
                    value={`${totalIncome.toFixed(2)}€`}
                    icon={<WalletIcon className="h-6 w-6 text-white"/>}
                    color="bg-green-500"
                />
                 <StatCard 
                    title="الربح الصافي" 
                    value={`${netProfit.toFixed(2)}€`}
                    icon={<BarChartIcon className="h-6 w-6 text-white"/>}
                    color="bg-indigo-500"
                />
            </div>
            
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">المشتركون الذين ينتهي اشتراكهم قريباً (خلال 7 أيام)</h2>
                {expiringSoonCustomers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-3 text-sm font-semibold tracking-wide">الاسم</th>
                                    <th className="p-3 text-sm font-semibold tracking-wide">رقم الهاتف</th>
                                    <th className="p-3 text-sm font-semibold tracking-wide">تاريخ الانتهاء</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expiringSoonCustomers.map(c => (
                                    <tr key={c.id} className="border-b border-gray-200">
                                        <td className="p-3">{c.name}</td>
                                        <td className="p-3">{c.phone}</td>
                                        <td className="p-3">{getExpiryDate(c.startDate, c.duration).toLocaleDateString('ar-EG', { numberingSystem: 'latn' })}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-center text-gray-500 py-4">لا يوجد مشتركين ينتهي اشتراكهم خلال 7 أيام.</p>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;