import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, X, Trash2, Eye, EyeOff, Shuffle, Filter } from 'lucide-react';
import { getMistakes, saveMistake, deleteMistake } from '../utils/db';

// 14 DUS Subjects with colors
const SUBJECTS = [
    { key: 'protetik', label: 'Protetik', color: 'bg-blue-500' },
    { key: 'cerrahi', label: 'Cerrahi', color: 'bg-red-500' },
    { key: 'periodontoloji', label: 'Periodontoloji', color: 'bg-green-500' },
    { key: 'endodonti', label: 'Endodonti', color: 'bg-yellow-500' },
    { key: 'ortodonti', label: 'Ortodonti', color: 'bg-purple-500' },
    { key: 'radyoloji', label: 'Radyoloji', color: 'bg-pink-500' },
    { key: 'restoratif', label: 'Restoratif', color: 'bg-indigo-500' },
    { key: 'pedodonti', label: 'Pedodonti', color: 'bg-cyan-500' },
    { key: 'patoloji', label: 'Patoloji', color: 'bg-orange-500' },
    { key: 'anatomi', label: 'Anatomi', color: 'bg-teal-500' },
    { key: 'biyokimya', label: 'Biyokimya', color: 'bg-lime-500' },
    { key: 'mikrobiyoloji', label: 'Mikrobiyoloji', color: 'bg-emerald-500' },
    { key: 'farmakoloji', label: 'Farmakoloji', color: 'bg-violet-500' },
    { key: 'fizyoloji', label: 'Fizyoloji', color: 'bg-rose-500' }
];

// 4 Error Types
const ERROR_TYPES = [
    { key: 'knowledge', label: 'Bilgi Eksikliği', icon: '📚', color: 'bg-red-500' },
    { key: 'attention', label: 'Dikkat Hatası', icon: '👁️', color: 'bg-yellow-500' },
    { key: 'interpretation', label: 'Yorum Hatası', icon: '🤔', color: 'bg-blue-500' },
    { key: 'time', label: 'Süre Yetmedi', icon: '⏱️', color: 'bg-purple-500' }
];

function MistakeBox() {
    const [mistakes, setMistakes] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showReviewMode, setShowReviewMode] = useState(false);
    const [selectedMistake, setSelectedMistake] = useState(null);
    const [currentReview, setCurrentReview] = useState(null);
    const [reviewAnswerVisible, setReviewAnswerVisible] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '' });

    // Filters
    const [subjectFilter, setSubjectFilter] = useState('all');
    const [errorTypeFilter, setErrorTypeFilter] = useState('all');

    // Form data
    const [formData, setFormData] = useState({
        imageData: '',
        subject: 'protetik',
        errorType: 'knowledge',
        notes: ''
    });

    useEffect(() => {
        loadMistakes();
    }, []);

    const loadMistakes = async () => {
        const allMistakes = await getMistakes();
        setMistakes(allMistakes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setFormData({ ...formData, imageData: reader.result });
        };
        reader.readAsDataURL(file);
    };

    const handleSaveMistake = async () => {
        if (!formData.imageData) {
            setToast({ show: true, message: '⚠️ Lütfen bir görsel yükleyin!' });
            setTimeout(() => setToast({ show: false, message: '' }), 3000);
            return;
        }

        const newMistake = {
            id: Date.now().toString(),
            imageData: formData.imageData,
            subject: formData.subject,
            errorType: formData.errorType,
            notes: formData.notes.trim(),
            createdAt: new Date().toISOString()
        };

        await saveMistake(newMistake);
        await loadMistakes();

        setFormData({ imageData: '', subject: 'protetik', errorType: 'knowledge', notes: '' });
        setShowAddModal(false);

        setToast({ show: true, message: '✓ Hata başarıyla kaydedildi!' });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const handleDeleteMistake = async (id) => {
        if (window.confirm('Bu hatayı silmek istediğinize emin misiniz?')) {
            await deleteMistake(id);
            await loadMistakes();
            setShowDetailModal(false);
            setToast({ show: true, message: 'Hata silindi' });
            setTimeout(() => setToast({ show: false, message: '' }), 3000);
        }
    };

    const handleCardClick = (mistake) => {
        setSelectedMistake(mistake);
        setShowDetailModal(true);
    };

    const handleRandomReview = () => {
        if (mistakes.length === 0) {
            setToast({ show: true, message: '⚠️ Henüz hata eklenmedi!' });
            setTimeout(() => setToast({ show: false, message: '' }), 3000);
            return;
        }

        const randomIndex = Math.floor(Math.random() * mistakes.length);
        setCurrentReview(mistakes[randomIndex]);
        setReviewAnswerVisible(false);
        setShowReviewMode(true);
    };

    const handleNextReview = () => {
        if (mistakes.length === 0) return;
        const randomIndex = Math.floor(Math.random() * mistakes.length);
        setCurrentReview(mistakes[randomIndex]);
        setReviewAnswerVisible(false);
    };

    // Filtered mistakes
    const filteredMistakes = mistakes.filter(m => {
        if (subjectFilter !== 'all' && m.subject !== subjectFilter) return false;
        if (errorTypeFilter !== 'all' && m.errorType !== errorTypeFilter) return false;
        return true;
    });

    const getSubjectLabel = (key) => SUBJECTS.find(s => s.key === key)?.label || key;
    const getSubjectColor = (key) => SUBJECTS.find(s => s.key === key)?.color || 'bg-gray-500';
    const getErrorTypeLabel = (key) => ERROR_TYPES.find(e => e.key === key)?.label || key;
    const getErrorTypeIcon = (key) => ERROR_TYPES.find(e => e.key === key)?.icon || '❓';
    const getErrorTypeColor = (key) => ERROR_TYPES.find(e => e.key === key)?.color || 'bg-gray-500';

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">
                        Hata Defteri
                    </h2>
                    <p className="text-muted-foreground mt-1">Yanlışlarınızdan öğrenin, tekrar etmeyin</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleRandomReview}
                        className="flex items-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg transition-all"
                    >
                        <Shuffle size={20} />
                        Rastgele Hatamı Sor
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl font-bold shadow-lg transition-all"
                    >
                        <Plus size={20} />
                        Yeni Hata Ekle
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Filtreler:</span>
                </div>

                {/* Subject Filters */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setSubjectFilter('all')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${subjectFilter === 'all'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary hover:bg-secondary/80'
                            }`}
                    >
                        Tüm Dersler
                    </button>
                    {SUBJECTS.map(subject => (
                        <button
                            key={subject.key}
                            onClick={() => setSubjectFilter(subject.key)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${subjectFilter === subject.key
                                ? `${subject.color} text-white`
                                : 'bg-secondary/50 hover:bg-secondary'
                                }`}
                        >
                            {subject.label}
                        </button>
                    ))}
                </div>

                {/* Error Type Filters */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setErrorTypeFilter('all')}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${errorTypeFilter === 'all'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary hover:bg-secondary/80'
                            }`}
                    >
                        Tüm Hata Tipleri
                    </button>
                    {ERROR_TYPES.map(errorType => (
                        <button
                            key={errorType.key}
                            onClick={() => setErrorTypeFilter(errorType.key)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${errorTypeFilter === errorType.key
                                ? `${errorType.color} text-white`
                                : 'bg-secondary/50 hover:bg-secondary'
                                }`}
                        >
                            <span>{errorType.icon}</span>
                            {errorType.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-2xl font-bold">{mistakes.length}</p>
                    <p className="text-sm text-muted-foreground">Toplam Hata</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-2xl font-bold">{filteredMistakes.length}</p>
                    <p className="text-sm text-muted-foreground">Filtrelenmiş</p>
                </div>
                <div className="bg-card border border-border rounded-xl p-4">
                    <p className="text-2xl font-bold">{new Set(mistakes.map(m => m.subject)).size}</p>
                    <p className="text-sm text-muted-foreground">Farklı Ders</p>
                </div>
            </div>

            {/* Masonry Gallery */}
            {filteredMistakes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredMistakes.map(mistake => (
                        <div
                            key={mistake.id}
                            onClick={() => handleCardClick(mistake)}
                            className="bg-card border border-border rounded-xl overflow-hidden cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg group"
                        >
                            <div className="relative">
                                <img
                                    src={mistake.imageData}
                                    alt="Question"
                                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <span className={`${getSubjectColor(mistake.subject)} text-white text-xs px-2 py-1 rounded-full font-medium`}>
                                        {getSubjectLabel(mistake.subject)}
                                    </span>
                                </div>
                            </div>
                            <div className="p-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`${getErrorTypeColor(mistake.errorType)} text-white text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1`}>
                                        <span>{getErrorTypeIcon(mistake.errorType)}</span>
                                        {getErrorTypeLabel(mistake.errorType)}
                                    </span>
                                </div>
                                {mistake.notes && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">{mistake.notes}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-2">
                                    {new Date(mistake.createdAt).toLocaleDateString('tr-TR')}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-card border border-border rounded-3xl p-12 text-center">
                    <AlertCircle size={64} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                    <p className="text-lg font-medium text-muted-foreground">
                        {mistakes.length === 0 ? 'Henüz hata eklenmedi' : 'Filtre ile eşleşen hata bulunamadı'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                        {mistakes.length === 0 ? 'Yanlış sorularınızı ekleyerek başlayın' : 'Farklı filtreler deneyin'}
                    </p>
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowAddModal(false)}>
                    <div className="bg-card w-full max-w-xl rounded-2xl p-4 shadow-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Plus className="text-red-500" size={24} />
                                Yeni Hata Ekle
                            </h3>
                            <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-secondary rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-3 overflow-y-auto flex-1">
                            {/* Image Upload */}
                            <div>
                                <label className="block text-xs font-medium mb-1">Soru Görseli *</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                                {formData.imageData && (
                                    <div className="mt-2">
                                        <img src={formData.imageData} alt="Preview" className="w-full max-h-48 object-contain rounded-lg border border-border" />
                                    </div>
                                )}
                            </div>

                            {/* Subject and Error Type in one row */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-xs font-medium mb-1">Ders</label>
                                    <select
                                        value={formData.subject}
                                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                        className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        {SUBJECTS.map(subject => (
                                            <option key={subject.key} value={subject.key}>{subject.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-medium mb-1">Hata Sebebi</label>
                                    <select
                                        value={formData.errorType}
                                        onChange={(e) => setFormData({ ...formData, errorType: e.target.value })}
                                        className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                                    >
                                        {ERROR_TYPES.map(errorType => (
                                            <option key={errorType.key} value={errorType.key}>
                                                {errorType.icon} {errorType.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="block text-xs font-medium mb-1">Notlar (opsiyonel)</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Açıklamalarınızı buraya yazın..."
                                    rows={3}
                                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-lg font-bold"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleSaveMistake}
                                className="flex-1 py-2 text-sm bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-lg font-bold"
                            >
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {showDetailModal && selectedMistake && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowDetailModal(false)}>
                    <div className="bg-card w-full max-w-3xl rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <span className={`${getSubjectColor(selectedMistake.subject)} text-white px-3 py-1.5 rounded-full font-medium`}>
                                    {getSubjectLabel(selectedMistake.subject)}
                                </span>
                                <span className={`${getErrorTypeColor(selectedMistake.errorType)} text-white px-3 py-1.5 rounded-full font-medium flex items-center gap-1`}>
                                    <span>{getErrorTypeIcon(selectedMistake.errorType)}</span>
                                    {getErrorTypeLabel(selectedMistake.errorType)}
                                </span>
                            </div>
                            <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-secondary rounded-full">
                                <X size={24} />
                            </button>
                        </div>

                        <img src={selectedMistake.imageData} alt="Question" className="w-full rounded-lg border border-border mb-4" />

                        {selectedMistake.notes && (
                            <div className="bg-secondary/30 rounded-xl p-4 mb-4">
                                <h4 className="font-semibold mb-2">Notlar:</h4>
                                <p className="text-sm whitespace-pre-wrap">{selectedMistake.notes}</p>
                            </div>
                        )}

                        <p className="text-sm text-muted-foreground mb-4">
                            Tarih: {new Date(selectedMistake.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => handleDeleteMistake(selectedMistake.id)}
                                className="flex-1 py-3 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                                <Trash2 size={18} />
                                Sil
                            </button>
                            <button
                                onClick={() => setShowDetailModal(false)}
                                className="flex-1 py-3 bg-secondary hover:bg-secondary/80 rounded-xl font-bold"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Review Mode Modal */}
            {showReviewMode && currentReview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowReviewMode(false)}>
                    <div className="bg-card w-full max-w-3xl rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold flex items-center gap-2">
                                <Shuffle className="text-purple-500" size={28} />
                                Hatırla Bakalım!
                            </h3>
                            <button onClick={() => setShowReviewMode(false)} className="p-2 hover:bg-secondary rounded-full">
                                <X size={24} />
                            </button>
                        </div>

                        <img src={currentReview.imageData} alt="Question" className="w-full rounded-lg border border-border mb-4" />

                        {!reviewAnswerVisible ? (
                            <button
                                onClick={() => setReviewAnswerVisible(true)}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                            >
                                <Eye size={20} />
                                Cevabı Göster
                            </button>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <span className={`${getSubjectColor(currentReview.subject)} text-white px-3 py-1.5 rounded-full font-medium`}>
                                        {getSubjectLabel(currentReview.subject)}
                                    </span>
                                    <span className={`${getErrorTypeColor(currentReview.errorType)} text-white px-3 py-1.5 rounded-full font-medium flex items-center gap-1`}>
                                        <span>{getErrorTypeIcon(currentReview.errorType)}</span>
                                        {getErrorTypeLabel(currentReview.errorType)}
                                    </span>
                                </div>

                                {currentReview.notes && (
                                    <div className="bg-secondary/30 rounded-xl p-4">
                                        <h4 className="font-semibold mb-2">Notlar:</h4>
                                        <p className="text-sm whitespace-pre-wrap">{currentReview.notes}</p>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleNextReview}
                                        className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-bold flex items-center justify-center gap-2"
                                    >
                                        <Shuffle size={18} />
                                        Başka Hata
                                    </button>
                                    <button
                                        onClick={() => setShowReviewMode(false)}
                                        className="flex-1 py-3 bg-secondary hover:bg-secondary/80 rounded-xl font-bold"
                                    >
                                        Kapat
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast.show && (
                <div className="fixed bottom-24 right-8 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300 z-50">
                    <span className="font-medium">{toast.message}</span>
                </div>
            )}
        </div>
    );
}

export default MistakeBox;
