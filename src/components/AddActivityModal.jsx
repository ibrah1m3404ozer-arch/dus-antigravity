import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar } from 'lucide-react';
import { saveActivity } from '../utils/db';
import { MAIN_CATEGORIES, getSubcategories } from '../constants/categories';

function AddActivityModal({ onClose, onSave, selectedDate }) {
    const [formData, setFormData] = useState({
        mainCategory: 'dus',
        subcategory: '',
        startTime: '',
        endTime: '',
        notes: ''
    });

    const [toast, setToast] = useState({ show: false, message: '' });

    // Initialize subcategory when component mounts
    useEffect(() => {
        const subcats = getSubcategories('dus');
        if (subcats.length > 0) {
            setFormData(prev => ({ ...prev, subcategory: subcats[0] }));
        }
    }, []);

    const handleMainCategoryChange = (newCategory) => {
        const subcats = getSubcategories(newCategory);
        setFormData({
            ...formData,
            mainCategory: newCategory,
            subcategory: subcats[0] || ''
        });
    };

    const calculateDuration = () => {
        if (!formData.startTime || !formData.endTime) return 0;

        const start = new Date(`${selectedDate.toISOString().split('T')[0]}T${formData.startTime}`);
        const end = new Date(`${selectedDate.toISOString().split('T')[0]}T${formData.endTime}`);

        const diffMs = end - start;
        const diffMins = Math.floor(diffMs / 60000);

        return diffMins > 0 ? diffMins : 0;
    };

    const formatDurationDisplay = (minutes) => {
        if (minutes === 0) return '0 dakika';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours === 0) return `${mins} dakika`;
        if (mins === 0) return `${hours} saat`;
        return `${hours} saat ${mins} dakika`;
    };

    const handleSave = async () => {
        // Validation
        if (!formData.startTime || !formData.endTime) {
            setToast({ show: true, message: '⚠️ Başlangıç ve bitiş saati gerekli!' });
            setTimeout(() => setToast({ show: false, message: '' }), 3000);
            return;
        }

        const duration = calculateDuration();
        if (duration <= 0) {
            setToast({ show: true, message: '⚠️ Bitiş saati başlangıç saatinden sonra olmalı!' });
            setTimeout(() => setToast({ show: false, message: '' }), 3000);
            return;
        }

        if (duration > 1440) { // 24 hours
            setToast({ show: true, message: '⚠️ Aktivite 24 saatten uzun olamaz!' });
            setTimeout(() => setToast({ show: false, message: '' }), 3000);
            return;
        }

        const newActivity = {
            id: Date.now().toString(),
            mainCategory: formData.mainCategory,
            subcategory: formData.subcategory,
            type: 'manual',
            startTime: new Date(`${selectedDate.toISOString().split('T')[0]}T${formData.startTime}`).toISOString(),
            endTime: new Date(`${selectedDate.toISOString().split('T')[0]}T${formData.endTime}`).toISOString(),
            duration: duration,
            notes: formData.notes.trim(),
            createdAt: new Date().toISOString()
        };

        await saveActivity(newActivity);
        onSave();
    };

    const duration = calculateDuration();
    const subcategories = getSubcategories(formData.mainCategory);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-card w-full max-w-lg rounded-2xl p-4 shadow-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                        <Calendar className="text-indigo-500" size={24} />
                        Aktivite Ekle
                    </h3>
                    <button onClick={onClose} className="p-1 hover:bg-secondary rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-3 overflow-y-auto flex-1 pr-2">
                    {/* Date Display */}
                    <div className="bg-indigo-500/10 rounded-lg p-2 text-center">
                        <p className="text-xs text-muted-foreground">Tarih</p>
                        <p className="text-sm font-bold">
                            {selectedDate.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>

                    {/* Main Category */}
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Ana Kategori</label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.keys(MAIN_CATEGORIES).map(catKey => {
                                const category = MAIN_CATEGORIES[catKey];
                                return (
                                    <button
                                        key={catKey}
                                        onClick={() => handleMainCategoryChange(catKey)}
                                        className={`p-2 rounded-lg border-2 transition-all flex items-center gap-2 ${formData.mainCategory === catKey
                                            ? `${category.bgColor} border-transparent text-white`
                                            : 'border-border hover:border-primary/50'
                                            }`}
                                    >
                                        <span className="text-lg">{category.icon}</span>
                                        <span className="font-medium text-xs">{category.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Subcategory */}
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Alt Kategori</label>
                        <select
                            value={formData.subcategory}
                            onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                            className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {subcategories.map(subcat => (
                                <option key={subcat} value={subcat}>{subcat}</option>
                            ))}
                        </select>
                    </div>

                    {/* Time Range */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-medium mb-1.5">Başlangıç Saati</label>
                            <input
                                type="time"
                                value={formData.startTime}
                                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium mb-1.5">Bitiş Saati</label>
                            <input
                                type="time"
                                value={formData.endTime}
                                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Duration Display */}
                    {duration > 0 && (
                        <div className="bg-secondary/50 rounded-lg p-2 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Clock className="text-indigo-500" size={16} />
                                <span className="text-xs font-medium">Süre:</span>
                            </div>
                            <span className="text-sm font-bold text-indigo-500">{formatDurationDisplay(duration)}</span>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-xs font-medium mb-1.5">Notlar (opsiyonel)</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Aktivite hakkında notlarınız..."
                            rows={2}
                            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                    </div>
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-lg font-bold"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex-1 py-2 text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-bold"
                    >
                        Kaydet
                    </button>
                </div>

                {/* Toast */}
                {toast.show && (
                    <div className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg animate-in fade-in">
                        {toast.message}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AddActivityModal;
