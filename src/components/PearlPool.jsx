import React, { useState, useEffect } from 'react';
import { FileJson, Star, Trash2, FolderPlus, Folder, Home, X, Plus, Edit2, Layers, FolderInput, ArrowRight, CheckCircle2 } from 'lucide-react';
import { getPearls, togglePearlFavorite, deletePearl, getPearlFolders, createPearlFolder, deletePearlFolder, savePearl } from '../utils/db';

const DUS_SUBJECTS = [
    "Anatomi", "Fizyoloji", "Biyokimya", "Mikrobiyoloji", "Patoloji", "Farmakoloji",
    "Protetik Diş Tedavisi", "Restoratif Diş Tedavisi", "Endodonti", "Periodontoloji",
    "Ortodonti", "Pedodonti", "Ağız Diş ve Çene Cerrahisi", "Ağız Diş ve Çene Radyolojisi",
    "Genel"
];

function PearlPool() {
    const [pearls, setPearls] = useState([]);
    const [folders, setFolders] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null); // null = root
    const [filter, setFilter] = useState('all'); // 'all' | 'favorites'
    const [categoryFilter, setCategoryFilter] = useState('all');

    // Create folder state
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // Create pearl state
    const [showCreatePearl, setShowCreatePearl] = useState(false);
    const [newPearlCategory, setNewPearlCategory] = useState('');
    const [newPearlContent, setNewPearlContent] = useState('');

    // Category Editing
    const [editingId, setEditingId] = useState(null);

    // Move Pearl State
    const [movingPearl, setMovingPearl] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const allPearls = await getPearls();
        const allFolders = await getPearlFolders();
        setPearls(allPearls.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        setFolders(allFolders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
    };

    const handleToggleFavorite = async (id) => {
        await togglePearlFavorite(id);
        await loadData();
    };

    const handleDeletePearl = async (id) => {
        if (window.confirm("Bu hap bilgiyi silmek istediğinize emin misiniz?")) {
            await deletePearl(id);
            await loadData();
        }
    };

    const handleCategoryUpdate = async (pearl, newCategory) => {
        await savePearl({ ...pearl, category: newCategory });

        // Optimistic UI Update
        const updatedPearls = pearls.map(p =>
            p.id === pearl.id ? { ...p, category: newCategory } : p
        );
        setPearls(updatedPearls);
        setEditingId(null);
    };

    const handleMovePearl = async (targetFolderId) => {
        if (!movingPearl) return;

        await savePearl({ ...movingPearl, folderId: targetFolderId });
        setMovingPearl(null);
        await loadData(); // Reload to reflect changes (item might disappear from current view)
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        const folder = {
            id: Date.now().toString(),
            name: newFolderName.trim(),
            createdAt: new Date().toISOString()
        };
        await createPearlFolder(folder);
        setNewFolderName('');
        setShowCreateFolder(false);
        await loadData();
    };

    const handleDeleteFolder = async (id) => {
        if (window.confirm("Bu klasörü silmek istediğinize emin misiniz? İçindeki hap bilgiler Ana Klasör'e taşınacak.")) {
            await deletePearlFolder(id);
            await loadData();
            if (currentFolderId === id) {
                setCurrentFolderId(null);
            }
        }
    };

    const handleCreatePearl = async () => {
        if (!newPearlCategory.trim() || !newPearlContent.trim()) {
            alert("Kategori ve içerik boş olamaz!");
            return;
        }
        const pearl = {
            id: Date.now().toString(),
            content: newPearlContent.trim(),
            category: newPearlCategory,
            sourceId: null,
            folderId: currentFolderId,
            isFavorite: false,
            createdAt: new Date().toISOString()
        };
        await savePearl(pearl);
        setNewPearlCategory('');
        setNewPearlContent('');
        setShowCreatePearl(false);
        await loadData();
    };

    // Filter pearls by folder
    const filteredByFolder = pearls.filter(p => p.folderId === currentFolderId);

    const categories = [...new Set(filteredByFolder.map(p => p.category || 'Genel'))];
    const filteredPearls = filteredByFolder.filter(p => {
        if (filter === 'favorites' && !p.isFavorite) return false;
        if (categoryFilter !== 'all' && (p.category || 'Genel') !== categoryFilter) return false;
        return true;
    });

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 relative">
            {/* Header & Breadcrumb */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-green-400">
                        Hap Bilgi Havuzu
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        AI tarafından çıkarılan tüm önemli bilgiler burada. Kategorilere göre düzenle!
                    </p>

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
                        <button
                            onClick={() => setCurrentFolderId(null)}
                            className={`hover:text-foreground transition-colors ${currentFolderId === null ? 'text-primary font-medium' : ''}`}
                        >
                            <Home size={16} className="inline mr-1" />
                            Ana Klasör
                        </button>
                        {currentFolderId && (
                            <>
                                <span>/</span>
                                <span className="text-primary font-medium">
                                    {folders.find(f => f.id === currentFolderId)?.name || 'Klasör'}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {!currentFolderId && (
                        <button
                            onClick={() => setShowCreateFolder(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 rounded-lg text-sm font-medium border border-emerald-500/30 transition-all"
                        >
                            <FolderPlus size={18} /> Yeni Klasör
                        </button>
                    )}
                    <button
                        onClick={() => setShowCreatePearl(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-sm font-medium border border-primary/30 transition-all"
                    >
                        <Plus size={18} /> Yeni Hap Bilgi
                    </button>
                </div>
            </div>

            {/* Info Banner for Favorites */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3">
                <Star size={20} className="text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                    <p className="text-blue-400 font-medium">💡 İpucu</p>
                    <p className="text-muted-foreground mt-1">
                        Ana paneldeki "Hap Bilgi Atlıkarıncası"nda beğendiğiniz bilgileri yıldızlayın, otomatik olarak buraya kaydedilsin.
                        Sonra buradan hem dersini seçebilir hem de klasörlere taşıyabilirsiniz.
                    </p>
                </div>
            </div>

            {/* Create Folder Modal (Replaced Inline) */}
            {showCreateFolder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShowCreateFolder(false)}>
                    <div className="bg-card w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-border scale-100 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <FolderPlus className="text-emerald-500" size={24} />
                                Yeni Klasör Oluştur
                            </h3>
                            <button onClick={() => setShowCreateFolder(false)} className="p-1 hover:bg-secondary rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-muted-foreground">Klasör Adı</label>
                                <input
                                    type="text"
                                    value={newFolderName}
                                    onChange={(e) => setNewFolderName(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                                    placeholder="örn: Oral Patoloji"
                                    className="w-full px-4 py-3 bg-background border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary shadow-sm text-lg"
                                    autoFocus
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowCreateFolder(false)}
                                    className="flex-1 py-3 bg-secondary hover:bg-secondary/80 rounded-xl font-bold transition-all"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleCreateFolder}
                                    className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 transition-all"
                                >
                                    Oluştur
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Move Pearl Modal */}
            {movingPearl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setMovingPearl(null)}>
                    <div className="bg-card w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <FolderInput className="text-primary" size={20} />
                                Taşı: Hedef Klasör Seç
                            </h3>
                            <button onClick={() => setMovingPearl(null)} className="p-1 hover:bg-secondary rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {/* Root Option */}
                            <button
                                onClick={() => handleMovePearl(null)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${movingPearl.folderId === null ? 'bg-primary/10 border-primary text-primary' : 'bg-background hover:bg-secondary border-border'}`}
                            >
                                <Home size={18} />
                                <span className="font-medium">Ana Klasör (Root)</span>
                                {movingPearl.folderId === null && <CheckCircle2 size={16} className="ml-auto" />}
                            </button>

                            {/* Folders List */}
                            {folders.map(folder => (
                                <button
                                    key={folder.id}
                                    onClick={() => handleMovePearl(folder.id)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${movingPearl.folderId === folder.id ? 'bg-primary/10 border-primary text-primary' : 'bg-background hover:bg-secondary border-border'}`}
                                >
                                    <Folder size={18} className="text-emerald-500" />
                                    <span className="font-medium truncate">{folder.name}</span>
                                    {movingPearl.folderId === folder.id && <CheckCircle2 size={16} className="ml-auto" />}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Pearl Modal */}
            {showCreatePearl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowCreatePearl(false)}>
                    <div className="bg-card w-full max-w-lg rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Plus className="text-primary" size={24} />
                                Yeni Hap Bilgi Ekle
                            </h3>
                            <button onClick={() => setShowCreatePearl(false)} className="p-1 hover:bg-secondary rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Kategori</label>
                                <select
                                    value={newPearlCategory}
                                    onChange={(e) => setNewPearlCategory(e.target.value)}
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">Seçiniz</option>
                                    {DUS_SUBJECTS.map(subject => (
                                        <option key={subject} value={subject}>{subject}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Hap Bilgi İçeriği</label>
                                <textarea
                                    value={newPearlContent}
                                    onChange={(e) => setNewPearlContent(e.target.value)}
                                    placeholder="Önemli bilgiyi buraya yazın..."
                                    rows={5}
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                                />
                            </div>
                            {currentFolderId && (
                                <p className="text-xs text-muted-foreground">
                                    📁 {folders.find(f => f.id === currentFolderId)?.name} klasörüne eklenecek
                                </p>
                            )}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowCreatePearl(false)}
                                className="flex-1 py-3 bg-secondary hover:bg-secondary/80 rounded-xl font-bold"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleCreatePearl}
                                className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90"
                            >
                                Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Folders (only show when in root) */}
            {currentFolderId === null && folders.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {folders.map(folder => (
                        <div
                            key={folder.id}
                            className="bg-card border border-border rounded-xl p-4 hover:border-emerald-500/50 transition-all cursor-pointer group relative"
                            onClick={() => setCurrentFolderId(folder.id)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                    <Folder size={24} className="text-emerald-500" />
                                    <div>
                                        <p className="font-medium line-clamp-1">{folder.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {pearls.filter(p => p.folderId === folder.id).length} hap bilgi
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 text-destructive rounded transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'all'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                        }`}
                >
                    Tümü ({filteredByFolder.length})
                </button>
                <button
                    onClick={() => setFilter('favorites')}
                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${filter === 'favorites'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80'
                        }`}
                    title="Ana panelden yıldızladığınız hap bilgiler"
                >
                    <Star size={16} />
                    Favoriler ({filteredByFolder.filter(p => p.isFavorite).length})
                </button>
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => setCategoryFilter('all')}
                        className={`text-xs px-3 py-1.5 rounded-full transition-all ${categoryFilter === 'all'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-secondary/50 hover:bg-secondary'
                            }`}
                    >
                        Tüm Kategoriler
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoryFilter(cat)}
                            className={`text-xs px-3 py-1.5 rounded-full transition-all ${categoryFilter === cat
                                ? 'bg-emerald-500 text-white'
                                : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            )}

            {/* Pearls List */}
            {filteredPearls.length === 0 ? (
                <div className="text-center py-20">
                    <FileJson size={64} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                    <p className="text-lg font-medium text-muted-foreground">
                        {currentFolderId ? 'Bu klasörde henüz hap bilgi yok' : 'Henüz hap bilgi yok'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Kütüphanede bir PDF'ten "Hap Bilgi" oluşturun
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPearls.map(pearl => (
                        <div
                            key={pearl.id}
                            className="bg-card border border-border rounded-xl p-4 hover:border-emerald-500/30 transition-all group relative break-inside-avoid"
                        >
                            {/* Header Row */}
                            <div className="flex items-center justify-between mb-3">
                                {/* Editable Category Badge */}
                                {editingId === pearl.id ? (
                                    <select
                                        className="max-w-[150px] px-2 py-1 bg-background border border-emerald-500 text-emerald-500 text-xs rounded font-bold outline-none"
                                        value={pearl.category || 'Genel'}
                                        onChange={(e) => handleCategoryUpdate(pearl, e.target.value)}
                                        onBlur={() => setEditingId(null)}
                                        autoFocus
                                    >
                                        {DUS_SUBJECTS.map(subject => (
                                            <option key={subject} value={subject}>{subject}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <button
                                        onClick={() => setEditingId(pearl.id)}
                                        className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded hover:bg-emerald-500/20 flex items-center gap-1 group/badge font-bold uppercase tracking-wide truncate max-w-[180px]"
                                        title="Kategoriyi değiştirmek için tıkla"
                                    >
                                        {pearl.category || 'Genel'}
                                        <Edit2 size={10} className="opacity-0 group-hover/badge:opacity-100" />
                                    </button>
                                )}

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setMovingPearl(pearl)}
                                        className="p-1 hover:bg-blue-500/10 text-blue-500 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                        title="Klasöre Taşı"
                                    >
                                        <FolderInput size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleToggleFavorite(pearl.id)}
                                        className="p-1 hover:bg-secondary rounded-full transition-colors"
                                    >
                                        <Star
                                            size={18}
                                            className={pearl.isFavorite ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"}
                                        />
                                    </button>
                                    <button
                                        onClick={() => handleDeletePearl(pearl.id)}
                                        className="p-1 hover:bg-destructive/10 text-destructive rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <p className="text-sm leading-relaxed text-foreground/90">{pearl.content}</p>

                            {/* Footer */}
                            <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
                                {new Date(pearl.createdAt).toLocaleDateString('tr-TR')}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default PearlPool;
