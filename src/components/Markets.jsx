import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw, Activity, LineChart, ArrowRight, DollarSign } from 'lucide-react';

// Simple Sparkline Component (SVG)
const Sparkline = ({ data, color }) => {
    if (!data || data.length < 2) return null;

    const width = 120;
    const height = 40;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Generate SVG Path
    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="overflow-visible">
            <path
                d={`M ${points}`}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Fill Area (Optional, gradient look) */}
            <path
                d={`M 0,${height} L ${points} L ${width},${height} Z`}
                fill={color}
                fillOpacity="0.1"
                stroke="none"
            />
        </svg>
    );
};

function Markets() {
    const [marketData, setMarketData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Symbols to fetch
    const WATCHLIST = [
        { key: 'XU100.IS', name: 'BIST 100', type: 'index' },
        { key: 'USDTRY=X', name: 'Dolar', type: 'currency' },
        { key: 'EURTRY=X', name: 'Euro', type: 'currency' },
        { key: 'XAUTRY=X', name: 'Gram Altın', type: 'commodity' }, // Needs conversion
        { key: 'BTC-USD', name: 'Bitcoin', type: 'crypto' },
        { key: 'ETH-USD', name: 'Ethereum', type: 'crypto' }
    ];

    useEffect(() => {
        fetchMarketData();
    }, []);

    const fetchYahooData = async (symbol) => {
        // Rotational strategy with cache busting
        const timestamp = new Date().getTime();
        const targets = [
            `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo&_=${timestamp}`,
            `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo&_=${timestamp}`
        ];

        for (const targetUrl of targets) {
            const encodedUrl = encodeURIComponent(targetUrl);
            const proxies = [
                `https://corsproxy.io/?${encodedUrl}`,
                `https://api.allorigins.win/raw?url=${encodedUrl}`,
                `https://corsproxy.io/?${targetUrl}` // Try raw url for corsproxy
            ];

            for (const proxyUrl of proxies) {
                try {
                    const response = await fetch(proxyUrl);
                    if (response.ok) {
                        const data = await response.json();
                        const result = data.chart?.result?.[0];
                        if (result) {
                            return result;
                        }
                    }
                } catch (err) {
                    // Continue
                }
            }
        }
        return null;
    };

    const fetchMarketData = async () => {
        setLoading(true);
        const newData = [];

        try {
            for (const item of WATCHLIST) {
                const result = await fetchYahooData(item.key);
                if (result) {
                    const meta = result.meta;
                    const quotes = result.indicators?.quote?.[0]?.close || [];
                    // Filter nulls from quotes for sparkline
                    const history = quotes.filter(p => p != null);

                    let price = meta.regularMarketPrice;
                    let prevClose = meta.chartPreviousClose;

                    // Special Logic for Gram Gold (XAUTRY is Ounce/TRY)
                    if (item.key === 'XAUTRY=X') {
                        price = price / 31.1035;
                        prevClose = prevClose / 31.1035;
                        // Adjust history too
                        for (let i = 0; i < history.length; i++) history[i] = history[i] / 31.1035;
                    }

                    const change = ((price - prevClose) / prevClose) * 100;

                    newData.push({
                        ...item,
                        price: price,
                        change: change,
                        history: history
                    });
                }
                // Small delay
                await new Promise(r => setTimeout(r, 200));
            }

            setMarketData(newData);
            setLastUpdate(new Date());
            showToast('Piyasa verileri güncellendi! 📊');

        } catch (error) {
            console.error('Market update failed:', error);
            showToast('Veriler güncellenemedi', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    const formatPrice = (val) => {
        return new Intl.NumberFormat('tr-TR', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(val);
    };

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-3xl border border-white/5 shadow-2xl">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <Activity className="text-primary" />
                        Piyasa Özeti
                    </h2>
                    <p className="text-slate-400 mt-2 font-medium">Küresel piyasalar parmaklarının ucunda 🌍</p>
                    {lastUpdate && (
                        <p className="text-xs text-slate-500 mt-1">Son: {lastUpdate.toLocaleTimeString()}</p>
                    )}
                </div>

                <button
                    onClick={fetchMarketData}
                    disabled={loading}
                    className="flex items-center gap-2 px-5 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    {loading ? 'Yükleniyor...' : 'Yenile'}
                </button>
            </div>

            {/* Market List */}
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-lg">
                <div className="p-6 border-b border-border/50">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <LineChart className="text-primary" size={20} />
                        Canlı Kurlar & Endeksler
                    </h3>
                </div>

                <div className="divide-y divide-border/50">
                    {marketData.length > 0 ? (
                        marketData.map((item) => {
                            const isPositive = item.change >= 0;
                            const colorClass = isPositive ? 'text-green-500' : 'text-red-500';
                            const strokeColor = isPositive ? '#22c55e' : '#ef4444';

                            return (
                                <div key={item.key} className="p-6 flex items-center justify-between hover:bg-muted/30 transition-colors group">
                                    {/* Left: Name & Symbol */}
                                    <div className="w-1/4">
                                        <div className="font-black text-xl text-foreground">{item.name}</div>
                                        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{item.key.replace('=X', '').replace('.IS', '')}</div>
                                    </div>

                                    {/* Middle: Sparkline */}
                                    <div className="flex-1 px-4 hidden md:flex justify-center h-[40px] items-center">
                                        <Sparkline data={item.history} color={strokeColor} />
                                    </div>

                                    {/* Right: Price & Change */}
                                    <div className="w-1/4 text-right">
                                        <div className="text-2xl font-black tabular-nums tracking-tight">
                                            {formatPrice(item.price)} <span className="text-sm font-normal text-muted-foreground">₺</span>
                                        </div>
                                        <div className={`flex items-center justify-end gap-1 text-sm font-bold ${colorClass}`}>
                                            {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                            {isPositive ? '+' : ''}{item.change.toFixed(2)}%
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-12 text-center text-muted-foreground">
                            {loading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <RefreshCw className="animate-spin text-primary" size={32} />
                                    <p>Veriler çekiliyor...</p>
                                </div>
                            ) : (
                                <p>Veri yok. Yenile butonuna basın.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* TradingView Widgets Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* News Timeline Widget */}
                <div className="bg-card border border-border rounded-3xl p-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="text-yellow-500" size={24} />
                        Piyasa Haberleri
                    </h3>
                    <div className="tradingview-widget-container" style={{ height: '500px' }}>
                        <div className="tradingview-widget-container__widget" style={{ height: '100%' }}>
                            <iframe
                                scrolling="no"
                                allowTransparency="true"
                                frameBorder="0"
                                src="https://s.tradingview.com/embed-widget/timeline/?locale=tr#%7B%22feedMode%22%3A%22market%22%2C%22market%22%3A%22crypto%22%2C%22colorTheme%22%3A%22dark%22%2C%22isTransparent%22%3Atrue%2C%22displayMode%22%3A%22regular%22%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%7D"
                                style={{ boxSizing: 'border-box', height: '100%', width: '100%' }}
                                title="TradingView Timeline"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                        Powered by TradingView
                    </p>
                </div>

                {/* Economic Calendar Widget */}
                <div className="bg-card border border-border rounded-3xl p-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Activity className="text-emerald-500" size={24} />
                        Ekonomik Takvim
                    </h3>
                    <div className="tradingview-widget-container" style={{ height: '500px' }}>
                        <div className="tradingview-widget-container__widget" style={{ height: '100%' }}>
                            <iframe
                                scrolling="no"
                                allowTransparency="true"
                                frameBorder="0"
                                src="https://s.tradingview.com/embed-widget/events/?locale=tr#%7B%22colorTheme%22%3A%22dark%22%2C%22isTransparent%22%3Atrue%2C%22width%22%3A%22100%25%22%2C%22height%22%3A%22100%25%22%2C%22importanceFilter%22%3A%22-1%2C0%2C1%22%7D"
                                style={{ boxSizing: 'border-box', height: '100%', width: '100%' }}
                                title="TradingView Economic Calendar"
                            />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                        Fed kararları, TCMB toplantıları ve daha fazlası
                    </p>
                </div>
            </div>

            {/* Toast Notification */}
            {toast.show && (
                <div className={`fixed bottom-8 right-8 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300 z-50 flex items-center gap-3 font-bold ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                    {toast.message}
                </div>
            )}
        </div>
    );
}

export default Markets;
