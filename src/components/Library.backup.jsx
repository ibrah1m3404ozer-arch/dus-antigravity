import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Loader2, BookOpen, Trash2, FolderPlus, Folder, ChevronRight, X, Sparkles, Home, MoreVertical, Brain, Bot, FileJson, PlayCircle, PauseCircle, StopCircle, GraduationCap, XCircle, CheckCircle2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { summarizeText, generateFlashcards, generateQuiz, generatePodcastScript } from '../services/aiService';
import { saveArticle, getAllArticles, deleteArticle, createFolder, getFolders, deleteFolder, savePearl, saveQuestion, forceCloseDB } from '../utils/db';
import ResourceUploadModal from './ResourceUploadModal';

// Worker configuration
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

function Library() {
    // Data State
    const [articles, setArticles] = useState([]);
    const [folders, setFolders] = useState([]);

    // UI State
    const [currentFolderId, setCurrentFolderId] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState('');
    const [activeArticleId, setActiveArticleId] = useState(null); // For dropdown menu

    // Modals
    const [summaryModal, setSummaryModal] = useState(null);
    const [quizModal, setQuizModal] = useState(null); // { step: 'config' | 'loading' | 'preview', data: [], article: null }
    const [flashcardModal, setFlashcardModal] = useState(null); // { status: 'loading' | 'preview', data: [], article: null }
    const [moveModal, setMoveModal] = useState(null); // { article, targetFolder }
    const [showUploadModal, setShowUploadModal] = useState(false);

    // Podcast State
    const [isPlayingPodcast, setIsPlayingPodcast] = useState(false);
    const [podcastText, setPodcastText] = useState(null);
    const [podcastStatus, setPodcastStatus] = useState('idle'); // idle, generating, playing, paused
    const synthRef = useRef(window.speechSynthesis);
    const utteranceRef = useRef(null);

    // Create Folder State
    const [showCreateFolder, setShowCreateFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    useEffect(() => {
        loadData();
        return () => {
            if (synthRef.current) synthRef.current.cancel(); // Cleanup speech
        };
    }, []);

    const loadData = async () => {
        try {
            const [loadedArticles, loadedFolders] = await Promise.all([
                getAllArticles(),
                getFolders()
            ]);
            setArticles(loadedArticles.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            setFolders(loadedFolders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        } catch (error) {
            console.error("Load Data Failed:", error);
        }
    };

    // --- PDF EXTRACTION ---
    const extractTextFromPDF = async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item) => item.str).join(' ');
            fullText += pageText + ' ';
        }
        return fullText;
    };

    // --- HANDLERS ---
    const handleCreateFolder = async (e) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;
        try {
            const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("DB_TIMEOUT")), 5000));
            await Promise.race([createFolder(newFolderName.trim()), timeout]);
            setNewFolderName('');
            setShowCreateFolder(false);
            await loadData();
        } catch (error) {
            if (error.message === "DB_TIMEOUT") alert("Veritabanı yanıt vermiyor. Lütfen 'Ayarlar -> Veritabanı Sıfırla' yapın.");
            else alert("Klasör oluşturulamadı: " + error.message);
        }
    };

    const [uploadError, setUploadError] = useState(null);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        setUploadError(null);
        setUploadStatus('Başlatılıyor...');

        try {
            console.log("Starting PDF extraction...");
            setUploadStatus('PDF taranıyor (OCR)...');
            const text = await extractTextFromPDF(file);
            console.log("PDF Extracted. Length:", text?.length);

            if (!text || text.trim().length < 50) {
                throw new Error('PDF boş veya okunamadı. (Metin bulunamadı)');
            }

            setUploadStatus('Veritabanına yazılıyor...');
            const newArticle = {
                id: Date.now().toString(),
                folderId: currentFolderId,
                title: file.name.replace('.pdf', ''),
                content: text,
                fileBlob: file,
                createdAt: new Date().toISOString()
            };

            // Log the article object to check if fileBlob is valid
            console.log("Saving article:", newArticle.title, "Blob size:", file.size);

            // PREVENTIVE CHECK: If file is too large (> 7MB), don't even try to save Blob
            // This prevents the DB lock/crash in the first place.
            let articleToSave = { ...newArticle };
            let skippedBlob = false;

            if (file.size > 7 * 1024 * 1024) { // 7MB Limit
                console.warn("File too large (" + (file.size / 1024 / 1024).toFixed(2) + "MB). Skipping Blob save.");
                articleToSave.fileBlob = null;
                articleToSave.title += ' (Sadece Metin)';
                skippedBlob = true;
            }

            try {
                // Save attempt
                const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("DB_TIMEOUT")), 15000));
                await Promise.race([saveArticle(articleToSave), timeout]);

                if (skippedBlob) {
                    alert("Dosya boyutu büyük (>7MB) olduğu için PDF önizlemesi veritabanına kaydedilmedi. Ancak içerik, özet ve soru özellikleri sorunsuz çalışır!");
                }
            } catch (err) {
                if (err.message === "DB_TIMEOUT") {
                    console.warn("Full save timed out. Killing DB connection and retrying text-only...");
                    setUploadStatus('⚠️ Veritabanı yanıt vermiyor. Bağlantı yenileniyor...');

                    // FORCE CLOSE DB TO CLEAR STUCK TRANSACTION
                    await forceCloseDB();
                    await new Promise(r => setTimeout(r, 1000));

                    setUploadStatus('⚠️ Dosya büyük, sadece metin kaydediliyor...');

                    // FALLBACK: Remove Blob and try again
                    const textOnlyArticle = { ...newArticle, fileBlob: null, title: newArticle.title + ' (Sadece Metin)' };
                    const retryTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error("DB_TIMEOUT_RETRY")), 10000));
                    await Promise.race([saveArticle(textOnlyArticle), retryTimeout]);

                    alert("Dosya boyutu veritabanı için çok büyüktü. Sadece metin içeriği kaydedildi. (Özellikler çalışır, ancak PDF görüntülenemez.)");
                } else {
                    throw err; // Rethrow other errors
                }
            }

        } finally {
            e.target.value = null;
        }
    };

    // New Hybrid Upload Handler (from ResourceUploadModal)
    const handleResourceUpload = async (resourceData) => {
        setShowUploadModal(false);
        setIsUploading(true);
        setUploadStatus('PDF işleniyor...');

        try {
            // Extract text from PDF
            const text = await extractTextFromPDF(resourceData.pdfFile);

            if (!text || text.trim().length < 50) {
                throw new Error('PDF boş veya okunamadı.');
            }

            setUploadStatus('Kaydediliyor...');

            // Create article with all hybrid fields
            const newArticle = {
                id: Date.now().toString(),
                folderId: currentFolderId,
                title: resourceData.title,
                content: text,
                fileBlob: resourceData.pdfFile,
                category: resourceData.category,
                manualSummary: resourceData.manualSummary || '',
                audioFile: resourceData.audioFile || null,
                videoFile: resourceData.videoFile || null,
                createdAt: new Date().toISOString()
            };

            await saveArticle(newArticle);
            console.log('✅ Hybrid resource saved!', newArticle.title);

            setUploadStatus('✅ Kaynak eklendi!');
            await loadData();
        } catch (error) {
            console.error('Resource upload error:', error);
            setUploadError(error.message || 'Kaynak eklenemedi.');
        } finally {
            setIsUploading(false);
            setTimeout(() => {
                setUploadStatus('');
                setUploadError(null);
            }, 3000);
        }
    };

    const handleDeleteArticle = async (id, e) => {
        e.stopPropagation();
        if (window.confirm("Silmek istediğinize emin misiniz?")) {
            await deleteArticle(id);
            loadData();
        }
    };

    const handleMoveArticle = async (folderId) => {
        if (!moveModal?.article) return;
        try {
            const updatedArticle = { ...moveModal.article, folderId };
            await saveArticle(updatedArticle);
            await loadData();
            setMoveModal(null);
            setActiveArticleId(null);
        } catch (e) {
            alert("Taşıma hatası: " + e.message);
        }
    };

    // --- AI ACTIONS ---

    // 1. SUMMARY
    const handleSummarize = async (article) => {
        setActiveArticleId(null); // Close menu

        // Check if summary already exists (cached)
        if (article.summary) {
            setSummaryModal({ ...article, summary: article.summary });
            return;
        }

        // Generate new summary
        setUploadStatus('Özetleniyor...');
        try {
            const apiKey = localStorage.getItem('gemini_api_key');
            const summary = await summarizeText(article.content.slice(0, 40000), apiKey);

            // Save summary to article
            const updatedArticle = { ...article, summary };
            await saveArticle(updatedArticle);
            await loadData(); // Refresh to get updated article

            setSummaryModal({ ...updatedArticle, summary });
        } catch (e) {
            alert("Özet Hata: " + e.message);
        } finally {
            setUploadStatus('');
        }
    };

    const handleRegenerateSummary = async () => {
        if (!summaryModal) return;
        setUploadStatus('Yeniden oluşturuluyor...');
        setSummaryModal({ ...summaryModal, summary: null }); // Clear current

        try {
            const apiKey = localStorage.getItem('gemini_api_key');
            const summary = await summarizeText(summaryModal.content.slice(0, 40000), apiKey);

            // Save to article
            const updatedArticle = { ...summaryModal, summary };
            await saveArticle(updatedArticle);
            await loadData();

            setSummaryModal({ ...updatedArticle, summary });
        } catch (e) {
            alert("Yeniden Oluşturma Hatası: " + e.message);
        } finally {
            setUploadStatus('');
        }
    };

    // 2. FLASHCARDS
    const [selectedFlashcards, setSelectedFlashcards] = useState(new Set());

    const handleGenerateFlashcards = async (article) => {
        setFlashcardModal({ status: 'loading', article });
        setActiveArticleId(null);
        setSelectedFlashcards(new Set()); // Reset selection
        try {
            const apiKey = localStorage.getItem('gemini_api_key');
            const cards = await generateFlashcards(article.content.slice(0, 30000), apiKey);
            setFlashcardModal({ status: 'preview', data: cards, article });
            // Auto-select all cards by default
            setSelectedFlashcards(new Set(cards.map((_, i) => i)));
        } catch (e) {
            alert("Kart Üretme Hatası: " + e.message);
            setFlashcardModal(null);
        }
    };

    const toggleFlashcardSelection = (index) => {
        setSelectedFlashcards(prev => {
            const newSet = new Set(prev);
            if (newSet.has(index)) {
                newSet.delete(index);
            } else {
                newSet.add(index);
            }
            return newSet;
        });
    };

    const saveSelectedFlashcards = async () => {
        if (!flashcardModal?.data || selectedFlashcards.size === 0) {
            alert("Lütfen en az bir hap bilgi seçin!");
            return;
        }
        try {
            const selectedCards = flashcardModal.data.filter((_, i) => selectedFlashcards.has(i));
            for (const card of selectedCards) {
                await savePearl({
                    id: Date.now().toString() + Math.random(),
                    content: card.content,
                    category: card.category,
                    sourceId: flashcardModal.article.id,
                    isFavorite: false,
                    createdAt: new Date().toISOString()
                });
            }
            alert(`${selectedCards.length} hap bilgi başarıyla kaydedildi! Dashboard > Hap Bilgiler'de görebilirsiniz.`);
            setFlashcardModal(null);
            setSelectedFlashcards(new Set());
        } catch (e) {
            alert("Kaydetme hatası: " + e.message);
        }
    };

    // 3. QUIZ
    const handleGenerateQuiz = async (difficulty) => {
        const article = quizModal.article;
        setQuizModal({ ...quizModal, step: 'loading' });
        try {
            const apiKey = localStorage.getItem('gemini_api_key');
            const questions = await generateQuiz(article.content.slice(0, 30000), apiKey, difficulty);
            setQuizModal({ step: 'preview', data: questions, article });
        } catch (e) {
            alert("Soru Üretme Hatası: " + e.message);
            setQuizModal(null);
        }
    };

    const saveQuestionToBank = async (q) => {
        try {
            await saveQuestion({
                id: Date.now().toString() + Math.random(),
                ...q,
                sourceId: quizModal.article.id,
                createdAt: new Date().toISOString()
            });
            // Visual feedback could be added here (toast)
        } catch (e) {
            console.error(e);
        }
    };

    // 4. PODCAST
    const [podcastRate, setPodcastRate] = useState(1.0);
    const [podcastArticle, setPodcastArticle] = useState(null); // Track which article is playing

    const handlePodcast = async (article) => {
        setActiveArticleId(null);

        // If same article is already playing, toggle pause/play
        if (podcastStatus === 'playing' && podcastArticle?.id === article.id) {
            synthRef.current.pause();
            setPodcastStatus('paused');
            return;
        }

        // If different article or resuming
        if (podcastStatus === 'paused' && podcastArticle?.id === article.id) {
            synthRef.current.resume();
            setPodcastStatus('playing');
            return;
        }

        // Stop any existing playback
        if (synthRef.current) {
            synthRef.current.cancel();
        }

        // Check if podcast script is cached
        if (article.podcastScript) {
            startPodcastPlayback(article, article.podcastScript);
            return;
        }

        // Generate new podcast script
        setPodcastStatus('generating');
        try {
            const apiKey = localStorage.getItem('gemini_api_key');
            const script = await generatePodcastScript(article.content.slice(0, 20000), apiKey);

            // Save script to article
            const updatedArticle = { ...article, podcastScript: script };
            await saveArticle(updatedArticle);
            await loadData();

            startPodcastPlayback(updatedArticle, script);
        } catch (e) {
            alert("Podcast Hatası: " + e.message);
            setPodcastStatus('idle');
        }
    };

    const startPodcastPlayback = (article, script) => {
        setPodcastText(script);
        setPodcastArticle(article);

        const utterance = new SpeechSynthesisUtterance(script);
        utterance.lang = 'tr-TR';
        utterance.rate = podcastRate;

        utterance.onend = () => {
            setPodcastStatus('idle');
            setPodcastArticle(null);
        };
        utteranceRef.current = utterance;

        synthRef.current.speak(utterance);
        setPodcastStatus('playing');
    };

    const handleStopPodcast = () => {
        synthRef.current.cancel();
        setPodcastStatus('idle');
        setPodcastArticle(null);
    };

    const handlePodcastRateChange = (newRate) => {
        setPodcastRate(newRate);
        if (utteranceRef.current) {
            // Recreate utterance with new rate if playing
            if (podcastStatus === 'playing' || podcastStatus === 'paused') {
                const currentText = podcastText;
                synthRef.current.cancel();

                const utterance = new SpeechSynthesisUtterance(currentText);
                utterance.lang = 'tr-TR';
                utterance.rate = newRate;
                utterance.onend = () => {
                    setPodcastStatus('idle');
                    setPodcastArticle(null);
                };
                utteranceRef.current = utterance;
                synthRef.current.speak(utterance);
                setPodcastStatus('playing');
            }
        }
    };

    const estimatePodcastDuration = () => {
        if (!podcastText) return "0:00";
        // Rough estimate: average Turkish speech is ~150 words per minute
        const words = podcastText.split(/\s+/).length;
        const minutes = Math.floor((words / 150) / podcastRate);
        const seconds = Math.round(((words / 150) / podcastRate % 1) * 60);
        return `~${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const togglePodcastPlayback = () => {
        if (podcastStatus === 'playing') {
            synthRef.current.pause();
            setPodcastStatus('paused');
        } else if (podcastStatus === 'paused') {
            synthRef.current.resume();
            setPodcastStatus('playing');
        }
    };

    // --- RENDER ---
    const filteredArticles = articles.filter(a => a.folderId === currentFolderId || (!a.folderId && currentFolderId === null));
    const showFolders = currentFolderId === null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
                        Akıllı Kütüphane
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                        <button onClick={() => setCurrentFolderId(null)} className={`flex items-center gap-1 hover:text-primary ${!currentFolderId && 'font-bold text-primary'}`}>
                            <Home size={14} /> Kütüphanem
                        </button>
                        {currentFolderId && (
                            <>
                                <ChevronRight size={16} />
                                <span className="font-semibold">{folders.find(f => f.id === currentFolderId)?.name || 'Klasör'}</span>
                            </>
                        )}
                    </div>
                </div>
                {/* Podcast Controls (Floating or Fixed) */}
                {podcastStatus !== 'idle' && (
                    <div className="fixed bottom-6 right-6 z-50 bg-card border border-border p-5 rounded-2xl shadow-2xl flex flex-col gap-3 animate-in slide-in-from-bottom-5 w-80">
                        <div className="flex items-center gap-3">
                            <div className="bg-primary/20 p-2 rounded-full animate-pulse text-primary">
                                <Bot size={24} />
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-primary">AI Sesli Özet</p>
                                <p className="text-[10px] text-muted-foreground line-clamp-1">{podcastArticle?.title || "Oynatılıyor..."}</p>
                            </div>
                            <button onClick={handleStopPodcast} className="p-1.5 hover:bg-destructive/10 text-destructive rounded-full">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Duration Display */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Süre: {estimatePodcastDuration()}</span>
                            <span className="text-primary font-medium">
                                {podcastStatus === 'generating' ? 'Oluşturuluyor...' : podcastStatus === 'playing' ? 'Oynatılıyor' : 'Duraklatıldı'}
                            </span>
                        </div>

                        {/* Play/Pause Button */}
                        <button
                            onClick={() => podcastArticle && handlePodcast(podcastArticle)}
                            className="w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-medium flex items-center justify-center gap-2"
                        >
                            {podcastStatus === 'playing' ? (
                                <><PauseCircle size={20} /> Duraklat</>
                            ) : (
                                <><PlayCircle size={20} /> Devam Et</>
                            )}
                        </button>

                        {/* Speed Controls */}
                        <div className="flex gap-2">
                            <span className="text-xs text-muted-foreground self-center">Hız:</span>
                            {[0.75, 1.0, 1.25, 1.5, 2.0].map(rate => (
                                <button
                                    key={rate}
                                    onClick={() => handlePodcastRateChange(rate)}
                                    className={`flex-1 py-1.5 text-xs rounded-md transition-all ${podcastRate === rate
                                        ? 'bg-primary text-primary-foreground font-bold'
                                        : 'bg-secondary/50 hover:bg-secondary'
                                        }`}
                                >
                                    {rate}x
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                {!currentFolderId && (
                    <button onClick={() => setShowCreateFolder(true)} className="flex items-center gap-2 px-4 py-2 bg-secondary/50 hover:bg-secondary rounded-lg text-sm font-medium border border-border">
                        <FolderPlus size={18} /> Yeni Klasör
                    </button>
                )}
            </div>

            {/* Folder Input */}
            {showCreateFolder && (
                <form onSubmit={handleCreateFolder} className="bg-card border border-border p-4 rounded-xl flex gap-2 animate-in slide-in-from-top-2">
                    <input autoFocus type="text" placeholder="Klasör Adı..." className="flex-1 bg-transparent border-none outline-none text-lg font-medium" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} />
                    <button type="button" onClick={() => setShowCreateFolder(false)} className="px-3 text-sm text-muted-foreground">İptal</button>
                    <button type="submit" className="px-4 bg-primary text-primary-foreground rounded-lg font-medium text-sm">Oluştur</button>
                </form>
            )}

            {/* Content Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {/* Folders */}
                {showFolders && folders.map(folder => (
                    <div key={folder.id} onClick={() => setCurrentFolderId(folder.id)} className="aspect-square bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/10 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 cursor-pointer group relative">
                        <Folder size={64} className="text-blue-400 fill-blue-400/20 group-hover:scale-110 transition-transform" />
                        <span className="font-semibold text-center text-sm">{folder.name}</span>
                        <button onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id).then(loadData); }} className="absolute top-2 right-2 p-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                    </div>
                ))}

                {/* Upload Button */}
                <div className="aspect-square border-2 border-dashed border-border hover:border-primary/50 bg-card/30 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer group relative overflow-hidden">
                    {isUploading ? (
                        <div className="flex flex-col items-center px-4 text-center">
                            {uploadError ? (
                                <>
                                    <XCircle className="text-destructive mb-2" size={32} />
                                    <span className="text-xs font-bold text-destructive break-words w-full">{uploadError}</span>
                                    <button onClick={(e) => { e.stopPropagation(); setIsUploading(false); }} className="mt-2 text-[10px] underline text-muted-foreground">kapat</button>
                                </>
                            ) : (
                                <>
                                    <Loader2 className="animate-spin text-primary mb-2" size={32} />
                                    <span className="text-xs font-medium text-primary">{uploadStatus}</span>
                                </>
                            )}
                        </div>
                    ) : (
                        <>
                            <div className="p-3 bg-primary/10 rounded-full text-primary group-hover:scale-110 transition-transform"><Upload size={24} /></div>
                            <span className="text-sm font-medium">Dosya Yükle</span>
                            <input type="file" accept="application/pdf" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                        </>
                    )}
                </div>

                {/* Articles */}
                {filteredArticles.map(article => (
                    <div key={article.id} className="aspect-square bg-card hover:bg-accent/5 border border-border rounded-2xl p-4 flex flex-col justify-between group relative">
                        <div className="flex justify-between items-start">
                            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500"><FileText size={24} /></div>
                            <div className="relative">
                                <button onClick={(e) => { e.stopPropagation(); setActiveArticleId(activeArticleId === article.id ? null : article.id); }} className="p-1 hover:bg-secondary rounded-full"><MoreVertical size={16} /></button>

                                {/* MAGIC MENU */}
                                {activeArticleId === article.id && (
                                    <div className="absolute right-0 top-8 w-48 bg-popover border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in zoom-in-95 origin-top-right">
                                        <button onClick={() => handleSummarize(article)} className="w-full text-left px-4 py-3 hover:bg-secondary flex items-center gap-2 text-sm"><Sparkles size={16} className="text-yellow-500" /> Özetle</button>
                                        <button onClick={() => handleGenerateFlashcards(article)} className="w-full text-left px-4 py-3 hover:bg-secondary flex items-center gap-2 text-sm"><FileJson size={16} className="text-emerald-500" /> Hap Bilgi (Flashcard)</button>
                                        <button onClick={() => setQuizModal({ step: 'config', article })} className="w-full text-left px-4 py-3 hover:bg-secondary flex items-center gap-2 text-sm"><Brain size={16} className="text-purple-500" /> Soru Üret (Quiz)</button>
                                        <button onClick={() => handlePodcast(article)} className="w-full text-left px-4 py-3 hover:bg-secondary flex items-center gap-2 text-sm"><Bot size={16} className="text-blue-500" /> Sesli Anlat (Podcast)</button>
                                        <div className="h-px bg-border my-1"></div>
                                        <button onClick={() => setMoveModal({ article, targetFolder: null })} className="w-full text-left px-4 py-3 hover:bg-secondary flex items-center gap-2 text-sm"><Folder size={16} className="text-orange-500" /> Taşı</button>
                                        <button onClick={(e) => handleDeleteArticle(article.id, e)} className="w-full text-left px-4 py-3 hover:bg-destructive/10 text-destructive flex items-center gap-2 text-sm"><Trash2 size={16} /> Sil</button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-medium text-sm line-clamp-2 mb-1" title={article.title}>{article.title}</h3>
                            <p className="text-[10px] text-muted-foreground">{new Date(article.createdAt).toLocaleDateString()}</p>
                        </div>
                        <button onClick={() => window.open(URL.createObjectURL(article.fileBlob), '_blank')} className="w-full py-2 bg-secondary/50 hover:bg-secondary rounded-lg text-xs font-bold mt-2">PDF AÇ</button>

                        {/* Outside click handler for menu could be added here or on main div */}
                        {activeArticleId === article.id && <div className="fixed inset-0 z-40" onClick={() => setActiveArticleId(null)}></div>}
                    </div>
                ))}
            </div>

            {/* --- MODALS --- */}

            {/* 1. SUMMARY MODAL */}
            {summaryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSummaryModal(null)}>
                    <div className="bg-card w-full max-w-3xl max-h-[85vh] rounded-2xl flex flex-col p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold flex gap-2"><Sparkles className="text-yellow-500" /> AI Özeti</h3>
                            <button onClick={handleRegenerateSummary} className="text-xs px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg font-medium flex items-center gap-1">
                                <Sparkles size={14} /> Yeniden Oluştur
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 prose prose-invert max-w-none text-sm whitespace-pre-wrap">{summaryModal.summary || "Yükleniyor..."}</div>
                        <button onClick={() => setSummaryModal(null)} className="mt-4 w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl">Kapat</button>
                    </div>
                </div>
            )}

            {/* 2. FLASHCARD MODAL */}
            {flashcardModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-card w-full max-w-2xl max-h-[80vh] rounded-2xl p-6 shadow-2xl flex flex-col">
                        {flashcardModal.status === 'loading' ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <Loader2 className="animate-spin text-primary mb-4" size={48} />
                                <h3 className="text-xl font-bold">Hap Bilgiler Çıkarılıyor...</h3>
                                <p className="text-muted-foreground">AI ders notlarını tarıyor.</p>
                            </div>
                        ) : (
                            <>
                                <h3 className="text-xl font-bold mb-4 flex gap-2">
                                    <FileJson className="text-emerald-500" /> Bulunan Hap Bilgiler ({flashcardModal.data.length})
                                </h3>
                                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                                    {flashcardModal.data.map((card, i) => (
                                        <div
                                            key={i}
                                            onClick={() => toggleFlashcardSelection(i)}
                                            className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedFlashcards.has(i)
                                                ? 'bg-emerald-500/10 border-emerald-500/40'
                                                : 'bg-secondary/30 border-border hover:border-emerald-500/20'
                                                }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedFlashcards.has(i)}
                                                    onChange={() => toggleFlashcardSelection(i)}
                                                    className="mt-1 w-4 h-4 accent-emerald-500"
                                                />
                                                <div className="flex-1">
                                                    <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded mb-2 inline-block">{card.category}</span>
                                                    <p className="font-medium">{card.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-3 mt-4">
                                    <button onClick={() => setFlashcardModal(null)} className="flex-1 py-3 bg-secondary hover:bg-secondary/80 rounded-xl font-bold">İptal</button>
                                    <button onClick={saveSelectedFlashcards} className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90">
                                        Seçilenleri Kaydet ({selectedFlashcards.size})
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* 3. QUIZ MODAL */}
            {quizModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-card w-full max-w-2xl max-h-[80vh] rounded-2xl p-6 shadow-2xl flex flex-col">

                        {quizModal.step === 'config' && (
                            <>
                                <h3 className="text-2xl font-bold mb-2">Soru Üretici ⚡</h3>
                                <p className="text-muted-foreground mb-6">Yapay zeka bu nottan nasıl sorular çıkarsın?</p>
                                <div className="space-y-3">
                                    <button onClick={() => handleGenerateQuiz("Zor, Klinik Vaka")} className="w-full text-left p-4 rounded-xl border-2 border-border hover:border-purple-500 hover:bg-purple-500/5 transition-all group">
                                        <span className="font-bold block text-lg group-hover:text-purple-400">🔥 Zor & Klinik Vaka</span>
                                        <span className="text-sm text-muted-foreground">Gerçek DUS simülasyonu. Vaka analizi gerektirir.</span>
                                    </button>
                                    <button onClick={() => handleGenerateQuiz("Orta, Spot Bilgi")} className="w-full text-left p-4 rounded-xl border-2 border-border hover:border-blue-500 hover:bg-blue-500/5 transition-all group">
                                        <span className="font-bold block text-lg group-hover:text-blue-400">💡 Orta & Spot Bilgi</span>
                                        <span className="text-sm text-muted-foreground">Temel kavramları ve sayısal değerleri test eder.</span>
                                    </button>
                                </div>
                                <button onClick={() => setQuizModal(null)} className="mt-auto pt-4 text-muted-foreground hover:text-foreground">İptal</button>
                            </>
                        )}

                        {quizModal.step === 'loading' && (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <Loader2 className="animate-spin text-purple-500 mb-4" size={48} />
                                <h3 className="text-xl font-bold">Sorular Hazırlanıyor...</h3>
                                <p className="text-muted-foreground">Komisyon soruları yazıyor.</p>
                            </div>
                        )}

                        {quizModal.step === 'preview' && (
                            <>
                                <h3 className="text-xl font-bold mb-4">Üretilen Sorular ({quizModal.data.length})</h3>
                                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                                    {quizModal.data.map((q, i) => (
                                        <div key={i} className="p-4 bg-secondary/30 rounded-xl relative group">
                                            <div className="absolute top-4 right-4 opactiy-0">
                                                <button onClick={() => saveQuestionToBank(q)} className="p-2 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-110 transition-transform"><CheckCircle2 size={16} /></button>
                                            </div>
                                            <p className="font-bold mb-2">{i + 1}. {q.question}</p>
                                            <ul className="text-sm space-y-1 pl-4 list-disc text-muted-foreground">
                                                {q.options.map(opt => <li key={opt}>{opt}</li>)}
                                            </ul>
                                            <div className="mt-3 p-2 bg-emerald-500/10 text-emerald-500 text-xs rounded border border-emerald-500/20">
                                                Cevap: {q.answer}
                                            </div>
                                            <button onClick={(e) => { e.target.innerText = "Eklendi!"; e.target.disabled = true; saveQuestionToBank(q); }} className="mt-3 w-full py-2 bg-purple-600/20 text-purple-400 hover:bg-purple-600 hover:text-white rounded-lg text-xs font-bold transition-all">
                                                Havusa Ekle
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-3 mt-4">
                                    <button onClick={() => setQuizModal(null)} className="w-full py-3 bg-secondary hover:bg-secondary/80 rounded-xl font-bold">Kapat</button>
                                    <button onClick={() => {
                                        quizModal.data.forEach(q => saveQuestionToBank(q));
                                        setQuizModal(null);
                                        alert("Tümü havuza eklendi!");
                                    }} className="w-full py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700">Tümünü Ekle</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* 4. MOVE MODAL */}
            {moveModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setMoveModal(null)}>
                    <div className="bg-card w-full max-w-md rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4 flex gap-2"><Folder className="text-orange-500" /> Dosyayı Taşı</h3>
                        <p className="text-sm text-muted-foreground mb-4">"{moveModal.article.title}" dosyasını nereye taşımak istiyorsunuz?</p>

                        <div className="space-y-2 max-h-80 overflow-y-auto mb-4">
                            {/* Ana Klasör (Root) */}
                            <button
                                onClick={() => handleMoveArticle(null)}
                                className={`w-full text-left p-3 rounded-lg border-2 transition-all ${moveModal.article.folderId === null
                                    ? 'border-primary bg-primary/10 cursor-not-allowed'
                                    : 'border-border hover:border-primary hover:bg-secondary/50'
                                    }`}
                                disabled={moveModal.article.folderId === null}
                            >
                                <div className="flex items-center gap-2">
                                    <Home size={18} className="text-blue-500" />
                                    <span className="font-medium">Ana Klasör (Kütüphanem)</span>
                                    {moveModal.article.folderId === null && (
                                        <span className="ml-auto text-xs text-primary">Mevcut Konum</span>
                                    )}
                                </div>
                            </button>

                            {/* Klasörler */}
                            {folders.map(folder => (
                                <button
                                    key={folder.id}
                                    onClick={() => handleMoveArticle(folder.id)}
                                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${moveModal.article.folderId === folder.id
                                        ? 'border-primary bg-primary/10 cursor-not-allowed'
                                        : 'border-border hover:border-primary hover:bg-secondary/50'
                                        }`}
                                    disabled={moveModal.article.folderId === folder.id}
                                >
                                    <div className="flex items-center gap-2">
                                        <Folder size={18} className="text-blue-400" />
                                        <span className="font-medium">{folder.name}</span>
                                        {moveModal.article.folderId === folder.id && (
                                            <span className="ml-auto text-xs text-primary">Mevcut Konum</span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button onClick={() => setMoveModal(null)} className="w-full py-3 bg-secondary hover:bg-secondary/80 rounded-xl font-bold">İptal</button>
                    </div>
                </div>
            )}

            {/* Resource Upload Modal */}
            <ResourceUploadModal
                isOpen={showUploadModal}
                onClose={() => setShowUploadModal(false)}
                onSave={handleResourceUpload}
                folders={folders}
            />
        </div >
    );
}

export default Library;
