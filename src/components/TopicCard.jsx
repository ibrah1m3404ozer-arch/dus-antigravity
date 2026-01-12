import React, { useState, useEffect } from 'react';
import { STATUS_CONFIG } from '../utils/data';
import { RotateCw, NotebookPen, X, Save, Camera, Image as ImageIcon, Trash2, Maximize2 } from 'lucide-react';

function TopicCard({ topic, onStatusChange, onNoteUpdate, onAddImage, onRemoveImage }) {
    const currentStatus = STATUS_CONFIG[topic.status] || STATUS_CONFIG['not-started'];
    const [isNoteOpen, setIsNoteOpen] = useState(false);
    const [noteText, setNoteText] = useState(topic.note || '');

    // Gallery States
    const [selectedImage, setSelectedImage] = useState(null); // For Lightbox
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    useEffect(() => {
        setNoteText(topic.note || '');
    }, [topic.note]);

    // Image category selection modal
    const [pendingImageFile, setPendingImageFile] = useState(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);

    // Image category tabs
    const [imageTab, setImageTab] = useState('all'); // 'all', 'soru', 'bilgi'

    const handleCycle = () => {
        const nextStatusKey = currentStatus.next;
        onStatusChange(topic.id, nextStatusKey);
    };

    const saveNote = () => {
        onNoteUpdate(topic.id, noteText);
        setIsNoteOpen(false);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];

        if (file) {
            // Check for unsupported formats (HEIC)
            if (file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')) {
                alert('⚠️ HEIC formatı desteklenmiyor!\n\nLütfen JPG veya PNG formatında bir resim seçin.\n\niPhone kullanıyorsanız:\nAyarlar → Kamera → Formatlar → "En Uyumlu" seçin.');
                e.target.value = null;
                return;
            }

            // Open category selection modal
            setPendingImageFile(file);
            setShowCategoryModal(true);
            e.target.value = null; // Clear input for next selection
        }
    };

    const handleCategorySelect = (category) => {
        if (pendingImageFile) {
            onAddImage(topic.id, pendingImageFile, category);
        }
        setShowCategoryModal(false);
        setPendingImageFile(null);
    };

    const openLightbox = (image) => {
        setSelectedImage(image);
        setIsLightboxOpen(true);
    };

    return (
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative group flex flex-col h-full">
            <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-lg text-foreground/90 leading-tight">
                    {topic.title}
                </h3>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => document.getElementById(`upload-${topic.id}`).click()}
                        className="p-2 rounded-full text-muted-foreground hover:bg-muted hover:text-blue-400 transition-colors"
                        title="Fotoğraf Ekle"
                    >
                        <Camera size={18} />
                    </button>
                    <input
                        type="file"
                        id={`upload-${topic.id}`}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                    />
                    <button
                        onClick={() => setIsNoteOpen(true)}
                        className={`p-2 rounded-full transition-colors ${topic.note ? 'text-accent hover:bg-accent/10 opacity-100' : 'text-muted-foreground hover:bg-muted'}`}
                        title="Not Ekle"
                    >
                        <NotebookPen size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-1">
                {/* Image Tabs */}
                {topic.images && topic.images.length > 0 && (
                    <div className="mb-2">
                        <div className="flex gap-1 text-[10px] font-medium">
                            <button
                                onClick={() => setImageTab('all')}
                                className={`px-2 py-1 rounded transition-colors ${imageTab === 'all'
                                    ? 'bg-primary/20 text-primary'
                                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                                    }`}
                            >
                                Tümü ({topic.images.length})
                            </button>
                            <button
                                onClick={() => setImageTab('soru')}
                                className={`px-2 py-1 rounded transition-colors ${imageTab === 'soru'
                                    ? 'bg-red-500/20 text-red-500'
                                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                                    }`}
                            >
                                📝 Sorular ({topic.images.filter(i => i.caption === 'Soru').length})
                            </button>
                            <button
                                onClick={() => setImageTab('bilgi')}
                                className={`px-2 py-1 rounded transition-colors ${imageTab === 'bilgi'
                                    ? 'bg-blue-500/20 text-blue-500'
                                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                                    }`}
                            >
                                📚 Bilgi ({topic.images.filter(i => i.caption === 'Bilgi Sayfası').length})
                            </button>
                        </div>
                    </div>
                )}

                {/* Thumbnails (Filtered by Tab) */}
                {topic.images && topic.images.length > 0 && (
                    <div className="flex gap-2 mb-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-border">
                        {topic.images
                            .filter(img => {
                                if (imageTab === 'all') return true;
                                if (imageTab === 'soru') return img.caption === 'Soru';
                                if (imageTab === 'bilgi') return img.caption === 'Bilgi Sayfası';
                                return true;
                            })
                            .map((img) => (
                                <div
                                    key={img.id}
                                    className="relative flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-border cursor-pointer hover:ring-2 ring-primary transition-all group/img"
                                    onClick={() => openLightbox(img)}
                                >
                                    <img
                                        src={img.dataUrl || (img.blob ? URL.createObjectURL(img.blob) : '')}
                                        alt="thumbnail"
                                        className="w-full h-full object-cover"
                                        onError={(e) => console.error('Image load error:', e)}
                                    />
                                    {/* Category Badge */}
                                    {img.caption && (
                                        <div className={`absolute bottom-0 left-0 right-0 text-[8px] font-bold text-center py-0.5 ${img.caption === 'Soru'
                                            ? 'bg-red-500/90 text-white'
                                            : 'bg-blue-500/90 text-white'
                                            }`}>
                                            {img.caption === 'Soru' ? 'S' : 'B'}
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between mt-auto pt-2">
                <div
                    className={`px-3 py-1 rounded-full text-xs font-medium ${currentStatus.color} transition-colors duration-300`}
                >
                    {currentStatus.label}
                </div>

                <button
                    onClick={handleCycle}
                    className="p-2 rounded-full hover:bg-primary/20 text-primary transition-colors"
                    title="Durumu Değiştir"
                >
                    <RotateCw size={20} className="hover:rotate-180 transition-transform duration-500" />
                </button>
            </div>

            {/* Note Modal */}
            {isNoteOpen && (
                <div className="absolute inset-0 bg-card/95 backdrop-blur-sm z-10 rounded-xl p-4 flex flex-col animate-in fade-in duration-200">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-muted-foreground">Konu Notları</span>
                        <button onClick={() => setIsNoteOpen(false)} className="text-muted-foreground hover:text-destructive">
                            <X size={18} />
                        </button>
                    </div>
                    <textarea
                        className="flex-1 w-full bg-input/50 rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                        placeholder="Önemli detayları buraya not al..."
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                    />
                    <button
                        onClick={saveNote}
                        className="mt-2 w-full py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-2"
                    >
                        <Save size={14} />
                        Kaydet
                    </button>
                </div>
            )}

            {/* Image Category Selection Modal */}
            {showCategoryModal && (
                <div className="absolute inset-0 bg-card/95 backdrop-blur-sm z-10 rounded-xl p-4 flex flex-col animate-in fade-in duration-200">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-muted-foreground">Bu resim ne tür?</span>
                        <button onClick={() => { setShowCategoryModal(false); setPendingImageFile(null); }} className="text-muted-foreground hover:text-destructive">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col gap-2 justify-center">
                        <button
                            onClick={() => handleCategorySelect('Soru')}
                            className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded-lg text-sm font-bold transition-colors"
                        >
                            📝 SORU
                        </button>
                        <button
                            onClick={() => handleCategorySelect('Bilgi Sayfası')}
                            className="w-full py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-500 rounded-lg text-sm font-bold transition-colors"
                        >
                            📚 BİLGİ SAYFASI
                        </button>
                    </div>
                </div>
            )}

            {/* Lightbox / Gallery Viewer */}
            {isLightboxOpen && selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setIsLightboxOpen(false);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Escape') setIsLightboxOpen(false);
                        if (e.key === 'ArrowLeft') {
                            const currentIndex = topic.images.findIndex(img => img.id === selectedImage.id);
                            if (currentIndex > 0) setSelectedImage(topic.images[currentIndex - 1]);
                        }
                        if (e.key === 'ArrowRight') {
                            const currentIndex = topic.images.findIndex(img => img.id === selectedImage.id);
                            if (currentIndex < topic.images.length - 1) setSelectedImage(topic.images[currentIndex + 1]);
                        }
                    }}
                    tabIndex={0}
                >
                    <div className="bg-card rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-border relative" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="flex justify-between items-center p-4 border-b border-border">
                            <h4 className="font-medium">Görsel Önizleme</h4>
                            <div className="flex gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveImage(topic.id, selectedImage.id);
                                        setIsLightboxOpen(false);
                                    }}
                                    className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                    title="Sil"
                                >
                                    <Trash2 size={20} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsLightboxOpen(false);
                                    }}
                                    className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Image Area with Navigation Arrows */}
                        <div className="flex-1 overflow-auto bg-black/50 flex items-center justify-center p-4 relative">
                            {/* Previous Button */}
                            {topic.images.findIndex(img => img.id === selectedImage.id) > 0 && (
                                <button
                                    onClick={() => {
                                        const currentIndex = topic.images.findIndex(img => img.id === selectedImage.id);
                                        setSelectedImage(topic.images[currentIndex - 1]);
                                    }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-10"
                                    title="Önceki (←)"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M15 18l-6-6 6-6" />
                                    </svg>
                                </button>
                            )}

                            <img
                                src={selectedImage.dataUrl || (selectedImage.blob ? URL.createObjectURL(selectedImage.blob) : '')}
                                alt="Full view"
                                className="max-w-full max-h-full object-contain rounded-md shadow-lg"
                                onError={(e) => console.error('Lightbox image error:', e)}
                            />

                            {/* Next Button */}
                            {topic.images.findIndex(img => img.id === selectedImage.id) < topic.images.length - 1 && (
                                <button
                                    onClick={() => {
                                        const currentIndex = topic.images.findIndex(img => img.id === selectedImage.id);
                                        setSelectedImage(topic.images[currentIndex + 1]);
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors z-10"
                                    title="Sonraki (→)"
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M9 18l6-6-6-6" />
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Footer / Caption */}
                        <div className="p-4 border-t border-border bg-card">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    {new Date(selectedImage.createdAt).toLocaleDateString('tr-TR')} tarihinde eklendi
                                </p>
                                {selectedImage.caption && (
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${selectedImage.caption === 'Soru'
                                        ? 'bg-red-500/20 text-red-500 border border-red-500/30'
                                        : 'bg-blue-500/20 text-blue-500 border border-blue-500/30'
                                        }`}>
                                        {selectedImage.caption}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TopicCard;
