import React, { useState, useRef } from 'react';
import { useAppContext } from '../context/AppContext';
import { SubscriptionTier, AppData } from '../types';
import ConfirmationModal from '../components/ConfirmationModal';

const SettingsPage: React.FC = () => {
    const { tiers, setTiers, getAppData, loadAppData, addToast } = useAppContext();
    const [localTiers, setLocalTiers] = useState<SubscriptionTier[]>([...tiers]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);


    const handlePriceChange = (duration: number, price: string) => {
        setLocalTiers(
            localTiers.map(tier =>
                tier.duration === duration ? { ...tier, price: parseFloat(price) || 0 } : tier
            )
        );
    };

    const handleSaveTiers = () => {
        setTiers(localTiers);
        addToast('تم حفظ الأسعار بنجاح!', 'success');
    };

    const handleBackup = () => {
        try {
            const data = getAppData();
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = `subscription_manager_backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            addToast('تم إنشاء النسخة الاحتياطية بنجاح.', 'success');
        } catch(error) {
            addToast('حدث خطأ أثناء إنشاء النسخة الاحتياطية.', 'error');
        }
    };

    const handleRestoreSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setPendingFile(file);
        setIsRestoreConfirmOpen(true);
        // Clear input value so the same file can be selected again if needed
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    
    const handleConfirmRestore = () => {
        if (!pendingFile) return;

        const reader = new FileReader();
        reader.onload = e => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') throw new Error("File could not be read");
                
                const data = JSON.parse(text) as AppData;
                const success = loadAppData(data);
                if (success) {
                    setLocalTiers([...data.tiers]);
                }
            } catch (error) {
                addToast('فشل في استعادة البيانات. الملف غير صالح أو تالف.', 'error');
            }
        };
        reader.readAsText(pendingFile);
        setIsRestoreConfirmOpen(false);
        setPendingFile(null);
    };

    return (
        <div className="p-6 md:p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">الإعدادات</h1>
            
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">تعديل أسعار الاشتراكات</h2>
                <div className="space-y-4">
                    {localTiers.map(tier => (
                         <div key={tier.duration} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                            <label className="w-full sm:w-48 font-medium text-gray-700">
                                اشتراك {tier.duration} {tier.duration === 1 ? 'شهر' : 'أشهر'}
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={tier.price}
                                    onChange={(e) => handlePriceChange(tier.duration, e.target.value)}
                                    className="p-2 border border-gray-300 rounded-md w-32"
                                    aria-label={`Price for ${tier.duration} months`}
                                />
                                <span>€</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="mt-6">
                    <button onClick={handleSaveTiers} className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                        حفظ الأسعار
                    </button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4">إدارة البيانات (يعمل بدون انترنت)</h2>
                <div className="flex flex-col md:flex-row gap-4">
                    <button onClick={handleBackup} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        نسخ احتياطي للبيانات
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleRestoreSelect} accept=".json" className="hidden" id="restore-input" />
                    <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">
                        استعادة البيانات من ملف
                    </button>
                </div>
                <p className="mt-4 text-sm text-gray-500">
                    يمكنك حفظ نسخة من جميع بياناتك (المشتركين، المصاريف، الإعدادات) في ملف JSON على جهازك. يمكنك استخدام هذا الملف لاحقاً لاستعادة بياناتك.
                </p>
            </div>

            <ConfirmationModal
                isOpen={isRestoreConfirmOpen}
                onClose={() => setIsRestoreConfirmOpen(false)}
                onConfirm={handleConfirmRestore}
                title="تأكيد استعادة البيانات"
                message="هل أنت متأكد من رغبتك في استعادة البيانات؟ سيتم الكتابة فوق جميع البيانات الحالية."
                confirmText="استعادة"
                confirmButtonClass="bg-gray-600 hover:bg-gray-700 focus:ring-gray-500"
            />
        </div>
    );
};

export default SettingsPage;