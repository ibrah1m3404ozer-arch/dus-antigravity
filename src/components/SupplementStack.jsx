import React, { useState, useEffect } from 'react';
import { getSupplements, saveSupplement, deleteSupplement, getSupplementLogsByDate, saveSupplementLog, deleteSupplementLog } from '../utils/db';
import { Pill, Plus, Trash2, Check, Sparkles } from 'lucide-react';

function SupplementStack() {
    const [supplements, setSupplements] = useState([]);
    const [todayLogs, setTodayLogs] = useState({});
    const [showAddModal, setShowAddModal] = useState(false);

    // Add Form
    const [newSupp, setNewSupp] = useState({ name: '', dosage: '', icon: '💊' });

    const TODAY = new Date().toISOString().split('T')[0];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        let supps = await getSupplements();

        // 🚀 Auto-Seed Starter Pack (Eğer liste boşsa)
        if (supps.length === 0) {
            const starterPack = [
                { id: 'auto_1', name: "Kreatin", dosage: "Antrenman Sonrası (5g)", icon: "⚡" },
                { id: 'auto_2', name: "Multivitamin", dosage: "Sabah Kahvaltıda", icon: "💊" },
                { id: 'auto_3', name: "ZMA", dosage: "Gece Yatmadan", icon: "🌙" },
                { id: 'auto_4', name: "Vitamin D3", dosage: "Sabah Tok", icon: "☀️" },
                { id: 'auto_5', name: "Omega-3", dosage: "Öğle Yemeğinde", icon: "🐟" }
            ];

            console.log("Seeding Supplement Starter Pack... 🚀");
            for (const s of starterPack) {
                await saveSupplement(s);
            }
            supps = await getSupplements(); // Reload seeded data
        }

        setSupplements(supps);

        const logs = await getSupplementLogsByDate(TODAY);
        const logMap = {};
        logs.forEach(log => {
            logMap[log.supplementId] = log.id;
        });
        setTodayLogs(logMap);
    };

    const handleSaveSupplement = async () => {
        if (!newSupp.name) return;
        const supplement = {
            id: Date.now().toString(),
            name: newSupp.name,
            dosage: newSupp.dosage || 'Günde 1 kez',
            icon: newSupp.icon || '💊'
        };
        await saveSupplement(supplement);
        setNewSupp({ name: '', dosage: '', icon: '💊' });
        setShowAddModal(false);
        loadData();
    };

    const handleDeleteSupplement = async (id, e) => {
        e.stopPropagation();
        if (window.confirm('Bu supplementi silmek istediğine emin misin?')) {
            await deleteSupplement(id);
            loadData();
        }
    };

    const toggleTaken = async (supplementId) => {
        const existingLogId = todayLogs[supplementId];

        if (existingLogId) {
            await deleteSupplementLog(existingLogId);
        } else {
            const log = {
                id: `${TODAY}_${supplementId}`,
                date: TODAY,
                supplementId,
                taken: true
            };
            await saveSupplementLog(log);
        }
        loadData();
    };

    const completionRate = supplements.length > 0
        ? Math.round((Object.keys(todayLogs).length / supplements.length) * 100)
        : 0;

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-gradient-to-r from-violet-900/50 to-indigo-900/50 p-6 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl">
                <div>
                    <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 flex items-center gap-3">
                        <Sparkles className="text-yellow-400 fill-yellow-400" />
                        Supplement Stack
                    </h2>
                    <p className="text-violet-200 mt-2 font-medium">Günlük optimizasyon rutinin hazır şampiyon! 🏆</p>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right hidden md:block">
                        <p className="text-xs font-bold text-violet-300 uppercase letter-spacing-wide">Günlük Hedef</p>
                        <p className={`text-2xl font-black transition-colors ${completionRate === 100 ? 'text-green-400' : 'text-white'}`}>%{completionRate}</p>
                    </div>
                    {/* Progress Circle */}
                    <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]">
                            <circle cx="32" cy="32" r="28" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                            <circle
                                cx="32" cy="32" r="28" fill="transparent" stroke={completionRate === 100 ? "#4ade80" : "#a78bfa"} strokeWidth="6"
                                strokeDasharray={175} strokeDashoffset={175 - (175 * completionRate) / 100} strokeLinecap="round"
                                className="transition-all duration-700 ease-out"
                            />
                        </svg>
                        <Pill size={20} className={`absolute ${completionRate === 100 ? 'text-green-400' : 'text-violet-300'}`} />
                    </div>
                </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Add Button */}
                <button
                    onClick={() => setShowAddModal(true)}
                    className="h-full min-h-[160px] border-2 border-dashed border-violet-500/30 rounded-3xl flex flex-col items-center justify-center text-violet-400 hover:text-violet-200 hover:border-violet-400 hover:bg-violet-500/10 transition-all group"
                >
                    <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Plus className="w-6 h-6" />
                    </div>
                    <span className="font-bold">Yeni Supplement Ekle</span>
                </button>

                {supplements.map(supp => {
                    const isTaken = !!todayLogs[supp.id];
                    return (
                        <div
                            key={supp.id}
                            cursor="pointer"
                            onClick={() => toggleTaken(supp.id)}
                            className={`relative p-5 rounded-3xl border backdrop-blur-md transition-all duration-300 group cursor-pointer select-none overflow-hidden
                                ${isTaken
                                    ? 'bg-emerald-900/30 border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.2)] scale-[1.02]'
                                    : 'bg-card/40 border-white/5 hover:border-violet-500/50 hover:bg-card/60 hover:translate-y-[-2px] hover:shadow-xl'
                                }
                            `}
                        >
                            {/* Neon Glow Logic */}
                            {isTaken && <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />}

                            <div className="flex justify-between items-start relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className={`text-4xl filter drop-shadow-md transition-transform duration-300 ${isTaken ? 'scale-110 rotate-12' : 'grayscale-[0.3]'}`}>
                                        {supp.icon || '💊'}
                                    </div>
                                    <div>
                                        <h3 className={`font-bold text-lg leading-tight ${isTaken ? 'text-emerald-300' : 'text-white'}`}>
                                            {supp.name}
                                        </h3>
                                        <p className={`text-xs font-medium mt-1 ${isTaken ? 'text-emerald-400/70' : 'text-gray-400'}`}>
                                            {supp.dosage}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => handleDeleteSupplement(supp.id, e)}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="mt-6 flex items-center justify-between relative z-10">
                                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${isTaken ? 'bg-emerald-500 text-black' : 'bg-white/5 text-gray-500'
                                    }`}>
                                    {isTaken ? <Check size={14} className="stroke-[3]" /> : <div className="w-3.5 h-3.5 rounded-full border-2 border-gray-600" />}
                                    {isTaken ? 'TAMAMLANDI' : 'BEKLİYOR'}
                                </div>
                            </div>
                        </div>
                    );
                })}


            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200" onClick={() => setShowAddModal(false)}>
                    <div className="bg-[#1a1a1a] w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-white/10" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                            <Plus className="text-violet-500" />
                            Yeni Supplement
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1 ml-1">AD (Örn: Kafein)</label>
                                <input
                                    value={newSupp.name}
                                    onChange={e => setNewSupp({ ...newSupp, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-violet-500 focus:border-transparent text-white placeholder:text-gray-600 outline-none transition-all"
                                    placeholder="Supplement adı..."
                                    autoFocus
                                />
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-gray-400 mb-1 ml-1">DOZ (5mg)</label>
                                    <input
                                        value={newSupp.dosage}
                                        onChange={e => setNewSupp({ ...newSupp, dosage: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-violet-500 text-white placeholder:text-gray-600 outline-none"
                                        placeholder="Dozaj..."
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="block text-xs font-bold text-gray-400 mb-1 ml-1">İKON</label>
                                    <select
                                        value={newSupp.icon}
                                        onChange={e => setNewSupp({ ...newSupp, icon: e.target.value })}
                                        className="w-full px-2 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-violet-500 text-2xl text-center outline-none cursor-pointer appearance-none"
                                    >
                                        <option value="💊">💊</option>
                                        <option value="⚡">⚡</option>
                                        <option value="🌙">🌙</option>
                                        <option value="☀️">☀️</option>
                                        <option value="🐟">🐟</option>
                                        <option value="🦾">🦾</option>
                                        <option value="🥃">🥃</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-8">
                            <button onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-2xl font-bold transition-colors">Vazgeç</button>
                            <button onClick={handleSaveSupplement} className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold shadow-lg shadow-violet-500/25 transition-all">Ekle</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SupplementStack;
