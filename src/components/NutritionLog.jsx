import React, { useState, useEffect } from 'react';
import { getNutritionLogs, saveNutritionLog, deleteNutritionLog } from '../utils/db';
import { Plus, Trash2, Droplets, Utensils, Flame, UserCog, AlertCircle } from 'lucide-react';

function NutritionLog() {
    const [logs, setLogs] = useState([]);
    const [goals, setGoals] = useState({ protein: 160, calories: 2500, water: 3000 }); // Water in ml
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // New Meal State
    const [newMeal, setNewMeal] = useState({ name: '', protein: '', calories: '' });

    useEffect(() => {
        loadData();
        loadGoals();
    }, []);

    const loadGoals = () => {
        const saved = localStorage.getItem('fitness_macros');
        if (saved) {
            setGoals(JSON.parse(saved));
        }
    };

    const saveGoals = (newGoals) => {
        setGoals(newGoals);
        localStorage.setItem('fitness_macros', JSON.stringify(newGoals));
        setIsSettingsOpen(false);
    };

    const loadData = async () => {
        const allLogs = await getNutritionLogs();
        // Simple "Daily Reset" logic: Only show today's logs
        const today = new Date().toLocaleDateString('tr-TR');
        const todaysLogs = allLogs.filter(l => new Date(l.date).toLocaleDateString('tr-TR') === today);
        setLogs(todaysLogs.sort((a, b) => b.createdAt - a.createdAt));
    };

    const handleAddMeal = async (e) => {
        e.preventDefault();
        if (!newMeal.name) return;

        const log = {
            id: Date.now().toString(),
            type: 'meal',
            name: newMeal.name,
            protein: parseInt(newMeal.protein) || 0,
            calories: parseInt(newMeal.calories) || 0,
            date: new Date().toISOString(),
            createdAt: Date.now()
        };

        await saveNutritionLog(log);
        setNewMeal({ name: '', protein: '', calories: '' });
        loadData();
    };

    const handleAddWater = async (amount) => {
        const log = {
            id: Date.now().toString(),
            type: 'water',
            name: 'Su',
            water: amount,
            date: new Date().toISOString(),
            createdAt: Date.now()
        };
        await saveNutritionLog(log);
        loadData();
    };

    const handleDelete = async (id) => {
        if (confirm('Silmek istediğine emin misin?')) {
            await deleteNutritionLog(id);
            loadData();
        }
    };

    // Calculate Totals
    const totalProtein = logs.filter(l => l.type === 'meal').reduce((acc, l) => acc + (l.protein || 0), 0);
    const totalCalories = logs.filter(l => l.type === 'meal').reduce((acc, l) => acc + (l.calories || 0), 0);
    const totalWater = logs.filter(l => l.type === 'water').reduce((acc, l) => acc + (l.water || 0), 0);

    // Helpers for Progress Bars
    const getProgress = (current, target) => Math.min((current / target) * 100, 100);
    const isExceeded = (current, target) => current > target;

    const COMMON_FOODS = [
        { name: 'Yumurta (1 adet)', protein: 6, calories: 70 },
        { name: 'Tavuk Göğsü (100g)', protein: 31, calories: 165 },
        { name: 'Pirinç Pilavı (100g pişmiş)', protein: 3, calories: 130 },
        { name: 'Whey Protein (1 ölçek)', protein: 24, calories: 120 },
        { name: 'Yulaf Ezmesi (50g)', protein: 6, calories: 190 },
        { name: 'Muz (Orta)', protein: 1, calories: 105 },
        { name: 'Ton Balığı (1 kutu)', protein: 25, calories: 150 },
        { name: 'Süzme Peynir (100g)', protein: 18, calories: 90 }
    ];

    const quickAddFood = async (food) => {
        const log = {
            id: Date.now().toString(),
            type: 'meal',
            name: food.name,
            protein: food.protein,
            calories: food.calories,
            date: new Date().toISOString(),
            createdAt: Date.now()
        };
        await saveNutritionLog(log);
        loadData();
    };

    return (
        <div className="space-y-6 pb-20 animate-in fade-in duration-500">
            {/* Header & Settings */}
            <div className="flex justify-between items-start">
                {/* ... existing header ... */}
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-lime-500">
                        Beslenme Takibi
                    </h2>
                    <p className="text-muted-foreground mt-1">{new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
                <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 bg-secondary/50 hover:bg-secondary rounded-xl transition-colors"
                >
                    <UserCog className="w-6 h-6 text-muted-foreground" />
                </button>
            </div>

            {/* Quick Add Section */}
            <div>
                <h3 className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">Hızlı Ekle</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {COMMON_FOODS.map((food, i) => (
                        <button
                            key={i}
                            onClick={() => quickAddFood(food)}
                            className="flex-shrink-0 bg-secondary/50 hover:bg-green-500/10 hover:text-green-500 border border-transparent hover:border-green-500/50 rounded-xl px-4 py-2 text-sm font-medium transition-all"
                        >
                            {food.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Goals Modal */}
            {isSettingsOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-card w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
                        <h3 className="text-xl font-bold">🎯 Günlük Hedefler</h3>
                        <div>
                            <label className="block text-sm font-medium mb-1">Protein Hedefi (gr)</label>
                            <input
                                type="number"
                                value={goals.protein}
                                onChange={e => setGoals({ ...goals, protein: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Kalori Limiti (kcal)</label>
                            <input
                                type="number"
                                value={goals.calories}
                                onChange={e => setGoals({ ...goals, calories: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Su Hedefi (ml)</label>
                            <input
                                type="number"
                                value={goals.water}
                                onChange={e => setGoals({ ...goals, water: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                            />
                        </div>
                        <button
                            onClick={() => saveGoals(goals)}
                            className="w-full py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-xl"
                        >
                            Kaydet
                        </button>
                    </div>
                </div>
            )}

            {/* Progress Bars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Protein */}
                <div className="bg-card border border-border rounded-2xl p-4 relative overflow-hidden">
                    <div className="flex justify-between items-end mb-2 relative z-10">
                        <span className="flex items-center gap-2 font-bold text-lg"><Utensils size={18} className="text-orange-500" /> Protein</span>
                        <span className="text-2xl font-black text-orange-500">{totalProtein} <span className="text-sm font-medium text-muted-foreground">/ {goals.protein}g</span></span>
                    </div>
                    <div className="h-3 w-full bg-secondary rounded-full overflow-hidden relative z-10">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${totalProtein > goals.protein ? 'bg-red-500' : 'bg-orange-500'}`}
                            style={{ width: `${getProgress(totalProtein, goals.protein)}%` }}
                        />
                    </div>
                </div>

                {/* Calories */}
                <div className="bg-card border border-border rounded-2xl p-4 relative overflow-hidden">
                    <div className="flex justify-between items-end mb-2 relative z-10">
                        <span className="flex items-center gap-2 font-bold text-lg"><Flame size={18} className="text-yellow-500" /> Kalori</span>
                        <span className="text-2xl font-black text-yellow-500">{totalCalories} <span className="text-sm font-medium text-muted-foreground">/ {goals.calories}</span></span>
                    </div>
                    <div className="h-3 w-full bg-secondary rounded-full overflow-hidden relative z-10">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${totalCalories > goals.calories ? 'bg-red-500' : 'bg-yellow-500'}`}
                            style={{ width: `${getProgress(totalCalories, goals.calories)}%` }}
                        />
                    </div>
                </div>

                {/* Water */}
                <div className="bg-card border border-border rounded-2xl p-4 relative overflow-hidden">
                    <div className="flex justify-between items-end mb-2 relative z-10">
                        <span className="flex items-center gap-2 font-bold text-lg"><Droplets size={18} className="text-blue-500" /> Su</span>
                        <span className="text-2xl font-black text-blue-500">{(totalWater / 1000).toFixed(1)} <span className="text-sm font-medium text-muted-foreground">/ {(goals.water / 1000).toFixed(1)} L</span></span>
                    </div>
                    <div className="h-3 w-full bg-secondary rounded-full overflow-hidden relative z-10">
                        <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                            style={{ width: `${getProgress(totalWater, goals.water)}%` }}
                        />
                    </div>

                    {/* Water Quick Add */}
                    <div className="flex gap-2 mt-3 relative z-10">
                        <button onClick={() => handleAddWater(200)} className="flex-1 py-1 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 font-bold rounded-lg transition-colors">+200ml</button>
                        <button onClick={() => handleAddWater(500)} className="flex-1 py-1 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 font-bold rounded-lg transition-colors">+500ml</button>
                    </div>
                </div>
            </div>

            {/* Meal Form */}
            <div className="bg-card border border-border rounded-2xl p-4">
                <form onSubmit={handleAddMeal} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-medium mb-1">Yemek Adı</label>
                        <input
                            value={newMeal.name}
                            onChange={e => setNewMeal({ ...newMeal, name: e.target.value })}
                            placeholder="Örn: 2 Yumurta + Yulaf"
                            className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-green-500"
                            required
                        />
                    </div>
                    <div className="w-full md:w-24">
                        <label className="block text-xs font-medium mb-1">Prot (g)</label>
                        <input
                            type="number"
                            value={newMeal.protein}
                            onChange={e => setNewMeal({ ...newMeal, protein: e.target.value })}
                            placeholder="0"
                            className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div className="w-full md:w-24">
                        <label className="block text-xs font-medium mb-1">Kal (kcal)</label>
                        <input
                            type="number"
                            value={newMeal.calories}
                            onChange={e => setNewMeal({ ...newMeal, calories: e.target.value })}
                            placeholder="0"
                            className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <button type="submit" className="w-full md:w-auto px-6 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
                        <Plus size={18} /> Ekle
                    </button>
                </form>
            </div>

            {/* Daily List */}
            <div className="space-y-2">
                <h3 className="text-lg font-bold flex items-center gap-2">Bugünün Kayıtları</h3>
                {logs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground bg-secondary/20 rounded-2xl border border-dashed border-border">
                        Bugün henüz bir şey yemedin (veya girmedin). 🍽️
                    </div>
                ) : (
                    <div className="space-y-2">
                        {logs.map(log => (
                            <div key={log.id} className="flex items-center justify-between p-3 bg-card border border-border rounded-xl hover:scale-[1.01] transition-transform">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${log.type === 'water' ? 'bg-blue-500/10 text-blue-500' : 'bg-green-500/10 text-green-500'}`}>
                                        {log.type === 'water' ? <Droplets size={20} /> : <Utensils size={20} />}
                                    </div>
                                    <div>
                                        <p className="font-bold">{log.name}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {log.type === 'meal' && (
                                        <div className="text-right text-sm">
                                            <span className="block font-bold text-orange-500">{log.protein}g Prot</span>
                                            <span className="block font-medium text-muted-foreground">{log.calories} kcal</span>
                                        </div>
                                    )}
                                    {log.type === 'water' && (
                                        <span className="font-bold text-blue-500">{log.water}ml</span>
                                    )}
                                    <button
                                        onClick={() => handleDelete(log.id)}
                                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default NutritionLog;
