import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Trash2, FolderPlus, Folder, Home, Music, Video, Brain, Sparkles, BookOpen, Star, Clock, Plus, ChevronRight, ChevronDown, CheckSquare, Save, X, Download } from 'lucide-react';
import { getAllArticles, saveArticle, deleteArticle, getFolders, createFolder, deleteFolder, savePearl, deletePearl, saveQuestion, deleteQuestion } from '../utils/db';
import { summarizeText, generateFlashcards, generateQuiz } from '../services/aiService';
import ResourceUploadModal from './ResourceUploadModal';
import * as pdfjsLib from 'pdfjs-dist';

// Using CDN worker for maximum stability
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.0.379/build/pdf.worker.min.mjs`;

function Library() {
    // State
    const [resources, setResources] = useState([]);
    const [folders, setFolders] = useState([]);
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [selectedResource, setSelectedResource] = useState(null);
    const [detailTab, setDetailTab] = useState(0);
    // Tabs: 0=PDF, 1=Summary, 2=Flashcards, 3=Quiz, 4=Media

    // Upload
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');

    // Folder Creation Modal State
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    // AI State
    const [aiLoading, setAiLoading] = useState(false);
    const [aiSummary, setAiSummary] = useState('');

    // Generation Settings
    const [flashcardCount, setFlashcardCount] = useState(10);
    const [quizCount, setQuizCount] = useState(10);

    // Flashcards State
    const [flashcards, setFlashcards] = useState([]);

    // Quiz State
    const [quizSets, setQuizSets] = useState([]); // Array of { id, timestamp, questions: [] }
    const [activeSetId, setActiveSetId] = useState(null);
    const [userAnswers, setUserAnswers] = useState({}); // { [questionId]: option }

    // Media References
    const audioInputRef = useRef(null);
    const videoInputRef = useRef(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            // 1. Load from IndexedDB (local, fast)
            const [localArticles, localFolders] = await Promise.all([
                getAllArticles(),
                getFolders()
            ]);

            // 2. Try to sync with Firebase (if authenticated)
            try {
                const { getAllLibraryArticles, getAllLibraryFolders } = await import('../utils/firebaseDB');
                const { auth } = await import('../utils/firebaseConfig');

                if (auth.currentUser && !auth.currentUser.isAnonymous) {
                    const [cloudArticles, cloudFolders] = await Promise.all([
                        getAllLibraryArticles(),
                        getAllLibraryFolders()
                    ]);

                    if (cloudArticles.length > 0 || cloudFolders.length > 0) {
                        console.log('📥 Downloaded from cloud:', { articles: cloudArticles.length, folders: cloudFolders.length });
                        const merged = await mergeLibraryData(localArticles, cloudArticles);
                        setResources(merged || []);
                        setFolders(cloudFolders.length > 0 ? cloudFolders : localFolders || []);
                    } else {
                        // If no cloud data, use local data
                        setResources(localArticles || []);
                        setFolders(localFolders || []);
                    }
                } else {
                    // Not authenticated - local only
                    setResources(localArticles || []);
                    setFolders(localFolders || []);
                }
            } catch (firebaseError) {
                console.warn('Firebase sync failed:', firebaseError);
                setResources(localArticles || []);
                setFolders(localFolders || []);
            }
        } catch (error) {
            console.error('loadData error:', error);
            setResources([]);
            setFolders([]);
        }
    };

    // Merge helper with download support + FULL DEBUG
    const mergeLibraryData = async (local, cloud) => {
        console.log('🔄 ===== MERGE START =====');
        console.log('📱 Local count:', local.length);
        console.log('☁️ Cloud count:', cloud.length);
        const map = new Map();

        // Start with cloud data
        console.log('☁️ Processing cloud items...');
        cloud.forEach(c => {
            console.log('  ☁️', c.id, c.title, 'URL:', c.fileURL ? '✅' : '❌');
            map.set(c.id, { ...c });
        });

        // Merge with local data (preserve local Blobs)
        console.log('📱 Merging local blobs...');
        local.forEach(l => {
            if (map.has(l.id)) {
                const existing = map.get(l.id);
                console.log('  📱 Merging:', l.id, 'hasBlob:', !!l.fileBlob);
                // Keep local Blobs if they exist
                existing.fileBlob = l.fileBlob || null;
                existing.audioFile = l.audioFile || null;
                existing.videoFile = l.videoFile || null;
            } else {
                map.set(l.id, l);
            }
        });

        // Download missing files from cloud URLs
        const merged = Array.from(map.values());
        console.log('🔄 Total merged:', merged.length);

        // SEQUENTIAL downloads for debugging
        console.log('📥 Starting downloads...');
        for (const article of merged) {
            if (article.fileURL && !article.fileBlob) {
                console.log('📥 DOWNLOADING:', article.title);
                console.log('  URL:', article.fileURL);
                try {
                    try {
                        // USE FIREBASE SDK FOR AUTH
                        const { ref, getBlob } = await import('firebase/storage');
                        const { storage } = await import('../utils/firebaseConfig');

                        const urlObj = new URL(article.fileURL);
                        const pathMatch = urlObj.pathname.match(/\/o\/(.+?)\?/);

                        if (pathMatch) {
                            const filePath = decodeURIComponent(pathMatch[1]);
                            console.log('  Path:', filePath);

                            const fileRef = ref(storage, filePath);
                            article.fileBlob = await getBlob(fileRef);
                            console.log('  ✅ Downloaded:', article.fileBlob.size, 'bytes');

                            await saveArticle(article);
                            console.log('  💾 Saved');
                        }
                    } catch (err) {
                        console.error('  ❌ Error:', err);
                    }
                } else if (article.fileBlob) {
                    console.log('✅ Has blob:', article.title);
                } else {
                    console.log('⚠️ No URL:', article.title);
                }
            }

            console.log('✅ ===== MERGE COMPLETE =====');
            return merged;
        };

        // Initialize session state when resource is selected
        const handleResourceSelect = (resource) => {
            setSelectedResource(resource);
            setDetailTab(0);
            setAiSummary(resource.aiSummary || '');
            setFlashcards(resource.generatedFlashcards || []);
            setQuizSets(resource.generatedQuizSets || []);
            if (resource.generatedQuizSets?.length > 0) {
                setActiveSetId(resource.generatedQuizSets[0].id);
            }
        };

        // Persist State Helper
        const persistResourceState = async (updatedFields) => {
            if (!selectedResource) return;
            const updatedResource = { ...selectedResource, ...updatedFields };
            await saveArticle(updatedResource);
            setSelectedResource(updatedResource); // Update local state
            await loadData(); // Update generic list
        };

        // Extract text from PDF
        const extractTextFromPDF = async (file) => {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                let fullText = '';

                // Process up to 30 pages (balance between completeness and performance)
                const maxPages = Math.min(pdf.numPages, 30);

                for (let i = 1; i <= maxPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n\n';
                }

                // Validate extraction
                if (!fullText.trim() || fullText.length < 50) {
                    console.warn('PDF text extraction resulted in very short text');
                    return 'PDF içeriği okunamadı (muhtemelen taranmış görsel). Lütfen manuel özet ekleyin.';
                }

                return fullText.trim();
            } catch (error) {
                console.error('PDF extraction error:', error);
                throw new Error(`PDF okuma hatası: ${error.message}`);
            }
        };

        // Handle Resource Upload
        const handleResourceUpload = async (resourceData) => {
            setShowUploadModal(false);
            setIsUploading(true);
            setUploadStatus('PDF işleniyor...');

            try {
                console.log('🚀 UPLOAD START:', { hasFile: !!resourceData.pdfFile, title: resourceData.title });

                let text = '';
                // Only attempt extraction if it's a PDF
                if (resourceData.pdfFile) {
                    text = await extractTextFromPDF(resourceData.pdfFile);
                    if (!text || text.trim().length < 10) {
                        // Fallback for scanned PDFs or images
                        text = "Bu PDF'den metin okunamadı (Taranmış belge olabilir).";
                        console.warn("PDF text extraction empty");
                    }
                }

                const newResource = {
                    id: Date.now().toString(),
                    title: resourceData.title,
                    folder: resourceData.folder,
                    tags: resourceData.tags || [],
                    category: resourceData.category || '',
                    fileBlob: resourceData.pdfFile,
                    audioFile: resourceData.audioFile || null,
                    videoFile: resourceData.videoFile || null,
                    extractedText: text,
                    manualSummary: resourceData.manualSummary || '',
                    images: [],
                    createdAt: new Date().toISOString(),
                    metadata: {},
                    sourceType: resourceData.pdfFile ? 'pdf' : 'manual'
                };

                // 🔥 FIX: Upload to Firebase Storage FIRST for authenticated users
                const { auth } = await import('../utils/firebaseConfig');
                const { storageHelpers } = await import('../utils/firebaseDB');

                if (auth.currentUser && !auth.currentUser.isAnonymous && resourceData.pdfFile) {
                    setUploadStatus('Firebase Storage\'a yükleniyor...');
                    console.log('📤 Uploading to Firebase Storage...');

                    const fileURL = await storageHelpers.uploadFile(
                        resourceData.pdfFile,
                        `articles/${newResource.id}/file.pdf`
                    );

                    newResource.fileURL = fileURL;
                    console.log('✅ Upload successful:', fileURL);
                }

                setUploadStatus('Kaydediliyor...');
                await saveArticle(newResource);
                console.log('💾 Saved to IndexedDB');

                setUploadStatus('Tamamlandı!');
                setTimeout(() => {
                    setIsUploading(false);
                    setUploadStatus('');
                }, 1000);

                // Reload data to reflect changes
                await loadData();
            } catch (error) {
                console.error(error);
                setUploadStatus('❌ Hata: ' + error.message);
                alert('Hata: ' + error.message);
                setIsUploading(false);
                setTimeout(() => setUploadStatus(''), 3000);
            }
        };

        // Delete Resource
        const handleDeleteResource = async (id) => {
            if (window.confirm('Bu kaynağı silmek istediğinizden emin misiniz?')) {
                await deleteArticle(id);
                await loadData();
                if (selectedResource?.id === id) {
                    setSelectedResource(null);
                }
            }
        };

        // Folder Management
        const initCreateFolder = () => {
            setNewFolderName('');
            setShowFolderModal(true);
        };

        const confirmCreateFolder = async () => {
            if (newFolderName.trim()) {
                await createFolder(newFolderName.trim());
                setShowFolderModal(false);
                await loadData();
            }
        };

        const handleDeleteFolder = async (id) => {
            if (window.confirm('Klasörü sil? (İçindeki kaynaklar Ana Klasör\'e taşınır)')) {
                const folderResources = resources.filter(r => r.folderId === id);
                for (const resource of folderResources) {
                    await saveArticle({ ...resource, folderId: null });
                }
                await deleteFolder(id);
                await loadData();
                if (currentFolderId === id) setCurrentFolderId(null);
            }
        };

        // AI Functions
        const handleSummarize = async () => {
            if (!selectedResource) return;

            // Validate content exists and is meaningful
            if (!selectedResource.content || selectedResource.content.length < 100) {
                alert('❌ PDF içeriği çok kısa veya okunamadı!\n\nAI özet oluşturmak için yeterli metin bulunamadı. Lütfen:\n\n1. Farklı bir PDF deneyin\n2. Manuel özet ekleyin (Medya sekmesi)');
                return;
            }

            const apiKey = localStorage.getItem('gemini_api_key');
            if (!apiKey) {
                alert('Lütfen Ayarlar sayfasından Google Gemini API anahtarınızı girin.');
                return;
            }

            setAiLoading(true);
            try {
                const summary = await summarizeText(selectedResource.content, apiKey);
                setAiSummary(summary);
                await persistResourceState({ aiSummary: summary });
            } catch (error) {
                alert('Özet oluşturulamadı: ' + error.message);
            } finally {
                setAiLoading(false);
            }
        };

        const handleGenerateFlashcards = async () => {
            if (!selectedResource) return;

            if (!selectedResource.content || selectedResource.content.length < 100) {
                alert('❌ PDF içeriği çok kısa!\n\nHap bilgi oluşturmak için yeterli metin bulunamadı.');
                return;
            }

            const apiKey = localStorage.getItem('gemini_api_key');
            if (!apiKey) {
                alert('Lütfen Ayarlar sayfasından Google Gemini API anahtarınızı girin.');
                return;
            }

            setAiLoading(true);
            try {
                const newCards = await generateFlashcards(selectedResource.content, apiKey, flashcardCount);
                const enrichedCards = newCards.map(c => ({
                    ...c,
                    id: Date.now().toString() + Math.random().toString().slice(2, 8),
                    isSaved: false
                }));

                const updatedFlashcards = [...flashcards, ...enrichedCards];
                setFlashcards(updatedFlashcards);
                await persistResourceState({ generatedFlashcards: updatedFlashcards });
            } catch (error) {
                alert('Hap bilgiler oluşturulamadı: ' + error.message);
            } finally {
                setAiLoading(false);
            }
        };

        const handleGenerateQuestions = async () => {
            if (!selectedResource) return;

            if (!selectedResource.content || selectedResource.content.length < 100) {
                alert('❌ PDF içeriği çok kısa!\n\nTest soruları oluşturmak için yeterli metin bulunamadı.');
                return;
            }

            const apiKey = localStorage.getItem('gemini_api_key');
            if (!apiKey) {
                alert('Lütfen Ayarlar sayfasından Google Gemini API anahtarınızı girin.');
                return;
            }

            setAiLoading(true);
            try {
                const quizData = await generateQuiz(selectedResource.content, apiKey, 'Zor, Klinik Vaka', quizCount);
                const enrichedQuiz = quizData.map(q => ({
                    ...q,
                    id: Date.now().toString() + Math.random().toString().slice(2, 8),
                    isSaved: false
                }));

                const newSet = {
                    id: Date.now(),
                    timestamp: new Date(),
                    questions: enrichedQuiz,
                    name: `Test ${quizSets.length + 1} (${enrichedQuiz.length} Soru)`
                };

                const updatedSets = [newSet, ...quizSets];
                setQuizSets(updatedSets);
                setActiveSetId(newSet.id);
                await persistResourceState({ generatedQuizSets: updatedSets });
            } catch (error) {
                alert('Sorular oluşturulamadı: ' + error.message);
            } finally {
                setAiLoading(false);
            }
        };

        // Save/Delete Handlers
        const toggleFlashcardSave = async (card) => {
            try {
                // Need to persist user selection on correct item
                // First update IDB Pool
                if (card.isSaved) {
                    await deletePearl(card.id);
                } else {
                    await savePearl({
                        id: card.id,
                        content: card.content,
                        category: card.category,
                        sourceId: selectedResource.id,
                        folderId: null,
                        isFavorite: true,
                        createdAt: new Date().toISOString()
                    });
                }

                // Then update Local List state to reflect change (UI toggle)
                const updatedFlashcards = flashcards.map(c => c.id === card.id ? { ...c, isSaved: !card.isSaved } : c);
                setFlashcards(updatedFlashcards);
                await persistResourceState({ generatedFlashcards: updatedFlashcards });

            } catch (error) {
                console.error(error);
            }
        };

        const deleteFlashcard = async (id) => {
            const updatedFlashcards = flashcards.filter(c => c.id !== id);
            setFlashcards(updatedFlashcards);
            await persistResourceState({ generatedFlashcards: updatedFlashcards });
        };

        const toggleQuestionSave = async (question) => {
            try {
                console.log("Saving Question:", question); // Debug for user to see options
                if (!question.options || question.options.length === 0) {
                    console.warn("Warning: Saving question with no options!");
                }

                // Update IDB Pool
                if (question.isSaved) {
                    await deleteQuestion(question.id);
                } else {
                    await saveQuestion({
                        id: question.id,
                        question: question.question,
                        options: question.options,
                        correctAnswer: question.answer,
                        explanation: question.explanation,
                        difficulty: 'Zor',
                        category: selectedResource.category || 'Genel', // Added category
                        sourceId: selectedResource.id,
                        createdAt: new Date().toISOString()
                    });
                }

                // Update Local State logic
                const updatedSets = quizSets.map(set => ({
                    ...set,
                    questions: set.questions.map(q => q.id === question.id ? { ...q, isSaved: !question.isSaved } : q)
                }));

                setQuizSets(updatedSets);
                await persistResourceState({ generatedQuizSets: updatedSets });

            } catch (error) {
                console.error(error);
            }
        };

        // Media Handlers
        const handleAddMedia = async (type, file) => {
            if (!file) return;
            const update = type === 'audio' ? { audioFile: file } : { videoFile: file };
            await persistResourceState(update);
        };

        // Filter resources by current folder
        const filteredResources = currentFolderId
            ? resources.filter(r => r.folderId === currentFolderId)
            : resources.filter(r => !r.folderId);

        const currentFolder = folders.find(f => f.id === currentFolderId);

        // Helper to download remote resource
        const handleDownloadResource = async (resource) => {
            if (!resource.fileURL) return;

            try {
                setUploadStatus('Dosya indiriliyor...');
                setIsUploading(true); // Reuse uploading spinner

                // Dynamic import to avoid issues if firebase not configured
                const { storageHelpers } = await import('../utils/firebaseDB');

                // Download file
                const blob = await storageHelpers.downloadFile(resource.fileURL);

                // Generic update to resource with new Blob
                const updatedResource = { ...resource, fileBlob: blob };

                // Save to local IndexedDB
                await saveArticle(updatedResource);

                // Update state
                setResources(prev => prev.map(r => r.id === resource.id ? updatedResource : r));
                setSelectedResource(updatedResource);
                setUploadStatus('✅ İndirme tamamlandı!');

            } catch (error) {
                console.error("Download failed:", error);
                alert('İndirme hatası: ' + error.message);
            } finally {
                setIsUploading(false);
                setTimeout(() => setUploadStatus(''), 2000);
            }
        };

        // Helpers for Rendering
        const renderPDFPreview = () => {
            // 1. Local Blob exists
            if (selectedResource?.fileBlob instanceof Blob) {
                const objectUrl = URL.createObjectURL(selectedResource.fileBlob);
                return (
                    <iframe
                        src={objectUrl}
                        className="w-full h-full rounded-xl border border-border bg-white"
                        title="PDF Viewer"
                    />
                );
            }

            // 2. Remote URL exists (need download)
            if (selectedResource?.fileURL) {
                return (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center bg-card/50 rounded-lg border border-dashed border-border animate-in fade-in">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                            <Download size={40} className="text-primary" />
                        </div>
                        <h3 className="font-bold text-xl mb-2 text-foreground">Dosya İndirilmeli</h3>
                        <p className="text-sm mb-6 max-w-sm opacity-80 leading-relaxed">
                            Bu dosya bulutta mevcut ancak cihazınızda yok. Görüntülemek için indirin.
                        </p>

                        <button
                            onClick={() => handleDownloadResource(selectedResource)}
                            disabled={isUploading}
                            className="px-8 py-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-bold shadow-lg shadow-primary/20 flex items-center gap-2 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                        >                        {isUploading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                İndiriliyor...
                            </>
                        ) : (
                            <>
                                <Download size={20} />
                                İndir ve Görüntüle
                            </>
                        )}
                        </button>
                        <p className="text-xs mt-4 text-muted-foreground/60">İndirdikten sonra internetsiz de erişebilirsiniz.</p>
                    </div>
                );
            }

            // 3. No file found (Error case)
            return (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center bg-card/50 rounded-lg border border-dashed border-border" style={{ borderColor: 'red' }}>
                    <FileText size={48} className="mb-4 opacity-50" />
                    <p className="font-bold text-lg text-red-400">PDF Dosyası Bulunamadı (v2.1)</p>

                    {/* DEBUG INFO */}
                    <div className="bg-black/50 p-4 rounded text-left text-xs font-mono mb-4 max-w-md w-full overflow-hidden">
                        <p className="text-yellow-400 font-bold mb-1">DEBUG DIAGNOSTICS:</p>
                        <p>ID: {selectedResource?.id}</p>
                        <p>Has Blob: {selectedResource?.fileBlob ? 'YES' : 'NO'}</p>
                        <p>Blob Type: {selectedResource?.fileBlob ? selectedResource.fileBlob.constructor.name : 'N/A'}</p>
                        <p>Cloud URL: {selectedResource?.fileURL ? (selectedResource.fileURL.substring(0, 30) + '...') : 'MISSING'}</p>
                        <p>Auth: {auth.currentUser ? 'YES' : 'NO'}</p>
                    </div>

                    <p className="text-sm mt-2 opacity-75 max-w-md">
                        Bu dosya hasarlı veya yüklenmemiş olabilir. Lütfen silip tekrar yükleyin.
                    </p>
                    <button
                        onClick={() => setSelectedResource(null)}
                        className="mt-4 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                        Geri Dön
                    </button>
                </div>
            );
        };

        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
                            📚 Kütüphane
                        </h2>
                        <p className="text-muted-foreground mt-1">
                            PDF kaynaklarını yönet, AI ile testler ve notlar oluştur
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={initCreateFolder} className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg flex items-center gap-2 font-medium">
                            <FolderPlus size={18} /> Klasör
                        </button>
                        <button onClick={() => setShowUploadModal(true)} className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg flex items-center gap-2 font-medium">
                            <Upload size={18} /> Kaynak Ekle
                        </button>
                    </div>
                </div>

                {/* Upload Status */}
                {uploadStatus && (
                    <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm">
                        {uploadStatus}
                    </div>
                )}

                {/* Create Folder Modal */}
                {showFolderModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200" onClick={() => setShowFolderModal(false)}>
                        <div className="bg-card w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-border scale-100 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <FolderPlus className="text-primary" size={24} />
                                    Yeni Klasör Oluştur
                                </h3>
                                <button onClick={() => setShowFolderModal(false)} className="p-1 hover:bg-secondary rounded-full">
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
                                        onKeyDown={(e) => e.key === 'Enter' && confirmCreateFolder()}
                                        placeholder="örn: Deneme Sınavları"
                                        className="w-full px-4 py-3 bg-background border border-primary/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary shadow-sm text-lg"
                                        autoFocus
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => setShowFolderModal(false)}
                                        className="flex-1 py-3 bg-secondary hover:bg-secondary/80 rounded-xl font-bold transition-all"
                                    >
                                        İptal
                                    </button>
                                    <button
                                        onClick={confirmCreateFolder}
                                        className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
                                    >
                                        Oluştur
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm">
                    <button onClick={() => setCurrentFolderId(null)} className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-secondary ${!currentFolderId ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                        <Home size={14} /> Ana Klasör
                    </button>
                    {currentFolder && (
                        <>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-primary font-medium">{currentFolder.name}</span>
                        </>
                    )}
                </div>

                {/* Folders */}
                {folders.length > 0 && !currentFolderId && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {folders.map(folder => (
                            <div key={folder.id} className="p-4 bg-card border border-border rounded-xl hover:border-primary transition-colors cursor-pointer group relative" onClick={() => setCurrentFolderId(folder.id)}>
                                <div className="flex items-center gap-2">
                                    <Folder className="text-primary" size={20} />
                                    <span className="font-medium truncate">{folder.name}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">{resources.filter(r => r.folderId === folder.id).length} kaynak</p>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }} className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-opacity">
                                    <Trash2 size={14} className="text-destructive" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Resources Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredResources.map(resource => (
                        <div key={resource.id} className="p-4 bg-card border border-border rounded-xl hover:border-primary transition-colors cursor-pointer group relative"
                            onClick={() => handleResourceSelect(resource)}>
                            <div className="flex items-start gap-3">
                                <FileText className="text-primary flex-shrink-0" size={24} />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium truncate">{resource.title}</h3>
                                    <p className="text-xs text-muted-foreground mt-1">{resource.category || 'Kategori yok'}</p>
                                </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteResource(resource.id); }} className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 rounded transition-opacity">
                                <Trash2 size={14} className="text-destructive" />
                            </button>
                        </div>
                    ))}
                </div>

                {filteredResources.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        <BookOpen size={48} className="mx-auto mb-3 opacity-50" />
                        <p>Henüz kaynak yok. Yeni kaynak ekleyin!</p>
                    </div>
                )}

                {/* Detail Modal */}
                {selectedResource && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in" onClick={() => setSelectedResource(null)}>
                        <div className="bg-card border border-border rounded-2xl max-w-7xl w-full h-[90vh] flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                            {/* Header */}
                            <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
                                <div>
                                    <h2 className="text-2xl font-bold">{selectedResource.title}</h2>
                                    <p className="text-sm text-muted-foreground">{selectedResource.category}</p>
                                </div>
                                <button onClick={() => setSelectedResource(null)} className="px-4 py-2 hover:bg-destructive/10 text-destructive rounded-lg">Kapat</button>
                            </div>

                            {/* Tabs Navigation */}
                            <div className="flex border-b border-border bg-card overflow-x-auto">
                                {[
                                    { id: 0, label: '📄 PDF', icon: FileText },
                                    { id: 1, label: '📝 Özet', icon: Sparkles },
                                    { id: 2, label: '🧠 Kartlar', icon: Brain },
                                    { id: 3, label: '🎯 Testler', icon: CheckSquare },
                                    { id: 4, label: '🎧 Medya', icon: Music }
                                ].map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setDetailTab(tab.id)}
                                        className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2 whitespace-nowrap ${detailTab === tab.id ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-hidden relative">
                                {/* TAB 0: PDF Viewer */}
                                {detailTab === 0 && (
                                    <div className="h-full p-4 bg-zinc-900/50">
                                        {renderPDFPreview()}
                                    </div>
                                )}

                                {/* TAB 1: AI Summary */}
                                {detailTab === 1 && (
                                    <div className="h-full flex flex-col">
                                        <div className="p-4 border-b border-border bg-muted/20 flex gap-4">
                                            <button
                                                onClick={handleSummarize}
                                                disabled={aiLoading}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                                            >
                                                <Sparkles size={16} /> {aiSummary ? 'Yeniden Özetle' : 'Özet Çıkar'}
                                            </button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-6">
                                            {aiSummary ? (
                                                <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                                    <h3 className="font-bold mb-4 flex items-center gap-2 text-blue-400"><FileText size={20} /> AI Özet</h3>
                                                    <div className="prose prose-invert max-w-none text-sm whitespace-pre-wrap leading-relaxed opacity-90">{aiSummary}</div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-20 text-muted-foreground opacity-50">
                                                    <Sparkles size={48} className="mx-auto mb-3" />
                                                    <p>Bu kaynağın özetini çıkarmak için butona tıkla.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* TAB 2: Flashcards */}
                                {detailTab === 2 && (
                                    <div className="h-full flex flex-col">
                                        <div className="p-4 border-b border-border bg-muted/20 flex gap-4 items-center">
                                            <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5 has-[:focus]:border-primary transition-colors">
                                                <span className="text-xs text-muted-foreground font-medium">Adet:</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="50"
                                                    value={flashcardCount}
                                                    onChange={(e) => setFlashcardCount(parseInt(e.target.value) || 10)}
                                                    className="w-12 bg-transparent text-sm font-bold text-center focus:outline-none"
                                                />
                                            </div>
                                            <button
                                                onClick={handleGenerateFlashcards}
                                                disabled={aiLoading}
                                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
                                            >
                                                <Brain size={16} /> Hap Bilgi Üret
                                            </button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-6">
                                            {flashcards.length > 0 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {flashcards.map((card) => (
                                                        <div key={card.id} className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl relative group hover:bg-emerald-500/10 transition-colors animate-in fade-in zoom-in-95">
                                                            <div className="pr-8">
                                                                <span className="text-xs font-bold text-emerald-500 mb-2 block">{card.category}</span>
                                                                <p className="text-sm font-medium leading-relaxed">{card.content}</p>
                                                            </div>
                                                            <div className="absolute top-2 right-2 flex flex-col gap-1">
                                                                <button onClick={() => toggleFlashcardSave(card)} className="p-1.5 hover:bg-background rounded-full transition-colors">
                                                                    <Star size={16} className={card.isSaved ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"} />
                                                                </button>
                                                                <button onClick={() => deleteFlashcard(card.id)} className="p-1.5 hover:bg-destructive/20 rounded-full transition-colors text-destructive opacity-0 group-hover:opacity-100">
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-20 text-muted-foreground opacity-50">
                                                    <Brain size={48} className="mx-auto mb-3" />
                                                    <p>Henüz hap bilgi üretilmedi. Adeti seç ve üret!</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* TAB 3: Quizzes */}
                                {detailTab === 3 && (
                                    <div className="h-full flex flex-col">
                                        <div className="p-4 border-b border-border bg-muted/20 flex gap-4 items-center">
                                            <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-1.5 has-[:focus]:border-primary transition-colors">
                                                <span className="text-xs text-muted-foreground font-medium">Soru Sayısı:</span>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="50"
                                                    value={quizCount}
                                                    onChange={(e) => setQuizCount(parseInt(e.target.value) || 10)}
                                                    className="w-12 bg-transparent text-sm font-bold text-center focus:outline-none"
                                                />
                                            </div>
                                            <button
                                                onClick={handleGenerateQuestions}
                                                disabled={aiLoading}
                                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                                            >
                                                <Plus size={16} /> Soru Üret
                                            </button>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-6">
                                            {quizSets.length > 0 ? (
                                                <div className="space-y-6">
                                                    {/* Test Sets Tabs */}
                                                    <div className="flex gap-2 overflow-x-auto pb-2 border-b border-border/50">
                                                        {quizSets.map(set => (
                                                            <button
                                                                key={set.id}
                                                                onClick={() => setActiveSetId(set.id)}
                                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeSetId === set.id ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'bg-secondary hover:bg-secondary/80 text-muted-foreground'}`}
                                                            >
                                                                {set.name}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    {/* Active Test Questions */}
                                                    {activeSet && (
                                                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                                            {activeSet.questions.map((q, i) => (
                                                                <div key={q.id} className="p-5 bg-card border border-border rounded-xl relative">
                                                                    <div className="flex justify-between items-start mb-4">
                                                                        <span className="font-mono text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">Soru {i + 1}</span>
                                                                        <button onClick={() => toggleQuestionSave(q)} className="p-2 hover:bg-secondary rounded-full transition-colors" title="Havuza Kaydet">
                                                                            <Star size={18} className={q.isSaved ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"} />
                                                                        </button>
                                                                    </div>

                                                                    <p className="font-medium text-lg mb-4 leading-relaxed">{q.question}</p>

                                                                    <div className="grid gap-2">
                                                                        {q.options && q.options.length > 0 ? (
                                                                            q.options.map((opt, j) => {
                                                                                const isSelected = userAnswers[q.id] === opt;
                                                                                const isCorrect = opt === q.answer;
                                                                                const showResult = !!userAnswers[q.id];

                                                                                let btnClass = "w-full text-left p-3 rounded-lg border transition-all hover:bg-secondary/50 relative text-sm";
                                                                                if (showResult) {
                                                                                    if (isCorrect) btnClass = "w-full text-left p-3 rounded-lg bg-green-500/10 text-green-500 border-green-500/50 font-medium";
                                                                                    else if (isSelected) btnClass = "w-full text-left p-3 rounded-lg bg-red-500/10 text-red-500 border-red-500/50";
                                                                                    else btnClass = "w-full text-left p-3 rounded-lg border-transparent opacity-50";
                                                                                }

                                                                                return (
                                                                                    <button
                                                                                        key={j}
                                                                                        onClick={() => setUserAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                                                                        disabled={showResult}
                                                                                        className={btnClass}
                                                                                    >
                                                                                        {opt}
                                                                                    </button>
                                                                                );
                                                                            })
                                                                        ) : (
                                                                            <div className="p-3 text-destructive bg-destructive/10 rounded">
                                                                                ⚠️ Şıklar yüklenemedi.
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {userAnswers[q.id] && (
                                                                        <div className="mt-4 p-4 bg-secondary/30 rounded-lg text-sm border-l-4 border-primary animate-in fade-in">
                                                                            <div className="font-bold text-primary mb-1">Açıklama</div>
                                                                            <div className="text-muted-foreground leading-relaxed">{q.explanation}</div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="text-center py-20 text-muted-foreground opacity-50">
                                                    <Brain size={48} className="mx-auto mb-3" />
                                                    <p>Henüz test oluşturulmadı. Soru sayısını seç ve üret!</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* TAB 4: Media */}
                                {detailTab === 4 && (
                                    <div className="h-full p-6 overflow-y-auto">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                                            {/* Audio Section */}
                                            <div className="p-6 bg-card border border-border rounded-xl">
                                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                                    <Music className="text-pink-500" /> Ses Kaydı
                                                </h3>

                                                {selectedResource.audioFile ? (
                                                    <div className="space-y-4">
                                                        <div className="bg-secondary p-4 rounded-lg flex items-center justify-between">
                                                            <span className="text-sm font-medium truncate">{selectedResource.audioFile.name}</span>
                                                            <button
                                                                onClick={() => persistResourceState({ audioFile: null })}
                                                                className="text-destructive hover:bg-destructive/10 p-2 rounded"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                        <audio controls className="w-full" src={URL.createObjectURL(selectedResource.audioFile)} />
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors cursor-pointer" onClick={() => audioInputRef.current.click()}>
                                                        <Music size={32} className="mx-auto mb-2 text-muted-foreground" />
                                                        <p className="text-sm font-medium">Ses Dosyası Ekle</p>
                                                        <p className="text-xs text-muted-foreground mt-1">.mp3, .wav</p>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    ref={audioInputRef}
                                                    className="hidden"
                                                    accept="audio/*"
                                                    onChange={(e) => handleAddMedia('audio', e.target.files[0])}
                                                />
                                            </div>

                                            {/* Video Section */}
                                            <div className="p-6 bg-card border border-border rounded-xl">
                                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                                    <Video className="text-blue-500" /> Video
                                                </h3>

                                                {selectedResource.videoFile ? (
                                                    <div className="space-y-4">
                                                        <div className="bg-secondary p-4 rounded-lg flex items-center justify-between">
                                                            <span className="text-sm font-medium truncate">{selectedResource.videoFile.name}</span>
                                                            <button
                                                                onClick={() => persistResourceState({ videoFile: null })}
                                                                className="text-destructive hover:bg-destructive/10 p-2 rounded"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                        <video controls className="w-full rounded-lg" src={URL.createObjectURL(selectedResource.videoFile)} />
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8 border-2 border-dashed border-border rounded-lg hover:border-primary transition-colors cursor-pointer" onClick={() => videoInputRef.current.click()}>
                                                        <Video size={32} className="mx-auto mb-2 text-muted-foreground" />
                                                        <p className="text-sm font-medium">Video Dosyası Ekle</p>
                                                        <p className="text-xs text-muted-foreground mt-1">.mp4, .mov</p>
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    ref={videoInputRef}
                                                    className="hidden"
                                                    accept="video/*"
                                                    onChange={(e) => handleAddMedia('video', e.target.files[0])}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <ResourceUploadModal isOpen={showUploadModal} onClose={() => setShowUploadModal(false)} onSave={handleResourceUpload} folders={folders} />
            </div>
        );
    }

    export default Library;
