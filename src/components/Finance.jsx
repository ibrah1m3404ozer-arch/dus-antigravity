import React, { useState, useEffect } from 'react';
import { getAssets, saveAsset, deleteAsset } from '../utils/db';
import { TrendingUp, TrendingDown, Trash2, RefreshCw, HelpCircle, Wallet, PieChart as PieChartIcon, Building2, Landmark, Coins, ChevronDown, ChevronUp, Plus, X, Globe, Bitcoin, Search, Check, Edit2, Lock, AlertTriangle, ExternalLink, Terminal } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const ASSET_TYPES = {
    stock: { key: 'stock', label: 'Hisse Senedi', color: '#3b82f6', icon: TrendingUp },
    fund: { key: 'fund', label: 'Yatırım Fonu', color: '#10b981', icon: Building2 },
    commodity: { key: 'commodity', label: 'Altın & Döviz', color: '#f59e0b', icon: Coins },
    bond: { key: 'bond', label: 'Tahvil & Bono', color: '#8b5cf6', icon: Landmark }
};

const BIST_STOCKS = [
    { symbol: 'THYAO', shortname: 'TURK HAVA YOLLARI' }, { symbol: 'ASELS', shortname: 'ASELSAN' }, { symbol: 'GARAN', shortname: 'GARANTI BANKASI' },
    { symbol: 'AKBNK', shortname: 'AKBANK' }, { symbol: 'ISCTR', shortname: 'IS BANKASI (C)' }, { symbol: 'SISE', shortname: 'SISE CAM' },
    { symbol: 'KCHOL', shortname: 'KOC HOLDING' }, { symbol: 'SAHOL', shortname: 'SABANCI HOLDING' }, { symbol: 'TUPRS', shortname: 'TUPRAS' },
    { symbol: 'EREGL', shortname: 'EREGLI DEMIR CELIK' }, { symbol: 'BIMAS', shortname: 'BIM MAGAZALAR' }, { symbol: 'FROTO', shortname: 'FORD OTOSAN' },
    { symbol: 'TOASO', shortname: 'TOFAS OTO. FAB.' }, { symbol: 'TCELL', shortname: 'TURKCELL' }, { symbol: 'TTKOM', shortname: 'TURK TELEKOM' },
    { symbol: 'PETKM', shortname: 'PETKIM' }, { symbol: 'EKGYO', shortname: 'EMLAK KONUT GMYO' }, { symbol: 'VESTL', shortname: 'VESTEL' },
    { symbol: 'ARCLK', shortname: 'ARCELIK' }, { symbol: 'PGSUS', shortname: 'PEGASUS' }, { symbol: 'ASTOR', shortname: 'ASTOR ENERJI' },
    { symbol: 'SASA', shortname: 'SASA POLYESTER' }, { symbol: 'HEKTS', shortname: 'HEKTAS' }, { symbol: 'ENKAI', shortname: 'ENKA INSAAT' }
    // (List shortened for brevity)
];

const POPULAR_FUNDS = [
    { code: 'AFT', name: 'AK PORTFÖY YENİ TEKNOLOJİLER', type: 'Hisse' },
    { code: 'IDL', name: 'IDEALIST PARA PIYASASI', type: 'Para Piyasası' },
    { code: 'MAC', name: 'MARMARA CAPITAL HİSSE', type: 'Hisse' },
    { code: 'TTE', name: 'İŞ PORTFÖY TEKNOLOJİ', type: 'Hisse' }
];

const COMMODITY_TYPES = ['USD', 'EUR', 'GBP', 'CAD', 'CHF', 'JPY', 'GRAM ALTIN', 'ONS ALTIN', 'GÜMÜŞ', 'BITCOIN'];

function Finance() {
    const [assets, setAssets] = useState([]);
    const [expandedType, setExpandedType] = useState('stock');
    const [expandedSymbols, setExpandedSymbols] = useState({});
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [currency, setCurrency] = useState('TRY');
    const [rates, setRates] = useState({ USD: 35, BTC: 100000, EUR: 38, GBP: 44, CAD: 25, XAU: 2980 });
    const [showAddForm, setShowAddForm] = useState(false);
    const [activeFormType, setActiveFormType] = useState('stock');
    const [editPriceId, setEditPriceId] = useState(null);
    const [editPriceVal, setEditPriceVal] = useState('');
    const [stockForm, setStockForm] = useState({ code: '', lots: '', price: '' });
    const [fundForm, setFundForm] = useState({ code: '', units: '', price: '' });
    const [commodityForm, setCommodityForm] = useState({ type: 'USD', amount: '', price: '' });
    const [bondForm, setBondForm] = useState({ name: '', maturityDate: '', interestRate: '', principal: '' });
    const [searchResults, setSearchResults] = useState([]);
    const [fundSearchResults, setFundSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    // DEBUG LOGS
    const [debugLog, setDebugLog] = useState([]);
    const [showDebug, setShowDebug] = useState(false);
    const addLog = (msg) => setDebugLog(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 50));

    useEffect(() => { loadAssets(); fetchRates(); }, []);
    const loadAssets = async () => { const data = await getAssets(); setAssets(data); };
    const fetchRates = async () => {
        try {
            const fiatRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const fiatData = await fiatRes.json();
            const usdTry = fiatData.rates.TRY;
            const newRates = { USD: usdTry, EUR: usdTry / fiatData.rates.EUR, GBP: usdTry / fiatData.rates.GBP, CAD: usdTry / fiatData.rates.CAD, CHF: usdTry / fiatData.rates.CHF, JPY: usdTry / fiatData.rates.JPY, BTC: 1, XAU: 2980 };
            const cryptoRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
            const cryptoData = await cryptoRes.json();
            newRates.BTC = cryptoData.bitcoin.usd;
            setRates(newRates);
        } catch (e) { console.error(e); }
    };

    // ... (Search Logic same as before) ...
    const searchStocks = async (query) => {
        setIsSearching(true);
        if (!query) { setSearchResults(BIST_STOCKS.slice(0, 50).map(s => ({ ...s, exchange: 'IST' }))); setIsSearching(false); return; }
        const upperQuery = query.toUpperCase();
        const localMatches = BIST_STOCKS.filter(s => s.symbol.includes(upperQuery) || s.shortname.includes(upperQuery)).map(s => ({ ...s, exchange: 'IST' }));
        if (localMatches.length > 0) { setSearchResults(localMatches); setIsSearching(false); return; }
        setSearchResults([{ symbol: upperQuery, shortname: 'Özel Giriş', exchange: '?' }]);
        setIsSearching(false);
    };
    const searchFunds = (query) => {
        setIsSearching(true);
        if (!query) { setFundSearchResults(POPULAR_FUNDS); setIsSearching(false); return; }
        const upperQuery = query.toUpperCase();
        const matches = POPULAR_FUNDS.filter(f => f.code.includes(upperQuery) || f.name.includes(upperQuery));
        setFundSearchResults(matches);
        setIsSearching(false);
    };
    const parseTurkishFloat = (str) => {
        if (!str) return NaN;
        let clean = str.replace(/[^0-9,.]/g, '');
        clean = clean.replace(/\./g, '');
        clean = clean.replace(',', '.');
        return parseFloat(clean);
    }

    // --- CALCULATED GOLD FETCHER (Most Robust) ---
    // --- ROBUST METAL FETCHER (Gold & Silver) ---
    const getMetalPrice = async (metalSymbols, name) => {
        addLog(`🧮 ${name} Hesaplanıyor...`);
        const proxies = [
            (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
            (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
            (url) => `https://cors-anywhere.herokuapp.com/${url}`
        ];

        const fetchYahoo = async (symbol) => {
            // addLog(`🔍 ${symbol} deneniyor...`);
            const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
            for (const p of proxies) {
                try {
                    const r = await fetch(p(targetUrl));
                    if (r.ok) {
                        const j = await r.json();
                        const val = j.chart?.result?.[0]?.meta?.regularMarketPrice;
                        if (val) return val;
                    }
                } catch (e) { }
            }
            return null;
        };

        const symbols = Array.isArray(metalSymbols) ? metalSymbols : [metalSymbols];

        try {
            const usdPrice = await fetchYahoo('TRY=X');
            if (!usdPrice) throw new Error("Dolar Kuru (TRY=X) alınamadı");

            for (const sym of symbols) {
                const ouncePrice = await fetchYahoo(sym);
                if (ouncePrice) {
                    const gramTL = (ouncePrice * usdPrice) / 31.1035;
                    addLog(`✅ ${name} (${sym}): ${gramTL.toFixed(2)} TL`);
                    return { price: gramTL, change: 0 };
                }
            }
            throw new Error(`Veri alınamadı: ${symbols.join(', ')}`);
        } catch (e) {
            addLog(`❌ ${name} Hatası: ${e.message}`);
            return null;
        }
    };

    const getCalculatedGoldPrice = () => getMetalPrice(['XAUUSD=X', 'GC=F'], 'Gram Altın');
    const getCalculatedSilverPrice = () => getMetalPrice(['XAGUSD=X', 'SI=F'], 'Gram Gümüş');

    // --- UNIVERSAL MECTOR FETCHER ---
    const getAssetData = async (symbol, type) => {
        // SPECIAL GRAM ALTIN LOGIC
        if (symbol === 'GRAM ALTIN' || symbol === 'GRAMALTIN') {
            // Try fetching from Truncgil first (Short timeout)
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s Timeout

                const res = await fetch('https://finans.truncgil.com/today.json', { signal: controller.signal }).catch(() => null);
                clearTimeout(timeoutId);

                if (res && res.ok) {
                    const data = await res.json();
                    if (data && data['gram-altin']) {
                        const p = parseTurkishFloat(data['gram-altin'].Satış);
                        if (p > 0) {
                            addLog(`✅ Gram Altın (API): ${p.toFixed(2)} TL`);
                            return { price: p, change: 0 };
                        }
                    }
                }
            } catch (ignore) { }

            // Fallback to Calculation
            return await getCalculatedGoldPrice();
        }

        // SPECIAL GRAM SILVER LOGIC
        if (symbol === 'GÜMÜŞ' || symbol === 'SILVER' || symbol === 'GRAM GÜMÜŞ') {
            return await getCalculatedSilverPrice();
        }

        let ySymbol = symbol.toUpperCase().replace('.IS', '');

        // Symbol Normalization
        if (ySymbol === 'USD') ySymbol = 'TRY=X';
        else if (ySymbol === 'EUR') ySymbol = 'EURTRY=X';
        else if (ySymbol === 'ONS ALTIN') ySymbol = 'XAUUSD=X';
        else if (ySymbol === 'BITCOIN') ySymbol = 'BTC-USD';
        else if (!ySymbol.includes('=') && !ySymbol.includes('.') && /^[A-Z0-9]{4,6}$/.test(ySymbol)) {
            ySymbol = ySymbol + '.IS';
        } else if (symbol.includes('.IS')) {
            ySymbol = symbol;
        }

        addLog(`📈 Fetching ${ySymbol}...`);
        const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ySymbol}?interval=1d&range=1d`;

        // Yahoo Proxy Strategies
        const strategies = [
            'https://cors-anywhere.herokuapp.com/',
            'https://api.allorigins.win/raw?url='
        ];

        for (const proxy of strategies) {
            try {
                const fullUrl = proxy.includes('url=') ? proxy + encodeURIComponent(targetUrl) : proxy + targetUrl;
                const response = await fetch(fullUrl, { headers: { 'Origin': window.location.origin } });
                if (!response.ok) throw new Error('Status ' + response.status);

                const data = await response.json();
                const result = data.chart?.result?.[0];
                if (!result) continue;

                const meta = result.meta;
                const price = meta.regularMarketPrice;
                const prevClose = meta.chartPreviousClose;
                const change = ((price - prevClose) / prevClose) * 100;

                addLog(`✅ ${ySymbol} OK: ${price}`);
                return { price, change };
            } catch (error) {
                addLog(`⚠️ Attempt Failed: ${error.message} (${proxy.substr(0, 15)})`);
            }
        }

        addLog(`❌ ALL FETCHES FAILED for ${ySymbol}`);
        return null;
    };

    const updateAssetPrices = async () => {
        setLoading(true);
        addLog("🔄 Update Started...");
        const updatedAssets = [...assets];
        let changed = false;

        // 1. Stocks & Commodities (Yahoo + Truncgil)
        const standardAssets = updatedAssets.filter(a => (a.type === 'stock' || a.type === 'commodity') && !a.isManual);
        for (const asset of standardAssets) {
            const data = await getAssetData(asset.symbol, asset.type);
            if (data && data.price > 0) {
                asset.currentPrice = data.price;
                changed = true;
            }
        }

        // 2. Funds (TEFAS)
        const fundsToFetch = updatedAssets.filter(a => a.type === 'fund' && !a.isManual);
        for (const fund of fundsToFetch) {
            addLog(`🔍 Fund: ${fund.symbol}`);
            let fetched = false;
            let price = 0;
            const proxyStrategies = [
                `https://cors-anywhere.herokuapp.com/https://www.tefas.gov.tr/FonAnaliz.aspx?FonKod=${fund.symbol}`,
                `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(`https://www.tefas.gov.tr/FonAnaliz.aspx?FonKod=${fund.symbol}`)}`,
                `https://api.allorigins.win/raw?url=${encodeURIComponent(`http://bigpara.hurriyet.com.tr/borsa/yatirim-fonlari/fon-detay-bilgileri/${fund.symbol}/`)}`
            ];

            for (const url of proxyStrategies) {
                if (fetched) break;
                try {
                    const res = await fetch(url, { headers: { 'Origin': window.location.origin } });
                    if (!res.ok) continue;
                    const htmlText = await res.text();

                    // Regex patterns for different sources
                    const tefasRegex = /id="MainContent_PanelInfo_LabelPrice"[^>]*>([^<]+)</;
                    const generalRegex = /class="value[^"]*">\s*([0-9.,]+)\s*</;

                    let match = htmlText.match(tefasRegex) || htmlText.match(generalRegex);

                    if (match && match[1]) {
                        const p = parseTurkishFloat(match[1]);
                        if (!isNaN(p) && p > 0) { price = p; fetched = true; }
                    }
                } catch (e) { }
            }

            if (fetched) {
                fund.currentPrice = price;
                changed = true;
                addLog(`✅ Fund OK: ${fund.symbol}`);
            } else {
                addLog(`❌ Fund Failed: ${fund.symbol}`);
            }
        }

        if (changed) {
            updatedAssets.forEach(a => saveAsset(a));
            setAssets(updatedAssets);
            showToast('Fiyatlar güncellendi');
        } else {
            showToast('Güncelleme tamamlandı (Değişiklik yok veya hata)', 'warning');
        }
        setLoading(false);
        addLog("🏁 Update Finished");
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
    };

    const handleEditPrice = (asset) => { setEditPriceId(asset.id); setEditPriceVal(asset.currentPrice); };
    const handleSavePrice = async (asset) => { const newPrice = parseFloat(editPriceVal); if (!isNaN(newPrice)) { asset.currentPrice = newPrice; asset.isManual = true; await saveAsset(asset); loadAssets(); setEditPriceId(null); showToast('Fiyat el ile sabitlendi 🔒'); } };
    const handleUnlockPrice = async (asset) => { asset.isManual = false; await saveAsset(asset); loadAssets(); showToast('Otomatik güncelleme açıldı 🔓'); updateAssetPrices(); };
    const handleDelete = async (id) => { if (window.confirm("Silinsin mi?")) { await deleteAsset(id); loadAssets(); } }

    // Add Handlers updated to send Symbol properly
    const handleAddStock = async () => { if (!stockForm.code || !stockForm.lots || !stockForm.price) return showToast('Eksik bilgi', 'error'); let finalSymbol = stockForm.code.toUpperCase(); await saveAsset({ id: Date.now().toString(), type: 'stock', symbol: finalSymbol, quantity: parseFloat(stockForm.lots), purchasePrice: parseFloat(stockForm.price), currentPrice: parseFloat(stockForm.price), isManual: false, createdAt: new Date().toISOString() }); setStockForm({ code: '', lots: '', price: '' }); setSearchResults([]); setIsSearching(false); setShowAddForm(false); loadAssets(); showToast('Hisse eklendi'); };
    const handleAddFund = async () => { if (!fundForm.code || !fundForm.units || !fundForm.price) return showToast('Eksik bilgi', 'error'); await saveAsset({ id: Date.now().toString(), type: 'fund', symbol: fundForm.code.toUpperCase(), category: 'Yatırım Fonu', quantity: parseFloat(fundForm.units), purchasePrice: parseFloat(fundForm.price), currentPrice: parseFloat(fundForm.price), isManual: false, createdAt: new Date().toISOString() }); setFundForm({ code: '', units: '', price: '' }); setFundSearchResults([]); setIsSearching(false); setShowAddForm(false); loadAssets(); showToast('Fon eklendi'); };
    const handleAddCommodity = async () => { if (!commodityForm.type || !commodityForm.amount || !commodityForm.price) return showToast('Eksik bilgi', 'error'); await saveAsset({ id: Date.now().toString(), type: 'commodity', symbol: commodityForm.type, quantity: parseFloat(commodityForm.amount), purchasePrice: parseFloat(commodityForm.price), currentPrice: parseFloat(commodityForm.price), isManual: false, createdAt: new Date().toISOString() }); setCommodityForm({ type: 'USD', amount: '', price: '' }); setShowAddForm(false); loadAssets(); showToast('Varlık eklendi'); };
    const handleAddBond = async () => { if (!bondForm.name || !bondForm.principal) return showToast('Eksik bilgi', 'error'); await saveAsset({ id: Date.now().toString(), type: 'bond', symbol: bondForm.name, maturityDate: bondForm.maturityDate, interestRate: bondForm.interestRate, quantity: 1, purchasePrice: parseFloat(bondForm.principal), currentPrice: parseFloat(bondForm.principal), isManual: false, createdAt: new Date().toISOString() }); setBondForm({ name: '', maturityDate: '', interestRate: '', principal: '' }); setShowAddForm(false); loadAssets(); showToast('Bono eklendi'); };

    const totalInvestedTRY = assets.reduce((sum, a) => sum + (a.quantity * a.purchasePrice), 0);
    const totalCurrentTRY = assets.reduce((sum, a) => sum + (a.quantity * a.currentPrice), 0);
    const totalGainTRY = totalCurrentTRY - totalInvestedTRY;
    const totalGainPercent = totalInvestedTRY > 0 ? ((totalGainTRY / totalInvestedTRY) * 100) : 0;
    const getConvertedValue = (tryValue) => { if (currency === 'USD') return tryValue / rates.USD; if (currency === 'BTC') return (tryValue / rates.USD) / rates.BTC; return tryValue; };
    const displayValue = getConvertedValue(totalCurrentTRY);
    const displayGain = getConvertedValue(totalGainTRY);
    const formatMoney = (val) => { if (currency === 'BTC') return `₿${val.toFixed(6)}`; if (currency === 'USD') return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; return `₺${val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; };
    const assetsByType = { stock: assets.filter(a => a.type === 'stock'), fund: assets.filter(a => a.type === 'fund'), commodity: assets.filter(a => a.type === 'commodity'), bond: assets.filter(a => a.type === 'bond') };
    const pieData = Object.keys(ASSET_TYPES).map(key => { const value = assetsByType[key].reduce((sum, a) => sum + (a.quantity * a.currentPrice), 0); return { name: ASSET_TYPES[key].label, value, color: ASSET_TYPES[key].color }; }).filter(d => d.value > 0);

    return (
        <div className="min-h-screen pb-20 animate-in fade-in duration-500 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4 space-y-6">
                    {/* WEALTH CARD */}
                    <div className="bg-gradient-to-br from-emerald-900/40 to-blue-900/40 border border-white/10 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl group min-h-[300px] flex flex-col justify-center">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><Wallet size={150} /></div>
                        <div className="relative z-10 text-center">
                            <div className="flex justify-center gap-2 mb-4">{['TRY', 'USD', 'BTC'].map(c => (<button key={c} onClick={() => setCurrency(c)} className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${currency === c ? 'bg-white text-black' : 'text-muted-foreground hover:bg-white/10'}`}>{c}</button>))}</div>
                            <p className="text-sm font-bold text-gray-400 tracking-widest mb-3">TOPLAM VARLIK</p>
                            <h2 className="text-5xl font-black text-white tracking-tighter drop-shadow-lg mb-6 leading-tight">{formatMoney(displayValue)}</h2>
                            <div className="flex flex-col items-center gap-1"><span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">TOPLAM KAR/ZARAR</span><div className={`inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-2xl font-black border ${totalGainTRY >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>{totalGainTRY >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}{totalGainTRY >= 0 ? '+' : ''}{formatMoney(displayGain)}<span className={totalGainTRY >= 0 ? 'text-emerald-500/70 text-lg ml-2 font-bold' : 'text-red-500/70 text-lg ml-2 font-bold'}>%{totalGainPercent.toFixed(2)}</span></div></div>
                        </div>
                    </div>
                </div>
                {/* ... (Rest is same layout) ... */}
                <div className="lg:col-span-8">
                    <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl h-full flex flex-col">
                        <div className="p-6 border-b border-border bg-white/5 flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2 text-xl"><Building2 className="text-primary" /> PORTFÖY DAĞILIMI</h3>
                            <button onClick={updateAssetPrices} className="p-2 hover:bg-white/10 rounded-xl transition-colors flex items-center gap-2 text-xs font-bold bg-white/5" title="Fiyatları İnternetten Çek"><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> FİYATLARI GÜNCELLE</button>
                        </div>
                        <div className="divide-y divide-border overflow-y-auto custom-scrollbar flex-1">
                            {Object.keys(ASSET_TYPES).map(key => {
                                const type = ASSET_TYPES[key]; const typeAssets = assetsByType[key]; const typeTotal = typeAssets.reduce((sum, a) => sum + (a.quantity * a.currentPrice), 0); const isExpanded = expandedType === key;
                                return (
                                    <div key={key} className="bg-card transition-all group">
                                        <button onClick={() => setExpandedType(isExpanded ? null : key)} className={`w-full flex items-center justify-between p-6 hover:bg-secondary/30 transition-colors ${isExpanded ? 'bg-secondary/10' : ''}`}>
                                            <div className="flex items-center gap-4"><div className={`p-3 rounded-xl bg-gradient-to-br from-gray-800 to-black border border-white/5 shadow-inner group-hover:scale-110 transition-transform`}><type.icon size={28} style={{ color: type.color }} /></div><div className="text-left"><h4 className="font-bold text-xl">{type.label}</h4><p className="text-sm text-muted-foreground font-medium">{typeAssets.length} varlık</p></div></div>
                                            <div className="text-right"><p className="font-black text-xl tracking-tight">₺{typeTotal.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</p>{isExpanded ? <ChevronUp className="ml-auto text-muted-foreground mt-1" /> : <ChevronDown className="ml-auto text-muted-foreground mt-1" />}</div>
                                        </button>
                                        {isExpanded && (
                                            <div className="bg-black/20 p-6 animate-in slide-in-from-top-2 border-t border-b border-white/5">
                                                <button onClick={() => { setActiveFormType(key); setShowAddForm(true); }} className="w-full py-3 mb-4 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center gap-2 font-bold text-muted-foreground hover:text-white hover:border-primary/50 hover:bg-white/5 transition-all"><Plus size={18} /> Yeni {type.label} Ekle</button>
                                                <div className="grid gap-3">
                                                    {(() => {
                                                        const groups = {};
                                                        typeAssets.forEach(a => { const s = a.symbol; if (!groups[s]) groups[s] = []; groups[s].push(a); });
                                                        return Object.keys(groups).map(sym => {
                                                            const group = groups[sym];
                                                            const totalQty = group.reduce((s, a) => s + a.quantity, 0); // Note: Simple sum - assuming similar units
                                                            const totalCost = group.reduce((s, a) => s + (a.quantity * a.purchasePrice), 0);
                                                            const avgCost = totalQty > 0 ? totalCost / totalQty : 0;
                                                            const currentPrice = group[0].currentPrice;
                                                            const val = totalQty * currentPrice;
                                                            const gain = val - totalCost;
                                                            const gainPercent = totalCost > 0 ? (gain / totalCost) * 100 : 0;

                                                            let titleClass = "text-white";
                                                            if (sym.includes('ALTIN') || sym.includes('XAU')) titleClass = "text-amber-400";
                                                            else if (sym.includes('GÜMÜŞ') || sym.includes('SILVER') || sym.includes('XAG')) titleClass = "text-slate-300";

                                                            const isMulti = group.length > 1;
                                                            const isDetailsOpen = !!expandedSymbols[sym];

                                                            return (
                                                                <div key={sym} className="bg-background/50 border border-white/5 rounded-xl transition-all hover:border-white/20 overflow-hidden">
                                                                    <div className={`p-4 flex justify-between items-center cursor-pointer ${isMulti ? 'hover:bg-white/5' : ''}`} onClick={() => isMulti && setExpandedSymbols(p => ({ ...p, [sym]: !p[sym] }))}>
                                                                        <div>
                                                                            <div className={`font-bold text-lg flex items-center gap-2 ${titleClass}`}>
                                                                                {sym.replace('.IS', '')}
                                                                                {isMulti && <span className="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-muted-foreground">{group.length} Kayıt</span>}
                                                                                {isMulti && (isDetailsOpen ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />)}
                                                                                {!isMulti && group[0].isManual && <Lock size={12} className="text-amber-500" />}
                                                                            </div>
                                                                            <div className="text-xs text-muted-foreground font-mono mt-0.5">{totalQty} adet • Ort: ₺{avgCost.toFixed(2)}</div>
                                                                        </div>
                                                                        <div className="text-right flex items-center gap-4">
                                                                            <div>
                                                                                <div className="font-bold text-white">₺{val.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                                                                                <div className={`text-xs font-bold ${gain >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>{gain >= 0 ? '+' : ''}₺{gain.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} (%{gainPercent.toFixed(1)})</div>
                                                                            </div>
                                                                            {!isMulti && (
                                                                                <div className="flex gap-1">
                                                                                    <button onClick={(e) => { e.stopPropagation(); handleEditPrice(group[0]); }} className="p-1.5 hover:bg-white/10 rounded text-muted-foreground hover:text-white"><Edit2 size={14} /></button>
                                                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(group[0].id); }} className="p-1.5 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 rounded"><Trash2 size={14} /></button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                    {isDetailsOpen && isMulti && (
                                                                        <div className="bg-black/20 border-t border-white/5 animate-in slide-in-from-top-1">
                                                                            {group.map(asset => {
                                                                                const subGain = (asset.quantity * asset.currentPrice) - (asset.quantity * asset.purchasePrice);
                                                                                const isEditing = editPriceId === asset.id;
                                                                                return (
                                                                                    <div key={asset.id} className="flex justify-between items-center p-3 pl-6 border-b border-white/5 last:border-0 hover:bg-white/5 text-sm transition-colors">
                                                                                        <div className="text-muted-foreground text-xs">
                                                                                            <div className="flex items-center gap-2">📅 {new Date(asset.createdAt).toLocaleDateString('tr-TR')} {asset.isManual && <Lock size={10} className="text-amber-500" />}</div>
                                                                                            <div className="font-mono">{asset.quantity} ad. @ ₺{asset.purchasePrice.toFixed(2)}</div>
                                                                                        </div>
                                                                                        <div className="flex items-center gap-3">
                                                                                            {isEditing ? (
                                                                                                <div className="flex items-center gap-1"><input className="w-20 bg-black border border-gray-600 rounded px-1 text-right text-xs text-white" type="number" value={editPriceVal} onChange={e => setEditPriceVal(e.target.value)} autoFocus /><button onClick={() => handleSavePrice(asset)} className="text-emerald-500"><Check size={14} /></button></div>
                                                                                            ) : (
                                                                                                <div className={`text-xs font-bold ${subGain >= 0 ? 'text-emerald-500/70' : 'text-red-500/70'}`}>{subGain >= 0 ? '+' : ''}₺{subGain.toFixed(1)}</div>
                                                                                            )}
                                                                                            <div className="flex gap-1 ml-2 opacity-50 hover:opacity-100">
                                                                                                <button onClick={() => handleEditPrice(asset)} className="p-1 text-white"><Edit2 size={12} /></button>
                                                                                                <button onClick={() => handleDelete(asset.id)} className="p-1 text-red-400"><Trash2 size={12} /></button>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
            {showAddForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowAddForm(false)}>
                    {/* ... (Add Forms - Stock form now sends only Symbol, logic handles the rest) ... */}
                    <div className="bg-card w-full max-w-md rounded-3xl border border-border p-8 shadow-2xl animate-in zoom-in-95 relative max-h-[90vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowAddForm(false)} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg text-muted-foreground hover:text-white transition-colors"><X size={20} /></button>
                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3"><div className="p-2 bg-primary/20 rounded-lg text-primary"><Plus /></div> Yeni {ASSET_TYPES[activeFormType].label}</h3>
                        <div className="space-y-4">
                            {activeFormType === 'stock' && (
                                <>
                                    <div className="space-y-2"><label className="text-xs font-bold text-muted-foreground ml-1">HİSSE KODU ARA</label><div className="relative"><input value={stockForm.code} onChange={e => { const val = e.target.value.toUpperCase(); setStockForm({ ...stockForm, code: val }); searchStocks(val); }} onFocus={() => { if (!stockForm.code) searchStocks(''); }} placeholder="Örn: THYAO" className="w-full pl-10 pr-4 py-3 bg-secondary rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary placeholder:font-normal" /><Search className="absolute left-3 top-3.5 text-muted-foreground" size={18} />{isSearching && <RefreshCw className="absolute right-3 top-3.5 animate-spin text-muted-foreground" size={18} />}</div>{searchResults.length > 0 && (<div className="bg-black/40 border border-white/5 rounded-xl mt-2 max-h-40 overflow-y-auto">{searchResults.map((res, idx) => (<div key={idx} onClick={() => { setStockForm({ ...stockForm, code: res.symbol }); setSearchResults([]); }} className="p-3 hover:bg-white/10 cursor-pointer border-b border-white/5 last:border-0 flex justify-between items-center"><div><div className="font-bold text-sm text-white">{res.symbol.replace('.IS', '')}</div><div className="text-xs text-muted-foreground">{res.shortname}</div></div><span className="text-xs bg-white/5 px-2 py-1 rounded">{res.exchange}</span></div>))}</div>)}</div>
                                    <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-xs font-bold text-muted-foreground ml-1">ADET</label><input type="number" value={stockForm.lots} onChange={e => setStockForm({ ...stockForm, lots: e.target.value })} placeholder="0" className="w-full px-4 py-3 bg-secondary rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary placeholder:font-normal" /></div><div className="space-y-2"><label className="text-xs font-bold text-muted-foreground ml-1">MALİYET (₺)</label><input type="number" value={stockForm.price} onChange={e => setStockForm({ ...stockForm, price: e.target.value })} placeholder="0.00" className="w-full px-4 py-3 bg-secondary rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary placeholder:font-normal" /></div></div>
                                    <button onClick={handleAddStock} className="w-full py-4 mt-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 transition-all">Varlığı Portföye Ekle</button>
                                </>
                            )}
                            {activeFormType === 'fund' && (
                                <>
                                    <div className="space-y-2"><label className="text-xs font-bold text-muted-foreground ml-1">FON KODU (TEFAS / MYNET)</label><div className="relative"><input value={fundForm.code} onChange={e => { const val = e.target.value.toUpperCase(); setFundForm({ ...fundForm, code: val }); searchFunds(val); }} onFocus={() => { if (!fundForm.code) searchFunds(''); }} placeholder="Örn: AFT" className="w-full pl-10 pr-4 py-3 bg-secondary rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary placeholder:font-normal" /><Search className="absolute left-3 top-3.5 text-muted-foreground" size={18} />{isSearching && <RefreshCw className="absolute right-3 top-3.5 animate-spin text-muted-foreground" size={18} />}</div><div className="text-[10px] text-muted-foreground mt-1 ml-1">*Listede yoksa kodu elle yazın (örn: IDL), otomatik çekilir.</div>{fundSearchResults.length > 0 && (<div className="bg-black/40 border border-white/5 rounded-xl mt-2 max-h-40 overflow-y-auto">{fundSearchResults.map((res, idx) => (<div key={idx} onClick={() => { setFundForm({ ...fundForm, code: res.code }); setFundSearchResults([]); }} className="p-3 hover:bg-white/10 cursor-pointer border-b border-white/5 last:border-0 flex justify-between items-center"><div><div className="font-bold text-sm text-white">{res.code}</div><div className="text-xs text-muted-foreground">{res.name}</div></div><span className="text-xs bg-white/5 px-2 py-1 rounded">{res.type}</span></div>))}</div>)}</div>
                                    <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-xs font-bold text-muted-foreground ml-1">ADET (Pay)</label><input type="number" value={fundForm.units} onChange={e => setFundForm({ ...fundForm, units: e.target.value })} placeholder="0" className="w-full px-4 py-3 bg-secondary rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary placeholder:font-normal" /></div><div className="space-y-2"><label className="text-xs font-bold text-muted-foreground ml-1">ALIM FİYATI (₺)</label><input type="number" value={fundForm.price} onChange={e => setFundForm({ ...fundForm, price: e.target.value })} placeholder="0.00" className="w-full px-4 py-3 bg-secondary rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary placeholder:font-normal" /></div></div>
                                    <button onClick={handleAddFund} className="w-full py-4 mt-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 transition-all">Fonu Ekle</button>
                                </>
                            )}
                            {activeFormType === 'commodity' && (
                                <>
                                    <div className="space-y-2"><label className="text-xs font-bold text-muted-foreground ml-1">VARLIK TÜRÜ</label><select value={commodityForm.type} onChange={e => setCommodityForm({ ...commodityForm, type: e.target.value })} className="w-full px-4 py-3 bg-secondary rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary appearance-none">{COMMODITY_TYPES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                                    <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-xs font-bold text-muted-foreground ml-1">MİKTAR</label><input type="number" value={commodityForm.amount} onChange={e => setCommodityForm({ ...commodityForm, amount: e.target.value })} placeholder="0" className="w-full px-4 py-3 bg-secondary rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary placeholder:font-normal" /></div><div className="space-y-2"><label className="text-xs font-bold text-muted-foreground ml-1">MALİYET (₺)</label><input type="number" value={commodityForm.price} onChange={e => setCommodityForm({ ...commodityForm, price: e.target.value })} placeholder="0.00" className="w-full px-4 py-3 bg-secondary rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary placeholder:font-normal" /></div></div>
                                    <button onClick={handleAddCommodity} className="w-full py-4 mt-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 transition-all">Varlık Ekle</button>
                                </>
                            )}
                            {activeFormType === 'bond' && (
                                <>
                                    <div className="space-y-2"><label className="text-xs font-bold text-muted-foreground ml-1">TAHVİL/BONO ADI</label><input value={bondForm.name} onChange={e => setBondForm({ ...bondForm, name: e.target.value })} placeholder="Örn: Hazine Bonosu TRT..." className="w-full px-4 py-3 bg-secondary rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary placeholder:font-normal" /></div>
                                    <div className="space-y-2"><label className="text-xs font-bold text-muted-foreground ml-1">VADE TARİHİ</label><input type="date" value={bondForm.maturityDate} onChange={e => setBondForm({ ...bondForm, maturityDate: e.target.value })} className="w-full px-4 py-3 bg-secondary rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary" /></div>
                                    <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-xs font-bold text-muted-foreground ml-1">ANAPARA (₺)</label><input type="number" value={bondForm.principal} onChange={e => setBondForm({ ...bondForm, principal: e.target.value })} placeholder="0.00" className="w-full px-4 py-3 bg-secondary rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary placeholder:font-normal" /></div><div className="space-y-2"><label className="text-xs font-bold text-muted-foreground ml-1">FAİZ ORANI (%)</label><input type="number" value={bondForm.interestRate} onChange={e => setBondForm({ ...bondForm, interestRate: e.target.value })} placeholder="45" className="w-full px-4 py-3 bg-secondary rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-primary placeholder:font-normal" /></div></div>
                                    <button onClick={handleAddBond} className="w-full py-4 mt-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold shadow-lg shadow-primary/20 transition-all">Bono Ekle</button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* TOAST - Removed fixed positioning for simplicity, using state */}
            {toast.show && (<div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-4 rounded-2xl border font-bold shadow-2xl animate-in slide-in-from-bottom duration-300 z-50 text-center min-w-[300px] backdrop-blur-md ${toast.type === 'error' ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-emerald-500/20 border-emerald-500 text-emerald-400'}`}>{toast.message}</div>)}
        </div>
    );
}

export default Finance;
