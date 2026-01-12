import React, { useState, useEffect } from 'react';
import { FileText, Rss, TrendingUp, Sparkles, Upload, ExternalLink, RefreshCw, MessageSquare, Repeat, Video, PenTool, Image as ImageIcon, Briefcase, CheckCircle, X, ChevronsRight, Trash2, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { getAllArticles, saveArticle, deleteArticle } from '../utils/db';
import { summarizeText } from '../services/aiService';
import ResourceUploadModal from './ResourceUploadModal';
// pdfjs-dist removed - PDF text extraction temporarily disabled

// Market Focused Feeds
const RSS_FEEDS = [
    { name: 'Investing Piyasa', url: 'https://tr.investing.com/rss/market_overview.rss' },
    { name: 'Bigpara', url: 'https://www.bigpara.com/rss/' },
    { name: 'Bloomberg HT', url: 'https://www.bloomberght.com/rss' },
    { name: 'Foreks', url: 'https://www.foreks.com/rss' }
];

// Proxy Rotation Strategy
const PROXIES = [
    // 1. AllOrigins (Most compatible)
    (url) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    // 2. CodeTabs (Good fallback)
    (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    // 3. CorsProxy.io (Another option)
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`
];

function FinanceNewsHub() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('live'); // Default back to Live
    const [reports, setReports] = useState([]);
    const [showUpload, setShowUpload] = useState(false);
    const [processingOp, setProcessingOp] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [inlineResults, setInlineResults] = useState({});

    useEffect(() => {
        fetchNews();
        loadReports();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const fetchUniqueRSS = async (url) => {
        for (const proxyGen of PROXIES) {
            try {
                const proxyUrl = proxyGen(url);
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s Timeout

                const response = await fetch(proxyUrl, { signal: controller.signal });
                clearTimeout(timeoutId);

                if (!response.ok) continue;

                const data = await response.json(); // AllOrigins/CodeTabs usually return JSON with contents
                const xmlString = data.contents || data; // Handle different proxy responses

                const parser = new DOMParser();
                const xml = parser.parseFromString(xmlString, 'text/xml');
                const items = Array.from(xml.querySelectorAll('item'));

                if (items.length > 0) return items;
            } catch (e) {
                console.warn('Proxy failed:', e);
                continue; // Try next proxy
            }
        }
        return [];
    };

    const fetchNews = async () => {
        setLoading(true);
        try {
            const allNews = [];
            // Use Promise.all to fetch feeds in parallel
            await Promise.all(RSS_FEEDS.map(async (feed) => {
                const items = await fetchUniqueRSS(feed.url);

                const feedItems = items.map(item => {
                    const title = item.querySelector('title')?.textContent || '';
                    const desc = item.querySelector('description')?.textContent?.replace(/<[^>]*>/g, '') || '';

                    // MARKET FILTER: Only keep relevant items
                    const keywords = ['borsa', 'hisse', 'dolar', 'altın', 'piyasa', 'faiz', 'enflasyon', 'tcmb', 'fed', 'ekonomi'];
                    const content = (title + ' ' + desc).toLowerCase();
                    const isRelevant = keywords.some(k => content.includes(k));

                    if (!isRelevant) return null;

                    return {
                        source: feed.name,
                        title: title,
                        link: item.querySelector('guid')?.textContent || item.querySelector('link')?.textContent,
                        pubDate: item.querySelector('pubDate')?.textContent,
                        description: desc.slice(0, 150) + (desc.length > 150 ? '...' : '')
                    };
                }).filter(Boolean).slice(0, 5); // Limit per feed

                allNews.push(...feedItems);
            }));

            // Sort by date (desc)
            allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

            if (allNews.length === 0) throw new Error("Haber bulunamadı");

            setNews(allNews);
            showToast('Piyasa haberleri güncellendi');
        } catch (error) {
            console.error('Feed Error', error);
            showToast('Haber akışı alınamadı. İnternet bağlantınızı kontrol edin.', 'error');
            // Fallback mock
            if (news.length === 0) setNews([
                { source: 'Sistem', title: 'Haber Kaynaklarına Erişilemiyor', pubDate: new Date().toUTCString(), description: 'Vekil sunucular yanıt vermiyor veya internet bağlantısı yok. Daha sonra tekrar deneyin.' },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const loadReports = async () => {
        const all = await getAllArticles();
        setReports(all.filter(a => ['Finans', 'Ekonomi', 'Borsa', 'Kripto', 'Altın', 'Döviz', 'Rapor'].includes(a.category) || a.category === 'Diğer'));
    };

    // ... (PDF & AI Logic remains same) ...
    const extractTextFromPDF = async (file) => {
        // PDF text extraction temporarily disabled
        return "PDF metin okuma şu an bakımdadır. Lütfen manuel özet girin.";
    };

    const handleSaveReport = async (data) => {
        setUploading(true);
        try {
            let content = data.manualSummary || '';
            if (data.pdfFile && !content) {
                try {
                    content = await extractTextFromPDF(data.pdfFile);
                } catch (err) {
                    content = "PDF içeriği okunamadı. Lütfen manuel özet girin.";
                }
            }
            const newReport = {
                id: Date.now().toString(),
                title: data.title,
                category: data.category,
                content: content,
                type: 'report',
                createdAt: new Date().toISOString(),
                manualSummary: data.manualSummary,
                fileName: data.pdfFile?.name,
                fileData: data.pdfFile
            };
            await saveArticle(newReport);
            await loadReports();
            setShowUpload(false);
            showToast('Dosya yüklendi ve işlendi ✅');
        } catch (error) {
            showToast('Yükleme hatası: ' + error.message, 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteReport = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('Bu raporu silmek istediğine emin misin?')) {
            await deleteArticle(id);
            await loadReports();
            showToast('Rapor silindi');
        }
    };

    const openPdf = (report) => {
        if (report.fileData) {
            const url = URL.createObjectURL(report.fileData);
            window.open(url, '_blank');
        } else {
            showToast('PDF verisi bulunamadı.', 'error');
        }
    };

    const generateContent = async (report, type) => {
        if (!report.content || report.content.length < 50) {
            showToast('İçerik çok kısa!', 'error');
            return;
        }
        setProcessingOp({ id: report.id, type });
        setInlineResults(prev => ({ ...prev, [report.id]: null }));
        try {
            const apiKey = localStorage.getItem('gemini_api_key');
            if (!apiKey) throw new Error('API Key eksik');

            let promptPrefix = "";
            let title = "";
            switch (type) {
                case 'summary': promptPrefix = "Özetle:\n\n"; title = "AI Özeti"; break;
                case 'tweet': promptPrefix = "Tweet yaz:\n\n"; title = "Tweet Taslağı"; break;
                case 'flood': promptPrefix = "Flood yaz:\n\n"; title = "Flood Taslağı"; break;
                case 'video': promptPrefix = "Video senaryosu:\n\n"; title = "Video Senaryosu"; break;
                case 'infographic': promptPrefix = "İnfografik hazırla:\n\n"; title = "İnfografik Planı"; break;
                default: promptPrefix = "Özetle:\n\n";
            }
            const content = report.content.slice(0, 15000);
            const result = await summarizeText(promptPrefix + content, apiKey);
            setInlineResults(prev => ({ ...prev, [report.id]: { title, content: result, type } }));
            showToast(`${title} oluşturuldu`);
        } catch (e) {
            showToast('Hata: ' + e.message, 'error');
        } finally {
            setProcessingOp(null);
        }
    };

    return (
        <div className="h-full flex flex-col space-y-6 p-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                        <span className="p-3 bg-fuchsia-500/20 text-fuchsia-400 rounded-2xl"><Briefcase size={32} /></span>
                        İÇERİK VE HABER STÜDYOSU
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium">Canlı piyasa haberleri, finansal analizler ve içerik üretim merkezi.</p>
                </div>
            </div>

            <div className="bg-card border border-border rounded-3xl overflow-hidden flex flex-col flex-1 shadow-2xl relative">
                {/* Header Tabs */}
                <div className="flex border-b border-border bg-black/20 backdrop-blur-sm">
                    <button
                        onClick={() => setActiveTab('live')}
                        className={`flex-1 py-5 font-bold flex items-center justify-center gap-2 transition-all relative ${activeTab === 'live' ? 'text-primary' : 'text-muted-foreground hover:bg-white/5'}`}
                    >
                        <Rss size={18} />
                        CANLI PİYASA
                        {activeTab === 'live' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('analysis')}
                        className={`flex-1 py-5 font-bold flex items-center justify-center gap-2 transition-all relative ${activeTab === 'analysis' ? 'text-purple-400' : 'text-muted-foreground hover:bg-white/5'}`}
                    >
                        <Sparkles size={18} />
                        İÇERİK STÜDYOSU
                        {activeTab === 'analysis' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-b from-transparent to-black/20 p-6">
                    {activeTab === 'live' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="col-span-full flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="animate-pulse w-2 h-2 rounded-full bg-green-500"></span>
                                    <span className="text-xs font-bold text-green-400 tracking-wider">CANLI PİYASA AKIŞI (Investing, Bigpara, BloombergHT)</span>
                                </div>
                                <button onClick={fetchNews} className="text-xs font-bold text-muted-foreground hover:text-white flex items-center gap-1 bg-white/5 px-3 py-1 rounded-full">
                                    <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> {loading ? 'YÜKLENİYOR...' : 'YENİLE'}
                                </button>
                            </div>

                            {news.map((item, idx) => (
                                <a
                                    key={idx}
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group bg-secondary/30 hover:bg-secondary/50 border border-white/5 hover:border-primary/50 p-5 rounded-2xl transition-all flex flex-col h-full relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 bg-white/10 px-2 py-1 rounded-bl-xl text-[9px] font-bold text-white uppercase tracking-wider">{item.source}</div>
                                    <h4 className="font-bold text-sm mb-3 group-hover:text-primary transition-colors line-clamp-3 leading-relaxed mt-2">{item.title}</h4>
                                    <p className="text-xs text-muted-foreground line-clamp-3 mb-4 flex-1">{item.description}</p>
                                    <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-muted-foreground">
                                        <span>{item.pubDate ? new Date(item.pubDate).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : 'Şimdi'}</span>
                                        <ExternalLink size={12} />
                                    </div>
                                </a>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Content Studio Logic (Reports List) */}
                            <div className="grid grid-cols-1 gap-6">
                                {reports.length === 0 ? (
                                    <div className="text-center py-20 border-2 border-dashed border-white/10 rounded-3xl">
                                        <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <FileText size={40} className="text-muted-foreground" />
                                        </div>
                                        <h3 className="text-lg font-bold text-white mb-2">Çalışma Masası Boş</h3>
                                        <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">Analiz etmek için dosya yükle.</p>
                                        <button onClick={() => setShowUpload(true)} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-purple-900/40 hover:-translate-y-1">Dosya Yükle</button>
                                    </div>
                                ) : (
                                    reports.map(report => (
                                        <div key={report.id} className="bg-gradient-to-r from-secondary/20 to-secondary/10 border border-white/5 p-6 rounded-2xl group shadow-sm">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-start gap-4 flex-1">
                                                    <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl cursor-pointer" onClick={() => openPdf(report)}><FileText size={24} /></div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-lg text-white mb-1 group-hover:text-purple-400 transition-colors cursor-pointer truncate" onClick={() => openPdf(report)}>{report.title}</h4>
                                                        <div className="flex gap-2">
                                                            <span className="text-xs bg-white/5 px-2 py-0.5 rounded text-muted-foreground">{report.category}</span>
                                                            {!report.fileData && <span className="text-xs text-red-400 py-0.5 flex items-center gap-1"><AlertTriangle size={10} /> Veri Yok</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 ml-4">
                                                    <button onClick={() => generateContent(report, 'infographic')} disabled={processingOp?.id === report.id} className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-pink-400 transition-colors" title="İnfografik"><ImageIcon size={16} /></button>
                                                    <button onClick={(e) => handleDeleteReport(report.id, e)} className="p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-red-500 transition-colors" title="Sil"><Trash2 size={16} /></button>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-4 pb-2 border-b border-white/5">
                                                {['summary', 'tweet', 'flood', 'video'].map(action => (
                                                    <button key={action} onClick={() => generateContent(report, action)} disabled={processingOp?.id === report.id} className={`flex-1 min-w-[100px] py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border border-transparent bg-white/5 hover:bg-white/10`}>
                                                        {processingOp?.id === report.id && processingOp?.type === action ? <RefreshCw size={14} className="animate-spin" /> : action.toUpperCase()}
                                                    </button>
                                                ))}
                                            </div>
                                            {inlineResults[report.id] && (
                                                <div className="mt-4 bg-black/30 rounded-xl border border-white/5 p-4 relative animate-in slide-in-from-top-2">
                                                    <button onClick={() => setInlineResults(prev => ({ ...prev, [report.id]: null }))} className="absolute top-2 right-2 text-muted-foreground hover:text-white"><X size={14} /></button>
                                                    <h5 className="font-bold text-primary mb-2 flex items-center gap-2 text-sm"><Sparkles size={14} /> {inlineResults[report.id].title}</h5>
                                                    <div className="text-sm text-gray-300 font-mono leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto custom-scrollbar p-2">{inlineResults[report.id].content}</div>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                            {reports.length > 0 && <button onClick={() => setShowUpload(true)} className="w-full py-4 border-2 border-dashed border-white/10 hover:border-purple-500/50 rounded-2xl text-muted-foreground hover:text-purple-400 font-bold flex items-center justify-center gap-2 transition-all"><Upload size={20} /> Yeni Dosya</button>}
                        </div>
                    )}
                </div>

                <ResourceUploadModal isOpen={showUpload} onClose={() => setShowUpload(false)} onSave={handleSaveReport} folders={[{ id: 'finance', name: 'Finans Raporları' }]} defaultCategory="Finans" />
                {uploading && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center"><RefreshCw size={48} className="animate-spin text-primary" /></div>}

                {toast.show && (
                    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl font-bold shadow-2xl animate-in slide-in-from-bottom z-50 flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                        {toast.type === 'error' ? <X size={20} /> : <CheckCircle size={20} />}
                        {toast.message}
                    </div>
                )}
            </div>
        </div>
    );
}

export default FinanceNewsHub;
