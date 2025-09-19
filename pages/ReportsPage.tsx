import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Customer, Expense } from '../types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Bar } from 'recharts';
// Fix: Use default import for jsPDF to allow module augmentation to work correctly.
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { utils, writeFile } from 'xlsx';

// Augment jsPDF module to include autoTable
declare module 'jspdf' {
    interface jsPDF {
        autoTable: (options: any) => jsPDF;
        lastAutoTable: { finalY: number };
    }
}

const ReportsPage: React.FC = () => {
    const { customers, expenses, tiers } = useAppContext();

    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

    const filteredData = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999); // Include the whole end day

        const filteredCustomers = customers.filter(c => {
            const customerDate = new Date(c.startDate);
            return customerDate >= start && customerDate <= end;
        });

        const filteredExpenses = expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate >= start && expenseDate <= end;
        });
        
        return { filteredCustomers, filteredExpenses };
    }, [customers, expenses, startDate, endDate]);

    const { filteredCustomers, filteredExpenses } = filteredData;
    
    const collectedIncome = filteredCustomers.filter(c => (c.paymentStatus || 'paid') === 'paid').reduce((sum, c) => sum + c.price, 0);
    const totalIncome = filteredCustomers.reduce((sum, c) => sum + c.price, 0);
    const unpaidAmount = totalIncome - collectedIncome;
    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = collectedIncome - totalExpenses;

    const financialSummaryData = [
        { name: 'المداخيل المحصلة', value: collectedIncome, fill: '#22c55e' },
        { name: 'المصاريف', value: totalExpenses, fill: '#ef4444' }
    ];

    const subscriberDistribution = useMemo(() => {
        const distribution = tiers.map(tier => ({
            name: `${tier.duration} ${tier.duration === 1 ? 'شهر' : tier.duration <= 10 ? 'أشهر' : 'شهرًا'}`,
            value: customers.filter(c => c.duration === tier.duration).length,
        }));
        return distribution.filter(d => d.value > 0);
    }, [customers, tiers]);
    
    const PIE_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    const exportToPDF = () => {
        const doc = new jsPDF();
        
        // This is a placeholder for a proper Arabic font.
        // For full support, a ttf font file needs to be embedded.
        doc.addFont('https://fonts.gstatic.com/s/tajawal/v9/Iura6YBj_oCad4k1nzSBC45I.woff2', 'Tajawal', 'normal');
        doc.setFont('Tajawal');
        
        doc.setR2L(true);
        doc.text('تقرير المداخيل والمصاريف', 105, 15, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`الفترة من ${startDate} إلى ${endDate}`, 105, 22, { align: 'center' });
        
        doc.autoTable({
            startY: 30,
            head: [['المجموع', 'البند']],
            body: [
                [`${totalIncome.toFixed(2)}€`, 'إجمالي المداخيل'],
                [`${collectedIncome.toFixed(2)}€`, 'المداخيل المحصلة'],
                [`${unpaidAmount.toFixed(2)}€`, 'مبالغ غير مدفوعة'],
                [`${totalExpenses.toFixed(2)}€`, 'إجمالي المصاريف'],
                [`${netProfit.toFixed(2)}€`, 'الربح الصافي'],
            ],
            theme: 'grid',
            styles: { halign: 'right', font: 'Tajawal' },
            headStyles: { fillColor: [22, 163, 74], halign: 'right' }
        });
        
        // Fix: Removed `as any` cast as typings are now correctly applied.
        let lastY = doc.lastAutoTable.finalY || 30;

        if (filteredCustomers.length > 0) {
            doc.setFontSize(12);
            doc.text('المشتركون الجدد في الفترة المحددة', 200, lastY + 10, { align: 'right' });
            doc.autoTable({
                startY: lastY + 15,
                head: [['حالة الدفع', 'السعر', 'المدة (شهر)', 'تاريخ البدء', 'رقم الهاتف', 'الاسم']],
                body: filteredCustomers.map(c => [
                    (c.paymentStatus || 'paid') === 'paid' ? 'تم الدفع' : 'لم يدفع',
                    `${c.price.toFixed(2)}€`,
                    c.duration,
                    new Date(c.startDate).toLocaleDateString('ar-EG', { numberingSystem: 'latn' }),
                    c.phone,
                    c.name
                ]),
                theme: 'striped',
                styles: { halign: 'right', font: 'Tajawal' },
                headStyles: { fillColor: [59, 130, 246], halign: 'right' }
            });
            // Fix: Removed `as any` cast as typings are now correctly applied.
            lastY = doc.lastAutoTable.finalY;
        }

        if (filteredExpenses.length > 0) {
            doc.setFontSize(12);
            doc.text('المصاريف في الفترة المحددة', 200, lastY + 10, { align: 'right' });
             doc.autoTable({
                startY: lastY + 15,
                head: [['المبلغ', 'النوع', 'التاريخ']],
                body: filteredExpenses.map(e => [
                    `${e.amount.toFixed(2)}€`,
                    e.type,
                    new Date(e.date).toLocaleDateString('ar-EG', { numberingSystem: 'latn' }),
                ]),
                theme: 'striped',
                styles: { halign: 'right', font: 'Tajawal' },
                headStyles: { fillColor: [239, 68, 68], halign: 'right' }
            });
        }


        doc.save(`report_${startDate}_${endDate}.pdf`);
    };

    const exportToExcel = () => {
        const summaryData = [
            { البند: 'إجمالي المداخيل', المجموع: `${totalIncome.toFixed(2)}€` },
            { البند: 'المداخيل المحصلة', المجموع: `${collectedIncome.toFixed(2)}€` },
            { البند: 'مبالغ غير مدفوعة', المجموع: `${unpaidAmount.toFixed(2)}€` },
            { البند: 'إجمالي المصاريف', المجموع: `${totalExpenses.toFixed(2)}€` },
            { البند: 'الربح الصافي', المجموع: `${netProfit.toFixed(2)}€` },
        ];
        
        const customerData = filteredCustomers.map(c => ({
            'الاسم': c.name,
            'الهاتف': c.phone,
            'تاريخ البدء': new Date(c.startDate).toLocaleDateString('ar-EG', { numberingSystem: 'latn' }),
            'المدة (أشهر)': c.duration,
            'السعر': c.price,
            'حالة الدفع': (c.paymentStatus || 'paid') === 'paid' ? 'تم الدفع' : 'لم يدفع'
        }));

        const expenseData = filteredExpenses.map(e => ({
            'التاريخ': new Date(e.date).toLocaleDateString('ar-EG', { numberingSystem: 'latn' }),
            'النوع': e.type,
            'المبلغ': e.amount,
            'ملاحظات': e.notes
        }));

        const wb = utils.book_new();
        const summaryWs = utils.json_to_sheet(summaryData);
        const customersWs = utils.json_to_sheet(customerData);
        const expensesWs = utils.json_to_sheet(expenseData);
        
        utils.book_append_sheet(wb, summaryWs, 'الملخص');
        utils.book_append_sheet(wb, customersWs, 'المشتركين الجدد');
        utils.book_append_sheet(wb, expensesWs, 'المصاريف');

        writeFile(wb, `report_${startDate}_${endDate}.xlsx`);
    };

    return (
        <div className="p-6 md:p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">التقارير</h1>
            
            <div className="bg-white p-4 rounded-lg shadow-md mb-6">
                <div className="flex flex-col md:flex-row gap-4 items-center">
                    <div>
                        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">من تاريخ</label>
                        <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 p-2 border border-gray-300 rounded-md" />
                    </div>
                    <div>
                        <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">إلى تاريخ</label>
                        <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 p-2 border border-gray-300 rounded-md" />
                    </div>
                    <div className="flex gap-2 mt-auto">
                        <button onClick={exportToPDF} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">تصدير PDF</button>
                        <button onClick={exportToExcel} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">تصدير Excel</button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-green-100 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-green-800">المداخيل المحصلة</h3>
                    <p className="text-3xl font-bold text-green-900">{collectedIncome.toFixed(2)}€</p>
                </div>
                <div className="bg-red-100 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-red-800">إجمالي المصاريف</h3>
                    <p className="text-3xl font-bold text-red-900">{totalExpenses.toFixed(2)}€</p>
                </div>
                <div className="bg-indigo-100 p-6 rounded-lg shadow">
                    <h3 className="text-lg font-semibold text-indigo-800">الربح الصافي</h3>
                    <p className="text-3xl font-bold text-indigo-900">{netProfit.toFixed(2)}€</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">ملخص الفترة المحددة</h2>
                     {collectedIncome > 0 || totalExpenses > 0 ? (
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <BarChart data={financialSummaryData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" domain={[0, 'dataMax + 100']} />
                                    <YAxis type="category" dataKey="name" width={80} />
                                    <Tooltip formatter={(value) => `${Number(value).toFixed(2)}€`} />
                                    <Bar dataKey="value" barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                     ) : (
                        <p className="text-center text-gray-500 py-8">لا يوجد بيانات لعرض الرسم البياني.</p>
                     )}
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">توزيع المشتركين (الإجمالي)</h2>
                    {subscriberDistribution.length > 0 ? (
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={subscriberDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                                        {subscriberDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name) => [`${value} مشترك`, name]}/>
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-center text-gray-500 py-8">لا يوجد بيانات لعرض الرسم البياني.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ReportsPage;
