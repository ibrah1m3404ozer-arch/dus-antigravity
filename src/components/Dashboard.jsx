import React, { useMemo, useState, useEffect } from 'react';
import { useStudyData } from '../hooks/useStudyData';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { STATUS_CONFIG } from '../utils/data';
import { Trophy, BookOpen, CheckCircle, Brain, ChevronLeft, ChevronRight, Star, ExternalLink, CalendarClock, Quote, Clock, TrendingUp, Trash2 } from 'lucide-react';
import { getPearls, togglePearlFavorite, savePearl, getStudySessions, deleteStudySession } from '../utils/db';
import { listenToStudySessions } from '../utils/firebaseDB';

function Dashboard() {
    const { data } = useStudyData();

    // Carousel state
    const [savedPearls, setSavedPearls] = useState([]);
    const [allPearls, setAllPearls] = useState([]);
    const [currentPearlIndex, setCurrentPearlIndex] = useState(0);

    // Profile state
    const [profile, setProfile] = useState({
        name: 'Geleceğin Uzmanı',
        title: '',
        goal: 'DUS 2026 Hedefi',
        date: '2026-10-15',
        motto: 'Bugün dünden daha iyi ol.'
    });

    // Toast notification state
    const [toast, setToast] = useState({ show: false, message: '' });

    // Study Session state
    const [studySessions, setStudySessions] = useState([]);
    const [sessionsLoading, setSessionsLoading] = useState(true);
    const [timeFilter, setTimeFilter] = useState('all'); // 'today' | 'week' | 'month' | 'all'

    useEffect(() => {
        // Load Profile
        const savedProfile = localStorage.getItem('user_profile');
        if (savedProfile) {
            setProfile(JSON.parse(savedProfile));
        }

        // Load Pearls
        const loadPearls = async () => {
            const dbPearls = await getPearls();
            setSavedPearls(dbPearls);
        };
        loadPearls();

        // Load Study Sessions with Firestore realtime listener
        let unsubscribe = () => { };
        const initListener = async () => {
            try {
                unsubscribe = await listenToStudySessions((sessions) => {
                    setStudySessions(sessions);
                    setSessionsLoading(false);
                });
            } catch (error) {
                console.warn('Firestore listener failed, using local:', error);
                const sessions = await getStudySessions();
                setStudySessions(sessions);
                setSessionsLoading(false);
            }
        };
        initListener();

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, []);

    // Combine pearls logic...(Keep existing logic)
    const DAILY_PILLS = [
        { "id": 1, "category": "Protetik", "content": "Ante Kanunu: Abutment dişlerin kök yüzey alanları toplamı, restore edilecek dişlerin kök yüzey alanları toplamına eşit veya ondan büyük olmalıdır." },
        { "id": 2, "category": "Patoloji", "content": "Ameloblastoma: En sık görülen odontojenik tümördür. Nüks riski yüksektir." },
        { "id": 3, "category": "Anatomi", "content": "Foramen Ovale'den geçen yapılar: N. Mandibularis (V3), A. Meningea Accessoria (MALE)." },
        { "id": 4, "category": "Periodontoloji", "content": "Gracey Küretler: 1/2 Ön, 5/6 Ön/Premolar, 7/8 Bukkal/Lingual, 11/12 Mezyal, 13/14 Distal." },
        { "id": 5, "category": "Farmakoloji", "content": "Lokal Anestezikler: Na+ kanallarını bloke eder. Enflamasyonda pH düştüğü için etki azalır." }
    ];

    useEffect(() => {
        const systemPearls = DAILY_PILLS.map(pill => ({
            id: `system-${pill.id}`,
            content: pill.content,
            category: pill.category,
            sourceId: null,
            isFavorite: false,
            isSystemPearl: true
        }));
        const combined = [...systemPearls, ...savedPearls];
        // Fisher-Yates shuffle
        for (let i = combined.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [combined[i], combined[j]] = [combined[j], combined[i]];
        }
        setAllPearls(combined);
    }, [savedPearls]);

    const stats = useMemo(() => {
        let totalTopics = 0;
        const statusCounts = {};
        Object.keys(STATUS_CONFIG).forEach(key => statusCounts[key] = 0);
        data.forEach(group => {
            group.subjects.forEach(subject => {
                subject.topics.forEach(topic => {
                    totalTopics++;
                    if (statusCounts[topic.status] !== undefined) statusCounts[topic.status]++;
                    else statusCounts['not-started']++;
                });
            });
        });
        const completionRate = Math.round(((totalTopics - statusCounts['not-started']) / totalTopics) * 100) || 0;
        return { totalTopics, statusCounts, completionRate };
    }, [data]);

    const chartData = Object.keys(stats.statusCounts)
        .filter(key => stats.statusCounts[key] > 0)
        .map(key => ({
            name: STATUS_CONFIG[key].label,
            value: stats.statusCounts[key]
            // Colors handled in render
        }));

    const COLORS = {
        'not-started': '#334155',
        'studying': '#2563eb',
        'finished': '#059669',
        'review1': '#ca8a04',
        'review2': '#ea580c',
        'questions': '#9333ea',
    };
    const getHexColor = (statusKey) => COLORS[statusKey] || '#ccc';

    // Countdown Logic
    const targetDate = profile.date ? new Date(profile.date) : new Date('2026-10-15');
    const today = new Date();
    const daysLeft = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header / Welcome Section */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
                        Hoşgeldin, {profile.name || "Şampiyon"} 👋
                    </h2>
                    <p className="text-muted-foreground mt-1 flex items-center gap-2">
                        <Quote size={14} className="text-primary" />
                        <span className="italic">"{profile.motto || "Bugün dünden daha iyi ol."}"</span>
                    </p>
                </div>

                {profile.name && (
                    <div className="text-right hidden md:block">
                        <span className="block text-xs font-bold text-muted-foreground uppercase tracking-widest">{profile.title}</span>
                    </div>
                )}
            </div>

            {/* Personalized Countdown Banner */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Trophy size={140} />
                </div>
                <div className="absolute -bottom-10 -left-10 p-8 opacity-5">
                    <CalendarClock size={140} />
                </div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full mb-3 backdrop-blur-sm border border-white/10">
                            <Trophy size={14} className="text-yellow-300" />
                            <span className="text-xs font-bold tracking-wide text-indigo-100">ANA HEDEF</span>
                        </div>
                        <h2 className="text-3xl font-black mb-1">{profile.goal || "Büyük Hedef Belirle"}</h2>
                        <p className="text-indigo-100 opacity-80 max-w-md">
                            Her gün atılan küçük adımlar, zirveye giden yolu kısaltır. Devam et!
                        </p>
                    </div>

                    <div className="flex flex-col items-center md:items-end">
                        <div className="flex items-baseline gap-2">
                            <span className="text-7xl font-mono font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-indigo-200 drop-shadow-sm">
                                {daysLeft > 0 ? daysLeft : 0}
                            </span>
                            <span className="text-xl font-bold opacity-80">GÜN</span>
                        </div>
                        <p className="text-xs font-medium text-indigo-200 uppercase tracking-widest opacity-70">
                            {daysLeft > 0 ? 'Büyük Güne Kalan' : 'Hedef Tarihi Geldi!'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:border-primary/50 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-500 group-hover:scale-110 transition-transform">
                            <BookOpen size={24} />
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-2 py-1 rounded-full uppercase">Toplam</span>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black">{stats.totalTopics}</h3>
                        <p className="text-xs font-semibold text-muted-foreground">Müfredattaki Konular</p>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:border-emerald-500/50 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 group-hover:scale-110 transition-transform">
                            <Trophy size={24} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black">{stats.completionRate}%</h3>
                        <p className="text-xs font-semibold text-muted-foreground">Genel İlerleme</p>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:border-purple-500/50 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500 group-hover:scale-110 transition-transform">
                            <CheckCircle size={24} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black">{stats.statusCounts['questions']}</h3>
                        <p className="text-xs font-semibold text-muted-foreground">Biten (Soru Çözülen)</p>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between shadow-sm hover:border-yellow-500/50 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500 group-hover:scale-110 transition-transform">
                            <Brain size={24} />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-3xl font-black">{stats.statusCounts['studying']}</h3>
                        <p className="text-xs font-semibold text-muted-foreground">Aktif Çalışılan</p>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm min-h-[400px]">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-muted-foreground" />
                        Konu Durum Dağılımı
                    </h3>
                    {stats.totalTopics > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => {
                                        const key = Object.keys(STATUS_CONFIG).find(k => STATUS_CONFIG[k].label === entry.name);
                                        return <Cell key={`cell-${index}`} fill={getHexColor(key)} stroke="transparent" />;
                                    })}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                                    itemStyle={{ color: '#f8fafc' }}
                                />
                                <Legend layout="horizontal" verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: '20px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/50">
                            Henüz veri yok. Müfredattan konu seçmeye başla!
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    {/* Interactive Pearls Carousel */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-950 rounded-3xl p-8 border border-white/5 relative overflow-hidden min-h-[300px] flex flex-col justify-between shadow-2xl">
                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                            <Brain size={180} />
                        </div>

                        {allPearls.length > 0 ? (
                            <>
                                <div className="relative z-10 w-full">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-glow-emerald">
                                                HAP BİLGİ DOZU
                                            </span>
                                            <span className="text-xs text-slate-400 border border-white/10 px-2 py-0.5 rounded backdrop-blur-sm">
                                                {allPearls[currentPearlIndex]?.category}
                                            </span>
                                        </div>

                                        <button
                                            onClick={async () => {
                                                const currentPearl = allPearls[currentPearlIndex];
                                                if (currentPearl.isSystemPearl) {
                                                    const newPearl = { id: `saved-${Date.now()}`, content: currentPearl.content, category: currentPearl.category, sourceId: null, folderId: null, isFavorite: true, createdAt: new Date().toISOString() };
                                                    await savePearl(newPearl);
                                                    setToast({ show: true, message: '✓ Hap Bilgi Havuzu\'na eklendi!' });
                                                    setTimeout(() => setToast({ show: false, message: '' }), 3000);
                                                } else {
                                                    const updatedPearl = await togglePearlFavorite(currentPearl.id);
                                                    setToast({ show: true, message: updatedPearl?.isFavorite ? '✓ Favorilere eklendi!' : 'Favorilerden çıkarıldı' });
                                                    setTimeout(() => setToast({ show: false, message: '' }), 3000);
                                                }
                                                const dbPearls = await getPearls();
                                                setSavedPearls(dbPearls);
                                            }}
                                            className="p-2 rounded-full hover:bg-white/10 transition-all group"
                                        >
                                            <Star size={20} className={allPearls[currentPearlIndex]?.isFavorite ? "fill-yellow-500 text-yellow-500" : "text-slate-500 group-hover:text-yellow-400"} />
                                        </button>
                                    </div>

                                    <p className="text-lg md:text-xl text-slate-200 leading-relaxed font-medium mb-8 line-clamp-6">
                                        "{allPearls[currentPearlIndex]?.content}"
                                    </p>
                                </div>

                                <div className="flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setCurrentPearlIndex(prev => prev === 0 ? allPearls.length - 1 : prev - 1)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                                            <ChevronLeft size={20} className="text-slate-300" />
                                        </button>
                                        <span className="text-xs font-mono text-slate-500 px-2">
                                            {currentPearlIndex + 1}/{allPearls.length}
                                        </span>
                                        <button onClick={() => setCurrentPearlIndex(prev => prev === allPearls.length - 1 ? 0 : prev + 1)} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
                                            <ChevronRight size={20} className="text-slate-300" />
                                        </button>
                                    </div>

                                    {allPearls[currentPearlIndex]?.sourceId && (
                                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-xl text-xs font-bold hover:bg-blue-500/30 transition-colors border border-blue-500/20">
                                            <ExternalLink size={14} /> KAYNAK
                                        </button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500">
                                <Brain size={48} className="mb-4 opacity-50" />
                                <p>Henüz hap bilgi yok.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Study Sessions Card */}
                <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            Çalışma Geçmişi
                        </h3>

                        {/* Filter Buttons */}
                        <div className="flex gap-2">
                            {[
                                { key: 'today', label: 'Bugün' },
                                { key: 'week', label: 'Hafta' },
                                { key: 'month', label: 'Ay' },
                                { key: 'all', label: 'Tümü' }
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setTimeFilter(key)}
                                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${timeFilter === key
                                            ? 'bg-primary text-primary-foreground shadow-sm'
                                            : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                                        }`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {sessionsLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="animate-pulse">
                                    <div className="h-16 bg-secondary/30 rounded-lg"></div>
                                </div>
                            ))}
                        </div>
                    ) : (() => {
                        // Streak calculation
                        const calculateStreak = () => {
                            if (studySessions.length === 0) return 0;

                            const sortedDates = studySessions
                                .map(s => new Date(s.timestamp).toDateString())
                                .filter((date, idx, arr) => arr.indexOf(date) === idx)
                                .sort((a, b) => new Date(b) - new Date(a));

                            let streak = 1;
                            const today = new Date().toDateString();
                            const yesterday = new Date(Date.now() - 86400000).toDateString();

                            if (sortedDates[0] !== today && sortedDates[0] !== yesterday) return 0;

                            for (let i = 1; i < sortedDates.length; i++) {
                                const prev = new Date(sortedDates[i - 1]);
                                const curr = new Date(sortedDates[i]);
                                const diffDays = Math.round((prev - curr) / (1000 * 60 * 60 * 24));

                                if (diffDays === 1) streak++;
                                else break;
                            }

                            return streak;
                        };

                        const streak = calculateStreak();

                        // Filter sessions
                        const now = new Date();
                        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        const weekStart = new Date(now - 7 * 24 * 60 * 60 * 1000);
                        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

                        const filtered = studySessions
                            .filter(s => {
                                const sessionDate = new Date(s.timestamp);
                                switch (timeFilter) {
                                    case 'today': return sessionDate >= todayStart;
                                    case 'week': return sessionDate >= weekStart;
                                    case 'month': return sessionDate >= monthStart;
                                    default: return true;
                                }
                            })
                            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                            .slice(0, 100);

                        // Calculate stats
                        const totalMinutes = filtered.reduce((sum, s) => sum + s.duration, 0);
                        const hours = Math.floor(totalMinutes / 60);
                        const mins = totalMinutes % 60;

                        // Top subjects
                        const subjectCounts = {};
                        filtered.forEach(s => {
                            subjectCounts[s.subject] = (subjectCounts[s.subject] || 0) + s.duration;
                        });
                        const topSubjects = Object.entries(subjectCounts)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 5);

                        const chartData = topSubjects.map(([subject, minutes]) => ({
                            subject: subject.length > 12 ? subject.substring(0, 12) + '...' : subject,
                            fullSubject: subject,
                            minutes
                        }));

                        const handleDeleteSession = async (sessionId) => {
                            if (confirm('Bu oturumu silmek istediğinden emin misin?')) {
                                await deleteStudySession(sessionId);
                            }
                        };

                        return (
                            <>
                                {/* Streak Display */}
                                {streak > 0 && (
                                    <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-3 mb-4">
                                        <p className="text-sm font-bold text-orange-400 flex items-center gap-2">
                                            🔥 Streak: {streak} gün arka arkaya çalıştın!
                                        </p>
                                    </div>
                                )}

                                {/* Stats Summary */}
                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-4 border border-blue-500/20">
                                        <p className="text-2xl font-black text-blue-400">{filtered.length}</p>
                                        <p className="text-xs text-muted-foreground font-semibold">Oturum</p>
                                    </div>
                                    <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-xl p-4 border border-emerald-500/20">
                                        <p className="text-xs text-muted-foreground font-semibold mb-1">Toplam Çalışma</p>
                                        <p className="text-2xl font-black text-emerald-400">{hours}:{mins.toString().padStart(2, '0')}</p>
                                    </div>
                                </div>

                                {/* Session List */}
                                {filtered.length > 0 ? (
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                        {filtered.slice(0, 50).map(session => (
                                            <div key={session.id} className="flex items-center justify-between p-3 bg-secondary/30 hover:bg-secondary/50 rounded-lg transition-colors border border-border/50 group">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-sm">{session.subject}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(session.timestamp).toLocaleDateString('tr-TR', { dateStyle: 'short' })} {' '}
                                                        {new Date(session.timestamp).toLocaleTimeString('tr-TR', { timeStyle: 'short' })}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={14} className="text-primary" />
                                                        <span className="text-sm font-bold text-primary">{session.duration} dk</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteSession(session.id)}
                                                        className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-lg text-muted-foreground hover:text-red-500 transition-all"
                                                        title="Sil"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {filtered.length > 50 && (
                                            <p className="text-xs text-center text-muted-foreground py-2 bg-secondary/20 rounded-lg">
                                                +{filtered.length - 50} oturum daha
                                            </p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-muted-foreground bg-secondary/20 rounded-xl border border-dashed border-border">
                                        <Clock size={48} className="mx-auto mb-3 opacity-30" />
                                        <p className="font-semibold">Henüz oturum yok</p>
                                        <p className="text-xs mt-1">Pomodoro ile çalışmaya başla! 🍅</p>
                                    </div>
                                )}

                                {/* Top Subjects with Bar Chart */}
                                {topSubjects.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-border">
                                        <div className="flex items-center gap-2 mb-4">
                                            <TrendingUp size={16} className="text-amber-500" />
                                            <p className="text-xs font-black text-muted-foreground uppercase tracking-wider">En Çok Çalışılan</p>
                                        </div>
                                        <ResponsiveContainer width="100%" height={150}>
                                            <BarChart data={chartData} layout="vertical">
                                                <XAxis type="number" hide />
                                                <YAxis type="category" dataKey="subject" width={80} style={{ fontSize: 10 }} />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#1e293b',
                                                        border: 'none',
                                                        borderRadius: '8px',
                                                        fontSize: '12px'
                                                    }}
                                                    formatter={(value, name, props) => [
                                                        `${value} dk`,
                                                        props.payload.fullSubject
                                                    ]}
                                                />
                                                <Bar dataKey="minutes" fill="#10b981" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
            </div>

            {/* Global Toast */}
            {toast.show && (
                <div className="fixed bottom-8 right-8 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-300 z-50 flex items-center gap-3 font-bold">
                    <CheckCircle size={20} className="text-emerald-200" />
                    {toast.message}
                </div>
            )}
        </div>
    );
}

export default Dashboard;
