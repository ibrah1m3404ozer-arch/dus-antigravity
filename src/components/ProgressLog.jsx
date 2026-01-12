import React, { useState, useEffect } from 'react';
import { getFitnessLogs, saveFitnessLog, deleteFitnessLog, getFitnessWorkouts } from '../utils/db';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Trash2, TrendingUp, Search, Dumbbell } from 'lucide-react';

function ProgressLog() {
    const [logs, setLogs] = useState([]);
    const [scheduleExercises, setScheduleExercises] = useState([]);
    const [pastExercises, setPastExercises] = useState([]);
    const [selectedExercise, setSelectedExercise] = useState('all');

    // Quick Add State
    const [newLog, setNewLog] = useState({ exerciseName: '', weight: '', reps: '', date: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const logData = await getFitnessLogs();
        setLogs(logData.sort((a, b) => new Date(b.date) - new Date(a.date)));

        const historyNames = [...new Set(logData.map(l => l.exerciseName))];
        setPastExercises(historyNames);

        const workouts = await getFitnessWorkouts();
        let programMoves = [];
        if (workouts.length > 0) {
            workouts.forEach(day => {
                if (day.exercises && Array.isArray(day.exercises)) {
                    day.exercises.forEach(ex => {
                        if (ex.name && ex.name.trim() !== '') {
                            programMoves.push(ex.name.trim());
                        }
                    });
                }
            });
        }
        programMoves = [...new Set(programMoves)].sort();
        setScheduleExercises(programMoves);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!newLog.exerciseName || !newLog.weight) return;

        const log = {
            id: Date.now().toString(),
            ...newLog,
            weight: parseFloat(newLog.weight),
            reps: parseInt(newLog.reps) || 0
        };

        await saveFitnessLog(log);
        setNewLog({ ...newLog, weight: '', reps: '' });
        loadData();
    };

    // FIXED DELETE HANDLER: No confirm, direct action for reliability
    const handleDelete = async (id) => {
        // 1. Optimistic Update (Immediate Feedback)
        const originalLogs = [...logs];
        setLogs(prevLogs => prevLogs.filter(log => log.id !== id));

        try {
            await deleteFitnessLog(id);
        } catch (error) {
            // Restore on error
            setLogs(originalLogs);
            console.error("Delete failed:", error);
        }
    };

    const getChartData = (exercise) => {
        return logs
            .filter(l => l.exerciseName === exercise)
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(l => ({
                date: new Date(l.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
                weight: l.weight
            }));
    };

    const filteredLogs = selectedExercise === 'all'
        ? logs
        : logs.filter(l => l.exerciseName === selectedExercise);

    const allUniqueExercises = [...new Set([...scheduleExercises, ...pastExercises])].sort();

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            <div>
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-500">
                    Gelişim Takibi
                </h2>
                <p className="text-muted-foreground mt-1">Progressive Overload istatistiklerin 📈</p>
            </div>

            <form onSubmit={handleSave} className="bg-card border border-border rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                    <label className="block text-xs font-medium mb-1 flex items-center gap-1">
                        <Dumbbell size={12} className="text-emerald-500" /> Hareket Seç
                    </label>
                    <select
                        value={newLog.exerciseName}
                        onChange={e => setNewLog({ ...newLog, exerciseName: e.target.value })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer"
                        required
                    >
                        <option value="" disabled>Hareket Seçiniz...</option>
                        {scheduleExercises.length > 0 && (
                            <optgroup label="Haftalık Programım">
                                {scheduleExercises.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </optgroup>
                        )}
                        {pastExercises.length > 0 && (
                            <optgroup label="Geçmiş Kayıtlar">
                                {pastExercises.filter(n => !scheduleExercises.includes(n)).map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </optgroup>
                        )}
                        <option value="custom">+ Diğer / Manuel Ekle</option>
                    </select>

                    {newLog.exerciseName === 'custom' && (
                        <input
                            type="text"
                            placeholder="Hareket Adı Yazın..."
                            className="w-full mt-2 px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 animate-in fade-in slide-in-from-top-2"
                            onChange={e => setNewLog({ ...newLog, exerciseName: e.target.value })}
                            autoFocus
                        />
                    )}
                </div>
                <div className="w-full md:w-32">
                    <label className="block text-xs font-medium mb-1">Ağırlık (kg)</label>
                    <input
                        type="number"
                        step="0.5"
                        value={newLog.weight}
                        onChange={e => setNewLog({ ...newLog, weight: e.target.value })}
                        placeholder="0"
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-emerald-500"
                        required
                    />
                </div>
                <div className="w-full md:w-32">
                    <label className="block text-xs font-medium mb-1">Tekrar</label>
                    <input
                        type="number"
                        value={newLog.reps}
                        onChange={e => setNewLog({ ...newLog, reps: e.target.value })}
                        placeholder="0"
                        className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                </div>
                <button type="submit" className="w-full md:w-auto px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                    <Plus size={18} /> Ekle
                </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card border border-border rounded-2xl p-6 min-h-[300px]">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold flex items-center gap-2">
                            <TrendingUp className="text-emerald-500" />
                            Grafik
                        </h3>
                        <select
                            value={selectedExercise}
                            onChange={e => setSelectedExercise(e.target.value)}
                            className="bg-background border border-border rounded-lg px-3 py-1 text-sm max-w-[150px] truncate"
                        >
                            <option value="all">Tüm Hareketler</option>
                            {allUniqueExercises.map(name => <option key={name} value={name}>{name}</option>)}
                        </select>
                    </div>

                    {selectedExercise !== 'all' && getChartData(selectedExercise).length > 1 ? (
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={getChartData(selectedExercise)}>
                                    <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 5', 'dataMax + 5']} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                                        itemStyle={{ color: '#10b981' }}
                                    />
                                    <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground opacity-50">
                            <TrendingUp size={48} className="mb-4" />
                            <p>Grafik görmek için bir hareket seçin</p>
                            <p className="text-xs">En az 2 veri girişi gerekli</p>
                        </div>
                    )}
                </div>

                <div className="bg-card border border-border rounded-2xl p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Search className="text-emerald-500" />
                        Son Loglar
                    </h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        {filteredLogs.map(log => (
                            <div key={log.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl hover:bg-secondary/50 transition-colors group relative">
                                <div>
                                    <p className="font-bold text-foreground">{log.exerciseName}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(log.date).toLocaleDateString('tr-TR')} • {log.reps} Tekrar</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xl font-bold text-emerald-500">{log.weight}kg</span>

                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(log.id);
                                        }}
                                        className="h-10 w-10 flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all cursor-pointer active:scale-90"
                                        title="Sil"
                                        style={{ zIndex: 50 }}
                                    >
                                        <Trash2 size={20} className="pointer-events-none" />
                                    </button>

                                </div>
                            </div>
                        ))}
                        {filteredLogs.length === 0 && (
                            <p className="text-center text-muted-foreground py-8">Kayıt bulunamadı.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProgressLog;
