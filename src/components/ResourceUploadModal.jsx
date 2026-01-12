import React, { useState } from 'react';
import { X, Upload, File, Music, Video, FileText, AlertCircle } from 'lucide-react';

function ResourceUploadModal({ isOpen, onClose, onSave, folders, defaultCategory }) {
    const [currentTab, setCurrentTab] = useState(0); // 0=Temel, 1=Medya, 2=Notlar

    // Form State
    const [pdfFile, setPdfFile] = useState(null);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState(defaultCategory || 'Finans');
    const [audioFile, setAudioFile] = useState(null);
    const [videoFile, setVideoFile] = useState(null);
    const [manualSummary, setManualSummary] = useState('');
    const [error, setError] = useState(null);

    const categories = ['Finans', 'Ekonomi', 'Borsa', 'Kripto', 'Altın', 'Döviz', 'Rapor', 'Diğer'];

    const tabs = [
        { id: 0, label: '📄 Temel Bilgiler', icon: FileText },
        { id: 1, label: '🎬 Medya', icon: Video },
        { id: 2, label: '📝 Notlar', icon: FileText }
    ];

    const handlePDFChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 50 * 1024 * 1024) {
                setError('PDF dosyası çok büyük! Maksimum 50MB.');
                return;
            }
            setError(null);
            setPdfFile(file);
            if (!title) setTitle(file.name.replace('.pdf', ''));
        }
    };

    const handleAudioChange = (e) => {
        const file = e.target.files[0];
        if (file && file.size > 100 * 1024 * 1024) {
            setError('Ses dosyası çok büyük! Maksimum 100MB.');
            return;
        }
        setAudioFile(file);
    };

    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (file && file.size > 500 * 1024 * 1024) {
            setError('Video dosyası çok büyük! Maksimum 500MB.');
            return;
        }
        setVideoFile(file);
    };

    const handleSubmit = () => {
        if (!pdfFile) {
            setError('Lütfen bir PDF dosyası seçin.');
            return;
        }

        const finalTitle = title.trim() || pdfFile.name.replace('.pdf', '');

        onSave({
            pdfFile,
            title: finalTitle,
            category,
            audioFile,
            videoFile,
            manualSummary
        });

        resetForm();
    };

    const resetForm = () => {
        setPdfFile(null);
        setTitle('');
        setCategory(defaultCategory || 'Finans');
        setAudioFile(null);
        setVideoFile(null);
        setManualSummary('');
        setCurrentTab(0);
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        const mb = bytes / (1024 * 1024);
        return `${mb.toFixed(2)} MB`;
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl relative">

                {/* Custom Overlay Alert */}
                {error && (
                    <div className="absolute top-4 left-4 right-4 bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-xl flex items-center gap-2 animate-in slide-in-from-top-2 z-10">
                        <AlertCircle size={20} />
                        <span className="text-sm font-bold">{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto hover:bg-red-500/10 p-1 rounded-lg"><X size={16} /></button>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-2xl font-bold">Yeni Kaynak Ekle</h2>
                    <button onClick={handleClose} className="p-2 hover:bg-muted rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setCurrentTab(tab.id)}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${currentTab === tab.id
                                ? 'border-b-2 border-primary text-primary'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Tab 0 */}
                    {currentTab === 0 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">PDF Dosyası <span className="text-red-500">*</span></label>
                                <input type="file" accept=".pdf" onChange={handlePDFChange} className="hidden" id="pdf-upload" />
                                <label htmlFor="pdf-upload" className="flex items-center gap-2 px-4 py-4 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-secondary/50 transition-all group">
                                    <div className="p-2 bg-secondary rounded-lg group-hover:bg-primary/20 transition-colors">
                                        <Upload size={24} className="group-hover:text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        {pdfFile ? (
                                            <p className="font-bold text-sm text-white">{pdfFile.name} <span className="font-normal text-muted-foreground ml-2">{formatFileSize(pdfFile.size)}</span></p>
                                        ) : (
                                            <p className="text-sm text-muted-foreground font-medium">PDF dosyanı buraya sürükle veya seç</p>
                                        )}
                                    </div>
                                </label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground mb-2 ml-1">KATEGORİ</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-4 py-3 bg-secondary border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none appearance-none font-bold"
                                    >
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-muted-foreground mb-2 ml-1">BAŞLIK (Opsiyonel)</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder={pdfFile ? pdfFile.name.replace('.pdf', '') : "Dosya adını kullan"}
                                        className="w-full px-4 py-3 bg-secondary border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none placeholder:font-normal font-bold"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tab 1: Medya */}
                    {currentTab === 1 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">🎧 Ses Dosyası</label>
                                <input type="file" accept=".mp3,.m4a" onChange={handleAudioChange} className="hidden" id="audio-upload" />
                                <label htmlFor="audio-upload" className="flex items-center gap-2 px-4 py-3 border border-border rounded-xl cursor-pointer hover:bg-secondary/50 transition-colors">
                                    <Music size={20} />
                                    {audioFile ? <span className="text-sm">{audioFile.name}</span> : <span className="text-sm text-muted-foreground">Ses dosyası ekle (Podcast vb.)</span>}
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">📹 Video Dosyası</label>
                                <input type="file" accept=".mp4" onChange={handleVideoChange} className="hidden" id="video-upload" />
                                <label htmlFor="video-upload" className="flex items-center gap-2 px-4 py-3 border border-border rounded-xl cursor-pointer hover:bg-secondary/50 transition-colors">
                                    <Video size={20} />
                                    {videoFile ? <span className="text-sm">{videoFile.name}</span> : <span className="text-sm text-muted-foreground">Video dosyası ekle</span>}
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Tab 2: Notlar */}
                    {currentTab === 2 && (
                        <div className="space-y-4">
                            <label className="block text-sm font-medium mb-2">📝 Manuel Notlar</label>
                            <textarea
                                value={manualSummary}
                                onChange={(e) => setManualSummary(e.target.value)}
                                placeholder="Ek notlarını buraya alabilirsin..."
                                rows={8}
                                className="w-full px-4 py-3 bg-secondary border border-border rounded-xl focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-border bg-muted/20">
                    <div className="flex gap-2 w-full">
                        {currentTab > 0 && (
                            <button onClick={() => setCurrentTab(currentTab - 1)} className="px-6 py-3 bg-secondary hover:bg-secondary/80 rounded-xl font-bold transition-colors">Geri</button>
                        )}
                        {currentTab < 2 ? (
                            <button onClick={() => setCurrentTab(currentTab + 1)} className="ml-auto px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-bold transition-colors shadow-lg shadow-primary/20">Devam Et</button>
                        ) : (
                            <button onClick={handleSubmit} className="ml-auto w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white rounded-xl font-bold transition-all shadow-xl shadow-blue-500/20">
                                Kaydet ve Analize Başla
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ResourceUploadModal;
