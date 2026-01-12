import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, X, Trash2, TrendingDown, ArrowRight, Target, Award, BarChart3, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { getExams, saveExam, deleteExam } from '../utils/db';

// DUS Subjects organized by category
const BASIC_SCIENCES = [
    { key: 'anatomi', label: 'Anatomi' },
    { key: 'fizyoloji', label: 'Fizyoloji' },
    { key: 'biyokimya', label: 'Tıbbi Biyokimya' },
    { key: 'mikrobiyoloji', label: 'Tıbbi Mikrobiyoloji' },
    { key: 'patoloji', label: 'Tıbbi Patoloji' },
    { key: 'farmakoloji', label: 'Tıbbi Farmakoloji' },
    { key: 'biyoloji', label: 'Tıbbi Biyoloji ve Genetik' }
];

const CLINICAL_SCIENCES = [
    { key: 'protetik', label: 'Protetik Diş Tedavisi' },
    { key: 'restoratif', label: 'Restoratif Diş Tedavisi' },
    { key: 'cerrahi', label: 'Ağız, Diş ve Çene Cerrahisi' },
    { key: 'radyoloji', label: 'Ağız, Diş ve Çene Radyolojisi' },
    { key: 'periodontoloji', label: 'Periodontoloji' },
    { key: 'ortodonti', label: 'Ortodonti' },
    { key: 'endodonti', label: 'Endodonti' },
    { key: 'pedodonti', label: 'Çocuk Diş Hekimliği (Pedodonti)' }
];

const ALL_SUBJECTS = [...BASIC_SCIENCES, ...CLINICAL_SCIENCES];

function Analytics() {
    const [exams, setExams] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '' });

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        date: new Date().toISOString().split('T')[0],
        subjects: {}
    });

    useEffect(() => {
        loadExams();
    }, []);

    // Initialize form subjects
    useEffect(() => {
        const initialSubjects = {};
        ALL_SUBJECTS.forEach(subject => {
            initialSubjects[subject.key] = { correct: 0, wrong: 0, blank: 0, net: 0 };
        });
        setFormData(prev => ({ ...prev, subjects: initialSubjects }));
    }, []);

    const loadExams = async () => {
        const allExams = await getExams();
        setExams(allExams.sort((a, b) => new Date(a.date) - new Date(b.date)));
    };

    const calculateNet = (correct, wrong) => {
        const c = parseInt(correct) || 0;
        const w = parseInt(wrong) || 0;
        return Math.max(0, c - w / 4).toFixed(2);
    };

    const handleSubjectChange = (subjectKey, field, value) => {
        const numValue = parseInt(value) || 0;
        const updated = { ...formData.subjects };
        updated[subjectKey] = { ...updated[subjectKey], [field]: numValue };

        // Calculate net
        const net = calculateNet(updated[subjectKey].correct, updated[subjectKey].wrong);
        updated[subjectKey].net = parseFloat(net);

        setFormData({ ...formData, subjects: updated });
    };

    const handleSaveExam = async () => {
        if (!formData.name.trim()) {
            setToast({ show: true, message: '⚠️ Deneme adı gerekli!' });
            setTimeout(() => setToast({ show: false, message: '' }), 3000);
            return;
        }

        const totalNet = Object.values(formData.subjects).reduce((sum, s) => sum + s.net, 0);

        const newExam = {
            id: Date.now().toString(),
            name: formData.name.trim(),
            date: formData.date,
            subjects: formData.subjects,
            totalNet: parseFloat(totalNet.toFixed(2)),
            createdAt: new Date().toISOString()
        };

        await saveExam(newExam);
        await loadExams();

        // Reset form
        const resetSubjects = {};
        ALL_SUBJECTS.forEach(subject => {
            resetSubjects[subject.key] = { correct: 0, wrong: 0, blank: 0, net: 0 };
        });
        setFormData({ name: '', date: new Date().toISOString().split('T')[0], subjects: resetSubjects });
        setShowModal(false);

        setToast({ show: true, message: '✓ Deneme başarıyla kaydedildi!' });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const handleDeleteExam = async (id) => {
        if (window.confirm('Bu denemeyi silmek istediğinize emin misiniz?')) {
            await deleteExam(id);
            await loadExams();
            setToast({ show: true, message: 'Deneme silindi' });
            setTimeout(() => setToast({ show: false, message: '' }), 3000);
        }
    };

    // Chart data
    const chartData = exams.map(exam => ({
        name: new Date(exam.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
        net: exam.totalNet,
        fullName: exam.name
    }));

    // Radar Chart Data (Last 5 exams average or last exam)
    const getRadarData = () => {
        if (exams.length === 0) return [];

        const recentExams = exams.slice(-5); // Last 5 exams
        const subjectAverages = {};

        ALL_SUBJECTS.forEach(subject => {
            const sum = recentExams.reduce((acc, exam) => acc + (exam.subjects[subject.key]?.net || 0), 0);
            subjectAverages[subject.key] = (sum / recentExams.length).toFixed(2);
        });

        return ALL_SUBJECTS.map(subject => ({
            subject: subject.label.length > 15 ? subject.label.substring(0, 15) + '...' : subject.label,
            net: parseFloat(subjectAverages[subject.key])
        }));
    };

    const radarData = getRadarData();

    // Stats
    const totalExams = exams.length;
    const highestNet = exams.length > 0 ? Math.max(...exams.map(e => e.totalNet)) : 0;
    const averageNet = exams.length > 0 ? (exams.reduce((sum, e) => sum + e.totalNet, 0) / exams.length).toFixed(2) : 0;

    // Get change from previous exam
    const getExamTrend = (index) => {
        if (index === 0) return null;
        const current = exams[index].totalNet;
        const previous = exams[index - 1].totalNet;
        const diff = current - previous;
        return { diff: diff.toFixed(2), isUp: diff > 0, isDown: diff < 0 };
    };

    // Subject analysis
    const getSubjectTrend = (subjectKey) => {
        if (exams.length < 2) return { change: 0, trend: 'neutral' };

        const lastExam = exams[exams.length - 1];
        const prevExam = exams[exams.length - 2];

        const lastNet = lastExam.subjects[subjectKey]?.net || 0;
        const prevNet = prevExam.subjects[subjectKey]?.net || 0;

        if (prevNet === 0) return { change: 0, trend: 'neutral' };

        const changePercent = ((lastNet - prevNet) / prevNet) * 100;

        let trend = 'neutral';
        if (changePercent > 10) trend = 'up';
        else if (changePercent < -10) trend = 'down';

        return { change: changePercent.toFixed(1), trend };
    };

    const getAverageNet = (subjectKey) => {
        if (exams.length === 0) return 0;
        const sum = exams.reduce((acc, exam) => acc + (exam.subjects[subjectKey]?.net || 0), 0);
        return (sum / exams.length).toFixed(2);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-purple-400">
                        Performans & Deneme Takip
                    </h2>
                    <p className="text-muted-foreground mt-1">Gelişiminizi görselleştirin ve zayıf noktalarınızı tespit edin</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg transition-all"
                >
                    <Plus size={20} />
                    Yeni Deneme Ekle
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-3">
                        <BarChart3 className="text-blue-500" size={24} />
                        <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded-full">Toplam</span>
                    </div>
                    <h3 className="text-3xl font-bold">{totalExams}</h3>
                    <p className="text-sm text-muted-foreground">Girilen Deneme</p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-3">
                        <Award className="text-emerald-500" size={24} />
                        <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded-full">En Yüksek</span>
                    </div>
                    <h3 className="text-3xl font-bold">{highestNet.toFixed(2)}</h3>
                    <p className="text-sm text-muted-foreground">Net Puan</p>
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-3">
                        <Target className="text-amber-500" size={24} />
                        <span className="text-xs bg-amber-500/10 text-amber-500 px-2 py-1 rounded-full">Ortalama</span>
                    </div>
                    <h3 className="text-3xl font-bold">{averageNet}</h3>
                    <p className="text-sm text-muted-foreground">Net Puan</p>
                </div>
            </div>

            {/* Charts Grid */}
            {exams.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Line Chart */}
                    <div className="bg-card border border-border rounded-3xl p-6">
                        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <TrendingUp className="text-violet-500" size={24} />
                            Genel Gelişim Grafiği
                        </h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="name" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc' }}
                                    itemStyle={{ color: '#f8fafc' }}
                                    formatter={(value, name, props) => [`${value} Net`, props.payload.fullName]}
                                />
                                <Legend />
                                <Line
                                    type="monotone"
                                    dataKey="net"
                                    stroke="#8b5cf6"
                                    strokeWidth={3}
                                    dot={{ fill: '#8b5cf6', r: 5 }}
                                    activeDot={{ r: 8 }}
                                    name="Toplam Net"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Radar Chart */}
                    <div className="bg-card border border-border rounded-3xl p-6">
                        <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                            <Target className="text-emerald-500" size={24} />
                            Ders Bazlı Güç Analizi
                        </h3>
                        <ResponsiveContainer width="100%" height={350}>
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="#334155" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                <PolarRadiusAxis stroke="#94a3b8" />
                                <Radar name="Net Ortalaması" dataKey="net" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px' }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                        <p className="text-xs text-muted-foreground text-center mt-4">
                            Son {Math.min(5, exams.length)} denemenin ortalaması
                        </p>
                    </div>
                </div>
            ) : (
                <div className="bg-card border border-border rounded-3xl p-12 text-center">
                    <BarChart3 size={64} className="mx-auto text-muted-foreground mb-4 opacity-50" />
                    <p className="text-lg font-medium text-muted-foreground">Henüz deneme eklenmedi</p>
                    <p className="text-sm text-muted-foreground mt-2">Gelişiminizi görmek için deneme sonuçlarınızı ekleyin</p>
                </div>
            )}

            {/* Subject Analysis */}
            {exams.length >= 2 && (
                <div className="bg-card border border-border rounded-3xl p-6">
                    <h3 className="text-xl font-semibold mb-6">Ders Bazlı Trend Analizi</h3>

                    {/* Basic Sciences */}
                    <div className="mb-6">
                        <h4 className="text-sm font-bold text-blue-400 mb-3 uppercase tracking-wider">Temel Bilimler</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {BASIC_SCIENCES.map(subject => {
                                const trend = getSubjectTrend(subject.key);
                                const avgNet = getAverageNet(subject.key);

                                return (
                                    <div key={subject.key} className="bg-secondary/30 rounded-xl p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{subject.label}</p>
                                            <p className="text-sm text-muted-foreground">Ort: {avgNet} net</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {trend.trend === 'up' && (
                                                <div className="flex items-center gap-1 text-emerald-500 text-sm font-medium">
                                                    <TrendingUp size={18} />
                                                    +{trend.change}%
                                                </div>
                                            )}
                                            {trend.trend === 'down' && (
                                                <div className="flex items-center gap-1 text-red-500 text-sm font-medium bg-red-500/10 px-2 py-1 rounded-full">
                                                    <TrendingDown size={18} />
                                                    {trend.change}% 📉
                                                </div>
                                            )}
                                            {trend.trend === 'neutral' && (
                                                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                                                    <ArrowRight size={18} />
                                                    Stabil
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Clinical Sciences */}
                    <div>
                        <h4 className="text-sm font-bold text-purple-400 mb-3 uppercase tracking-wider">Klinik Bilimler</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {CLINICAL_SCIENCES.map(subject => {
                                const trend = getSubjectTrend(subject.key);
                                const avgNet = getAverageNet(subject.key);

                                return (
                                    <div key={subject.key} className="bg-secondary/30 rounded-xl p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{subject.label}</p>
                                            <p className="text-sm text-muted-foreground">Ort: {avgNet} net</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {trend.trend === 'up' && (
                                                <div className="flex items-center gap-1 text-emerald-500 text-sm font-medium">
                                                    <TrendingUp size={18} />
                                                    +{trend.change}%
                                                </div>
                                            )}
                                            {trend.trend === 'down' && (
                                                <div className="flex items-center gap-1 text-red-500 text-sm font-medium bg-red-500/10 px-2 py-1 rounded-full">
                                                    <TrendingDown size={18} />
                                                    {trend.change}% 📉
                                                </div>
                                            )}
                                            {trend.trend === 'neutral' && (
                                                <div className="flex items-center gap-1 text-muted-foreground text-sm">
                                                    <ArrowRight size={18} />
                                                    Stabil
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Exam List with Trend Indicators */}
            {exams.length > 0 && (
                <div className="bg-card border border-border rounded-3xl p-6">
                    <h3 className="text-xl font-semibold mb-4">Deneme Listesi</h3>
                    <div className="space-y-3">
                        {exams.map((exam, index) => {
                            const trend = getExamTrend(index);

                            return (
                                <div
                                    key={exam.id}
                                    className={`rounded-xl p-4 flex items-center justify-between hover:bg-secondary/50 transition-colors ${trend?.isDown ? 'bg-red-500/10 border border-red-500/30' :
                                            trend?.isUp ? 'bg-emerald-500/10 border border-emerald-500/30' :
                                                'bg-secondary/30'
                                        }`}
                                >
                                    <div>
                                        <p className="font-medium">{exam.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {new Date(exam.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {trend && (
                                            <div className={`flex items-center gap-1 text-sm font-medium ${trend.isUp ? 'text-emerald-500' : 'text-red-500'}`}>
                                                {trend.isUp ? (
                                                    <>
                                                        <TrendingUp size={18} />
                                                        +{trend.diff} 📈
                                                    </>
                                                ) : (
                                                    <>
                                                        <TrendingDown size={18} />
                                                        {trend.diff} 📉
                                                    </>
                                                )}
                                            </div>
                                        )}
                                        <div className="text-right">
                                            <p className="text-2xl font-bold text-violet-500">{exam.totalNet}</p>
                                            <p className="text-xs text-muted-foreground">Toplam Net</p>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteExam(exam.id)}
                                            className="p-2 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Add Exam Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-card w-full max-w-5xl rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold flex items-center gap-2">
                                <Plus className="text-violet-500" size={28} />
                                Yeni Deneme Ekle
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-secondary rounded-full">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Exam Info */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium mb-2">Deneme Adı</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="örn: Tustime 4, ÇPA Deneme 5"
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Tarih</label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                            </div>
                        </div>

                        {/* Subjects - Basic Sciences */}
                        <div className="mb-6">
                            <h4 className="font-bold mb-4 text-lg text-blue-400 uppercase tracking-wider">Temel Bilimler</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {BASIC_SCIENCES.map(subject => (
                                    <div key={subject.key} className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                                        <p className="font-medium mb-3">{subject.label}</p>
                                        <div className="grid grid-cols-4 gap-2">
                                            <div>
                                                <label className="block text-xs text-muted-foreground mb-1">Doğru</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={formData.subjects[subject.key]?.correct || 0}
                                                    onChange={(e) => handleSubjectChange(subject.key, 'correct', e.target.value)}
                                                    className="w-full px-2 py-1 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-muted-foreground mb-1">Yanlış</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={formData.subjects[subject.key]?.wrong || 0}
                                                    onChange={(e) => handleSubjectChange(subject.key, 'wrong', e.target.value)}
                                                    className="w-full px-2 py-1 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-muted-foreground mb-1">Boş</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={formData.subjects[subject.key]?.blank || 0}
                                                    onChange={(e) => handleSubjectChange(subject.key, 'blank', e.target.value)}
                                                    className="w-full px-2 py-1 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-muted-foreground mb-1">Net</label>
                                                <div className="w-full px-2 py-1 bg-violet-500/10 border border-violet-500/30 rounded text-sm font-bold text-violet-500 text-center">
                                                    {formData.subjects[subject.key]?.net?.toFixed(2) || '0.00'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Subjects - Clinical Sciences */}
                        <div className="mb-6">
                            <h4 className="font-bold mb-4 text-lg text-purple-400 uppercase tracking-wider">Klinik Bilimler</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {CLINICAL_SCIENCES.map(subject => (
                                    <div key={subject.key} className="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
                                        <p className="font-medium mb-3">{subject.label}</p>
                                        <div className="grid grid-cols-4 gap-2">
                                            <div>
                                                <label className="block text-xs text-muted-foreground mb-1">Doğru</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={formData.subjects[subject.key]?.correct || 0}
                                                    onChange={(e) => handleSubjectChange(subject.key, 'correct', e.target.value)}
                                                    className="w-full px-2 py-1 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-muted-foreground mb-1">Yanlış</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={formData.subjects[subject.key]?.wrong || 0}
                                                    onChange={(e) => handleSubjectChange(subject.key, 'wrong', e.target.value)}
                                                    className="w-full px-2 py-1 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-muted-foreground mb-1">Boş</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={formData.subjects[subject.key]?.blank || 0}
                                                    onChange={(e) => handleSubjectChange(subject.key, 'blank', e.target.value)}
                                                    className="w-full px-2 py-1 bg-background border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-gray-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs text-muted-foreground mb-1">Net</label>
                                                <div className="w-full px-2 py-1 bg-violet-500/10 border border-violet-500/30 rounded text-sm font-bold text-violet-500 text-center">
                                                    {formData.subjects[subject.key]?.net?.toFixed(2) || '0.00'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Total Net */}
                        <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl p-4 mb-6">
                            <div className="flex items-center justify-between text-white">
                                <span className="text-lg font-medium">TOPLAM NET</span>
                                <span className="text-4xl font-bold">
                                    {Object.values(formData.subjects).reduce((sum, s) => sum + s.net, 0).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-3 bg-secondary hover:bg-secondary/80 rounded-xl font-bold"
                            >
                                İptal
                            </button>
                            <button
                                onClick={handleSaveExam}
                                className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-bold"
                            >
                                Denemeyi Kaydet
                            </button>
                        </div>
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

export default Analytics;
